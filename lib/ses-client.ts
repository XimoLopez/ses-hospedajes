import JSZip from "jszip";
import { buildCommunicationXML, buildSOAPEnvelope, buildConsultaLoteSOAP } from "./xml-builder";
import type { GuestData, CommunicationType, SESConfig, SESResponse } from "./types";

function getSESConfig(): SESConfig {
    const environment = (process.env.NEXT_PUBLIC_SES_ENVIRONMENT || "PRE") as "PRE" | "PRO";
    const endpoint =
        environment === "PRO"
            ? process.env.SES_PRO_ENDPOINT || ""
            : process.env.SES_PRE_ENDPOINT || "";

    return {
        environment,
        wsUser: process.env.SES_WS_USER || "",
        wsPassword: process.env.SES_WS_PASSWORD || "",
        establishmentCode: process.env.SES_ESTABLISHMENT_CODE || "",
        entityCode: process.env.SES_ENTITY_CODE || "",
        endpoint,
    };
}

export async function compressAndEncode(xmlContent: string): Promise<string> {
    const zip = new JSZip();
    zip.file("comunicacion.xml", xmlContent);
    const zipBlob = await zip.generateAsync({ type: "base64" });
    return zipBlob;
}

export async function sendCommunication(
    guests: GuestData[],
    job: import("./types").ImportJob
): Promise<SESResponse> {
    const config = getSESConfig();

    if (!config.wsUser || !config.wsPassword) {
        return {
            success: false,
            errors: [{ code: "CONFIG_ERROR", message: "Credenciales del servicio web no configuradas" }],
        };
    }

    if (!config.endpoint) {
        return {
            success: false,
            errors: [{ code: "CONFIG_ERROR", message: "Endpoint del servicio web no configurado" }],
        };
    }

    try {
        // 1. Build XML
        const xml = buildCommunicationXML({
            establishmentCode: config.establishmentCode,
            communicationType: job.communicationType,
            guests,
            referenciaContrato: job.referenciaContrato,
            fechaContrato: job.fechaContrato,
            fechaEntradaGlobal: job.fechaEntradaGlobal,
            fechaSalidaGlobal: job.fechaSalidaGlobal,
            numeroPersonasGlobal: job.numeroPersonasGlobal,
            tipoPago: job.tipoPago,
            fechaPago: job.fechaPago
        });

        // 2. Compress and encode (ZIP + Base64)
        const base64Zip = await compressAndEncode(xml);

        // 3. Build SOAP envelope
        const soapEnvelope = buildSOAPEnvelope(
            xml,
            base64Zip,
            config.wsUser,
            config.wsPassword,
            config.entityCode || config.establishmentCode, // Usar Entity Code para la cabecera (Arrendador)
            job.communicationType
        );

        // 4. Send SOAP request
        // Node.js rejects many Spanish government certificates by default 
        // We bypass TLS verification explicitly pending official CA installation
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        const basicAuth = Buffer.from(`${config.wsUser}:${config.wsPassword}`).toString("base64");
        const contentLength = Buffer.byteLength(soapEnvelope, 'utf8').toString();

        console.log("----------------------------");
        console.log(`📡 Llamando endpoint [${config.environment}]: ${config.endpoint}`);
        console.log(`📦 Content-Length: ${contentLength} bytes`);
        console.log("----------------------------");

        // Use native https module to guarantee HTTP/1.1 legacy compatibility
        // as Node 18 native fetch (Undici) handles TLS/SNI differently and causes 404s on SES WAF
        const responseText = await new Promise<string>((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(config.endpoint);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': '', // WSDL especifica soapAction=""
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Length': contentLength,
                    'Connection': 'close'
                },
                rejectUnauthorized: false,
            };

            const req = https.request(options, (res: any) => {
                console.log(`📡 STATUS de https.request: ${res.statusCode}`);
                console.log(`📡 HEADERS de https.request:`, res.headers);

                let data = '';
                res.on('data', (chunk: string) => { data += chunk; });
                res.on('end', () => {
                    // Inject status code if failed, to reuse existing error logic
                    if (res.statusCode >= 400 && res.statusCode !== 500) {
                        reject(new Error(`HTTP_${res.statusCode}: ${res.statusMessage}`));
                    } else {
                        resolve(data);
                    }
                });
            });

            req.on('error', (e: Error) => reject(e));
            req.write(soapEnvelope);
            req.end();
        });

        // 5. Parse SOAP response to extract batch ID
        const batchIdMatch = responseText.match(/<lote>(.*?)<\/lote>/);
        const batchId = batchIdMatch ? batchIdMatch[1] : undefined;

        // Check for SOAP faults
        const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/);
        if (faultMatch) {
            return {
                success: false,
                errors: [{ code: "SOAP_FAULT", message: faultMatch[1] }],
                rawResponse: responseText,
            };
        }

        // Check for business errors in response
        if (responseText.includes("<respuesta>") || responseText.includes("</errores>") || responseText.includes("</error>")) {
            const errorMatches = [...responseText.matchAll(/<error[^>]*>([\s\S]*?)<\/error>/g)];

            // Si hay errores individuales
            if (errorMatches.length > 0) {
                const parsedErrors = errorMatches.map((arr, idx) => {
                    const content = arr[1];
                    const code = content.match(/<codigo[^>]*>(.*?)<\/codigo>/)?.[1] || `ERR_${idx}`;
                    const msg = content.match(/<descripcion[^>]*>(.*?)<\/descripcion>/)?.[1] ||
                        content.match(/<mensaje[^>]*>(.*?)<\/mensaje>/)?.[1] ||
                        content.replace(/<[^>]+>/g, '').trim();
                    return { code, message: msg };
                });
                return {
                    success: false,
                    errors: parsedErrors,
                    rawResponse: responseText,
                };
            }

            // Si hay un error global en <respuesta>
            const globalErrorMatch = responseText.match(/<respuesta>[\s\S]*?<codigo>(.*?)<\/codigo>[\s\S]*?<descripcion>(.*?)<\/descripcion>[\s\S]*?<\/respuesta>/);
            if (globalErrorMatch && globalErrorMatch[1] !== "0") { // 0 suele ser éxito, pero depende del API
                return {
                    success: false,
                    errors: [{ code: globalErrorMatch[1], message: globalErrorMatch[2] }],
                    rawResponse: responseText,
                };
            }
        }

        return {
            success: true,
            batchId,
            status: "pending",
            rawResponse: responseText,
        };
    } catch (error: any) {
        console.error("====== ERROR DE RED O FETCH EN PRO ======");
        console.error("Data config enviada:", {
            environment: config.environment,
            endpoint: config.endpoint,
            hasUser: !!config.wsUser,
            hasPass: !!config.wsPassword
        });
        console.error("Mensaje Error:", error.message);
        console.error("Causa raíz (Node.js Fetch):", error.cause);
        console.error("Error Stack:", error.stack);
        console.error("=========================================");

        return {
            success: false,
            errors: [
                {
                    code: "NETWORK_ERROR",
                    message: error.message || "Error de red desconocido",
                },
            ],
        };
    }
}

export async function checkBatchStatus(batchId: string): Promise<SESResponse> {
    const config = getSESConfig();

    try {
        const soapEnvelope = buildConsultaLoteSOAP(
            batchId,
            config.wsUser,
            config.wsPassword,
            config.establishmentCode
        );

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        const basicAuth = Buffer.from(`${config.wsUser}:${config.wsPassword}`).toString("base64");
        const contentLength = Buffer.byteLength(soapEnvelope, 'utf8').toString();

        const responseText = await new Promise<string>((resolve, reject) => {
            const https = require('https');
            const urlObj = new URL(config.endpoint);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': '',
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Length': contentLength,
                    'Connection': 'close'
                },
                rejectUnauthorized: false,
            };

            const req = https.request(options, (res: any) => {
                let data = '';
                res.on('data', (chunk: string) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 400 && res.statusCode !== 500) {
                        reject(new Error(`HTTP_${res.statusCode}: ${res.statusMessage}`));
                    } else {
                        resolve(data);
                    }
                });
            });

            req.on('error', (e: Error) => reject(e));
            req.write(soapEnvelope);
            req.end();
        });

        // Parse status from response
        const statusMatch = responseText.match(/<estado>(.*?)<\/estado>/);
        const status = statusMatch ? statusMatch[1].toLowerCase() : "unknown";

        // Parse individual errors
        const parsedErrors: Array<{ code: string; message: string }> = [];
        const errorBlocks = responseText.split("<error>");
        for (let i = 1; i < errorBlocks.length; i++) {
            const block = errorBlocks[i];
            const codeMatch = block.match(/<codigo>(.*?)<\/codigo>/);
            const descMatch = block.match(/<descripcion>(.*?)<\/descripcion>/);
            if (codeMatch && descMatch) {
                parsedErrors.push({ code: codeMatch[1], message: descMatch[1] });
            }
        }

        return {
            success: true,
            batchId,
            status,
            errors: parsedErrors.length > 0 ? parsedErrors : undefined,
            rawResponse: responseText,
        };
    } catch (error) {
        return {
            success: false,
            errors: [
                {
                    code: "NETWORK_ERROR",
                    message: error instanceof Error ? error.message : "Error de red desconocido",
                },
            ],
        };
    }
}

export { getSESConfig };

const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BASIC_AUTH = Buffer.from("21688025ZWS:dEnCh8~k").toString("base64");
const BASE64_FAKE_ZIP = "UEsDBBQAAAAIAIiWk1iqZpM/HAAAAE8AAAAQAAAAY29tdW5pY2FjaW9uLnhtbE2QwWrDMAyG74W+g9HdxnG6wdA1dOywdttgOwCrrTRWnIwtOzD29jOcbRcdJPT9H/2SfN3uL2H1GaxH0g3NUBMYh17T0Q3ff90uDzBN5rYJvYMDHxi1m40Iox+VvEIFbLzhBS9f3+7hBdsVf0iF06O5kE5704uQ14cT8B5pPdwj1h2VwxhE62oN0HpwPjLIfWEMlM9sV9p3O7pG/f01h/7n21V2rT0LUEbH4Lq1s4E28o18kQ+i87O/AQAA//9QSwcIqmaTPxwAAABPAAAAUEsBAhQAFAAAAAgAiJaTWKpmkz8cAAAATwAAABAAAAAAAAAAAQAgAAAAAAAAAGNvbXVuaWNhY2lvbi54bWxQSwUGAAAAAAEAAQA+AAAAWgAAAAAA";

const variations = [
    {
        name: "com:fichero",
        body: `<com:altaComunicacion><com:fichero>${BASE64_FAKE_ZIP}</com:fichero></com:altaComunicacion>`
    },
    {
        name: "com:comunicacion",
        body: `<com:altaComunicacion><com:comunicacion>${BASE64_FAKE_ZIP}</com:comunicacion></com:altaComunicacion>`
    },
    {
        name: "fichero (no namespace)",
        body: `<com:altaComunicacion><fichero>${BASE64_FAKE_ZIP}</fichero></com:altaComunicacion>`
    },
    {
        name: "comunicacion (no namespace)",
        body: `<com:altaComunicacion><comunicacion>${BASE64_FAKE_ZIP}</comunicacion></com:altaComunicacion>`
    }
];

async function test(variation) {
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="https://hospedajes.ses.mir.es/esquemas/comunicacion">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>21688025ZWS</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">dEnCh8~k</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    ${variation.body}
  </soapenv:Body>
</soapenv:Envelope>`;

    return new Promise((resolve) => {
        const options = {
            hostname: 'hospedajes.pre-ses.mir.es',
            port: 443,
            path: '/hospedajes-web/ws/v1/comunicacion',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'altaComunicacion',
                'Authorization': `Basic ${BASIC_AUTH}`,
                'Content-Length': Buffer.byteLength(soapEnvelope, 'utf8'),
                'Connection': 'close'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ name: variation.name, status: res.statusCode, data }));
        });
        req.on('error', e => resolve({ name: variation.name, status: 'ERROR', message: e.message }));
        req.write(soapEnvelope);
        req.end();
    });
}

async function start() {
    for (const v of variations) {
        const res = await test(v);
        console.log(`Test: ${res.name} -> Status: ${res.status}`);
        if (res.status !== 502 && res.status !== 404) {
            console.log(`   DATA Snippet: ${res.data.substring(0, 100)}...`);
        }
    }
}

start();

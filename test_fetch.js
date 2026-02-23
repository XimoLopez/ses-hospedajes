const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const basicAuth = Buffer.from("21688025ZWS:dEnCh8~k").toString("base64");
const soapEnvelope = '<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"></env:Envelope>';

const options = {
    hostname: 'hospedajes.ses.mir.es',
    port: 443,
    path: '/hospedajes-web/ws/v1/comunicacion',
    method: 'POST',
    headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'altaComunicacion',
        'Authorization': `Basic ${basicAuth}`,
        'Content-Length': Buffer.byteLength(soapEnvelope, 'utf8'),
        'User-Agent': "curl/8.7.1",
        'Accept': "*/*",
        'Connection': 'close'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});
req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});
req.write(soapEnvelope);
req.end();

const https = require('https');
const crypto = require('crypto');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const basicAuth = Buffer.from("21688025ZWS:dEnCh8~k").toString("base64");

const base64Zip = crypto.randomBytes(2500).toString('base64');
const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="https://hospedajes.ses.mir.es/esquemas/comunicacion">
  <env:Header/>
  <env:Body>
    <com:altaComunicacion>
      <comunicacion>${base64Zip}</comunicacion>
    </com:altaComunicacion>
  </env:Body>
</env:Envelope>`;

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
        'Connection': 'close'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('BODY:', data));
});
req.on('error', console.error);
req.write(soapEnvelope);
req.end();

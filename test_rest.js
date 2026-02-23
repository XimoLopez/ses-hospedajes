const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const basicAuth = Buffer.from("21688025ZWS:dEnCh8~k").toString("base64");
const base64Fake = "UEsDBBQAAAAIAIiWk1iqZpM/HAAAAE8AAAAQAAAAY29tdW5pY2FjaW9uLnhtbE2QwWrDMAyG74W+g9HdxnG6wdA1dOywdttgOwCrrTRWnIwtOzD29jOcbRcdJPT9H/2SfN3uL2H1GaxH0g3NUBMYh17T0Q3ff90uDzBN5rYJvYMDHxi1m40Iox+VvEIFbLzhBS9f3+7hBdsVf0iF06O5kE5704uQ14cT8B5pPdwj1h2VwxhE62oN0HpwPjLIfWEMlM9sV9p3O7pG/f01h/7n21V2rT0LUEbH4Lq1s4E28o18kQ+i87O/AQAA//9QSwcIqmaTPxwAAABPAAAAUEsBAhQAFAAAAAgAiJaTWKpmkz8cAAAATwAAABAAAAAAAAAAAQAgAAAAAAAAAGNvbXVuaWNhY2lvbi54bWxQSwUGAAAAAAEAAQA+AAAAWgAAAAAA";

const options = {
    hostname: 'hospedajes.ses.mir.es',
    port: 443,
    path: '/hospedajes-web/ws/v1/comunicacion',
    method: 'POST',
    headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Authorization': `Basic ${basicAuth}`,
        'Content-Length': Buffer.byteLength(base64Fake, 'utf8'),
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
req.write(base64Fake);
req.end();

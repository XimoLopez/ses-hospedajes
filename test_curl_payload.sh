#!/bin/bash
BASIC_AUTH=$(echo -n "21688025ZWS:dEnCh8~k" | base64)
PAYLOAD=$(cat << 'XML'
<?xml version="1.0" encoding="UTF-8"?>
<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="https://hospedajes.ses.mir.es/esquemas/comunicacion">
  <env:Header/>
  <env:Body>
    <com:altaComunicacion>
      <comunicacion>UEsDBBQAAAAIAIiWk1iqZpM/HAAAAE8AAAAQAAAAY29tdW5pY2FjaW9uLnhtbE2QwWrDMAyG74W+g9HdxnG6wdA1dOywdttgOwCrrTRWnIwtOzD29jOcbRcdJPT9H/2SfN3uL2H1GaxH0g3NUBMYh17T0Q3ff90uDzBN5rYJvYMDHxi1m40Iox+VvEIFbLzhBS9f3+7hBdsVf0iF06O5kE5704uQ14cT8B5pPdwj1h2VwxhE62oN0HpwPjLIfWEMlM9sV9p3O7pG/f01h/7n21V2rT0LUEbH4Lq1s4E28o18kQ+i87O/AQAA//9QSwcIqmaTPxwAAABPAAAAUEsBAhQAFAAAAAgAiJaTWKpmkz8cAAAATwAAABAAAAAAAAAAAQAgAAAAAAAAAGNvbXVuaWNhY2lvbi54bWxQSwUGAAAAAAEAAQA+AAAAWgAAAAAA</comunicacion>
    </com:altaComunicacion>
  </env:Body>
</env:Envelope>
XML
)

curl -v -X POST "https://hospedajes.ses.mir.es/hospedajes-web/ws/v1/comunicacion" \
  -H "SOAPAction: altaComunicacion" \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "Authorization: Basic $BASIC_AUTH" \
  -d "$PAYLOAD"

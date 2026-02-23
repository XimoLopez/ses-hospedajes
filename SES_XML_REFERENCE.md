# Referencia de Estructura XML - SES.HOSPEDAJES (v3.1.3)

Este documento detalla los hallazgos tras analizar los esquemas XSD proporcionados por el Ministerio del Interior para el envío de comunicaciones de hospedaje.

## 1. Estructura de Dirección (`direccionType`)

En los esquemas `tiposGenerales.xsd` y `altaParteHospedaje.xsd`, la dirección de una persona (viajero o titular) se define con los siguientes campos obligatorios y opcionales:

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `direccion` | string(100) | SÍ | Calle, número, etc. |
| `direccionComplementaria` | string(100) | NO | Piso, puerta, etc. |
| `codigoMunicipio` | string(5) | NO | **Código INE de 5 dígitos.** Para España, los 2 primeros son la provincia. |
| `nombreMunicipio` | string(100) | NO | Nombre de la ciudad/municipio. |
| `codigoPostal` | string(20) | SÍ | |
| `pais` | ISO 3166-1 Alfa-3 | SÍ | Ejemplo: `ESP`, `FRA`, `GBR`. |

### ⚠️ Nota sobre Ciudad y Provincia:
*   **No existe un campo específico para "Provincia"** en el esquema de envío masivo.
*   Para direcciones en España, se recomienda encarecidamente enviar el `codigoMunicipio` completo para que el sistema asigne automáticamente Ciudad y Provincia.
*   Si se envía solo el nombre del municipio en `nombreMunicipio`, es posible que no se asocie correctamente a una provincia si el nombre es ambiguo.
*   **Propuesta de mejora**: Para envíos internacionales o donde la provincia sea crítica, concatenar en `nombreMunicipio` como `Ciudad (Provincia)`.

## 2. Tipos de Documento (`tipoDocumento`)

Según la normativa RD 933/2021 y los esquemas analizados, los códigos numéricos estándar son:

| Código | Descripción |
| :--- | :--- |
| `1` | DNI / NIF (España) |
| `2` | Pasaporte |
| `3` | Permiso de conducir (España) |
| `4` | Permiso de residencia / TIE / NIE |
| `5` | Carta de identidad (UE) |

### ⚠️ Problema detectado:
Si el sistema origen envía cadenas de texto como "DNI" o "Pasaporte" en lugar de los códigos numéricos, el Ministerio puede rechazar el registro por tipo de documento inválido. El mapeo actual debe asegurar que siempre se envíe el número.

## 3. Bloque de Contrato (`contratoHospedajeType`)

Campos requeridos en el contrato:
*   `referencia`: ID único del contrato.
*   `fechaContrato`: Fecha de firma (YYYY-MM-DD).
*   `fechaEntrada`: Fecha/hora de entrada (xsd:dateTime).
*   `fechaSalida`: Fecha/hora de salida (xsd:dateTime).
*   `numPersonas`: Número total de personas en el contrato.
*   `pago`: Bloque obligatorio que incluye `tipoPago` (codes: `EF`, `TA`, `TR`, `PP`, `OT`).

## 4. Próximos Pasos en el Sistema:
1.  **Reforzar Mapeo CSV**: Asegurar que `ciudad` y `provincia` se lean correctamente del CSV y se almacenen en el modelo interno.
2.  **Optimizar XML Builder**:
    *   Si el país es `ESP`, intentar obtener el código INE de 5 dígitos.
    *   Si no hay código INE, incluir la provincia en el campo `nombreMunicipio`.
    *   Asegurar que `tipoDocumento` siempre sea un código numérico válido.

# API - Survivors (Supervivientes)

Descripción rápida

Colección de endpoints para gestionar supervivientes. Incluye creación, listado, obtención por ID, actualización parcial y cambio de estado (inactivar/reactivar). Las relaciones (cánceres, teléfono, contactos de emergencia) se gestionan a través de endpoints específicos; el endpoint de `PUT /api/survivors/:id` NO debe usarse para actualizar relaciones.

Base de datos / campos relevantes

- idSurvivor: Int (PK)
- idHeadquarter: Int (FK)
- survivorName: String
- documentNumber: String
- country: String
- birthday: Date (YYYY-MM-DD)
- email: String
- residence: String
- genre: String
- workingCondition: String
- CONAPDIS: Boolean
- IMAS: Boolean
- physicalFileStatus: String
- medicalRecord: Boolean
- dateHomeSINRUBE: Boolean
- foodBank: Boolean
- socioEconomicStudy: Boolean
- notes: String?
- status: String (active|inactive) - default: active

Endpoints principales

1) GET /api/survivors?status=active|inactive|all&take=&skip=
- Descripción: Lista supervivientes. Por defecto `status=active`.
- Query params:
  - status (opcional): "active" | "inactive" | "all"
  - take (opcional): número de registros
  - skip (opcional): offset
- Respuesta: arreglo de supervivientes (select limitado a campos principales + headquarter).

2) GET /api/survivors/active
- Descripción: Lista solo los supervivientes activos (alias conveniente).

3) GET /api/survivors/:id
- Descripción: Devuelve los datos de un superviviente con sus relaciones principales (cánceres, teléfono y contactos).
- Respuestas: 200 con datos, 404 si no existe.

4) POST /api/survivors
- Descripción: Crea un nuevo superviviente y sus relaciones iniciales (cánceres obligatorios, teléfono opcional y contactos opcionales). Operación en transacción.
- Body (JSON) - ejemplo mínimo válido:
{
  "idHeadquarter": 1,
  "survivorName": "Nombre Ejemplo",
  "documentNumber": "12345678",
  "country": "País",
  "birthday": "1990-01-01",
  "email": "ejemplo@example.com",
  "residence": "Ciudad",
  "genre": "F",
  "workingCondition": "Trabaja",
  "CONAPDIS": false,
  "IMAS": false,
  "physicalFileStatus": "Completo",
  "medicalRecord": false,
  "dateHomeSINRUBE": false,
  "foodBank": false,
  "socioEconomicStudy": false,
  "notes": "Alguna nota",
  "phone": "50688877766",               // opcional - sólo dígitos, max 12
  "cancers": [                           // obligatorio, mínimo 1
    { "idCancer": 1, "stage": "I" }
  ],
  "emergencyContacts": [2, 3]           // opcional: array de idEmergencyContact
}

- Validaciones importantes (respetar):
  - `cancers` es obligatorio y debe ser un array con al menos 1 elemento; cada elemento requiere `idCancer` (number) y `stage` (string).
  - `phone` (si se proporciona) debe ser dígitos únicamente y hasta 12 caracteres.
  - `idHeadquarter` debe existir y estar activa.
  - `email` y `documentNumber` deben ser únicos (se validan antes de crear).
- Comportamiento: crea survivor, crea relaciones de cancer (createMany) y, si se pasa `phone`, crea/busca registro en `Phone` y vincula en `PhoneSurvivor` dentro de una transacción. Si falla cualquier paso, la transacción hace rollback y NO habrá cambios parciales.

5) PUT /api/survivors/:id
- Descripción: Actualiza campos del survivor (parcial). NO permite actualizar relaciones (cancer, phone, emergencyContacts) desde este endpoint.
- Body (JSON): cualquier subset de los campos del survivor (ej. `survivorName`, `email`, `residence`, etc.)
- Notas:
  - Si el superviviente está `inactive`, la API devuelve error de negocio y no permite update.
  - Para actualizar relaciones usa los endpoints específicos (cáncer, teléfono, contactos).

6) DELETE /api/survivors/:id
- Descripción: Alterna el estado entre `active` e `inactive`. Implementado como cambio de `status` (soft delete).
- Comportamiento: Si el estado actual es `active`, lo pone `inactive`, y viceversa. Se registra SecurityLog con la acción INACTIVE o REACTIVATE.

7) POST /api/survivors/:id/reactivate
- Descripción: Endpoint explícito para reactivar.
- Body: ninguno.
- Comportamiento: reactiva el survivor (pone status = 'active'). El controlador valida existencia previa.

Errores comunes y cómo interpretarlos

- P2025 (Prisma): "No record was found for an update." — suele ocurrir cuando `prisma.update` se invoca con un `where` que no coincide (p.ej. incluir campos no-únicos en `where`). En este repo se corrigió el `where` para usar solo `idSurvivor`.
- P2002: Unique constraint failed — ocurre al intentar crear with duplicate `documentNumber` o `email` o `phone`.
- Validaciones del controlador retornan `validationErrors` con la lista de problemas.

Notas adicionales

- La creación y modificación de relaciones (Phone, CancerSurvivor, EmergencyContactSurvivor) se hace en endpoints dedicados.
- Las respuestas incluyen logs de seguridad (SecurityLog) en operaciones CREATE/UPDATE/INACTIVE/REACTIVATE.

# EmergencyContactPhone Module

## Descripción
Módulo para gestionar la relación entre contactos de emergencia y teléfonos. Cada contacto de emergencia puede tener **máximo un teléfono**.

## Estructura del Módulo

### Archivos
- `emergencyContactPhone.repository.js` - Capa de acceso a datos (Prisma)
- `emergencyContactPhone.service.js` - Lógica de negocio
- `emergencyContactPhone.controller.js` - Manejo de peticiones HTTP
- `emergencyContactPhone.routes.js` - Definición de rutas y autenticación

## Endpoints

### 1. GET `/api/emergency-contacts/:id/phone`
Obtiene el teléfono de un contacto de emergencia.

**Permisos requeridos:** `Contactos de Emergencia` (read)

**Respuesta exitosa (200):**
```json
{
  "idPhone": 1,
  "idEmergencyContact": 5,
  "phone": {
    "idPhone": 1,
    "phone": "50312345678"
  }
}
```

**Si no tiene teléfono:**
```json
{
  "success": true,
  "data": null,
  "message": "El contacto de emergencia no tiene teléfono registrado"
}
```

---

### 2. POST `/api/emergency-contacts/:id/phone`
Agrega un teléfono a un contacto de emergencia (solo si no tiene uno).

**Permisos requeridos:** `Contactos de Emergencia` (create)

**Body:**
```json
{
  "phone": 50312345678
}
```

**Validaciones:**
- El contacto de emergencia debe existir
- El contacto debe estar activo (`status: 'active'`)
- No puede tener un teléfono ya registrado
- El teléfono debe ser válido (número de 8-15 dígitos)

**Comportamiento:**
- Si el número de teléfono ya existe en la tabla `Phone`, reutiliza ese registro
- Si es un número nuevo, crea un nuevo registro en `Phone`
- Crea la relación en `EmergencyContactPhone`

**Security Log:** Acción `CREATE` con detalles del teléfono agregado

---

### 3. PUT `/api/emergency-contacts/:id/phone`
Actualiza (reemplaza) el teléfono de un contacto de emergencia.

**Permisos requeridos:** `Contactos de Emergencia` (read, update)

**Body:**
```json
{
  "phone": 50387654321
}
```

**Validaciones:**
- El contacto de emergencia debe existir
- El contacto debe estar activo
- Debe tener un teléfono registrado previamente
- El nuevo teléfono no puede ser igual al actual

**Proceso:**
1. Elimina la relación anterior con el teléfono viejo
2. Encuentra o crea el nuevo teléfono en la tabla `Phone`
3. Crea nueva relación con el teléfono nuevo

**Security Log:** Acción `UPDATE` mostrando teléfono anterior y nuevo

---

### 4. DELETE `/api/emergency-contacts/:id/phone`
Elimina el teléfono de un contacto de emergencia.

**Permisos requeridos:** `Contactos de Emergencia` (read, delete)

**Validaciones:**
- El contacto de emergencia debe existir
- Debe tener un teléfono registrado

**Proceso:**
- Elimina la relación en `EmergencyContactPhone`
- El registro en `Phone` permanece (modelo inmutable)

**Security Log:** Acción `DELETE` con detalles del teléfono eliminado

---

## Modelo de Datos

### EmergencyContactPhone (Tabla relacional)
```prisma
model EmergencyContactPhone {
  idEmergencyContact Int             @map("idEmergencyContact")
  idPhone            Int             @map("idPhone")
  emergencyContact   EmergencyContact @relation(fields: [idEmergencyContact], references: [idEmergencyContact])
  phone              Phone           @relation(fields: [idPhone], references: [idPhone])

  @@id([idEmergencyContact, idPhone])
  @@map("EmergencyContactPhone")
}
```

## Patrones Utilizados

### 1. Repository Pattern
- `emergencyContactPhone.repository.js` maneja todas las queries de Prisma
- Métodos: `getByEmergencyContact`, `create`, `deleteAllByEmergencyContact`

### 2. Service Layer
- `emergencyContactPhone.service.js` contiene lógica de negocio
- Actúa como intermediario entre controller y repository

### 3. Controller Pattern
- Validaciones con `ValidationRules`
- Manejo de errores estandarizado
- Respuestas consistentes con `res.success()`, `res.error()`, etc.

### 4. Security Logging
- Todas las acciones (CREATE, UPDATE, DELETE) se registran en `SecurityLog`
- Incluye detalles del usuario, acción y cambios realizados

### 5. Phone Immutability
- Los registros en la tabla `Phone` nunca se modifican
- Se reutilizan números existentes o se crean nuevos
- Al eliminar la relación, el teléfono permanece en la BD

## Dependencias

### Servicios externos:
- `EmergencyContactsService` - Para validar que el contacto existe
- `PhoneService` - Para encontrar o crear teléfonos (método `findOrCreate`)
- `SecurityLogService` - Para registro de auditoría

### Utilidades:
- `ValidationRules.parseIdParam()` - Valida IDs numéricos
- `ValidationRules.parsePhoneNumber()` - Valida y normaliza teléfonos

## Casos de Uso

### Agregar teléfono a contacto de emergencia nuevo
```bash
POST /api/emergency-contacts/5/phone
{
  "phone": 50312345678
}
```

### Cambiar teléfono de contacto existente
```bash
PUT /api/emergency-contacts/5/phone
{
  "phone": 50387654321
}
```

### Consultar teléfono actual
```bash
GET /api/emergency-contacts/5/phone
```

### Eliminar teléfono
```bash
DELETE /api/emergency-contacts/5/phone
```

## Errores Comunes

### 400 - Bad Request
- "El contacto de emergencia ya tiene un teléfono registrado" (al hacer POST)
- "No se pueden agregar teléfonos a un contacto de emergencia inactivo"
- "El nuevo teléfono es el mismo que el actual" (al hacer PUT)

### 404 - Not Found
- "Contacto de emergencia" no encontrado
- "El contacto de emergencia no tiene un teléfono registrado" (al hacer PUT/DELETE)

### 422 - Validation Errors
- "El parámetro id debe ser numérico"
- "phone es requerido y debe ser un número válido de 8 a 15 dígitos"

## Notas de Implementación

1. **Solo un teléfono por contacto:** El sistema está diseñado para manejar un único teléfono por contacto de emergencia
2. **Validación de estado:** Solo contactos activos pueden tener teléfonos agregados o actualizados
3. **Normalización de teléfonos:** Los teléfonos se normalizan y almacenan sin espacios ni caracteres especiales
4. **Auditoría completa:** Todas las operaciones quedan registradas en `SecurityLog`

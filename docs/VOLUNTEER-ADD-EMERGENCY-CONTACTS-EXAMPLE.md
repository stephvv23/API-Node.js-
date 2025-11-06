# Ejemplo de Agregar Contactos de Emergencia a Voluntario

## Endpoint
`POST /api/volunteers/:id/emergencyContacts`

## Caso de Ejemplo

### Request
```json
POST /api/volunteers/1/emergencyContacts
{
  "emergencyContacts": [
    { "idEmergencyContact": 1, "relationship": "Madre" },
    { "idEmergencyContact": 5, "relationship": "Hermano" },
    { "idEmergencyContact": 10, "relationship": "Tío" },
    { "idEmergencyContact": 123, "relationship": "Primo" }
  ]
}
```

Donde:
- **ID 1**: Existe, está activo y NO tiene relación previa → ✅ **Se agregará**
- **ID 5**: Existe, está activo pero YA tiene relación → ⚠️ **Ya existe**
- **ID 10**: Existe pero está INACTIVO → ⚠️ **No se puede agregar**
- **ID 123**: NO existe en el sistema → ❌ **No existe**

---

## Response

### Success (201 si se agregó al menos uno, 200 si no)

```json
{
  "success": true,
  "message": "✅ Agregados: ID: 1 - María González (Madre) | ⚠️ Ya agregados: ID: 5 - Pedro Ramírez (Ya existe con relación: Hermano) | ⚠️ Inactivos: ID: 10 - Ana López | ❌ No existen: ID: 123",
  "data": {
    "summary": {
      "added": 1,
      "alreadyExists": 1,
      "inactive": 1,
      "notFound": 1,
      "total": 4
    },
    "details": {
      "added": [
        {
          "idEmergencyContact": 1,
          "nameEmergencyContact": "María González",
          "relationship": "Madre"
        }
      ],
      "alreadyExists": [
        {
          "idEmergencyContact": 5,
          "nameEmergencyContact": "Pedro Ramírez",
          "currentRelationship": "Hermano",
          "attemptedRelationship": "Hermano"
        }
      ],
      "inactive": [
        {
          "idEmergencyContact": 10,
          "nameEmergencyContact": "Ana López",
          "relationship": "Tío"
        }
      ],
      "notFound": [
        {
          "idEmergencyContact": 123,
          "relationship": "Primo"
        }
      ]
    }
  }
}
```

---

## Interpretación de la Respuesta

### 📊 Summary (Resumen)
- **added**: 1 - Se agregó 1 contacto exitosamente
- **alreadyExists**: 1 - 1 contacto ya tenía relación con el voluntario
- **inactive**: 1 - 1 contacto existe pero está inactivo
- **notFound**: 1 - 1 contacto no existe en el sistema
- **total**: 4 - Total de IDs procesados

### 📋 Details (Detalles)

#### ✅ Added (Agregados exitosamente)
Contactos que **SÍ** se agregaron al voluntario:
- ID 1 - María González con parentesco "Madre"

#### ⚠️ Already Exists (Ya Agregados)
Contactos que ya tenían relación con el voluntario:
- ID 5 - Pedro Ramírez (ya tenía relación "Hermano" y se intentó agregar con "Hermano")
- **Nota**: Muestra la relación actual vs la intentada

#### ⚠️ Inactive (Inactivos)
Contactos que existen pero están inactivos:
- ID 10 - Ana López (existe pero está inactivo, no se puede agregar)

#### ❌ Not Found (No Existen)
Contactos que **NO** existen en el sistema:
- ID 123 (no se encontró en la base de datos)

---

## Otros Casos de Ejemplo

### Caso 1: Todos agregados exitosamente
```json
Request: 
{
  "emergencyContacts": [
    { "idEmergencyContact": 1, "relationship": "Madre" },
    { "idEmergencyContact": 2, "relationship": "Padre" }
  ]
}

Response (201):
{
  "message": "✅ Agregados: ID: 1 - María González (Madre), ID: 2 - Juan Pérez (Padre)",
  "data": {
    "summary": { "added": 2, "alreadyExists": 0, "inactive": 0, "notFound": 0, "total": 2 },
    "details": {
      "added": [
        { "idEmergencyContact": 1, "nameEmergencyContact": "María González", "relationship": "Madre" },
        { "idEmergencyContact": 2, "nameEmergencyContact": "Juan Pérez", "relationship": "Padre" }
      ],
      "alreadyExists": [],
      "inactive": [],
      "notFound": []
    }
  }
}
```

### Caso 2: Todos ya existen
```json
Request: 
{
  "emergencyContacts": [
    { "idEmergencyContact": 5, "relationship": "Hermano" }
  ]
}

Response (200):
{
  "message": "⚠️ Ya agregados: ID: 5 - Pedro Ramírez (Ya existe con relación: Hermano)",
  "data": {
    "summary": { "added": 0, "alreadyExists": 1, "inactive": 0, "notFound": 0, "total": 1 },
    "details": {
      "added": [],
      "alreadyExists": [
        {
          "idEmergencyContact": 5,
          "nameEmergencyContact": "Pedro Ramírez",
          "currentRelationship": "Hermano",
          "attemptedRelationship": "Hermano"
        }
      ],
      "inactive": [],
      "notFound": []
    }
  }
}
```

### Caso 3: Ninguno existe
```json
Request: 
{
  "emergencyContacts": [
    { "idEmergencyContact": 999, "relationship": "Amigo" }
  ]
}

Response (200):
{
  "message": "❌ No existen: ID: 999",
  "data": {
    "summary": { "added": 0, "alreadyExists": 0, "inactive": 0, "notFound": 1, "total": 1 },
    "details": {
      "added": [],
      "alreadyExists": [],
      "inactive": [],
      "notFound": [
        { "idEmergencyContact": 999, "relationship": "Amigo" }
      ]
    }
  }
}
```

### Caso 4: Todos inactivos
```json
Request: 
{
  "emergencyContacts": [
    { "idEmergencyContact": 10, "relationship": "Tío" }
  ]
}

Response (200):
{
  "message": "⚠️ Inactivos: ID: 10 - Ana López",
  "data": {
    "summary": { "added": 0, "alreadyExists": 0, "inactive": 1, "notFound": 0, "total": 1 },
    "details": {
      "added": [],
      "alreadyExists": [],
      "inactive": [
        {
          "idEmergencyContact": 10,
          "nameEmergencyContact": "Ana López",
          "relationship": "Tío"
        }
      ],
      "notFound": []
    }
  }
}
```

---

## Códigos de Estado HTTP

| Resultado | Código HTTP | Descripción |
|-----------|-------------|-------------|
| Al menos uno agregado | **201 Created** | Se crearon nuevas relaciones |
| Ninguno agregado | **200 OK** | Operación exitosa pero sin cambios |
| Error de validación | **400 Bad Request** | Datos inválidos |
| Voluntario no encontrado | **404 Not Found** | El voluntario no existe |

---

## Ventajas de esta Implementación

✅ **Procesamiento Completo**: No falla al primer error, procesa todos los IDs
✅ **Clasificación Detallada**: Separa en 4 categorías claras
✅ **Información Rica**: Incluye nombres y relaciones existentes
✅ **Sin Errores en Consola**: Todos los casos se manejan sin logs innecesarios
✅ **Resumen Numérico**: Conteo rápido de cada categoría
✅ **Retroalimentación Clara**: Mensajes con íconos para fácil lectura
✅ **Detección de Duplicados**: Identifica relaciones existentes antes de intentar agregar

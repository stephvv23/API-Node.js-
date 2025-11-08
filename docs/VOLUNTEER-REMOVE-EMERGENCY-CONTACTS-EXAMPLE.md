# Ejemplo de Eliminación de Contactos de Emergencia

## Endpoint
`DELETE /api/volunteers/:id/emergencyContacts`

## Caso de Ejemplo

### Request
```json
DELETE /api/volunteers/1/emergencyContacts
{
  "idEmergencyContacts": [1, 5, 123]
}
```

Donde:
- **ID 1**: Existe y tiene relación con el voluntario
- **ID 5**: Existe pero NO tiene relación con el voluntario
- **ID 123**: NO existe en el sistema

---

## Response

### Success (200)

```json
{
  "success": true,
  "message": "✅ Eliminados: ID: 1 - María González (Madre) | ⚠️ Sin relación con el voluntario: ID: 5 - Pedro Ramírez | ❌ No existen: ID: 123",
  "data": {
    "summary": {
      "deleted": 1,
      "notRelated": 1,
      "notFound": 1,
      "total": 3
    },
    "details": {
      "deleted": [
        {
          "idEmergencyContact": 1,
          "nameEmergencyContact": "María González",
          "relationship": "Madre"
        }
      ],
      "notRelated": [
        {
          "idEmergencyContact": 5,
          "nameEmergencyContact": "Pedro Ramírez"
        }
      ],
      "notFound": [
        {
          "idEmergencyContact": 123
        }
      ]
    }
  }
}
```

---

## Interpretación de la Respuesta

### 📊 Summary (Resumen)
- **deleted**: 1 - Se eliminó 1 contacto exitosamente
- **notRelated**: 1 - 1 contacto existe pero no tenía relación con el voluntario
- **notFound**: 1 - 1 contacto no existe en el sistema
- **total**: 3 - Total de IDs procesados

### 📋 Details (Detalles)

#### ✅ Deleted (Eliminados)
Contactos que **SÍ** se eliminaron del voluntario:
- ID 1 - María González con parentesco "Madre"

#### ⚠️ Not Related (Sin Relación)
Contactos que existen pero **NO** tenían relación con el voluntario:
- ID 5 - Pedro Ramírez (existe en el sistema pero no estaba asociado a este voluntario)

#### ❌ Not Found (No Existen)
Contactos que **NO** existen en el sistema:
- ID 123 (no se encontró en la base de datos)

---

## Otros Casos de Ejemplo

### Caso 1: Todos eliminados exitosamente
```json
Request: { "idEmergencyContacts": [1, 2, 3] }

Response:
{
  "message": "✅ Eliminados: ID: 1 - María González (Madre), ID: 2 - Juan Pérez (Padre), ID: 3 - Ana López (Hermana)",
  "data": {
    "summary": { "deleted": 3, "notRelated": 0, "notFound": 0, "total": 3 },
    "details": {
      "deleted": [...],
      "notRelated": [],
      "notFound": []
    }
  }
}
```

### Caso 2: Ninguno existe
```json
Request: { "idEmergencyContacts": [999, 888] }

Response:
{
  "message": "❌ No existen: ID: 999, ID: 888",
  "data": {
    "summary": { "deleted": 0, "notRelated": 0, "notFound": 2, "total": 2 },
    "details": {
      "deleted": [],
      "notRelated": [],
      "notFound": [...]
    }
  }
}
```

### Caso 3: Todos existen pero no tienen relación
```json
Request: { "idEmergencyContacts": [4, 5, 6] }

Response:
{
  "message": "⚠️ Sin relación con el voluntario: ID: 4 - Carlos Ruiz, ID: 5 - Pedro Ramírez, ID: 6 - Sofía Torres",
  "data": {
    "summary": { "deleted": 0, "notRelated": 3, "notFound": 0, "total": 3 },
    "details": {
      "deleted": [],
      "notRelated": [...],
      "notFound": []
    }
  }
}
```

---

## Ventajas de esta Implementación

✅ **Transparencia Total**: El usuario sabe exactamente qué pasó con cada ID
✅ **Información Detallada**: Incluye nombres y parentescos de los contactos eliminados
✅ **Categorización Clara**: Separa entre eliminados, sin relación y no encontrados
✅ **Resumen Numérico**: Ofrece un conteo rápido de cada categoría
✅ **No Falla**: Aunque algunos IDs no sean válidos, procesa todos y reporta resultados

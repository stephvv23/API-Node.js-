# Ejemplos de CREATE para Survivor con Relaciones

## ✅ Ejemplo Completo (Con todas las relaciones)

```http
POST http://localhost:3000/api/survivors
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "idHeadquarter": 1,
  "survivorName": "María González Pérez",
  "documentNumber": "1-0234-0567",
  "country": "Costa Rica",
  "birthday": "1985-05-15",
  "email": "maria.gonzalez@example.com",
  "residence": "San José, Costa Rica",
  "genre": "Femenino",
  "workingCondition": "Empleada",
  "CONAPDIS": true,
  "IMAS": false,
  "physicalFileStatus": true,
  "medicalRecord": false,
  "dateHomeSINRUBE": true,
  "foodBank": true,
  "socioEconomicStudy": false,
  "notes": "Paciente con seguimiento mensual",
  "status": "active",
  "cancers": [
    {
      "idCancer": 1,
      "status": "En tratamiento",
      "stage": "Etapa II"
    },
    {
      "idCancer": 2,
      "status": "Remisión",
      "stage": "Etapa I"
    }
  ],
  "phone": "22334455",
  "emergencyContacts": [1, 2]
}
```

---

## ✅ Ejemplo Mínimo (Solo campos requeridos)

```http
POST http://localhost:3000/api/survivors
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "idHeadquarter": 1,
  "survivorName": "Juan Pérez",
  "documentNumber": "2-0345-0678",
  "country": "Costa Rica",
  "birthday": "1980-03-12",
  "email": "juan.perez@example.com",
  "residence": "Alajuela, Costa Rica",
  "genre": "Masculino",
  "workingCondition": "Desempleado",
  "CONAPDIS": false,
  "IMAS": true,
  "physicalFileStatus": false,
  "medicalRecord": true,
  "dateHomeSINRUBE": false,
  "foodBank": true,
  "socioEconomicStudy": false,
  "cancers": [
    {
      "idCancer": 1,
      "status": "En tratamiento",
      "stage": "Etapa III"
    }
  ]
}
```

**Nota:** Los campos `phones` y `emergencyContacts` son opcionales.

---

## ✅ Ejemplo con Múltiples Cánceres

```http
POST http://localhost:3000/api/survivors
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "idHeadquarter": 1,
  "survivorName": "Ana Rodríguez",
  "documentNumber": "3-0456-0789",
  "country": "Costa Rica",
  "birthday": "1975-08-20",
  "email": "ana.rodriguez@example.com",
  "residence": "Heredia, Costa Rica",
  "genre": "Femenino",
  "workingCondition": "Pensionada",
  "CONAPDIS": true,
  "IMAS": true,
  "physicalFileStatus": true,
  "medicalRecord": true,
  "dateHomeSINRUBE": true,
  "foodBank": true,
  "socioEconomicStudy": true,
  "notes": "Requiere seguimiento constante",
  "cancers": [
    {
      "idCancer": 1,
      "status": "Remisión completa",
      "stage": "Etapa I"
    },
    {
      "idCancer": 3,
      "status": "En tratamiento",
      "stage": "Etapa II"
    },
    {
      "idCancer": 5,
      "status": "Curado",
      "stage": "Etapa I"
    }
  ],
  "phones": [25551234],
  "emergencyContacts": [1]
}
```

---

## ❌ Errores Comunes

### Error 1: Sin cánceres

```http
POST http://localhost:3000/api/survivors
Content-Type: application/json

{
  "idHeadquarter": 1,
  "survivorName": "Test User",
  "cancers": []  // ❌ ERROR: Mínimo 1 cáncer requerido
}
```

**Respuesta esperada:**
```json
{
  "ok": false,
  "errors": ["Debe proporcionar al menos un tipo de cáncer"]
}
```

---

### Error 2: Estructura incorrecta de cancer

```http
POST http://localhost:3000/api/survivors
Content-Type: application/json

{
  "idHeadquarter": 1,
  "survivorName": "Test User",
  "cancers": [
    {
      "idCancer": 1
      // ❌ Faltan: status y stage
    }
  ]
}
```

**Respuesta esperada:**
```json
{
  "ok": false,
  "errors": [
    "Cancer 1: status es requerido y debe ser un texto",
    "Cancer 1: stage (etapa) es requerido y debe ser un texto"
  ]
}
```

---

### Error 3: Campos booleanos como strings

```http
POST http://localhost:3000/api/survivors
Content-Type: application/json

{
  "idHeadquarter": 1,
  "survivorName": "Test User",
  "CONAPDIS": "si",  // ❌ Debe ser boolean
  "IMAS": "no",      // ❌ Debe ser boolean
  "physicalFileStatus": "true",  // ❌ Debe ser boolean sin comillas
  "cancers": [...]
}
```

**Respuesta esperada:**
```json
{
  "ok": false,
  "errors": [
    "CONAPDIS: Debe ser verdadero o falso",
    "IMAS: Debe ser verdadero o falso",
    "physicalFileStatus: Debe ser verdadero o falso"
  ]
}
```

---

### Error 4: Teléfonos con formato incorrecto

```http
POST http://localhost:3000/api/survivors
Content-Type: application/json

{
  "idHeadquarter": 1,
  "survivorName": "Test User",
  "phones": "22334455",  // ❌ Debe ser un array
  "cancers": [...]
}
```

**Respuesta esperada:**
```json
{
  "ok": false,
  "errors": ["phones debe ser un array de números"]
}
```

---

## ✅ Respuesta Exitosa

```json
{
  "ok": true,
  "message": "Survivor created successfully",
  "data": {
    "idSurvivor": 5,
    "idHeadquarter": 1,
    "survivorName": "María González Pérez",
    "documentNumber": "1-0234-0567",
    "country": "Costa Rica",
    "birthday": "1985-05-15T00:00:00.000Z",
    "email": "maria.gonzalez@example.com",
    "residence": "San José, Costa Rica",
    "genre": "Femenino",
    "workingCondition": "Empleada",
    "CONAPDIS": true,
    "IMAS": false,
    "physicalFileStatus": true,
    "medicalRecord": false,
    "dateHomeSINRUBE": true,
    "foodBank": true,
    "socioEconomicStudy": false,
    "notes": "Paciente con seguimiento mensual",
    "status": "active",
    "headquarter": {
      "idHeadquarter": 1,
      "name": "Sede Central",
      "email": "central@funca.org",
      "location": "San José, Costa Rica"
    },
    "cancerSurvivor": [
      {
        "status": "En tratamiento",
        "stage": "Etapa II",
        "cancer": {
          "idCancer": 1,
          "cancerName": "Cáncer de mama",
          "description": "Tratamiento oncológico y acompañamiento psicosocial"
        }
      },
      {
        "status": "Remisión",
        "stage": "Etapa I",
        "cancer": {
          "idCancer": 2,
          "cancerName": "Cáncer de próstata",
          "description": "Seguimiento y control"
        }
      }
    ],
    "phoneSurvivor": [
      {
        "phone": {
          "idPhone": 1,
          "phone": 22334455
        }
      },
      {
        "phone": {
          "idPhone": 2,
          "phone": 88776655
        }
      }
    ],
    "emergencyContactSurvivor": [
      {
        "emergencyContact": {
          "idEmergencyContact": 1,
          "nameEmergencyContact": "Pedro González",
          "emailEmergencyContact": "pedro@example.com",
          "relationship": "Hermano"
        }
      },
      {
        "emergencyContact": {
          "idEmergencyContact": 2,
          "nameEmergencyContact": "Carmen Pérez",
          "emailEmergencyContact": "carmen@example.com",
          "relationship": "Madre"
        }
      }
    ]
  }
}
```

---

## 📝 Notas Importantes

### Campos Requeridos
- ✅ `idHeadquarter` - ID de la sede (debe existir)
- ✅ `survivorName` - Nombre completo
- ✅ `documentNumber` - Número de documento único
- ✅ `country` - País
- ✅ `birthday` - Fecha de nacimiento
- ✅ `email` - Correo electrónico único
- ✅ `residence` - Dirección de residencia
- ✅ `genre` - Género
- ✅ `workingCondition` - Condición laboral
- ✅ `CONAPDIS` - Boolean
- ✅ `IMAS` - Boolean
- ✅ `physicalFileStatus` - Boolean
- ✅ `medicalRecord` - Boolean
- ✅ `dateHomeSINRUBE` - Boolean
- ✅ `foodBank` - Boolean
- ✅ `socioEconomicStudy` - Boolean
- ✅ **`cancers`** - Array con mínimo 1 cáncer

### Campos Opcionales
- ⭕ `notes` - Notas adicionales
- ⭕ `status` - Estado (default: "active")
- ⭕ `phones` - Array de números de teléfono
- ⭕ `emergencyContacts` - Array de IDs de contactos de emergencia existentes

### Estructura de Cancer
Cada elemento en el array `cancers` debe tener:
```json
{
  "idCancer": 1,        // ID del cáncer (debe existir en tabla Cancer)
  "status": "En tratamiento",  // Estado actual (En tratamiento, Remisión, Curado, etc.)
  "stage": "Etapa II"   // Etapa del cáncer (Etapa I, II, III, IV)
}
```

**Ejemplos de valores para `status`:**
- "En tratamiento"
- "Remisión"
- "Remisión completa"
- "Curado"
- "En seguimiento"
- "Recaída"

**Ejemplos de valores para `stage`:**
- "Etapa I"
- "Etapa II"
- "Etapa III"
- "Etapa IV"
- "No especificado"

### Teléfonos
- Los números de teléfono se crean automáticamente si no existen
- Se pueden compartir entre múltiples survivors
- Formato: Array de números enteros `[22334455, 88776655]`

### Contactos de Emergencia
- Deben existir previamente en la tabla `EmergencyContact`
- Solo se vinculan, no se crean
- Formato: Array de IDs `[1, 2, 3]`

---

## 🔍 Validaciones Implementadas

1. ✅ Campos booleanos deben ser `true` o `false` (no strings)
2. ✅ `cancers` debe ser un array con al menos 1 elemento
3. ✅ Cada cancer debe tener `idCancer`, `status` y `aftermath`
4. ✅ `documentNumber` debe ser único
5. ✅ `email` debe ser único
6. ✅ `phones` debe ser un array (si se proporciona)
7. ✅ `emergencyContacts` debe ser un array de IDs (si se proporciona)
8. ✅ Transacción atómica: si algo falla, nada se guarda

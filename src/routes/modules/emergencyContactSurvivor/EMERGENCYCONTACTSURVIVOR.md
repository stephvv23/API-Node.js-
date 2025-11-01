# API - EmergencyContactSurvivor (Contactos de emergencia ↔ Superviviente)

## Descripción rápida

Gestiona las relaciones entre `EmergencyContact` y `Survivor`. Permite listar, agregar, obtener y eliminar (hard delete) contactos de emergencia para un superviviente.

## Endpoints

### 1) GET /api/survivors/:id/emergency-contacts?take=10&skip=0
**Descripción**: Lista los contactos de emergencia vinculados a un superviviente con paginación.

**Query params**:
- `take` (opcional): Número de registros a retornar. Default: 10
- `skip` (opcional): Número de registros a saltar. Default: 0

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "idEmergencyContact": 1,
      "idSurvivor": 5,
      "emergencyContact": {
        "idEmergencyContact": 1,
        "nameEmergencyContact": "María González",
        "emailEmergencyContact": "maria@example.com",
        "relationship": "Madre",
        "status": "active"
      }
    },
    {
      "idEmergencyContact": 2,
      "idSurvivor": 5,
      "emergencyContact": {
        "idEmergencyContact": 2,
        "nameEmergencyContact": "Pedro López",
        "emailEmergencyContact": "pedro@example.com",
        "relationship": "Hermano",
        "status": "active"
      }
    }
  ]
}
```

---

### 2) GET /api/survivors/:id/emergency-contacts/:idEmergencyContact
**Descripción**: Obtiene una relación específica.

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "idEmergencyContact": 1,
    "idSurvivor": 5,
    "emergencyContact": {
      "idEmergencyContact": 1,
      "nameEmergencyContact": "María González",
      "emailEmergencyContact": "maria@example.com",
      "relationship": "Madre",
      "status": "active"
    }
  }
}
```

---

### 3) POST /api/survivors/:id/emergency-contacts
**Descripción**: Añade un contacto de emergencia al superviviente.

**Body (JSON)**:
```json
{
  "idEmergencyContact": 2
}
```

**Validaciones**:
- `idEmergencyContact` requerido y debe ser un número.
- El contacto debe existir y estar `active` en `EmergencyContact`.
- El superviviente debe existir y estar `active`.

**Comportamiento**:
- Si la relación ya existe → error (debe eliminarse primero para volver a agregar).
- Si no existe → crear relación.

**Ejemplo de respuesta exitosa**:
```json
{
  "success": true,
  "message": "Contacto de emergencia agregado exitosamente",
  "data": {
    "idEmergencyContact": 2,
    "idSurvivor": 5,
    "emergencyContact": {
      "idEmergencyContact": 2,
      "nameEmergencyContact": "Pedro López",
      "emailEmergencyContact": "pedro@example.com",
      "relationship": "Hermano",
      "status": "active"
    }
  }
}
```

**Ejemplo de error (relación ya existe)**:
```json
{
  "success": false,
  "errors": [
    "El superviviente ya tiene registrado el contacto de emergencia \"Pedro López\"."
  ]
}
```

---

### 4) DELETE /api/survivors/:id/emergency-contacts/:idEmergencyContact
**Descripción**: Elimina permanentemente (hard delete) la relación.

**Reglas de negocio**:
- No permite eliminar el único contacto de emergencia del superviviente.

**Ejemplo de respuesta exitosa**:
```json
{
  "success": true,
  "message": "Contacto de emergencia eliminado exitosamente",
  "data": null
}
```

**Ejemplo de error (último contacto)**:
```json
{
  "success": false,
  "message": "No se puede eliminar el único contacto de emergencia del superviviente"
}
```

---

## Notas

- **Hard delete**: Al eliminar una relación, se borra permanentemente de la base de datos (no se puede reactivar).
- Las operaciones de creación/eliminación registran entradas en `SecurityLog`.
- Usa los endpoints de `EmergencyContact` para listar y gestionar los contactos maestros; aquí solo se gestionan las relaciones.

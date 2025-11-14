# Patrón EntityValidators - Validación Centralizada Estándar

## Descripción
Sistema de validación estandarizado usado en todos los módulos para validar datos de entrada de manera consistente y centralizada.

## Ubicación
`src/utils/validator.js`

## Patrón de Uso Estándar

### Importación en Controllers
```javascript
const { EntityValidators } = require('../../../utils/validator');
```

### Validación en Creación (partial: false)
```javascript
const validation = EntityValidators.entityName(req.body, { partial: false });
if (!validation.isValid) {
  return res.validationErrors(validation.errors);
}
```

### Validación en Actualización (partial: true)
```javascript
const validation = EntityValidators.entityName(updateData, { partial: true });
if (!validation.isValid) {
  return res.validationErrors(validation.errors);
}
```

## Entidades que Implementan Este Patrón

### Headquarters
```javascript
EntityValidators.headquarters(data, { partial: false }) // Creación
EntityValidators.headquarters(data, { partial: true })  // Actualización
```

### Cancer
```javascript
EntityValidators.cancer(data, { partial: false }) // Creación
EntityValidators.cancer(data, { partial: true })  // Actualización
```

### Users
```javascript
EntityValidators.user(data, { partial: false }) // Creación
EntityValidators.user(data, { partial: true })  // Actualización
```

### Category
```javascript
EntityValidators.category(data, { partial: false }) // Creación
EntityValidators.category(data, { partial: true })  // Actualización
```

### Role
```javascript
EntityValidators.role(data, { partial: false }) // Creación
EntityValidators.role(data, { partial: true })  // Actualización
```

### Assets
```javascript
EntityValidators.asset(data, { partial: false }) // Creación
EntityValidators.asset(data, { partial: true })  // Actualización
```

### EmergencyContact
```javascript
EntityValidators.emergencyContact(data, { partial: false }) // Creación
EntityValidators.emergencyContact(data, { partial: true })  // Actualización
```

## Patrón de Respuesta de Validación

### Errores de Validación
```javascript
if (!validation.isValid) {
  return res.validationErrors(validation.errors);
}
```

### Estructura de Errores
```javascript
{
  isValid: false,
  errors: [
    "campo1: mensaje de error",
    "campo2: mensaje de error"
  ]
}
```

## Beneficios del Patrón
- **Consistencia**: Validaciones uniformes en toda la aplicación
- **Centralización**: Cambios afectan a todos los módulos
- **Reutilización**: Reglas comunes compartidas
- **Mantenibilidad**: Un solo lugar para modificar validaciones

## Módulos que Usan Este Patrón
- Todos los controllers principales
- HeadquartersController
- CancerController
- UsersController
- CategoryController
- RoleController
- AssetController
- EmergencyContactController</content>
<parameter name="filePath">c:\Users\lara3\Desktop\Universidad semestre 6\Proyecto analisis\API-Node.js-\src\utils\README-Patron-EntityValidators.md
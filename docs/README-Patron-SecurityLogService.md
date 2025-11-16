# Patrón SecurityLogService - Logging de Seguridad Estándar

## Descripción
Sistema de logging estandarizado usado en todos los módulos para registrar operaciones sensibles y mantener trazabilidad completa de acciones de usuarios.

## Ubicación
`src/services/securitylog.service.js`

## Patrón de Uso Estándar

### Importación en Controllers
```javascript
const { SecurityLogService } = require('../../../services/securitylog.service');
```

### Logging de Creación
```javascript
await SecurityLogService.log({
  email: req.user?.sub,
  action: 'CREATE',
  description: `Se creó la entidad "${created.name}"`,
  affectedTable: 'EntityName',
});
```

### Logging de Actualización
```javascript
await SecurityLogService.log({
  email: req.user?.sub,
  action: 'UPDATE',
  description: `Se actualizó la entidad "${updated.name}"`,
  affectedTable: 'EntityName',
});
```

### Logging de Reactivación
```javascript
await SecurityLogService.log({
  email: req.user?.sub,
  action: 'REACTIVATE',
  description: `Se reactivó la entidad "${updated.name}"`,
  affectedTable: 'EntityName',
});
```

### Logging de Inactivación
```javascript
await SecurityLogService.log({
  email: req.user?.sub,
  action: 'INACTIVE',
  description: `Se inactivó la entidad "${deleted.name}"`,
  affectedTable: 'EntityName',
});
```

## Acciones Estándar

### CREATE
Registro de creación de nuevos recursos.
- **Cuándo usar**: Después de crear exitosamente un registro en la base de datos
- **Información requerida**: Datos completos del nuevo registro (ID, nombre, campos principales)
- **Descripción**: Debe incluir todos los campos relevantes del registro creado para trazabilidad completa
- **Ejemplo**: `Se creó la entidad "NombreEntidad" con ID "123" y campos: campo1="valor1", campo2="valor2"`

### UPDATE
Registro de actualización de recursos existentes.
- **Cuándo usar**: Después de actualizar exitosamente un registro, incluyendo cambios de status
- **Información requerida**: Comparación entre versión anterior y nueva del registro
- **Descripción**: Incluir qué campos cambiaron específicamente, valores anteriores y nuevos
- **Ejemplo**: `Se actualizó la entidad. Cambios: nombre: "anterior" → "nuevo", status: "inactive" → "active"`

### REACTIVATE
Registro específico de reactivación (inactive → active).
- **Cuándo usar**: Cuando se cambia el status de 'inactive' a 'active' y no hay otros cambios
- **Información requerida**: Datos completos del registro reactivado
- **Descripción**: Confirmar que solo cambió el status y listar todos los datos actuales
- **Detección**: Comparar versiones anterior y nueva para verificar que solo cambió el status

### INACTIVE
Registro de inactivación (soft delete).
- **Cuándo usar**: Después de cambiar status a 'inactive' (equivalente a eliminación lógica)
- **Información requerida**: Datos del registro antes de la inactivación
- **Descripción**: Incluir ID, nombre y campos principales del registro inactivado
- **Ejemplo**: `Se inactivó la entidad "NombreEntidad" (ID: 123) con campos: campo1="valor1"`

## Mejores Prácticas

### Descripciones Detalladas
- **Incluir IDs**: Siempre incluir el ID del registro para fácil identificación
- **Campos Principales**: Registrar nombre, email, status y otros campos críticos
- **Comparaciones**: Para UPDATE, mostrar explícitamente qué cambió
- **Relaciones**: Incluir información de entidades relacionadas cuando aplique
- **Contexto Completo**: Proporcionar suficiente información para reconstruir el estado del sistema

### Momento de Logging
- **Después de Operación Exitosa**: Solo registrar cuando la operación en BD fue exitosa
- **Antes de Respuesta**: Registrar antes de enviar respuesta al cliente
- **Excepciones**: No registrar si la operación falló (usar console.error para debugging)

### Detección de Reactivación
- **Comparación Campo a Campo**: Verificar que solo cambió el status de inactive a active
- **Campos Excluidos**: Status no debe contar como cambio para otros campos
- **Prioridad**: REACTIVATE tiene prioridad sobre UPDATE cuando aplica

### Detección de Reactivación
```javascript
// Patrón estándar para detectar si solo cambió el status
const onlyStatusChange =
  previousEntity.status === 'inactive' &&
  updatedEntity.status === 'active' &&
  previousEntity.name === updatedEntity.name &&
  previousEntity.email === updatedEntity.email &&
  // ... comparar todos los demás campos relevantes

const action = onlyStatusChange ? 'REACTIVATE' : 'UPDATE';
```

## Entidades que Implementan Este Patrón

### Headquarters
```javascript
// CREATE - Detalla todos los campos del registro creado
description: `Se creó la sede con ID "${newHeadquarter.idHeadquarter}". ` +
  `Nombre: "${newHeadquarter.name}", ` +
  `Horario: "${newHeadquarter.schedule}", ` +
  `Ubicación: "${newHeadquarter.location}", ` +
  `Correo: "${newHeadquarter.email}", ` +
  `Descripción: "${newHeadquarter.description}", ` +
  `Estado: "${newHeadquarter.status}".`

// UPDATE - Comparación detallada de cambios
description: `Se actualizó la sede con ID "${id}".\n` +
  `Versión previa: Nombre: "${previousHeadquarter.name}", Horario: "${previousHeadquarter.schedule}", ` +
  `Ubicación: "${previousHeadquarter.location}", Correo: "${previousHeadquarter.email}", ` +
  `Descripción: "${previousHeadquarter.description}", Estado: "${previousHeadquarter.status}".\n` +
  `Nueva versión: Nombre: "${updatedHeadquarter.name}", Horario: "${updatedHeadquarter.schedule}", ` +
  `Ubicación: "${updatedHeadquarter.location}", Correo: "${updatedHeadquarter.email}", ` +
  `Descripción: "${updatedHeadquarter.description}", Estado: "${updatedHeadquarter.status}".`

// REACTIVATE - Confirmación de solo cambio de status
description: `Se reactivó la sede con ID "${id}". ` +
  `Datos completos: Nombre: "${updatedHeadquarter.name}", ` +
  `Horario: "${updatedHeadquarter.schedule}", Ubicación: "${updatedHeadquarter.location}", ` +
  `Correo: "${updatedHeadquarter.email}", Descripción: "${updatedHeadquarter.description}", ` +
  `Estado: "${updatedHeadquarter.status}".`

// INACTIVE - Datos del registro inactivado
description: `Se inactivó la sede: ID "${id}", ` +
  `Nombre: "${deletedHeadquarter.name}", Horario: "${deletedHeadquarter.schedule}", ` +
  `Ubicación: "${deletedHeadquarter.location}", Correo: "${deletedHeadquarter.email}", ` +
  `Descripción: "${deletedHeadquarter.description}", Estado: "${deletedHeadquarter.status}".`
```

### Cancer
```javascript
// CREATE - Nombre del cáncer creado
description: `Se creó el cáncer "${created.cancerName}" con ID "${created.idCancer}" y descripción "${created.description}".`

// UPDATE - Comparación de cambios en el nombre
description: `Se actualizó el cáncer de "${previous.cancerName}" a "${updated.cancerName}". ` +
  `Descripción previa: "${previous.description}" → Nueva descripción: "${updated.description}".`

// REACTIVATE - Confirmación de reactivación
description: `Se reactivó el cáncer "${updated.cancerName}" (ID: ${updated.idCancer}). ` +
  `Descripción: "${updated.description}", Estado: "${updated.status}".`

// INACTIVE - Datos del cáncer inactivado
description: `Se inactivó el cáncer "${updated.cancerName}" (ID: ${updated.idCancer}). ` +
  `Descripción: "${updated.description}".`
```

### Users
```javascript
// CREATE - Datos completos del usuario creado incluyendo relaciones
description: `Se creó el usuario con email "${created.email}" (ID: ${created.idUser}). ` +
  `Nombre: "${created.name}", Estado: "${created.status}". ` +
  `${formatUserRelations(created)}`

// UPDATE - Comparación detallada incluyendo relaciones
description: `Se actualizó el usuario "${updated.email}".\n` +
  `Versión previa: Nombre: "${previousUser.name}", Email: "${previousUser.email}", Estado: "${previousUser.status}". ` +
  `${formatUserRelations(previousUser)}\n` +
  `Nueva versión: Nombre: "${updated.name}", Email: "${updated.email}", Estado: "${updated.status}". ` +
  `${formatUserRelations(updated)}`

// REACTIVATE - Datos completos del usuario reactivado
description: `Se reactivó el usuario "${updated.name}" (Email: ${updated.email}, ID: ${updated.idUser}). ` +
  `Estado: "${updated.status}". ${formatUserRelations(updatedWithRelations)}`

// INACTIVE - Datos del usuario inactivado
description: `Se inactivó el usuario: ${userToDelete.name} (Email: ${userToDelete.email}, ID: ${userToDelete.idUser}). ` +
  `${formatUserRelations(userToDelete)}`
```

## Patrón formatUserRelations (Users específico)
```javascript
const formatUserRelations = (user) => {
  const sedes = user.headquarterUser?.map(h => `${h.headquarter.name} (ID: ${h.headquarter.idHeadquarter})`).join(', ') || 'Sin sedes';
  const roles = user.roles?.map(r => `${r.role.rolName} (ID: ${r.role.idRole})`).join(', ') || 'Sin roles';
  return `Sedes: [${sedes}], Roles: [${roles}]`;
};
```

## Beneficios del Patrón
- **Trazabilidad**: Registro completo de todas las operaciones
- **Auditoría**: Historial para compliance y debugging
- **Consistencia**: Formato uniforme en todos los módulos
- **Reactivación**: Detección automática de reactivaciones
- **Contexto**: Información detallada de cambios

## Módulos que Usan Este Patrón
- HeadquartersController
- CancerController
- UsersController
- CategoryController
- RoleController
- AssetController
- EmergencyContactController

## Estructura de Base de Datos
```sql
CREATE TABLE SecurityLog (
  idSecurityLog SERIAL PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  affectedTable VARCHAR(50) NOT NULL
);
```</content>
<parameter name="filePath">c:\Users\lara3\Desktop\Universidad semestre 6\Proyecto analisis\API-Node.js-\src\utils\README-Patron-SecurityLogService.md
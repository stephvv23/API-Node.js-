# Patrones Externos Estandarizados - Documentación Completa

Este directorio contiene la documentación de los **patrones externos estandarizados** que se usan consistentemente en todos los módulos del sistema como estándares de desarrollo.

## Patrones Estandarizados Documentados

### 1. EntityValidators - Validación Centralizada
**Archivo**: `README-Patron-EntityValidators.md`
**Descripción**: Sistema de validación estandarizado para todas las entidades
**Uso**: Validación de datos en controllers antes de operaciones CRUD
**Entidades**: user, category, role, headquarters, cancer, asset, emergencyContact
**Patrón**:
```javascript
const validation = EntityValidators.entityName(data, { partial: false });
if (!validation.isValid) {
  return res.validationErrors(validation.errors);
}
```

### 2. SecurityLogService - Logging de Seguridad
**Archivo**: `README-Patron-SecurityLogService.md`
**Descripción**: Sistema de logging estandarizado para operaciones sensibles
**Uso**: Registro automático de todas las operaciones CRUD
**Acciones**: CREATE, UPDATE, REACTIVATE, INACTIVE
**Patrón**:
```javascript
await SecurityLogService.log({
  email: req.user?.sub,
  action: 'CREATE',
  description: `Se creó la entidad "${created.name}"`,
  affectedTable: 'EntityName',
});
```

### 3. Response Methods - Respuestas HTTP
**Archivo**: `README-Patron-Response-Methods.md`
**Descripción**: Métodos de respuesta HTTP estandarizados
**Uso**: Respuestas consistentes en todos los controllers
**Métodos**: `res.success()`, `res.error()`, `res.notFound()`, `res.validationErrors()`
**Patrón**:
```javascript
return res.success(data, 'Operación exitosa');
return res.error('Error interno');
return res.notFound('Entidad');
return res.validationErrors(['Campo requerido']);
```

### 4. Prisma Client - Acceso a Base de Datos
**Archivo**: `README-Patron-Prisma-Client.md`
**Descripción**: ORM estandarizado para acceso type-safe a base de datos
**Uso**: Consultas consistentes en todos los repositories
**Características**: baseSelect, soft delete, relaciones, error handling
**Patrón**:
```javascript
const baseSelect = { idEntity: true, field1: true, field2: true };

create: (data) => prisma.entity.create({ data, select: baseSelect })
findById: (id) => prisma.entity.findUnique({ where: { id }, select: baseSelect })
```

## Arquitectura General con Patrones

```
HTTP Request
    ↓
Controller (EntityValidators + Response Methods)
    ↓
Service (Lógica de Negocio)
    ↓
Repository (Prisma Client)
    ↓
Base de Datos
    ↑
SecurityLogService (Logging paralelo)
```

## Flujo Estándar de Operaciones

### CREATE Operation
```javascript
// 1. Validación con EntityValidators
const validation = EntityValidators.entity(data, { partial: false });
if (!validation.isValid) return res.validationErrors(validation.errors);

// 2. Operación de negocio
const created = await EntityService.create(data);

// 3. Logging con SecurityLogService
await SecurityLogService.log({
  email: req.user?.sub, action: 'CREATE', /* ... */
});

// 4. Respuesta con Response Methods
return res.status(201).success(created, 'Entidad creada');
```

### UPDATE Operation
```javascript
// 1. Verificar existencia
const exists = await EntityService.get(id);
if (!exists) return res.notFound('Entidad');

// 2. Validación con EntityValidators
const validation = EntityValidators.entity(data, { partial: true });
if (!validation.isValid) return res.validationErrors(validation.errors);

// 3. Operación de negocio
const updated = await EntityService.update(id, data);

// 4. Logging con SecurityLogService
await SecurityLogService.log({
  email: req.user?.sub, action: 'UPDATE', /* ... */
});

// 5. Respuesta con Response Methods
return res.success(updated, 'Entidad actualizada');
```

### READ Operation
```javascript
// 1. Operación con Prisma Client
const entity = await EntityService.get(id);
if (!entity) return res.notFound('Entidad');

// 2. Respuesta con Response Methods
return res.success(entity);
```

### DELETE Operation (Soft Delete)
```javascript
// 1. Verificar existencia
const exists = await EntityService.get(id);
if (!exists) return res.notFound('Entidad');

// 2. Operación con Prisma Client (soft delete)
const deleted = await EntityService.delete(id);

// 3. Logging con SecurityLogService
await SecurityLogService.log({
  email: req.user?.sub, action: 'INACTIVE', /* ... */
});

// 4. Respuesta con Response Methods
return res.success(deleted, 'Entidad inactivada');
```

## Beneficios de los Patrones Estandarizados

### Consistencia
- **Validación**: Reglas uniformes en toda la aplicación
- **Logging**: Registro consistente de operaciones
- **Respuestas**: Formato uniforme de respuestas HTTP
- **Base de Datos**: Consultas consistentes con Prisma

### Mantenibilidad
- **Centralización**: Cambios en un patrón afectan consistentemente
- **Reutilización**: Componentes compartidos entre módulos
- **Debugging**: Patrones conocidos facilitan troubleshooting
- **Escalabilidad**: Nuevos módulos siguen estándares existentes

### Calidad
- **Type Safety**: Prisma proporciona validación de tipos
- **Error Handling**: Manejo consistente de errores
- **Security**: Logging automático de operaciones sensibles
- **Performance**: Consultas optimizadas con baseSelect

### Desarrollo
- **Productividad**: Boilerplate estandarizado acelera desarrollo
- **Onboarding**: Nuevos developers aprenden patrones rápidamente
- **Code Review**: Estándares claros facilitan revisión
- **Testing**: Patrones predecibles facilitan testing

## Módulos que Implementan Estos Patrones

### Controllers (Todos usan los 3 patrones principales)
- HeadquartersController
- CancerController
- UsersController
- CategoryController
- RoleController
- AssetController
- EmergencyContactController

### Services (Usan Prisma Client)
- HeadquarterService
- CancerService
- UsersService
- CategoryService
- RoleService
- AssetService
- EmergencyContactService

### Repositories (Usan Prisma Client exclusivamente)
- HeadquarterRepository
- CancerRepository
- UsersRepository
- CategoryRepository
- RoleRepository
- AssetRepository
- EmergencyContactRepository

## Próximos Pasos

Para agregar un nuevo módulo siguiendo estos estándares:

1. **Crear Repository** con patrón Prisma Client
2. **Crear Service** con lógica de negocio
3. **Crear Controller** usando EntityValidators, SecurityLogService y Response Methods
4. **Agregar validaciones** en EntityValidators
5. **Configurar rutas** usando wrapExpressHandler
6. **Actualizar documentación** si es necesario

Esta estandarización asegura calidad, consistencia y mantenibilidad en todo el proyecto.</content>
<parameter name="filePath">c:\Users\lara3\Desktop\Universidad semestre 6\Proyecto analisis\API-Node.js-\src\utils\README-Patrones-Estandarizados.md
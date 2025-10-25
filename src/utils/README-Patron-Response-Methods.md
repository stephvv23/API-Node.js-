# Patrón Response Methods - Respuestas HTTP Estandarizadas

## Descripción
Sistema de métodos de respuesta HTTP estandarizados usado en todos los controllers para mantener consistencia en las respuestas de la API.

## Ubicación
Los métodos están disponibles en el objeto `res` gracias al middleware `standardResponseMiddleware` en `src/utils/apiResponse.js`

## Patrón de Uso Estándar

### res.success(data, message)
Respuesta exitosa con datos.

#### Uso
```javascript
// Respuesta simple
return res.success(data);

// Respuesta con mensaje personalizado
return res.success(data, 'Operación completada exitosamente');
```

#### Estructura de Respuesta
```javascript
{
  "ok": true,
  "data": { /* datos retornados */ },
  "message": "mensaje opcional"
}
```

### res.error(message, statusCode)
Respuesta de error genérico.

#### Uso
```javascript
// Error con código personalizado
return res.error('Error interno del servidor', 500);

// Error con mensaje específico
return res.error('Error al procesar la solicitud');
```

#### Estructura de Respuesta
```javascript
{
  "ok": false,
  "message": "mensaje de error"
}
```

### res.notFound(resource)
Respuesta cuando un recurso no es encontrado.

#### Uso
```javascript
// Verificar existencia primero
const entity = await EntityService.get(id);
if (!entity) {
  return res.notFound('Entidad');
}
```

#### Estructura de Respuesta
```javascript
{
  "ok": false,
  "message": "Entidad no encontrado",
  "statusCode": 404
}
```

### res.validationErrors(errors, message)
Respuesta para errores de validación.

#### Uso
```javascript
// Errores de EntityValidators
if (!validation.isValid) {
  return res.validationErrors(validation.errors);
}

// Errores personalizados
return res.validationErrors(['Campo requerido', 'Formato inválido']);
```

#### Estructura de Respuesta
```javascript
{
  "ok": false,
  "message": "Errores de validación",
  "errors": ["campo1: mensaje", "campo2: mensaje"]
}
```

## Patrones de Manejo de Errores

### Try/Catch Estándar
```javascript
try {
  const data = await EntityService.operation();
  return res.success(data);
} catch (error) {
  console.error('[MODULE] operation error:', error);
  return res.error('Error al realizar operación');
}
```

### Verificación de Existencia
```javascript
const exists = await EntityService.get(id);
if (!exists) {
  return res.notFound('Entidad');
}
```

### Manejo de Errores de Prisma
```javascript
try {
  // operación
} catch (error) {
  if (error.code === 'P2002') {
    return res.validationErrors(['Registro duplicado']);
  }
  if (error.code === 'P2025') {
    return res.notFound('Entidad');
  }
  return res.error('Error en operación');
}
```

## Flujo Estándar en Controllers

### Método CREATE
```javascript
create: async (req, res) => {
  // 1. Validación
  const validation = EntityValidators.entity(req.body, { partial: false });
  if (!validation.isValid) {
    return res.validationErrors(validation.errors);
  }

  try {
    // 2. Operación
    const created = await EntityService.create(req.body);

    // 3. Logging
    await SecurityLogService.log({ /* ... */ });

    // 4. Respuesta exitosa
    return res.status(201).success(created, 'Entidad creada exitosamente');

  } catch (error) {
    // 5. Manejo de errores
    if (error.code === 'P2002') {
      return res.validationErrors(['Registro duplicado']);
    }
    return res.error('Error al crear entidad');
  }
}
```

### Método UPDATE
```javascript
update: async (req, res) => {
  // 1. Verificar existencia
  const exists = await EntityService.get(req.params.id);
  if (!exists) {
    return res.notFound('Entidad');
  }

  // 2. Validación
  const validation = EntityValidators.entity(req.body, { partial: true });
  if (!validation.isValid) {
    return res.validationErrors(validation.errors);
  }

  // 3. Verificar duplicados (si aplica)
  // Ejemplo: verificar nombre único
  if (req.body.name) {
    const duplicate = await EntityService.findByName(req.body.name);
    if (duplicate && duplicate.id !== req.params.id) {
      return res.validationErrors(['Ya existe una entidad con ese nombre']);
    }
  }

  try {
    // 4. Operación
    const updated = await EntityService.update(req.params.id, req.body);

    // 5. Logging
    await SecurityLogService.log({ /* ... */ });

    // 6. Respuesta exitosa
    return res.success(updated, 'Entidad actualizada exitosamente');

  } catch (error) {
    // 7. Manejo de errores
    return res.error('Error al actualizar entidad');
  }
}
```

### Método GET
```javascript
get: async (req, res) => {
  try {
    const entity = await EntityService.get(req.params.id);
    if (!entity) {
      return res.notFound('Entidad');
    }
    return res.success(entity);
  } catch (error) {
    console.error('[MODULE] get error:', error);
    return res.error('Error al obtener entidad');
  }
}
```

### Método LIST
```javascript
list: async (req, res) => {
  try {
    const entities = await EntityService.list();
    return res.success(entities);
  } catch (error) {
    console.error('[MODULE] list error:', error);
    return res.error('Error al obtener entidades');
  }
}
```

### Método REMOVE (Soft Delete)
```javascript
remove: async (req, res) => {
  const exists = await EntityService.get(req.params.id);
  if (!exists) {
    return res.notFound('Entidad');
  }

  try {
    const deleted = await EntityService.delete(req.params.id);

    await SecurityLogService.log({
      email: req.user?.sub,
      action: 'INACTIVE',
      description: `Se inactivó la entidad "${deleted.name}"`,
      affectedTable: 'EntityName',
    });

    return res.success(deleted, 'Entidad inactivada exitosamente');

  } catch (error) {
    if (error.code === 'P2025') {
      return res.notFound('Entidad');
    }
    return res.error('Error al inactivar entidad');
  }
}
```

## Beneficios del Patrón
- **Consistencia**: Respuestas uniformes en toda la API
- **Claridad**: Campo `ok` indica claramente éxito/error
- **Estandarización**: Métodos comunes disponibles en todos los controllers
- **Mantenibilidad**: Cambios centralizados en el middleware
- **Type Safety**: Estructura predecible para clientes

## Módulos que Usan Este Patrón
- Todos los controllers implementan estos métodos de respuesta
- HeadquartersController
- CancerController
- UsersController
- CategoryController
- RoleController
- AssetController
- EmergencyContactController

## Middleware Requerido
Para que estos métodos estén disponibles, debe incluirse el middleware:
```javascript
// En server.js o app.js
const { standardResponseMiddleware } = require('./utils/apiResponse');
app.use(standardResponseMiddleware);
```</content>
<parameter name="filePath">c:\Users\lara3\Desktop\Universidad semestre 6\Proyecto analisis\API-Node.js-\src\utils\README-Patron-Response-Methods.md
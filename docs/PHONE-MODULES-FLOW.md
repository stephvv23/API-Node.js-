# Documentación de Flujo en Módulos de Teléfonos Relacionales

## Introducción

Los módulos de teléfonos relacionales gestionan la relación de un teléfono por entidad (superviviente, padrino, sede, voluntario). Cada entidad puede tener máximo un teléfono registrado. Los módulos siguen un patrón MVC estándar con controladores, servicios, repositorios y rutas.

## Patrón de Diseño y Consistencia

### Patrón Actual

**Survivor (Superviviente):**
- Permite pasar `phone` en el POST /api/survivors (CREATE)
- El teléfono se crea automáticamente en la tabla Phone y se vincula en PhoneSurvivor
- Modificaciones posteriores se realizan mediante endpoints dedicados: `/api/survivors/:id/phone`

**Volunteer, GodParent, Headquarter:**
- NO permiten pasar `phone` en el CREATE del endpoint principal
- Los teléfonos se gestionan exclusivamente mediante endpoints dedicados: `/api/{entity}/:id/phone`

### Inconsistencia Identificada

⚠️ **NOTA IMPORTANTE:** Existe una inconsistencia en el patrón de diseño de la API. El módulo Survivor permite agregar teléfono durante la creación, mientras que Volunteer, GodParent y Headquarter requieren usar endpoints dedicados incluso para la creación inicial del teléfono.

**Recomendación:** Considerar estandarizar todos los módulos para usar el mismo patrón:
- **Opción A:** Permitir `phone` opcional en CREATE para todas las entidades
- **Opción B:** Requerir endpoints dedicados `/phone` para todas las entidades (incluyendo Survivor)

## Validaciones

Todos los módulos de teléfono utilizan la clase reutilizable `ValidationRules` de `src/utils/validator.js`:

- **ID de entidad:** `ValidationRules.parseIdParam(id)` - Valida que el ID sea numérico y positivo
- **Número de teléfono:** `ValidationRules.parsePhoneNumber(phone)` - Valida formato (solo dígitos, máximo 12 dígitos)

## Módulos

### phoneSurvivor
Gestiona teléfonos para supervivientes.

**Endpoints:**
- `GET /api/survivors/:id/phone` - Obtener teléfono
- `POST /api/survivors/:id/phone` - Agregar teléfono (si no tiene)
- `PUT /api/survivors/:id/phone` - Actualizar teléfono
- `DELETE /api/survivors/:id/phone` - Eliminar teléfono

**Flujo General:**
1. Validación de parámetros (ID numérico, teléfono válido)
2. Verificación de existencia de superviviente
3. Llamada a servicio para operación en base de datos
4. Registro de log de seguridad
5. Respuesta al cliente

**Detalles por Operación:**
- **GET:** Valida ID, verifica superviviente existe, obtiene relación teléfono-superviviente, retorna teléfono o null.
- **POST:** Valida ID y teléfono, verifica superviviente existe y no tiene teléfono, encuentra/crea teléfono en tabla Phone, crea relación, loggea acción.
- **PUT:** Similar a POST pero elimina relación existente primero.
- **DELETE:** Valida ID, verifica superviviente existe, elimina relación, loggea acción.

### phoneGodparent
Gestiona teléfonos para padrinos.

**Endpoints:**
- `GET /api/godparents/:id/phone` - Obtener teléfono
- `POST /api/godparents/:id/phone` - Agregar teléfono (si no tiene)
- `PUT /api/godparents/:id/phone` - Actualizar teléfono
- `DELETE /api/godparents/:id/phone` - Eliminar teléfono

**Flujo General:** Igual al módulo phoneSurvivor, reemplazando "superviviente" por "padrino".

### phoneHeadquarter
Gestiona teléfonos para sedes.

**Endpoints:**
- `GET /api/headquarters/:id/phone` - Obtener teléfono
- `POST /api/headquarters/:id/phone` - Agregar teléfono (si no tiene)
- `PUT /api/headquarters/:id/phone` - Actualizar teléfono
- `DELETE /api/headquarters/:id/phone` - Eliminar teléfono

**Flujo General:** Igual al módulo phoneSurvivor, reemplazando "superviviente" por "sede".

### phoneVolunteer
Gestiona teléfonos para voluntarios.

**Endpoints:**
- `GET /api/volunteers/:id/phone` - Obtener teléfono
- `POST /api/volunteers/:id/phone` - Agregar teléfono (si no tiene)
- `PUT /api/volunteers/:id/phone` - Actualizar teléfono
- `DELETE /api/volunteers/:id/phone` - Eliminar teléfono

**Flujo General:** Igual al módulo phoneSurvivor, reemplazando "superviviente" por "voluntario". Además, verifica que el voluntario esté activo.

## Componentes Comunes

- **Controlador:** Maneja requests HTTP, validaciones, llamadas a servicios, logs de seguridad.
- **Servicio:** Capa delgada que delega a repositorio.
- **Repositorio:** Operaciones directas con Prisma en tabla específica (phoneSurvivor, phoneGodparent, etc.).
- **Rutas:** Definición de endpoints con autenticación JWT y autorización por ventana/acción.
- **Validaciones:** ID numérico, teléfono presente, entidad existe, máximo 1 teléfono.
- **Logs de Seguridad:** Registro de acciones (crear, actualizar, eliminar) con usuario de req.user?.sub.
- **Respuestas:** Éxito con datos, errores de validación, no encontrado, errores internos.
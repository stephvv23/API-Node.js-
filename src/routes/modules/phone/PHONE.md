# API - Phone (Teléfonos)

Descripción rápida

Representa números de teléfono únicos en la aplicación. La entidad `Phone` almacena el número (campo `phone`) y su `idPhone`. Las relaciones con supervivientes, voluntarios, etc. se hacen a través de tablas relacionales.

Esquema relevante

- idPhone: Int (PK)
- phone: String (único, max 12)

Endpoints

1) GET /api/phones
- Descripción: Obtiene lista de todos los teléfonos.
- Respuesta: arreglo de objetos `{ idPhone, phone }`.

2) GET /api/phones/:id
- Descripción: Obtiene un teléfono específico por `idPhone`.
- Respuestas: 200 con objeto, o 404 si no existe.

Notas

- No hay endpoints públicos para crear/borrar `Phone` directamente desde el controlador normal; la creación se hace vía `PhoneService.findOrCreate()` cuando se vincula un teléfono a un superviviente u otra entidad.
- El campo `phone` debe ser una cadena de dígitos (sin formatos) y el sistema intenta normalizar entradas en los controladores/servicios.

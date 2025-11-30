# API - PhoneSurvivor (Teléfono ↔ Superviviente)

Descripción rápida

Endpoints para vincular un teléfono a un superviviente (uno por superviviente). El teléfono es una entidad independiente (`Phone`), y `PhoneSurvivor` es la tabla relacional que conecta `Phone` con `Survivor`.

Endpoints

1) GET /api/survivors/:id/phone
- Descripción: Obtiene el teléfono vinculado al superviviente.
- Respuesta: objeto con `idPhone`, `idSurvivor` y `phone` (objeto con `idPhone` y `phone`). Si no existe devuelve `null` con mensaje.

2) POST /api/survivors/:id/phone
- Descripción: Añade un teléfono a un superviviente que no tenga uno.
- Body: { "phone": 50612345678 }
- Validaciones:
  - `phone` es requerido y debe ser string o number que contenga sólo dígitos.
  - Máx 12 dígitos.
  - El superviviente debe existir y estar `active`.
  - Si el superviviente ya tiene teléfono devuelve error; usar PUT para reemplazar.
- Comportamiento:
  - Se busca o crea el registro en `Phone` (campo `phone` es único).
  - Se crea la relación en `PhoneSurvivor`.
  - Se registra SecurityLog (CREATE).

3) PUT /api/survivors/:id/phone
- Descripción: Reemplaza el teléfono del superviviente.
- Body: { "phone": 50687654321 }
- Validaciones:
  - Igual que POST.
  - El superviviente debe ser `active`.
  - Si no tiene teléfono devuelve 404 (usar POST para crear primero).
  - Si se intenta cambiar al mismo número devuelve badRequest.
- Comportamiento:
  - Se elimina la relación anterior (`deleteAllBySurvivor`) y se crea la nueva.
  - Se registra SecurityLog (UPDATE).

4) DELETE /api/survivors/:id/phone
- Descripción: Elimina la relación teléfono-superviviente (no borra el registro de `Phone`, solo la relación).
- Validaciones:
  - El superviviente debe existir.
  - Si no tiene teléfono devuelve 404.
- Comportamiento:
  - Se borran las relaciones de `PhoneSurvivor` para el superviviente.
  - Se registra SecurityLog (DELETE).

Notas

- `Phone` en la DB es inmutable (se reutiliza el mismo registro para varios survivors si se comparte número).
- El flujo está diseñado para mantener `Phone` en una tabla separada y la relación en `PhoneSurvivor`.
- En la creación desde `Survivor.create` se intenta vincular el teléfono dentro de la transacción principal; si cualquier paso falla, todo se revierte.

# API - CancerSurvivor (Cáncer ↔ Superviviente)

Descripción rápida

Tabla relacional que conecta tipos de cáncer (`Cancer`) con `Survivor`. Permite registrar la `stage`. La API soporta crear, actualizar y eliminar (hard delete) estas relaciones.

Endpoints

1) GET /api/survivors/:id/cancers?take=10&skip=0
- Descripción: Lista relaciones cancer-survivor para el superviviente con paginación.
- Query params:
  - `take` (opcional): Número de registros a retornar. Default: 10
  - `skip` (opcional): Número de registros a saltar. Default: 0

2) GET /api/survivors/:id/cancers/:idCancer
- Descripción: Obtiene una relación específica (incluye datos del `Cancer`).

3) POST /api/survivors/:id/cancers
- Descripción: Agrega un tipo de cáncer al superviviente.
- Body (JSON):
{
  "idCancer": 1,
  "stage": "I",
  "status": "active"   // opcional, por defecto 'active'
}
- Validaciones:
  - `idCancer` requerido (number) y debe existir y estar activo en `Cancer`.
  - `stage` requerido (string no vacío).
- Comportamiento especial:
  - Si la relación ya existe y está `active`, retorna error (usar PUT para cambiar etapa).
  - Si la relación existe pero está `inactive`, la reactivará y actualizará `stage` si se proporciona (se registra REACTIVATE).
  - Si no existe, crea una nueva relación.

4) PUT /api/survivors/:id/cancers/:idCancer
- Descripción: Actualiza `stage` y/o `status` de la relación.
- Body (JSON): al menos uno de `stage` (string) o `status` ('active'|'inactive') debe proporcionarse.
- Validaciones: verifica formato y valores permitidos para `status`.

5) DELETE /api/survivors/:id/cancers/:idCancer
- Descripción: Inactiva (soft delete) la relación cancer-survivor.
- Reglas de negocio:
  - No permite inactivar si ya está inactivo.
  - No permite inactivar el último cáncer activo del superviviente (un superviviente debe tener al menos un cáncer activo).

Notas

- En el esquema Prisma `CancerSurvivor` tiene `status String @default("active")`; por tanto las creaciones sin `status` usarán "active".
- Todas las operaciones de estado generan entradas en `SecurityLog`.

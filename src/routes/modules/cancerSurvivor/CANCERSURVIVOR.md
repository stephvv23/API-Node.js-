# API - CancerSurvivor (Cáncer ↔ Superviviente)

Descripción rápida

Tabla relacional que conecta tipos de cáncer (`Cancer`) con `Survivor`. Permite registrar la `stage` y el `status`. La API soporta crear, actualizar y cambiar estado (soft delete) de estas relaciones.

Endpoints

1) GET /api/survivors/:id/cancers?take=10&skip=0&status=active
- Descripción: Lista relaciones cancer-survivor para el superviviente con paginación y filtro de estado.
- Query params:
  - `take` (opcional): Número de registros a retornar. Default: 10
  - `skip` (opcional): Número de registros a saltar. Default: 0
  - `status` (opcional): Filtro de estado. Valores permitidos:
    - `active` (default): Solo cánceres activos
    - `inactive`: Solo cánceres inactivos
    - `all`: Todos los cánceres (activos e inactivos)
- Respuesta: Lista ordenada (activos primero, luego inactivos)
- Ejemplo: `GET /api/survivors/1/cancers?status=all` retorna todos los cánceres del superviviente

2) GET /api/survivors/:id/cancers/:idCancer
- Descripción: Obtiene una relación específica (incluye datos del `Cancer`).
- Nota: Solo retorna si está activa. Para obtener inactivas, usar el listado con `status=all`.

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

5) PATCH /api/survivors/:id/cancers/:idCancer/status
- Descripción: Alterna el estado (activo ↔ inactivo) de la relación cancer-survivor.
- Comportamiento:
  - Si está `active`, cambia a `inactive` (soft delete)
  - Si está `inactive`, cambia a `active` (reactivar)
- Reglas de negocio:
  - No permite inactivar el último cáncer activo del superviviente (un superviviente debe tener al menos un cáncer activo).
- Respuesta: Retorna la relación con el nuevo estado
- Security Log: Registra "DELETE" al inactivar o "REACTIVATE" al activar

Notas

- En el esquema Prisma `CancerSurvivor` tiene `status String @default("active")`; por tanto las creaciones sin `status` usarán "active".
- Todas las operaciones de estado generan entradas en `SecurityLog`.
- El filtro `status` por defecto es `active` para mantener compatibilidad con versiones anteriores.
- Los cánceres inactivos representan cánceres que el superviviente tuvo pero ya no están activos o fueron eliminados del registro.

# API - EmergencyContactSurvivor (Contactos de emergencia ↔ Superviviente)

Descripción rápida

Gestiona las relaciones entre `EmergencyContact` y `Survivor`. Permite listar, agregar (o reactivar), obtener y eliminar (soft delete) contactos de emergencia para un superviviente.

Endpoints

1) GET /api/survivors/:id/emergency-contacts?status=active|inactive|all
- Descripción: Lista los contactos de emergencia vinculados a un superviviente según `status`.
- Query `status` por defecto: `active`.

2) GET /api/survivors/:id/emergency-contacts/:idEmergencyContact
- Descripción: Obtiene una relación específica.

3) POST /api/survivors/:id/emergency-contacts
- Descripción: Añade un contacto de emergencia al superviviente o lo reactiva si existía previamente.
- Body (JSON): { "idEmergencyContact": 2 }
- Validaciones:
  - `idEmergencyContact` requerido y debe ser un número.
  - El contacto debe existir y estar `active` en `EmergencyContact`.
  - El superviviente debe existir y estar `active`.
- Comportamiento:
  - Si la relación ya existe y está `active` -> error.
  - Si existe pero `inactive` -> reactivar y devolver la relación reactivada.
  - Si no existe -> crear relación (status por defecto 'active').

4) DELETE /api/survivors/:id/emergency-contacts/:idEmergencyContact
- Descripción: Inactiva (soft delete) la relación.
- Reglas de negocio:
  - No permite inactivar si ya está inactivo.
  - No permite inactivar el único contacto de emergencia activo del superviviente.

Notas

- Las operaciones de creación/reactivación/inactivación registran entradas en `SecurityLog`.
- Usa los endpoints de `EmergencyContact` para listar y gestionar los contactos maestros; aquí solo se gestionan las relaciones.

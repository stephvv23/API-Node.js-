# Análisis de Índices para Base de Datos - Prisma

## 📊 Resumen Ejecutivo

Este documento presenta el análisis de los campos más utilizados en consultas de cada módulo y las recomendaciones de índices para optimizar el rendimiento de la base de datos.

---

## 🔍 Análisis por Módulo

### 1. **User (Usuarios)**
**Campos más consultados:**
- ✅ `email` - Ya es PRIMARY KEY (índice único automático)
- `status` - Filtrado frecuente en búsquedas con roles y permisos

**Consultas identificadas:**
- `findByEmail` con joins a roles y headquarters
- Filtros por `status = 'active'` en consultas de roles
- Búsquedas en `TokenBlacklist` por `token`

**Recomendaciones:**
- ✅ `email` ya tiene índice (PK)
- ➕ Índice en `status` para filtrado rápido
- ➕ Índice en `TokenBlacklist.token` para validación de tokens

---

### 2. **Volunteer (Voluntarios)**
**Campos más consultados:**
- `identifier` - Búsqueda única por documento
- `email` - Búsqueda por correo
- `status` - Filtrado en listados
- `idVolunteer` (FK en relaciones)

**Consultas identificadas:**
- `findByIdentifier(identifier)`
- `findByEmail(email)`
- `list()` con filtro por `status`
- Múltiples joins con `HeadquarterVolunteer`, `EmergencyContactVolunteer`, `ActivityVolunteer`

**Recomendaciones:**
- ➕ Índice único en `identifier`
- ➕ Índice en `email`
- ➕ Índice en `status`

---

### 3. **Activity (Actividades)**
**Campos más consultados:**
- `idHeadquarter` - FK para filtrar por sede
- `status` - Filtrado de actividades activas/inactivas
- `type` - Filtrado por tipo de actividad
- `modality` - Filtrado por modalidad
- `date` - Búsquedas por rango de fechas

**Consultas identificadas:**
- `findAll()` con filtros: status, headquarter, type, modality, date range
- Joins frecuentes con `Headquarter`, `ActivityVolunteer`, `ActivitySurvivor`, `ActivityGodparent`

**Recomendaciones:**
- ➕ Índice en `idHeadquarter` (FK)
- ➕ Índice en `status`
- ➕ Índice en `type`
- ➕ Índice en `date`
- ➕ Índice compuesto en `(idHeadquarter, status, date)` para consultas complejas

---

### 4. **Asset (Activos)**
**Campos más consultados:**
- `idCategory` - FK frecuente
- `idHeadquarter` - FK para filtrar por sede
- `status` - Filtrado activo/inactivo

**Consultas identificadas:**
- `listByUserEmail()` - Filtra por headquarters del usuario
- `list()` con joins a `Category` y `Headquarter`
- Validaciones de categorías y sedes activas

**Recomendaciones:**
- ➕ Índice en `idCategory` (FK)
- ➕ Índice en `idHeadquarter` (FK)
- ➕ Índice en `status`

---

### 5. **Godparent (Padrinos)**
**Campos más consultados:**
- `email` - Búsqueda por correo
- `name` - Búsqueda por nombre
- `idSurvivor` - FK opcional (puede ser null)
- `idHeadquarter` - FK para sede
- `status` - Filtrado

**Consultas identificadas:**
- `findByEmail(email)`
- `findByName(name)`
- Joins con `Survivor`, `Headquarter`, `ActivityGodparent`

**Recomendaciones:**
- ➕ Índice en `email`
- ➕ Índice en `idSurvivor` (FK)
- ➕ Índice en `idHeadquarter` (FK)
- ➕ Índice en `status`

---

### 6. **Survivor (Sobrevivientes)**
**Campos más consultados:**
- `idHeadquarter` - FK para sede
- `documentNumber` - Identificación única
- `email` - Búsqueda por correo
- `status` - Filtrado

**Consultas identificadas:**
- Joins frecuentes con `Headquarter`, `CancerSurvivor`, `EmergencyContactSurvivor`
- Relación con `Godparent` (varios padrinos por sobreviviente)

**Recomendaciones:**
- ➕ Índice único en `documentNumber`
- ➕ Índice en `email`
- ➕ Índice en `idHeadquarter` (FK)
- ➕ Índice en `status`

---

### 7. **Headquarter (Sedes)**
**Campos más consultados:**
- ✅ `name` - Ya es UNIQUE (índice automático)
- `email` - Búsqueda por correo
- `status` - Filtrado

**Consultas identificadas:**
- `findbyname(name)`
- `findbyemail(email)`
- FK en múltiples tablas: Activity, Asset, Survivor, Godparent, etc.

**Recomendaciones:**
- ✅ `name` ya tiene índice único
- ➕ Índice en `email`
- ➕ Índice en `status`

---

### 8. **Role (Roles)**
**Campos más consultados:**
- ✅ `rolName` - Ya es UNIQUE (índice automático)
- `status` - Filtrado frecuente

**Consultas identificadas:**
- `findByName(rolName)`
- `list()` con filtro por status
- Joins con `UserRole`, `RoleWindow`

**Recomendaciones:**
- ✅ `rolName` ya tiene índice único
- ➕ Índice en `status`

---

### 9. **Category (Categorías)**
**Campos más consultados:**
- ✅ `name` - Ya es UNIQUE (índice automático)
- `status` - Filtrado

**Consultas identificadas:**
- `findByName(name)`
- `list()` con filtro por status

**Recomendaciones:**
- ✅ `name` ya tiene índice único
- ➕ Índice en `status`

---

### 10. **Cancer**
**Campos más consultados:**
- ✅ `cancerName` - Ya es UNIQUE (índice automático)
- `status` - Filtrado

**Recomendaciones:**
- ✅ `cancerName` ya tiene índice único
- ➕ Índice en `status`

---

### 11. **Window (Módulos/Ventanas)**
**Campos más consultados:**
- ✅ `windowName` - Ya es UNIQUE (índice automático)
- `status` - Filtrado en permisos

**Recomendaciones:**
- ✅ `windowName` ya tiene índice único
- ➕ Índice en `status`

---

### 12. **EmergencyContact (Contactos de Emergencia)**
**Campos más consultados:**
- `status` - Filtrado

**Consultas identificadas:**
- Joins con `EmergencyContactVolunteer`, `EmergencyContactSurvivor`

**Recomendaciones:**
- ➕ Índice en `status`

---

### 13. **LoginAccess (Accesos)**
**Campos más consultados:**
- `email` - FK para usuario
- `date` - Para reportes históricos

**Recomendaciones:**
- ➕ Índice en `email` (FK)
- ➕ Índice en `date` para consultas de rango

---

### 14. **SecurityLog (Logs de Seguridad)**
**Campos más consultados:**
- `email` - FK para usuario
- `date` - Búsquedas por fecha
- `affectedTable` - Filtrado por tabla

**Recomendaciones:**
- ➕ Índice en `email` (FK)
- ➕ Índice en `date`
- ➕ Índice en `affectedTable`
- ➕ Índice compuesto en `(email, date)` para auditorías por usuario

---

### 15. **Phone (Teléfonos)**
**Campos más consultados:**
- `phone` - Búsqueda única

**Recomendaciones:**
- ➕ Índice único en `phone` (evitar duplicados)

---

## 📋 Tablas Relacionales (Muchos a Muchos)

Todas las tablas relacionales ya tienen **índices automáticos en sus PKs compuestas**, pero se recomienda:

**Índices adicionales sugeridos:**
- `HeadquarterUser`: índice en `email` para búsquedas inversas
- `UserRole`: índice en `email` para búsquedas inversas
- `RoleWindow`: índice en `idWindow` para búsquedas inversas
- `HeadquarterVolunteer`: índice en `idVolunteer` para búsquedas inversas
- `ActivityVolunteer`: índice en `idVolunteer` para búsquedas inversas
- `ActivitySurvivor`: índice en `idSurvivor` para búsquedas inversas
- `CancerSurvivor`: índice en `idSurvivor` para búsquedas inversas

---

## 🎯 Resumen de Índices Recomendados

### Índices Simples por Prioridad

#### **Prioridad ALTA** (Uso muy frecuente)
1. `User.status`
2. `Volunteer.identifier` (UNIQUE)
3. `Volunteer.email`
4. `Volunteer.status`
5. `Activity.idHeadquarter`
6. `Activity.status`
7. `Activity.date`
8. `Asset.idCategory`
9. `Asset.idHeadquarter`
10. `Asset.status`
11. `Survivor.documentNumber` (UNIQUE)
12. `Survivor.idHeadquarter`
13. `Survivor.status`
14. `Godparent.idHeadquarter`
15. `Godparent.status`

#### **Prioridad MEDIA** (Uso frecuente)
16. `Godparent.email`
17. `Godparent.idSurvivor`
18. `Headquarter.email`
19. `Headquarter.status`
20. `Role.status`
21. `Category.status`
22. `Cancer.status`
23. `Window.status`
24. `EmergencyContact.status`
25. `LoginAccess.email`
26. `LoginAccess.date`
27. `SecurityLog.email`
28. `SecurityLog.date`
29. `Phone.phone` (UNIQUE)
30. `TokenBlacklist.token`

#### **Prioridad BAJA** (Uso ocasional)
31. `Activity.type`
32. `Activity.modality`
33. `SecurityLog.affectedTable`
34. `Survivor.email`

### Índices Compuestos (Para consultas complejas)

1. `Activity (idHeadquarter, status, date)` - Búsquedas de actividades por sede y fecha
2. `SecurityLog (email, date)` - Auditorías por usuario
3. `Asset (idHeadquarter, status)` - Activos por sede

---

## 📈 Impacto Esperado

### Beneficios
- ⚡ **Mejora en velocidad de consultas:** 50-90% más rápido en búsquedas
- 🔍 **Búsquedas por campos únicos:** Instantáneas (identifier, documentNumber, email)
- 📊 **Reportes y filtrados:** Mucho más eficientes
- 🔗 **Joins:** Optimizados con índices en FKs

### Consideraciones
- 💾 **Espacio adicional:** ~10-15% más de almacenamiento
- ⏱️ **Inserciones ligeramente más lentas:** Pero insignificante en este contexto
- ✅ **Mantenimiento automático:** MySQL mantiene los índices actualizados

---

## 🛠️ Implementación

Los índices se implementarán en el archivo `schema.prisma` usando las directivas:
- `@@index([campo])` - Índice simple
- `@@index([campo1, campo2])` - Índice compuesto
- `@unique` - Índice único

Después de actualizar el schema, ejecutar:
```bash
npx prisma migrate dev --name add_optimized_indexes
```

---

## 📝 Notas Adicionales

- Los campos que ya son `@unique` o PRIMARY KEY no necesitan índices adicionales
- Los índices compuestos son útiles cuando se consultan múltiples campos juntos frecuentemente
- Es importante monitorear el uso real después de implementar para ajustar si es necesario
- MySQL crea índices automáticos en FKs, pero los estamos definiendo explícitamente para documentación

---

**Fecha de análisis:** Noviembre 2025  
**Versión:** 1.0  
**Estado:** Pendiente de implementación

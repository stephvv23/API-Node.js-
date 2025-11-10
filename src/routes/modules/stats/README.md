# 📊 Módulo de Estadísticas - FuncaVida API

Este módulo proporciona endpoints específicos para el sistema de estadísticas del frontend de FuncaVida, siguiendo el patrón estándar del proyecto: **Controller → Service → Repository**.

## 🏗️ Estructura del Módulo

```
src/routes/modules/stats/
├── stats.controller.js    # Controladores HTTP
├── stats.service.js       # Lógica de negocio
├── stats.repository.js     # Acceso a base de datos con Prisma
├── stats.routes.js        # Definición de rutas
└── README.md             # Documentación
```

## 🔐 Autenticación y Autorización

**Todos los endpoints requieren autenticación JWT y permisos de ADMIN.**

- **Autenticación**: Token JWT válido en el header `Authorization: Bearer <token>`
- **Autorización**: Solo usuarios con rol ADMIN pueden acceder a los reportes
- **Ventana**: 'Reportes' con permiso 'read'

### Ejemplo de Uso con Autenticación:

```javascript
// En el frontend
const token = localStorage.getItem('jwt_token');
const response = await fetch('/api/stats/general', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

if (response.status === 401) {
  // Usuario no autenticado
  console.log('Token inválido o expirado');
} else if (response.status === 403) {
  // Usuario sin permisos de ADMIN
  console.log('No tienes permisos para ver reportes');
} else {
  const result = await response.json();
  // Procesar datos de estadísticas
}
```

## 🚀 Endpoints Disponibles

### **1. Security Logs**
**GET** `/api/security-logs`

Obtiene logs de seguridad para estadísticas de acciones e incidencias.

**Parámetros de Query:**
- `limit` (opcional): Número máximo de registros (default: 1000)
- `offset` (opcional): Número de registros a saltar (default: 0)
- `startDate` (opcional): Fecha de inicio (ISO string)
- `endDate` (opcional): Fecha de fin (ISO string)
- `action` (opcional): Filtrar por acción específica
- `affectedTable` (opcional): Filtrar por tabla afectada

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "securityIdLog": 149,
      "email": "admin@funca.org",
      "date": "2025-10-26T19:22:42.305Z",
      "action": "ASSIGN_VOLUNTEERS",
      "description": "Se asignaron 2 voluntarios a la actividad ID \"1\"",
      "affectedTable": "activityvolunteer",
      "user": {
        "email": "admin@funca.org",
        "name": "Admin User"
      }
    }
  ]
}
```

### **2. Estadísticas de Usuarios**
**GET** `/api/users/stats`

Obtiene estadísticas completas de usuarios del sistema.

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "totalUsers": 3,
    "activeUsers": 3,
    "inactiveUsers": 0,
    "newUsersThisMonth": 2,
    "usersByRole": [
      { "role": "ADMIN", "count": 1 },
      { "role": "COORDINATOR", "count": 1 },
      { "role": "voluntarios", "count": 1 }
    ],
    "usersBySede": [
      { "sede": "Sede Central", "count": 2 },
      { "sede": "Sede Norte", "count": 1 }
    ],
    "topUsersByAccess": [
      {
        "email": "admin@funca.org",
        "name": "Admin User",
        "accessCount": 45
      }
    ],
    "lastAccessByUser": [
      {
        "email": "admin@funca.org",
        "name": "Admin User",
        "lastAccess": "2025-10-26T19:22:42.305Z"
      }
    ]
  }
}
```

### **3. Estadísticas Generales**
**GET** `/api/stats/general`

Obtiene estadísticas generales del sistema.

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "systemStats": {
      "totalUsers": 3,
      "totalRoles": 3,
      "totalHeadquarters": 2,
      "totalVolunteers": 33,
      "totalSurvivors": 1,
      "totalActivities": 6,
      "totalAssets": 6,
      "totalSuppliers": 2
    },
    "securityStats": {
      "totalLogins": 150,
      "totalSecurityLogs": 149,
      "incidentsByTable": [
        { "affectedTable": "activityvolunteer", "_count": { "securityIdLog": 50 } }
      ],
      "mostCommonActions": [
        { "action": "ASSIGN_VOLUNTEERS", "_count": { "securityIdLog": 30 } }
      ]
    },
    "activityStats": {
      "last30Days": {
        "activeUsers": 3,
        "totalLogins": 150,
        "totalSecurityLogs": 149
      }
    }
  }
}
```

### **4. Usuarios por Rol y Sede**
**GET** `/api/stats/users-by-role-sede`

Obtiene datos para gráfico de usuarios activos por rol y sede.

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "combination": "ADMIN - Sede Central",
      "count": 1
    },
    {
      "combination": "COORDINATOR - Sede Norte",
      "count": 1
    }
  ]
}
```

### **5. Nuevos Usuarios Mensuales**
**GET** `/api/stats/new-users-monthly`

Obtiene datos para gráfico de nuevos usuarios por mes (últimos 12 meses).

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "month": "2025-10",
      "count": 2
    },
    {
      "month": "2025-09",
      "count": 1
    }
  ]
}
```

### **6. Acciones Más Comunes**
**GET** `/api/stats/top-actions`

Obtiene las 5 acciones más registradas en SecurityLog.

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "action": "ASSIGN_VOLUNTEERS",
      "count": 30
    },
    {
      "action": "LOGIN",
      "count": 25
    }
  ]
}
```

### **7. Incidencias por Tabla**
**GET** `/api/stats/incidents-by-table`

Obtiene incidencias agrupadas por tabla afectada.

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "table": "activityvolunteer",
      "count": 50
    },
    {
      "table": "users",
      "count": 30
    }
  ]
}
```

### **8. Prueba de Conexión**
**GET** `/api/stats/test`

Endpoint de prueba para verificar la conexión a la base de datos.

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "message": "Conexión a base de datos exitosa",
    "userCount": 3,
    "roleCount": 3,
    "timestamp": "2025-10-27T00:56:29.419Z"
  }
}
```

## 🔧 Patrón de Arquitectura

### **Controller (stats.controller.js)**
- Maneja las peticiones HTTP
- Valida parámetros de entrada
- Delega lógica de negocio al Service
- Maneja errores y respuestas

### **Service (stats.service.js)**
- Contiene la lógica de negocio
- Coordina múltiples operaciones del Repository
- Optimiza consultas con Promise.all()
- Procesa y transforma datos

### **Repository (stats.repository.js)**
- Acceso directo a la base de datos con Prisma
- Consultas optimizadas y eficientes
- Manejo de relaciones y agregaciones
- Separación de consultas complejas

## 📈 Optimizaciones Implementadas

### **Rendimiento**
- Uso de `Promise.all()` para consultas paralelas
- Consultas optimizadas con `groupBy` y `count`
- Separación de consultas para evitar `groupBy` con `include`
- Paginación configurable en security logs

### **Manejo de Errores**
- Try/catch en todos los niveles
- Logging consistente con prefijo `[STATS]`
- Respuestas de error estandarizadas
- Manejo de casos edge (datos vacíos, relaciones faltantes)

### **Escalabilidad**
- Filtros opcionales para reducir carga
- Límites configurables en consultas
- Estructura modular fácil de extender
- Consultas eficientes para grandes volúmenes

## 🚀 Integración con Frontend

El frontend ya está preparado para consumir estos endpoints. Los datos están estructurados para ser compatibles con:

- **Chart.js**: Para gráficos de barras, líneas y pastel
- **StatsManager.js**: Para cálculos estadísticos adicionales
- **Tablas dinámicas**: Para mostrar datos en formato tabular

## 📝 Uso Rápido

```javascript
// Ejemplo de uso en el frontend
const response = await fetch('/api/users/stats');
const result = await response.json();

if (result.ok) {
  const userStats = result.data;
  
  // Usar los datos para gráficos
  const chartData = userStats.usersByRole.map(item => ({
    label: item.role,
    value: item.count
  }));
}
```

## 📋 Códigos de Respuesta HTTP

### **200 OK**
- Petición exitosa, datos devueltos correctamente
- Formato: `{ok: true, data: {...}}`

### **401 Unauthorized**
- Token JWT inválido, expirado o no proporcionado
- Usuario no autenticado

### **403 Forbidden**
- Usuario autenticado pero sin permisos de ADMIN
- No tiene acceso a la ventana 'Reportes'

### **500 Internal Server Error**
- Error interno del servidor
- Problemas de conexión a base de datos
- Formato: `{ok: false, message: "Error message"}`

## ✅ Estado Actual

- ✅ Todos los endpoints funcionando correctamente
- ✅ **Autenticación JWT implementada** - Solo ADMIN puede acceder
- ✅ **Autorización por ventana** - Permiso 'read' en 'Reportes'
- ✅ Respuestas en formato estándar del proyecto (`{ok: true, data: ...}`)
- ✅ Manejo de errores robusto
- ✅ Consultas optimizadas con Prisma
- ✅ Documentación completa
- ✅ Patrón de arquitectura consistente con el proyecto

**El sistema de estadísticas está completamente implementado y listo para usar con tu frontend. Solo usuarios ADMIN pueden acceder a los reportes.**

# Formato Completo de Security Log por Módulo

## Descripción
Este documento detalla **TODOS los datos** que se guardan en el campo `description` de la tabla `security.log` para cada módulo del sistema. Esta información es vital para que el frontend pueda extraer y mostrar correctamente todos los detalles de cada evento registrado.

## Ubicación de los Datos
- **Tabla**: `SecurityLog`
- **Campo**: `description` (TEXT) - Contiene TODOS los datos del evento
- **Campo**: `affectedTable` (VARCHAR(50)) - Identifica el módulo
- **Campo**: `action` (VARCHAR(50)) - Tipo de acción (CREATE, UPDATE, REACTIVATE, INACTIVE)

## Formato de Logging por Módulo

### 1. Módulo de Usuarios (User)

#### CREATE - Creación de Usuario
**Formato completo:**
```
Se creó el usuario con los siguientes datos: Email: "email@ejemplo.com", Nombre: "Nombre Usuario", Estado: "active". Sedes: [Sede Central (ID: 1)], Roles: [ADMIN (ID: 1)].
```

**Ejemplo real:**
```
Se creó el usuario con los siguientes datos: Email: "admin@funca.org", Nombre: "Admin Funca", Estado: "active". Sedes: [Sede Central (ID: 1)], Roles: [ADMIN (ID: 1)].
```

#### UPDATE - Actualización de Usuario
**Formato completo:**
```
Se actualizó el usuario "email@ejemplo.com".
Versión previa: Nombre: "Nombre Anterior", Email: "email@ejemplo.com", Estado: "active". Sedes: [Sede Central (ID: 1)], Roles: [ADMIN (ID: 1)].
Nueva versión: Nombre: "Nombre Nuevo", Email: "email@ejemplo.com", Estado: "active". Sedes: [Sede Central (ID: 1)], Roles: [ADMIN (ID: 1)].
```

#### REACTIVATE - Reactivación de Usuario
**Formato completo:**
```
Se reactivó el usuario con email "email@ejemplo.com". Datos completos: Email: "email@ejemplo.com", Nombre: "Nombre Usuario", Estado: "active". Sedes: [Sede Central (ID: 1)], Roles: [ADMIN (ID: 1)].
```

#### INACTIVE - Inactivación de Usuario
**Formato completo:**
```
Se inactivó el usuario: Email: "email@ejemplo.com", Nombre: "Nombre Usuario", Estado: "inactive". Sedes: [Sede Central (ID: 1)], Roles: [ADMIN (ID: 1)].
```

### 2. Módulo de Activos (Assets)

#### CREATE - Creación de Activo
**Formato completo:**
```
Se creó el activo con los siguientes datos: ID: "123", Categoría ID: "2", Sede ID: "1", Nombre: "Nombre Activo", Tipo: "Tipo Activo", Descripción: "Descripción del activo", Estado: "active".
```

**Ejemplo real:**
```
Se creó el activo con los siguientes datos: ID: "3", Categoría ID: "2", Sede ID: "1", Nombre: "pepe", Tipo: "asdfsfd", Descripción: "asdgsagd", Estado: "active".
```

#### UPDATE - Actualización de Activo
**Formato completo:**
```
Se actualizó el activo con ID "123". Versión previa: Nombre: "Nombre Anterior", Tipo: "Tipo Anterior", Descripción: "Descripción anterior", Categoría ID: "2", Sede ID: "1", Estado: "active". Nueva versión: Nombre: "Nombre Nuevo", Tipo: "Tipo Nuevo", Descripción: "Descripción nueva", Categoría ID: "2", Sede ID: "1", Estado: "active".
```

**Ejemplo real:**
```
Se actualizó el activo con ID "3". Versión previa: Nombre: "pepe", Tipo: "asdfsfd", Descripción: "asdgsagd", Categoría ID: "2", Sede ID: "1", Estado: "active". Nueva versión: Nombre: "pepe actualizado", Tipo: "asdfsfd", Descripción: "asdgsagd", Categoría ID: "2", Sede ID: "1", Estado: "active".
```

#### INACTIVE - Inactivación de Activo
**Formato completo:**
```
Se inactivó el activo: ID "123", Nombre: "Nombre Activo", Tipo: "Tipo Activo", Descripción: "Descripción del activo", Categoría ID: "2", Sede ID: "1", Estado: "inactive".
```

### 3. Módulo de Sedes (Headquarter)

#### CREATE - Creación de Sede
**Formato completo:**
```
Se creó la sede con los siguientes datos: ID: "123", Nombre: "Nombre Sede", Horario: "Horario de atención", Ubicación: "Ubicación física", Correo: "email@sede.com", Descripción: "Descripción de la sede", Estado: "active".
```

**Ejemplo real:**
```
Se creó la sede con los siguientes datos: ID: "1", Nombre: "Sede Central", Horario: "Lunes a Viernes 8:00-17:00", Ubicación: "San José, Costa Rica", Correo: "central@funca.org", Descripción: "Sede principal de la organización", Estado: "active".
```

#### UPDATE - Actualización de Sede
**Formato completo:**
```
Se actualizó la sede con ID "123". Versión previa: Nombre: "Nombre Anterior", Horario: "Horario anterior", Ubicación: "Ubicación anterior", Correo: "email@sede.com", Descripción: "Descripción anterior", Estado: "active". Nueva versión: Nombre: "Nombre Nuevo", Horario: "Horario nuevo", Ubicación: "Ubicación nueva", Correo: "email@sede.com", Descripción: "Descripción nueva", Estado: "active".
```

**Ejemplo real:**
```
Se actualizó la sede con ID "1". Versión previa: Nombre: "Sede Central", Horario: "Lunes a Viernes 8:00-17:00", Ubicación: "San José, Costa Rica", Correo: "central@funca.org", Descripción: "Sede principal", Estado: "active". Nueva versión: Nombre: "Sede Central Actualizada", Horario: "Lunes a Viernes 9:00-18:00", Ubicación: "San José Centro", Correo: "central@funca.org", Descripción: "Sede principal actualizada", Estado: "active".
```

#### REACTIVATE - Reactivación de Sede
**Formato completo:**
```
Se reactivó la sede con ID "123". Datos completos: Nombre: "Nombre Sede", Horario: "Horario de atención", Ubicación: "Ubicación física", Correo: "email@sede.com", Descripción: "Descripción de la sede", Estado: "active".
```

#### INACTIVE - Inactivación de Sede
**Formato completo:**
```
Se inactivó la sede: ID "123", Nombre: "Nombre Sede", Horario: "Horario de atención", Ubicación: "Ubicación física", Correo: "email@sede.com", Descripción: "Descripción de la sede", Estado: "inactive".
```

### 4. Módulo de Actividades (Activity)

#### CREATE - Creación de Actividad
**Formato completo:**
```
Se creó la actividad con los siguientes datos: ID: "123", Título: "Título Actividad", Tipo: "Tipo Actividad", Modalidad: "Presencial/Virtual", Capacidad: 25, Ubicación: "Ubicación específica", Fecha: "2024-12-01", Estado: "active". Sede: "Nombre Sede" (ID: 1).
```

#### UPDATE - Actualización de Actividad
**Formato completo:**
```
Se actualizó la actividad con ID "123". Versión previa: Título: "Título Anterior", Tipo: "Tipo Anterior", Modalidad: "Presencial", Capacidad: 20, Ubicación: "Ubicación anterior", Fecha: "2024-12-01", Estado: "active". Sede: "Nombre Sede" (ID: 1). Nueva versión: Título: "Título Nuevo", Tipo: "Tipo Nuevo", Modalidad: "Presencial", Capacidad: 25, Ubicación: "Ubicación nueva", Fecha: "2024-12-01", Estado: "active". Sede: "Nombre Sede" (ID: 1).
```

**Ejemplo real:**
```
Se actualizó la actividad con ID "1". Versión previa: Título: "Taller de Cocina", Tipo: "Taller", Modalidad: "Presencial", Capacidad: 20, Ubicación: "Sala Principal", Fecha: "2024-12-01", Estado: "active". Sede: "Sede Central" (ID: 1). Nueva versión: Título: "Taller de Cocina Avanzado", Tipo: "Taller", Modalidad: "Presencial", Capacidad: 25, Ubicación: "Sala Principal", Fecha: "2024-12-01", Estado: "active". Sede: "Sede Central" (ID: 1).
```

#### REACTIVATE - Reactivación de Actividad
**Formato completo:**
```
Se reactivó la actividad con ID "123". Datos completos: Título: "Título Actividad", Tipo: "Tipo Actividad", Modalidad: "Presencial/Virtual", Capacidad: 25, Ubicación: "Ubicación específica", Fecha: "2024-12-01", Estado: "active". Sede: "Nombre Sede" (ID: 1).
```

#### INACTIVE - Inactivación de Actividad
**Formato completo:**
```
Se inactivó la actividad: ID "123", Título: "Título Actividad", Tipo: "Tipo Actividad", Modalidad: "Presencial/Virtual", Capacidad: 25, Ubicación: "Ubicación específica", Fecha: "2024-12-01", Estado: "inactive". Sede: "Nombre Sede" (ID: 1).
```

### 5. Módulo de Cáncer

#### CREATE - Creación de Cáncer
**Formato completo:**
```
Se creó el cáncer "Nombre Cáncer" con ID "123" y descripción "Descripción del cáncer".
```

**Ejemplo real:**
```
Se creó el cáncer "Cancer de estomago" con ID "1" y descripción "Tipo de cáncer que afecta el estómago".
```

#### UPDATE - Actualización de Cáncer
**Formato completo:**
```
Se actualizó el cáncer de "Nombre Anterior" a "Nombre Nuevo". Descripción previa: "Descripción anterior" → Nueva descripción: "Descripción nueva".
```

#### REACTIVATE - Reactivación de Cáncer
**Formato completo:**
```
Se reactivó el cáncer "Nombre Cáncer" (ID: 123). Descripción: "Descripción del cáncer", Estado: "active".
```

#### INACTIVE - Inactivación de Cáncer
**Formato completo:**
```
Se inactivó el cáncer "Nombre Cáncer" (ID: 123). Descripción: "Descripción del cáncer".
```

### 6. Módulo de Categorías (Category)

#### CREATE - Creación de Categoría
**Formato completo:**
```
Se creó la categoría con los siguientes datos: ID: "123", Nombre: "Nombre Categoría", Descripción: "Descripción de la categoría", Estado: "active".
```

#### UPDATE - Actualización de Categoría
**Formato completo:**
```
Se actualizó la categoría con ID "123". Versión previa: Nombre: "Nombre Anterior", Descripción: "Descripción anterior", Estado: "active". Nueva versión: Nombre: "Nombre Nuevo", Descripción: "Descripción nueva", Estado: "active".
```

#### REACTIVATE - Reactivación de Categoría
**Formato completo:**
```
Se reactivó la categoría con ID "123". Datos completos: Nombre: "Nombre Categoría", Descripción: "Descripción de la categoría", Estado: "active".
```

#### INACTIVE - Inactivación de Categoría
**Formato completo:**
```
Se inactivó la categoría: ID "123", Nombre: "Nombre Categoría", Descripción: "Descripción de la categoría", Estado: "inactive".
```

### 7. Módulo de Roles (Role)

#### CREATE - Creación de Rol
**Formato completo:**
```
Se creó el rol con los siguientes datos: ID: "123", Nombre: "Nombre Rol", Descripción: "Descripción del rol", Estado: "active".
```

#### UPDATE - Actualización de Rol
**Formato completo:**
```
Se actualizó el rol con ID "123". Versión previa: Nombre: "Nombre Anterior", Descripción: "Descripción anterior", Estado: "active". Nueva versión: Nombre: "Nombre Nuevo", Descripción: "Descripción nueva", Estado: "active".
```

#### REACTIVATE - Reactivación de Rol
**Formato completo:**
```
Se reactivó el rol con ID "123". Datos completos: Nombre: "Nombre Rol", Descripción: "Descripción del rol", Estado: "active".
```

#### INACTIVE - Inactivación de Rol
**Formato completo:**
```
Se inactivó el rol: ID "123", Nombre: "Nombre Rol", Descripción: "Descripción del rol", Estado: "inactive".
```

### 8. Módulo de Contactos de Emergencia (EmergencyContact)

#### CREATE - Creación de Contacto de Emergencia
**Formato completo:**
```
Se creó el contacto de emergencia con los siguientes datos: ID: "123", Nombre: "Nombre Contacto", Teléfono: "12345678", Relación: "Relación con el paciente", Estado: "active".
```

#### UPDATE - Actualización de Contacto de Emergencia
**Formato completo:**
```
Se actualizó el contacto de emergencia con ID "123". Versión previa: Nombre: "Nombre Anterior", Teléfono: "12345678", Relación: "Relación anterior", Estado: "active". Nueva versión: Nombre: "Nombre Nuevo", Teléfono: "87654321", Relación: "Relación nueva", Estado: "active".
```

#### REACTIVATE - Reactivación de Contacto de Emergencia
**Formato completo:**
```
Se reactivó el contacto de emergencia con ID "123". Datos completos: Nombre: "Nombre Contacto", Teléfono: "12345678", Relación: "Relación con el paciente", Estado: "active".
```

#### INACTIVE - Inactivación de Contacto de Emergencia
**Formato completo:**
```
Se inactivó el contacto de emergencia: ID "123", Nombre: "Nombre Contacto", Teléfono: "12345678", Relación: "Relación con el paciente", Estado: "inactive".
```

## Patrones de Parsing para Frontend

### Función Universal para Extraer Datos
```javascript
function parseSecurityLogDescription(description, affectedTable, action) {
  const patterns = {
    'User': {
      CREATE: /Se creó el usuario con los siguientes datos: Email: "(?<email>[^"]+)", Nombre: "(?<name>[^"]+)", Estado: "(?<status>[^"]+)". Sedes: \[(?<sedes>[^\]]+)\], Roles: \[(?<roles>[^\]]+)\]\./,
      UPDATE: /Se actualizó el usuario "(?<email>[^"]+)".\s*Versión previa: (?<previousData>.*?)\.\s*Nueva versión: (?<newData>.*?)\./s,
      REACTIVATE: /Se reactivó el usuario con email "(?<email>[^"]+)". Datos completos: Email: "(?<email>[^"]+)", Nombre: "(?<name>[^"]+)", Estado: "(?<status>[^"]+)". Sedes: \[(?<sedes>[^\]]+)\], Roles: \[(?<roles>[^\]]+)\]\./,
      INACTIVE: /Se inactivó el usuario: Email: "(?<email>[^"]+)", Nombre: "(?<name>[^"]+)", Estado: "(?<status>[^"]+)". Sedes: \[(?<sedes>[^\]]+)\], Roles: \[(?<roles>[^\]]+)\]\./
    },
    'Assets': {
      CREATE: /Se creó el activo con los siguientes datos: ID: "(?<id>[^"]+)", Categoría ID: "(?<categoryId>[^"]+)", Sede ID: "(?<headquarterId>[^"]+)", Nombre: "(?<name>[^"]+)", Tipo: "(?<type>[^"]+)", Descripción: "(?<description>[^"]+)", Estado: "(?<status>[^"]+)"\./,
      UPDATE: /Se actualizó el activo con ID "(?<id>[^"]+)". Versión previa: (?<previousData>.*?)\. Nueva versión: (?<newData>.*?)\./s,
      INACTIVE: /Se inactivó el activo: ID "(?<id>[^"]+)", Nombre: "(?<name>[^"]+)", Tipo: "(?<type>[^"]+)", Descripción: "(?<description>[^"]+)", Categoría ID: "(?<categoryId>[^"]+)", Sede ID: "(?<headquarterId>[^"]+)", Estado: "(?<status>[^"]+)"\./
    },
    'Headquarter': {
      CREATE: /Se creó la sede con los siguientes datos: ID: "(?<id>[^"]+)", Nombre: "(?<name>[^"]+)", Horario: "(?<schedule>[^"]+)", Ubicación: "(?<location>[^"]+)", Correo: "(?<email>[^"]+)", Descripción: "(?<description>[^"]+)", Estado: "(?<status>[^"]+)"\./,
      UPDATE: /Se actualizó la sede con ID "(?<id>[^"]+)". Versión previa: (?<previousData>.*?)\. Nueva versión: (?<newData>.*?)\./s,
      REACTIVATE: /Se reactivó la sede con ID "(?<id>[^"]+)". Datos completos: Nombre: "(?<name>[^"]+)", Horario: "(?<schedule>[^"]+)", Ubicación: "(?<location>[^"]+)", Correo: "(?<email>[^"]+)", Descripción: "(?<description>[^"]+)", Estado: "(?<status>[^"]+)"\./,
      INACTIVE: /Se inactivó la sede: ID "(?<id>[^"]+)", Nombre: "(?<name>[^"]+)", Horario: "(?<schedule>[^"]+)", Ubicación: "(?<location>[^"]+)", Correo: "(?<email>[^"]+)", Descripción: "(?<description>[^"]+)", Estado: "(?<status>[^"]+)"\./
    },
    'Activity': {
      CREATE: /Se creó la actividad con los siguientes datos: ID: "(?<id>[^"]+)", Título: "(?<title>[^"]+)", Tipo: "(?<type>[^"]+)", Modalidad: "(?<modality>[^"]+)", Capacidad: (?<capacity>\d+), Ubicación: "(?<location>[^"]+)", Fecha: "(?<date>[^"]+)", Estado: "(?<status>[^"]+)". Sede: "(?<headquarterName>[^"]+)" \(ID: (?<headquarterId>\d+)\)\./,
      UPDATE: /Se actualizó la actividad con ID "(?<id>[^"]+)". Versión previa: (?<previousData>.*?)\. Nueva versión: (?<newData>.*?)\./s,
      REACTIVATE: /Se reactivó la actividad con ID "(?<id>[^"]+)". Datos completos: Título: "(?<title>[^"]+)", Tipo: "(?<type>[^"]+)", Modalidad: "(?<modality>[^"]+)", Capacidad: (?<capacity>\d+), Ubicación: "(?<location>[^"]+)", Fecha: "(?<date>[^"]+)", Estado: "(?<status>[^"]+)". Sede: "(?<headquarterName>[^"]+)" \(ID: (?<headquarterId>\d+)\)\./,
      INACTIVE: /Se inactivó la actividad: ID "(?<id>[^"]+)", Título: "(?<title>[^"]+)", Tipo: "(?<type>[^"]+)", Modalidad: "(?<modality>[^"]+)", Capacidad: (?<capacity>\d+), Ubicación: "(?<location>[^"]+)", Fecha: "(?<date>[^"]+)", Estado: "(?<status>[^"]+)". Sede: "(?<headquarterName>[^"]+)" \(ID: (?<headquarterId>\d+)\)\./
    },
    'Cancer': {
      CREATE: /Se creó el cáncer "(?<name>[^"]+)" con ID "(?<id>[^"]+)" y descripción "(?<description>[^"]+)"\./,
      UPDATE: /Se actualizó el cáncer de "(?<previousName>[^"]+)" a "(?<newName>[^"]+)". Descripción previa: "(?<previousDescription>[^"]+)" → Nueva descripción: "(?<newDescription>[^"]+)"\./,
      REACTIVATE: /Se reactivó el cáncer "(?<name>[^"]+)" \(ID: (?<id>\d+)\). Descripción: "(?<description>[^"]+)", Estado: "(?<status>[^"]+)"\./,
      INACTIVE: /Se inactivó el cáncer "(?<name>[^"]+)" \(ID: (?<id>\d+)\). Descripción: "(?<description>[^"]+)"\./
    }
  };

  const modulePatterns = patterns[affectedTable];
  if (!modulePatterns) {
    return null; // Módulo no soportado
  }

  const pattern = modulePatterns[action];
  if (!pattern) {
    return null; // Acción no soportada
  }

  const match = description.match(pattern);
  if (!match) {
    return null; // No se pudo parsear
  }

  return match.groups;
}
```

### Función para Procesar Logs UPDATE
```javascript
function parseUpdateLog(description, affectedTable) {
  // Para logs UPDATE, necesitamos extraer tanto la versión previa como la nueva
  const updatePattern = /Se actualizó.*?Versión previa: (?<previousData>.*?)\. Nueva versión: (?<newData>.*?)\./s;
  const match = description.match(updatePattern);
  
  if (!match) {
    return null;
  }

  // Parsear datos de la nueva versión (estado actual)
  const newDataPatterns = {
    'Assets': /Nombre: "(?<name>[^"]+)", Tipo: "(?<type>[^"]+)", Descripción: "(?<description>[^"]+)", Categoría ID: "(?<categoryId>[^"]+)", Sede ID: "(?<headquarterId>[^"]+)", Estado: "(?<status>[^"]+)"/,
    'Headquarter': /Nombre: "(?<name>[^"]+)", Horario: "(?<schedule>[^"]+)", Ubicación: "(?<location>[^"]+)", Correo: "(?<email>[^"]+)", Descripción: "(?<description>[^"]+)", Estado: "(?<status>[^"]+)"/,
    'Activity': /Título: "(?<title>[^"]+)", Tipo: "(?<type>[^"]+)", Modalidad: "(?<modality>[^"]+)", Capacidad: (?<capacity>\d+), Ubicación: "(?<location>[^"]+)", Fecha: "(?<date>[^"]+)", Estado: "(?<status>[^"]+)". Sede: "(?<headquarterName>[^"]+)" \(ID: (?<headquarterId>\d+)\)/
  };

  const newDataPattern = updatePatterns[affectedTable];
  if (!newDataPattern) {
    return null;
  }

  const newDataMatch = match.groups.newData.match(newDataPattern);
  return newDataMatch ? newDataMatch.groups : null;
}
```

## Ejemplo de Uso en Frontend

### Componente React para Mostrar Logs Detallados
```javascript
import React, { useState, useEffect } from 'react';

const SecurityLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityLogs();
  }, []);

  const fetchSecurityLogs = async () => {
    try {
      const response = await fetch('/api/security-logs');
      const data = await response.json();
      
      // Procesar cada log para extraer todos los datos
      const processedLogs = data.map(log => {
        const parsedData = parseSecurityLogDescription(log.description, log.affectedTable, log.action);
        return {
          ...log,
          parsedData: parsedData
        };
      });
      
      setLogs(processedLogs);
    } catch (error) {
      console.error('Error fetching security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLogDetails = (log) => {
    if (!log.parsedData) {
      return <span>No se pudieron parsear los datos</span>;
    }

    switch (log.affectedTable) {
      case 'User':
        return (
          <div>
            <p><strong>Email:</strong> {log.parsedData.email}</p>
            <p><strong>Nombre:</strong> {log.parsedData.name}</p>
            <p><strong>Estado:</strong> {log.parsedData.status}</p>
            <p><strong>Sedes:</strong> {log.parsedData.sedes}</p>
            <p><strong>Roles:</strong> {log.parsedData.roles}</p>
          </div>
        );
      case 'Assets':
        return (
          <div>
            <p><strong>ID:</strong> {log.parsedData.id}</p>
            <p><strong>Nombre:</strong> {log.parsedData.name}</p>
            <p><strong>Tipo:</strong> {log.parsedData.type}</p>
            <p><strong>Descripción:</strong> {log.parsedData.description}</p>
            <p><strong>Sede ID:</strong> {log.parsedData.headquarterId}</p>
            <p><strong>Categoría ID:</strong> {log.parsedData.categoryId}</p>
            <p><strong>Estado:</strong> {log.parsedData.status}</p>
          </div>
        );
      case 'Headquarter':
        return (
          <div>
            <p><strong>ID:</strong> {log.parsedData.id}</p>
            <p><strong>Nombre:</strong> {log.parsedData.name}</p>
            <p><strong>Horario:</strong> {log.parsedData.schedule}</p>
            <p><strong>Ubicación:</strong> {log.parsedData.location}</p>
            <p><strong>Correo:</strong> {log.parsedData.email}</p>
            <p><strong>Descripción:</strong> {log.parsedData.description}</p>
            <p><strong>Estado:</strong> {log.parsedData.status}</p>
          </div>
        );
      case 'Activity':
        return (
          <div>
            <p><strong>ID:</strong> {log.parsedData.id}</p>
            <p><strong>Título:</strong> {log.parsedData.title}</p>
            <p><strong>Tipo:</strong> {log.parsedData.type}</p>
            <p><strong>Modalidad:</strong> {log.parsedData.modality}</p>
            <p><strong>Capacidad:</strong> {log.parsedData.capacity}</p>
            <p><strong>Ubicación:</strong> {log.parsedData.location}</p>
            <p><strong>Fecha:</strong> {log.parsedData.date}</p>
            <p><strong>Sede:</strong> {log.parsedData.headquarterName} (ID: {log.parsedData.headquarterId})</p>
            <p><strong>Estado:</strong> {log.parsedData.status}</p>
          </div>
        );
      case 'Cancer':
        return (
          <div>
            <p><strong>ID:</strong> {log.parsedData.id}</p>
            <p><strong>Nombre:</strong> {log.parsedData.name}</p>
            <p><strong>Descripción:</strong> {log.parsedData.description}</p>
            <p><strong>Estado:</strong> {log.parsedData.status}</p>
          </div>
        );
      default:
        return <span>Módulo no soportado</span>;
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="security-log-table">
      <h2>Registro Completo de Cambios</h2>
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Acción</th>
            <th>Módulo</th>
            <th>Fecha</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.securityIdLog}>
              <td>{log.user?.name || 'N/A'}</td>
              <td>{log.email}</td>
              <td>{log.action}</td>
              <td>{log.affectedTable}</td>
              <td>{new Date(log.date).toLocaleDateString()}</td>
              <td>{renderLogDetails(log)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SecurityLogTable;
```

## Resumen de Campos por Módulo

| Módulo | Campos Disponibles | Acciones Soportadas |
|--------|-------------------|-------------------|
| **User** | email, name, status, sedes, roles | CREATE, UPDATE, REACTIVATE, INACTIVE |
| **Assets** | id, name, type, description, headquarterId, categoryId, status | CREATE, UPDATE, INACTIVE |
| **Headquarter** | id, name, schedule, location, email, description, status | CREATE, UPDATE, REACTIVATE, INACTIVE |
| **Activity** | id, title, type, modality, capacity, location, date, headquarterName, headquarterId, status | CREATE, UPDATE, REACTIVATE, INACTIVE |
| **Cancer** | id, name, description, status | CREATE, UPDATE, REACTIVATE, INACTIVE |
| **Category** | id, name, description, status | CREATE, UPDATE, REACTIVATE, INACTIVE |
| **Role** | id, name, description, status | CREATE, UPDATE, REACTIVATE, INACTIVE |
| **EmergencyContact** | id, name, phone, relation, status | CREATE, UPDATE, REACTIVATE, INACTIVE |

## Consideraciones Importantes

1. **Encoding**: Los textos están en UTF-8, manejar caracteres especiales correctamente
2. **Saltos de línea**: En UPDATE se usan `\n` para separar versiones
3. **Comillas**: Todos los valores están entre comillas dobles
4. **Campos opcionales**: Algunos campos pueden ser null o vacíos
5. **Formato de fechas**: Las fechas están en formato ISO 8601
6. **Múltiples relaciones**: En el módulo User, un usuario puede tener múltiples sedes y roles separados por comas
7. **Logs UPDATE**: Siempre usar la "Nueva versión" para obtener el estado actual

## Endpoints Disponibles

- **GET** `/api/security-logs` - Obtener todos los logs
- **GET** `/api/security-logs?affectedTable=User` - Solo logs de usuarios
- **GET** `/api/security-logs?action=CREATE` - Solo logs de creación
- **GET** `/api/security-logs?startDate=2024-01-01&endDate=2024-12-31` - Filtrar por fechas

---

**Nota**: Este documento se actualiza automáticamente cuando cambian los formatos de logging en el backend. Para cambios en el formato, contactar al equipo de backend.
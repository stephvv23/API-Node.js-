
# Paso a paso para que les funcione prisma
Instalar dependencias:

intalar la extension en vscode llamada prisma

En terminal escribir 
    npm install


Crear archivo .env con el contenido:

    DATABASE_URL="mysql://root:TUPASSWORD@localhost:3306/TUBASEDATOS"
    PORT=3000
    JWT_SECRET="clave_secreta"
    FRONTEND_URL="http://localhost:3000"  # Para email links


Validar y generar cliente Prisma:
    en terminal escribir 
    npx prisma validate
    npx prisma generate


    Migrar la base de datos:
        npx prisma migrate dev -n init_users_module

   # ############################### COMANDO PARA REINICIAR TODA LA BASE DE DATOS Y PONER LOS SEEDERS TOTALMENTE DESDE 0: 
        npx prisma migrate reset

se usa subir para subri cuando no hay datos  |       se usa para subir cuando ya hay datos    
    Correr datos base                        |       Actualiza la BD al vuelo sin crear migraciones.
    npx prisma db seed                       |       npx prisma db push

    Abrir Prisma Studio (opcional):

    npx prisma studio

# instalar bcryp
    npm install bcrypt 

# instalar express
    npm install -D @types/express

# instalar cors
    npm i cors

# instalar el jsonwebToken
npm i jsonwebtoken

# Run 

---

## Password Reset Feature 🔐

Se ha implementado un sistema completo de recuperación de contraseña por email.

### Endpoints Disponibles

- **POST `/api/password-recovery/request`** - Solicitar reset de contraseña
- **POST `/api/password-recovery/verify-token`** - Verificar si un token es válido
- **POST `/api/password-recovery/reset`** - Resetear contraseña con token

### Características

✅ Tokens únicos generados con crypto.randomBytes  
✅ Expiración de 1 hora  
✅ One-time use (previene reutilización)  
✅ Password hashing con bcrypt  
✅ Audit logging de eventos  
✅ No revela si usuario existe (seguridad)  
✅ Email integration (console mock + production ready)  

### Documentación

- **[PASSWORD_RESET_INTEGRATION.md](./docs/PASSWORD_RESET_INTEGRATION.md)** - Guía de integración frontend y backend
- **[PASSWORD_RESET_TESTING.md](./docs/PASSWORD_RESET_TESTING.md)** - Guía paso a paso para testear
- **[Postman_PasswordReset_Collection.json](./docs/Postman_PasswordReset_Collection.json)** - Colección Postman lista para importar

### Quick Start

1. Solicitar reset:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com"}'
```

2. Obtener token (desarrollo):
```bash
curl http://localhost:3000/api/auth/latest-reset-token?email=usuario@example.com
```

3. Resetear contraseña:
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_HERE","newPassword":"NuevaContraseña123!"}'
```

    npm run dev

# Test
    {
        "email": "josueelmer1234@gmail.com",
        "name": "Elmer Josue Rodriguez",
        "status": "active",
        "password": "1234"
    }

# corre la api en el postMan
http://localhost:3000/api/users

# para correr la api
npm run dev
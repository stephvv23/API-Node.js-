
# Paso a paso para que les funcione prisma
Instalar dependencias:

intalar la extension en vscode llamada prisma

En terminal escribir 
    npm install


Crear archivo .env con el contenido:

    DATABASE_URL="mysql://root:TUPASSWORD@localhost:3306/TUBASEDATOS"
    PORT=3000
    JWT_SECRET="clave_secreta"
    FRONTEND_URL="http://localhost:3000"
    
    # Email Configuration (for Password Recovery)
    EMAIL_HOST="smtp.gmail.com"
    EMAIL_PORT=587
    EMAIL_USER="tu-email@gmail.com"
    EMAIL_PASS="tu-app-password"
    EMAIL_FROM="noreply@tuapp.com"


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

# instalar nodemailer (para recuperación de contraseña)
npm i nodemailer

# Run 

---

## 🔐 Módulo de Recuperación de Contraseña

### Configuración Rápida

1. **Instalar dependencia**:
   ```bash
   npm i nodemailer
   ```

2. **Configurar variables de entorno** (en tu `.env`):
   ```
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="tu-email@gmail.com"
   EMAIL_PASS="tu-app-password-de-gmail"
   EMAIL_FROM="noreply@tuapp.com"
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Crear App Password en Gmail** :
   - Ve a tu cuenta de Google → Seguridad → Verificación en 2 pasos
   - Genera una "Contraseña de aplicación" para tu app
   - Usa esa contraseña en `EMAIL_PASS`

   **Nota: Este paso en este caso es opconal puesto que yá configurado, para consultar la configuración existente vaya a: soportefuncavida@gmail.com contraseña: FuncaSoporte2025 🔑**

   ## Esta cuenta es de uso meramente de servicio no contiene información sensible de la aplicación. DAR USO RESPONSABLE ##
   

### Endpoints

- **POST** `/api/password-recovery/request` - Solicitar recuperación (envía email)
- **POST** `/api/password-recovery/verify-token` - Verificar validez del token
- **POST** `/api/password-recovery/reset` - Cambiar contraseña con token

### Ejemplo de Uso

```bash
# 1. Solicitar recuperación
POST /api/password-recovery/request
Body: { "email": "usuario@gmail.com" }

# 2. Usuario recibe email con token → Resetear contraseña
POST /api/password-recovery/reset
Body: { 
  "token": "abc123...",
  "newPassword": "NuevaPass123!",
  "confirmPassword": "NuevaPass123!"
}
```

📚 **Documentación completa**: Ver [README-Password-Recovery-Module.md](./docs/README-Password-Recovery-Module.md)

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
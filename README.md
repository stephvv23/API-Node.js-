
# Paso a paso para que les funcione prisma
Instalar dependencias:

intalar la extension en vscode llamada prisma

En terminal escribir 
    npm install


Crear archivo .env con el contenido:

    DATABASE_URL="mysql://root:TUPASSWORD@localhost:3306/TUBASEDATOS"
    PORT=3000
    JWT_SECRET="clave_secreta"


Validar y generar cliente Prisma:
    en terminal escribir 
    npx prisma validate
    npx prisma generate


    Migrar la base de datos:
        npx prisma migrate dev -n init_users_module

se usa subir para subri cuando no hay datos  |       se usa para subir cuando ya hay datos    
    Correr datos base                        |       Actualiza la BD al vuelo sin crear migraciones.
    npx prisma db seed                       |       npx prisma db push

    Abrir Prisma Studio (opcional):

    npx prisma studio



# instalar bcryp
    npm install bcrypt 
    npm install -D @types/bcrypt

# instalar express
    npm install -D @types/express



# instalar cors
    npm i cors
    npm i -D @types/cors

# Run 
    npm run dev

# Test
    {
        "email": "josueelmer1234@gmail.com",
        "name": "Elmer Josue Rodriguez",
        "status": "active",
        "password": "1234"
    }

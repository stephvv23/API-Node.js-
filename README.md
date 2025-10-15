Basado en -> https://www.youtube.com/watch?v=BImKbdy-ubM

# simple-nodejs-api

### Pequeña API REST con Node.js + Express que persiste datos en db.json. Ideal para aprender rutas, métodos HTTP y flujo básico antes de pasar a una BD real (MySQL/Prisma).

--- 


### 🧱 Stack

- Node.js (ESM)
- Express (5.x)
- Nodemon (dev)
- fs para leer/escribir db.json

### 📁 Estructura
```
├── index.js
├── package.json
├── db.json
└── requests.http   # opcional (VS Code REST Client)
```
### 🛠️ Requisitos

- Node.js >= 18
- (Opcional) Extensión REST Client en VS Code o Postman/Insomnia

### ⚙️ Instalación y ejecución
1. Instalar dependencias
`npm install`

2. Ejecutar en desarrollo (reinicio automático)
`npm run dev`
Servirá en: http://localhost:3000
3. package.json relevante:
```js
{
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js"
  }
}
```

### 🗃️ “Base de datos” “fake” (archivo JSON)

Crea db.json en la raíz:
```
{
  "users": []
}
```

La API leerá y escribirá en este archivo.

### 🌐 Endpoints

Base URL: http://localhost:3000

Método	Ruta	Descripción	Body JSON (ejemplo)	Respuesta (ejemplo)
- GET	/	Bienvenida / health	—	{ "message": "Welcome ..." }
- GET	/users	Lista todos los usuarios	—	[ { "id":1,"name":"Ana" } ]
- GET	/users/:id	Obtiene un usuario por ID	—	{ "id":2,"name":"David" }
- POST	/users	Crea un nuevo usuario	{ "name":"David" }	{ "id":3,"name":"David" }

Códigos típicos: 200 OK, 201 Created, 400 Bad Request, 404 Not Found.

### 🧪 Cómo probar
Opción A) 

> Instalar extension requests.http (VS Code)

Asegúrate de:

1. Escribir HTTP/1.1 (no HHTP/1.1)
2. Header correcto: Content-Type
3. Línea en blanco entre headers y body
4. Sin espacios en la URL (evita /users %20)

Opción B) 
> cURL

curl http://localhost:3000/users

curl http://localhost:3000/users/1

curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"David"}'

📜 Licencia

ISC © Stephanie (Stefani Gwen)

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

    Reiniciar los seeders: 
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

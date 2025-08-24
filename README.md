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

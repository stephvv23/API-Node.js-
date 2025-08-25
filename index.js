import express from "express";
import fs from "fs";
import { prisma } from "./src/lib/prisma.js";

const app = express();
app.use(express.json());

// Health
app.get("/", (req, res) => {
  res.json({ message: "API OK with Prisma + MySQL" });
});

// const readData = () => {
//   try {
//     const data = fs.readFileSync("./db.json");
//     return JSON.parse(data);
//   } catch (error) {
//     console.error("Error reading the file:", error);
//   }
// };

// const writeData = (data) => {
//   try {
//     fs.writeFileSync("./db.json", JSON.stringify(data));
//   } catch (error) {
//     console.error("Error reading the file:", error);
//   }
// };

/**
 * GET /users
 * Lista todos los usuarios
 */
app.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /users
 * Crea un usuario nuevo
 * body: { name: string, email: string }
 */
app.post("/users", async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: true,
        message: "name and email are required",
      });
    }

    const created = await prisma.user.create({
      data: { name, email },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.status(201).json(created);
  } catch (err) {
    // Manejo de email duplicado (constraint unique)
    if (err.code === "P2002" && err.meta?.target?.includes("email")) {
      return res.status(409).json({
        error: true,
        message: "Email already exists",
      });
    }
    next(err);
  }
});

// app.get("/", (req, res) => {
//   res.send("Welcome to my firts API with Node.js!!!!");
// });

// Error handler básico
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({
    error: true,
    message: err.message ?? "Internal Server Error"
  });
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API up on http://localhost:${PORT}`));

// Cierre limpio (opcional)
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});


// app.get("/users", (req, res) => {
//   const data = readData();
//   res.json(data.users); //solo envia los users
// });

// app.get("/users/:id", (req, res) => {
//   const data = readData();
//   const id = parseInt(req.params.id);
//   const user = data.users.find((user) => user.id === id);

//   res.json(user); //solo envia el user con el id especifico
// });

// app.post("/users", (req, res) => {
//   const data = readData();
//   const body = req.body;
//   const newUser = {
//     id: data.users.length + 1,
//     ...body,
//   };
//   data.users.push(newUser);
//   writeData(data);
//   res.json(newUser);
// });

// app.put("/users/:id", (req, res) => {
//   const data = readData();
//   const body = req.body;
//   const id = parseInt(req.params.id);
//   const userindex = data.users.findIndex((user) => user.id === id);

//   data.users[userindex] = {
//     ...data.users[userindex],
//     ...body,
//   }; //actualiza el user con la info del body
//   writeData(data);
//   res.json({ message: "User updated successfully" });
// });

// app.delete("/users/:id", (req, res) => {
//   const data = readData();
//   const id = parseInt(req.params.id);
//   const userindex = data.users.findIndex((user) => user.id === id);

//   data.users.splice(userindex, 1); //elimina el user con el id especifico
//   writeData(data);
//   res.json({ message: "User deleted successfully" });
// });



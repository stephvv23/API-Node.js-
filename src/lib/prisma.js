// src/lib/prisma.js

//Importa el cliente de Prisma que se generó a partir de tu schema.prisma.
//Se obtiene métodos tipo prisma.user.findMany(), prisma.post.create(), etc.
import { PrismaClient } from "@prisma/client";

//Toma el objeto global de Node (compatible también con browser/edge).
//Lo usamos para guardar/reutilizar una sola instancia de Prisma en desarrollo
const globalForPrisma = globalThis;

// Crea una instancia de PrismaClient y la exporta
// con configuración de logging para errores y advertencias
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
    log: ["error", "warn", "query"] // puedes añadir "query" si quieres ver SQL
    });


// En desarrollo, guarda la instancia de Prisma en el objeto global
// para que se reutilice y no cree muchas conexiones a la base de datos
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

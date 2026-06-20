import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the service.
export const prisma = new PrismaClient();

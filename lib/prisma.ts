import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAccelerate: PrismaClient | undefined;
};

const isAccelerate = process.env.DATABASE_URL?.startsWith("prisma+postgres://");

function createDirectClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? (["query", "error", "warn"] as Prisma.LogLevel[])
        : (["error"] as Prisma.LogLevel[]),
  });
}

function createAccelerateClient(): PrismaClient {
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!,
    log:
      process.env.NODE_ENV === "development"
        ? (["query", "error", "warn"] as Prisma.LogLevel[])
        : (["error"] as Prisma.LogLevel[]),
  }).$extends(withAccelerate()) as unknown as PrismaClient;
}

const prisma = isAccelerate
  ? (globalForPrisma.prismaAccelerate ??= createAccelerateClient())
  : (globalForPrisma.prisma ??= createDirectClient());

if (process.env.NODE_ENV !== "production") {
  if (isAccelerate) {
    globalForPrisma.prismaAccelerate = prisma;
  } else {
    globalForPrisma.prisma = prisma;
  }
}

export default prisma;

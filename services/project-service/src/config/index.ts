// Central place where this service reads its environment.
export const config = {
  port: Number(process.env.PROJECT_PORT) || 4004,
  databaseUrl: process.env.DATABASE_URL || "",
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://auth-service:4001",
};

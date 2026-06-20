export const config = {
  port: Number(process.env.AUTH_PORT) || 4001,
  jwtSecret: process.env.JWT_SECRET || "super-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  databaseUrl: process.env.DATABASE_URL || "",
};

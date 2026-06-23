type SameSite = "lax" | "strict" | "none";

export const config = {
  port: Number(process.env.AUTH_PORT) || 4001,
  jwtSecret: process.env.JWT_SECRET || "super-secret-change-me",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7,
  databaseUrl: process.env.DATABASE_URL || "",

  cookieName: process.env.REFRESH_COOKIE_NAME || "refresh_token",
  cookiePath: process.env.REFRESH_COOKIE_PATH || "/api/auth",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: (process.env.COOKIE_SAMESITE as SameSite) || "lax",
};

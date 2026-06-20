// Central place where the gateway reads its environment.
export const config = {
  port: Number(process.env.GATEWAY_PORT) || 8080,
  jwtSecret: process.env.JWT_SECRET || "super-secret-change-me",
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://auth-service:4001",
  taskServiceUrl: process.env.TASK_SERVICE_URL || "http://task-service:4002",
  projectServiceUrl: process.env.PROJECT_SERVICE_URL || "http://project-service:4004",
};

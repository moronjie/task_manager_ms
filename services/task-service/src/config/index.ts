// Central place where this service reads its environment.
export const config = {
  port: Number(process.env.TASK_PORT) || 4002,
  mongoUrl: process.env.MONGO_URL || "mongodb://mongo:27017/taskdb",
  rabbitUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672",
  rabbitExchange: process.env.RABBITMQ_EXCHANGE || "task_events",
  projectServiceUrl: process.env.PROJECT_SERVICE_URL || "http://project-service:4004",
};

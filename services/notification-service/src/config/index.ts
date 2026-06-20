// Central place where this service reads its environment.
export const config = {
  port: Number(process.env.NOTIFICATION_PORT) || 4003,
  rabbitUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672",
  rabbitExchange: process.env.RABBITMQ_EXCHANGE || "task_events",
  queue: "notifications",
};

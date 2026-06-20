import amqp, { Channel } from "amqplib";
import { config } from "../config";

const EXCHANGE = config.rabbitExchange;

let channel: Channel | null = null;

// Connect with a retry loop (the broker is slower to be ready than the app)
// and assert a durable topic exchange that the notification service binds to.
export async function connectRabbit(retries = 20, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await amqp.connect(config.rabbitUrl);
      const ch = await connection.createChannel();
      await ch.assertExchange(EXCHANGE, "topic", { durable: true });
      channel = ch;
      console.log("[task] connected to RabbitMQ");
      return;
    } catch (err) {
      console.warn(`[task] rabbit connection failed (attempt ${attempt}/${retries})`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// Publish a domain event. Routing key examples: task.created, task.assigned.
export function publishEvent(routingKey: string, payload: unknown): void {
  if (!channel) {
    console.warn("[task] cannot publish, channel not ready:", routingKey);
    return;
  }
  const body = Buffer.from(JSON.stringify(payload));
  channel.publish(EXCHANGE, routingKey, body, { persistent: true });
  console.log(`[task] published ${routingKey}`);
}

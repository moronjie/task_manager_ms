import amqp, { Channel, ConsumeMessage } from "amqplib";
import { config } from "./config";

const EXCHANGE = config.rabbitExchange;
const QUEUE = config.queue;

// In-memory record of notifications produced so far (demo only).
export const notifications: Array<{ event: string; payload: unknown; at: string }> = [];

function handleMessage(channel: Channel, msg: ConsumeMessage | null) {
  if (!msg) return;
  const routingKey = msg.fields.routingKey;
  let payload: unknown = null;
  try {
    payload = JSON.parse(msg.content.toString());
  } catch {
    payload = msg.content.toString();
  }

  // For the demo we just log; a real service would email / push / persist.
  const at = new Date().toISOString();
  notifications.push({ event: routingKey, payload, at });
  console.log(`[notification] received ${routingKey}:`, payload);

  channel.ack(msg);
}

// Connect with a retry loop, bind a durable queue to the topic exchange for
// all task.* events, and start consuming.
export async function startConsumer(retries = 20, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await amqp.connect(config.rabbitUrl);
      const channel: Channel = await connection.createChannel();

      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, "task.*");

      await channel.consume(QUEUE, (msg) => handleMessage(channel, msg));
      console.log(`[notification] consuming '${QUEUE}' bound to '${EXCHANGE}' (task.*)`);
      return;
    } catch (err) {
      console.warn(`[notification] rabbit connection failed (attempt ${attempt}/${retries})`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

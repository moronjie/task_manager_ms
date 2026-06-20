import express, { Request, Response } from "express";
import { startConsumer, notifications } from "./consumer";
import { config } from "./config";

const app = express();

app.get("/health", (_req: Request, res: Response) =>
  res.json({ success: true, message: "ok", data: { service: "notification" } })
);

// Expose recent notifications (demo helper).
app.get("/notifications", (_req: Request, res: Response) =>
  res.json({ success: true, message: "notifications fetched", data: { notifications } })
);

async function start() {
  await startConsumer();
  app.listen(config.port, () => console.log(`[notification] listening on :${config.port}`));
}

start().catch((err) => {
  console.error("[notification] failed to start:", err);
  process.exit(1);
});

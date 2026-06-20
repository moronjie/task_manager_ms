import express, { Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import { connectMongo } from "./lib/mongo";
import { connectRabbit } from "./lib/rabbit";
import { errorHandler, notFoundHandler } from "./lib/http";
import { config } from "./config";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) =>
  res.json({ success: true, message: "ok", data: { service: "task" } })
);

app.use("/tasks", routes);

app.use(notFoundHandler);
app.use(errorHandler);

// Connect dependencies before accepting traffic.
async function start() {
  await connectMongo();
  await connectRabbit();
  app.listen(config.port, () => console.log(`[task] listening on :${config.port}`));
}

start().catch((err) => {
  console.error("[task] failed to start:", err);
  process.exit(1);
});

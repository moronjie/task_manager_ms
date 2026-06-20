import express, { Request, Response } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { config } from "./config";

const app = express();
app.use(cors(
  {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"], 
    credentials: true, 
  }
));

// NOTE: we deliberately do NOT parse the body here. The gateway streams request
// bodies straight through to the downstream services; parsing would consume the
// stream and break proxying.

app.get("/health", (_req: Request, res: Response) =>
  res.json({ success: true, message: "ok", data: { service: "gateway" } })
);

registerRoutes(app);

app.listen(config.port, () => console.log(`[gateway] listening on :${config.port}`));

import express, { Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./lib/http";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) =>
  res.json({ success: true, message: "ok", data: { service: "auth" } })
);

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => console.log(`[auth] listening on :${config.port}`));

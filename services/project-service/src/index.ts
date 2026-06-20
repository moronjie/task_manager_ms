import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import { workspaceRoutes, projectRoutes, internalRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./lib/http";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) =>
  res.json({ success: true, message: "ok", data: { service: "project" } })
);

app.use("/workspaces", workspaceRoutes);
app.use("/projects", projectRoutes);
app.use("/internal", internalRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => console.log(`[project] listening on :${config.port}`));

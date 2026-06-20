import { Express } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { AuthedRequest, verifyJwt } from "./auth";
import { config } from "./config";

// Forward the verified identity downstream as trusted headers, stripping any
// client-supplied ones first so they can't be spoofed.
const forwardUser: NonNullable<Options["on"]>["proxyReq"] = (proxyReq, req) => {
  proxyReq.removeHeader("x-user-id");
  proxyReq.removeHeader("x-user-role");

  const authed = req as AuthedRequest;
  if (authed.userId) {
    proxyReq.setHeader("x-user-id", authed.userId);
    proxyReq.setHeader("x-user-role", authed.userRole || "user");
  }
};

function createProxy(target: string, prefix: string, pathRewrite: Record<string, string>) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    // Function filter is unambiguous — glob matching of "**" is unreliable here.
    pathFilter: (path) => path === prefix || path.startsWith(prefix + "/"),
    pathRewrite,
    on: { proxyReq: forwardUser },
  });
}

export function registerRoutes(app: Express) {
  // Guards run first. Express restores req.url after a mounted middleware calls
  // next(), so the app-level proxies below still see the full original path.
  app.use("/api/auth/me", verifyJwt);
  app.use("/api/tasks", verifyJwt);
  app.use("/api/workspaces", verifyJwt);
  app.use("/api/projects", verifyJwt);

  // Proxies are registered without a mount path so pathRewrite matches against
  // the full request path. Auth service mounts routes at "/"; the others mount
  // at a named base ("/tasks", "/workspaces", "/projects").
  app.use(createProxy(config.authServiceUrl, "/api/auth", { "^/api/auth": "" }));
  app.use(createProxy(config.taskServiceUrl, "/api/tasks", { "^/api/tasks": "/tasks" }));
  app.use(createProxy(config.projectServiceUrl, "/api/workspaces", { "^/api/workspaces": "/workspaces" }));
  app.use(createProxy(config.projectServiceUrl, "/api/projects", { "^/api/projects": "/projects" }));
}

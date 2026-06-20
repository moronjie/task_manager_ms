import { Router } from "express";
import { asyncHandler } from "./lib/http";
import { validateBody } from "./lib/validate";
import {
  createWorkspaceSchema,
  addMemberSchema,
  createProjectSchema,
  updateProjectSchema,
} from "./schemas/projectSchemas";
import {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  listMembers,
  addMember,
  removeMember,
  createProject,
  listProjects,
} from "./controllers/workspaceController";
import {
  getProject,
  updateProject,
  deleteProject,
} from "./controllers/projectController";
import {
  getProjectInternal,
  getMembershipInternal,
} from "./controllers/internalController";

// ─── Public routes (behind the gateway JWT) ───────────────
export const workspaceRoutes = Router();
workspaceRoutes.post("/", validateBody(createWorkspaceSchema), asyncHandler(createWorkspace));
workspaceRoutes.get("/", asyncHandler(listWorkspaces));
workspaceRoutes.get("/:id", asyncHandler(getWorkspace));
workspaceRoutes.get("/:id/members", asyncHandler(listMembers));
workspaceRoutes.post("/:id/members", validateBody(addMemberSchema), asyncHandler(addMember));
workspaceRoutes.delete("/:id/members/:userId", asyncHandler(removeMember));
workspaceRoutes.post("/:id/projects", validateBody(createProjectSchema), asyncHandler(createProject));
workspaceRoutes.get("/:id/projects", asyncHandler(listProjects));

export const projectRoutes = Router();
projectRoutes.get("/:id", asyncHandler(getProject));
projectRoutes.patch("/:id", validateBody(updateProjectSchema), asyncHandler(updateProject));
projectRoutes.delete("/:id", asyncHandler(deleteProject));

// ─── Internal routes (private network only) ───────────────
export const internalRoutes = Router();
internalRoutes.get("/projects/:id", asyncHandler(getProjectInternal));
internalRoutes.get("/workspaces/:workspaceId/members/:userId", asyncHandler(getMembershipInternal));

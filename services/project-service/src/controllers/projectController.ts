import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/AppError";
import { sendSuccess } from "../lib/http";
import { requireUserId } from "../lib/context";
import { requireMember, requireRole } from "../lib/access";

async function loadProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw Errors.notFound("project not found");
  }
  return project;
}

// GET /projects/:id — must be a member of the project's workspace.
export async function getProject(req: Request, res: Response) {
  const userId = requireUserId(req);
  const project = await loadProject(req.params.id);
  await requireMember(project.workspaceId, userId);
  return sendSuccess(res, { project });
}

// PATCH /projects/:id — any member can update name/description.
export async function updateProject(req: Request, res: Response) {
  const userId = requireUserId(req);
  const project = await loadProject(req.params.id);
  await requireMember(project.workspaceId, userId);

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: req.body,
  });
  return sendSuccess(res, { project: updated }, "project updated");
}

// DELETE /projects/:id — owner/admin only.
export async function deleteProject(req: Request, res: Response) {
  const userId = requireUserId(req);
  const project = await loadProject(req.params.id);
  await requireRole(project.workspaceId, userId, ["owner", "admin"]);

  await prisma.project.delete({ where: { id: project.id } });
  return sendSuccess(res, { id: project.id }, "project deleted");
}

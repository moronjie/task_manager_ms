import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/AppError";
import { sendSuccess } from "../lib/http";
import { requireUserId } from "../lib/context";
import { requireMember, requireRole } from "../lib/access";
import { assertUserExists } from "../lib/authClient";

// POST /workspaces — create a workspace; the creator becomes its owner.
export async function createWorkspace(req: Request, res: Response) {
  const userId = requireUserId(req);
  const { name } = req.body;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: userId,
      members: { create: { userId, role: "owner" } },
    },
    include: { members: true },
  });

  return sendSuccess(res, { workspace }, "workspace created", 201);
}

// GET /workspaces — workspaces the current user is a member of.
export async function listWorkspaces(req: Request, res: Response) {
  const userId = requireUserId(req);

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true, projects: true } } },
  });

  return sendSuccess(res, { workspaces }, "workspaces fetched");
}

// GET /workspaces/:id — must be a member.
export async function getWorkspace(req: Request, res: Response) {
  const userId = requireUserId(req);
  const workspaceId = req.params.id;
  await requireMember(workspaceId, userId);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true, projects: true },
  });
  if (!workspace) {
    throw Errors.notFound("workspace not found");
  }
  return sendSuccess(res, { workspace });
}

// GET /workspaces/:id/members — list members (any member can view).
export async function listMembers(req: Request, res: Response) {
  const userId = requireUserId(req);
  const workspaceId = req.params.id;
  await requireMember(workspaceId, userId);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
  return sendSuccess(res, { members }, "members fetched");
}

// POST /workspaces/:id/members — owner/admin adds a member by user id.
export async function addMember(req: Request, res: Response) {
  const userId = requireUserId(req);
  const workspaceId = req.params.id;
  await requireRole(workspaceId, userId, ["owner", "admin"]);

  const { userId: newUserId, role } = req.body;

  // Confirm the user actually exists in the auth service.
  await assertUserExists(newUserId);

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: newUserId } },
  });
  if (existing) {
    throw Errors.conflict("user is already a member");
  }

  const member = await prisma.workspaceMember.create({
    data: { workspaceId, userId: newUserId, role },
  });
  return sendSuccess(res, { member }, "member added", 201);
}

// DELETE /workspaces/:id/members/:userId — owner/admin removes a member.
export async function removeMember(req: Request, res: Response) {
  const userId = requireUserId(req);
  const workspaceId = req.params.id;
  const targetUserId = req.params.userId;
  await requireRole(workspaceId, userId, ["owner", "admin"]);

  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
  if (!target) {
    throw Errors.notFound("member not found");
  }
  if (target.role === "owner") {
    throw Errors.forbidden("the workspace owner cannot be removed");
  }

  await prisma.workspaceMember.delete({ where: { id: target.id } });
  return sendSuccess(res, { userId: targetUserId }, "member removed");
}

// POST /workspaces/:id/projects — any member can create a project.
export async function createProject(req: Request, res: Response) {
  const userId = requireUserId(req);
  const workspaceId = req.params.id;
  await requireMember(workspaceId, userId);

  const { name, description } = req.body;
  const project = await prisma.project.create({
    data: { workspaceId, name, description: description ?? "" },
  });
  return sendSuccess(res, { project }, "project created", 201);
}

// GET /workspaces/:id/projects — list projects in the workspace.
export async function listProjects(req: Request, res: Response) {
  const userId = requireUserId(req);
  const workspaceId = req.params.id;
  await requireMember(workspaceId, userId);

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, { projects }, "projects fetched");
}

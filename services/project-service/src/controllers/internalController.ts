import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/AppError";
import { sendSuccess } from "../lib/http";
import { getMembership } from "../lib/access";

// Internal endpoints consumed by other services on the private network (not
// exposed through the gateway). No JWT context — these are trusted service calls.

// GET /internal/projects/:id — returns minimal project info (or 404).
export async function getProjectInternal(req: Request, res: Response) {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    select: { id: true, workspaceId: true, name: true },
  });
  if (!project) {
    throw Errors.notFound("project not found");
  }
  return sendSuccess(res, { project });
}

// GET /internal/workspaces/:workspaceId/members/:userId — membership or 404.
export async function getMembershipInternal(req: Request, res: Response) {
  const { workspaceId, userId } = req.params;
  const member = await getMembership(workspaceId, userId);
  if (!member) {
    throw Errors.notFound("not a member");
  }
  return sendSuccess(res, { member });
}

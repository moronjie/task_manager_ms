import type { WorkspaceMember } from "@prisma/client";
import { prisma } from "./prisma";
import { Errors } from "./AppError";

export async function getMembership(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | null> {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

// Require that the user belongs to the workspace; returns their membership.
export async function requireMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember> {
  const member = await getMembership(workspaceId, userId);
  if (!member) {
    throw Errors.forbidden("you are not a member of this workspace");
  }
  return member;
}

// Require that the user holds one of the given roles in the workspace.
export async function requireRole(
  workspaceId: string,
  userId: string,
  roles: string[]
): Promise<WorkspaceMember> {
  const member = await requireMember(workspaceId, userId);
  if (!roles.includes(member.role)) {
    throw Errors.forbidden(`requires role: ${roles.join(" or ")}`);
  }
  return member;
}

import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "name is required"),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  role: z.enum(["admin", "member"]).default("member"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

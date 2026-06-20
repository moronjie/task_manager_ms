import { z } from "zod";

const status = z.enum(["todo", "in_progress", "done"]);
const priority = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "title is required"),
  projectId: z.string().min(1, "projectId is required"),
  description: z.string().optional(),
  status: status.optional(),
  priority: priority.optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

// All fields optional for a partial update; projectId/workspaceId are not
// reassignable here.
export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

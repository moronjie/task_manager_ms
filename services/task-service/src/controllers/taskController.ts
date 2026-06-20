import { Request, Response } from "express";
import { Task } from "../models/Task";
import { publishEvent } from "../lib/rabbit";
import { Errors } from "../lib/AppError";
import { sendSuccess } from "../lib/http";
import { getProjectWorkspaceId, isWorkspaceMember } from "../lib/projectClient";

// The gateway forwards the verified user id; downstream we trust it.
function requireUserId(req: Request): string {
  const userId = req.header("x-user-id");
  if (!userId) {
    throw Errors.unauthorized("missing user context");
  }
  return userId;
}

export async function createTask(req: Request, res: Response) {
  const userId = requireUserId(req);
  // req.body is already validated by validateBody(createTaskSchema).
  const { title, description, priority, assigneeId, dueDate, projectId } = req.body;

  // Cross-service validation against the project service: the project must
  // exist, the creator must be a member of its workspace, and any assignee must
  // be a member too.
  const workspaceId = await getProjectWorkspaceId(projectId);

  if (!(await isWorkspaceMember(workspaceId, userId))) {
    throw Errors.forbidden("you are not a member of this project's workspace");
  }
  if (assigneeId && !(await isWorkspaceMember(workspaceId, assigneeId))) {
    throw Errors.validation("assignee is not a member of the workspace");
  }

  const task = await Task.create({
    title,
    description,
    priority,
    assigneeId: assigneeId ?? null,
    dueDate: dueDate ?? null,
    projectId,
    workspaceId,
    createdBy: userId,
  });

  publishEvent("task.created", {
    taskId: task.id,
    title: task.title,
    projectId,
    workspaceId,
    createdBy: userId,
  });
  if (task.assigneeId) {
    publishEvent("task.assigned", { taskId: task.id, assigneeId: task.assigneeId });
  }

  return sendSuccess(res, { task }, "task created", 201);
}

export async function listTasks(req: Request, res: Response) {
  requireUserId(req);
  const { status, assigneeId, projectId, workspaceId } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (assigneeId) filter.assigneeId = assigneeId;
  if (projectId) filter.projectId = projectId;
  if (workspaceId) filter.workspaceId = workspaceId;

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, { tasks }, "tasks fetched");
}

export async function getTask(req: Request, res: Response) {
  requireUserId(req);
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw Errors.notFound("task not found");
  }
  return sendSuccess(res, { task });
}

export async function updateTask(req: Request, res: Response) {
  requireUserId(req);
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw Errors.notFound("task not found");
  }

  const previousAssignee = task.assigneeId;
  const body = req.body ?? {};

  // A new assignee must be a member of the task's workspace.
  if (body.assigneeId && body.assigneeId !== previousAssignee) {
    if (!(await isWorkspaceMember(task.workspaceId, body.assigneeId))) {
      throw Errors.validation("assignee is not a member of the workspace");
    }
  }

  const updatable = ["title", "description", "status", "priority", "assigneeId", "dueDate"] as const;
  for (const key of updatable) {
    if (key in body) {
      task.set(key, body[key]);
    }
  }
  await task.save();

  // Notify when the assignee changes (including newly assigned).
  if (task.assigneeId && task.assigneeId !== previousAssignee) {
    publishEvent("task.assigned", { taskId: task.id, assigneeId: task.assigneeId });
  }

  return sendSuccess(res, { task }, "task updated");
}

export async function deleteTask(req: Request, res: Response) {
  requireUserId(req);
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    throw Errors.notFound("task not found");
  }
  return sendSuccess(res, { id: req.params.id }, "task deleted");
}

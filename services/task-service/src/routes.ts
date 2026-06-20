import { Router } from "express";
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} from "./controllers/taskController";
import { asyncHandler } from "./lib/http";
import { validateBody } from "./lib/validate";
import { createTaskSchema, updateTaskSchema } from "./schemas/taskSchemas";

const router = Router();

router.post("/", validateBody(createTaskSchema), asyncHandler(createTask));
router.get("/", asyncHandler(listTasks));
router.get("/:id", asyncHandler(getTask));
router.patch("/:id", validateBody(updateTaskSchema), asyncHandler(updateTask));
router.delete("/:id", asyncHandler(deleteTask));

export default router;

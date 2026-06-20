import { Schema, model, InferSchemaType } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assigneeId: { type: String, default: null },
    createdBy: { type: String, required: true },
    dueDate: { type: Date, default: null },
    projectId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export type TaskDoc = InferSchemaType<typeof taskSchema>;

export const Task = model("Task", taskSchema);

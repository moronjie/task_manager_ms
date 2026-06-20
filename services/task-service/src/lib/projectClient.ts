import { config } from "../config";
import { Errors } from "./AppError";

const base = config.projectServiceUrl;

async function getJson(url: string): Promise<{ status: number; body: any }> {
  let res: globalThis.Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("project service unreachable");
  }
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// Confirm the project exists and return its workspace id (via the internal API).
export async function getProjectWorkspaceId(projectId: string): Promise<string> {
  const { status, body } = await getJson(`${base}/internal/projects/${projectId}`);
  if (status === 404) {
    throw Errors.notFound("project not found");
  }
  if (status >= 400) {
    throw new Error(`project service returned ${status}`);
  }
  return body.data.project.workspaceId as string;
}

// Check whether a user is a member of a workspace.
export async function isWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { status } = await getJson(
    `${base}/internal/workspaces/${workspaceId}/members/${userId}`
  );
  if (status === 404) return false;
  if (status >= 400) {
    throw new Error(`project service returned ${status}`);
  }
  return true;
}

export type Role = "ADMIN" | "WRITER" | "EDITOR";

export type Permission =
  | "project:read"
  | "project:write"
  | "entity:read"
  | "entity:write"
  | "story:read"
  | "story:write"
  | "continuity:check"
  | "prompt:compose"
  | "export:read"
  | "version:publish";

export type ToolContext = {
  tenantId: string;
  userId: string;
  projectId?: string;
};

export type ContinuityIssueSeverity = "INFO" | "WARN" | "ERROR";

export type ContinuityIssue = {
  severity: ContinuityIssueSeverity;
  code: string;
  message: string;
  nodeId: string;
  entityIds?: string[];
  suggestion?: string;
};

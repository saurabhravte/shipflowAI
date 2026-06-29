// Auth-specific middleware lives in common/middleware/auth.middleware.ts.
// This file re-exports for module-local convenience.
export { requireAuth, requireWorkspaceMember } from "../../common/middleware/auth.middleware";

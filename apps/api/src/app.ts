import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { authRoutes } from "./modules/auth/auth.routes";
import { workspaceRoutes } from "./modules/workspace/workspace.routes";
import { projectRoutes } from "./modules/project/project.routes";
import { featureRequestRoutes } from "./modules/feature-request/feature-request.routes";
import { billingRoutes } from "./modules/billing/billing.routes";
import { githubRoutes } from "./modules/github/github.routes";
import { globalErrorHandler } from "./common/utils/apiError";

const app: Application = express();

// ── Security middlewares ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/feature-requests", featureRequestRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/github", githubRoutes);

// ── Global error handler (must be last) ────────────────────────────────────
app.use(globalErrorHandler);

export default app;

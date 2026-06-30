import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "./id";
import { memberRoleEnum, timestamps } from "./_shared";

/**
 * The four tables below (user, session, account, verification) follow the
 * exact shape Better Auth expects for its Drizzle adapter. Do not rename
 * columns — Better Auth's adapter maps to these by convention. See:
 * apps/web/src/server/auth/auth.ts for the adapter wiring.
 */

export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => createId("usr")),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(() => createId("ses")),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  /** Tracks which workspace the user is currently "inside" — read by workspaceProcedure. */
  activeWorkspaceId: text("active_workspace_id").references(() => workspace.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey().$defaultFn(() => createId("acc")),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(), // "google" | "github"
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => createId("ver")),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---- Workspace (tenant) layer — our own, sits on top of Better Auth -------

export const workspace = pgTable("workspace", {
  id: text("id").primaryKey().$defaultFn(() => createId("ws")),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  /** AES-encrypted OpenRouter key for BYOK — see lib/crypto/workspace-secrets.ts */
  openrouterApiKeyEnc: text("openrouter_api_key_enc"),
  /** Masked hint shown in UI, e.g. sk-or-…x7Kp */
  openrouterApiKeyHint: text("openrouter_api_key_hint"),
  ...timestamps,
});

export const member = pgTable("member", {
  id: text("id").primaryKey().$defaultFn(() => createId("mem")),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull().default("member"),
  ...timestamps,
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey().$defaultFn(() => createId("inv")),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: memberRoleEnum("role").notNull().default("member"),
  invitedByUserId: text("invited_by_user_id")
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---- Relations --------------------------------------------------------

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(member),
}));

export const workspaceRelations = relations(workspace, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  workspace: one(workspace, { fields: [member.workspaceId], references: [workspace.id] }),
  user: one(user, { fields: [member.userId], references: [user.id] }),
}));

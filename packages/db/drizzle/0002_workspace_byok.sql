ALTER TABLE "workspace" ADD COLUMN IF NOT EXISTS "openrouter_api_key_enc" text;
ALTER TABLE "workspace" ADD COLUMN IF NOT EXISTS "openrouter_api_key_hint" text;

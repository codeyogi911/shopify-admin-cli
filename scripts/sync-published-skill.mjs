import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publishedSkillDir = path.join(repoRoot, "skills", "shopify-admin-cli");
const referencesDir = path.join(publishedSkillDir, "references");
const knowledgeSourceDir = path.join(repoRoot, "knowledge");
const knowledgeTargetDir = path.join(referencesDir, "knowledge");

await mkdir(referencesDir, { recursive: true });
await rm(knowledgeTargetDir, { recursive: true, force: true });
await mkdir(knowledgeTargetDir, { recursive: true });

await cp(knowledgeSourceDir, knowledgeTargetDir, { recursive: true });

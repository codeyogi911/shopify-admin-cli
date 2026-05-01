import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publishedSkillDir = path.join(repoRoot, "skills", "shopify-admin-cli");
const referencesDir = path.join(publishedSkillDir, "references");
const knowledgeSourceDir = path.join(repoRoot, "knowledge");
const knowledgeTargetDir = path.join(referencesDir, "knowledge");

const stripFrontmatter = (text) => {
  if (!text.startsWith("---\n")) return text;
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return text;
  return text.slice(end + 5).trimStart();
};

const copySkillBody = async (sourceRelativePath, targetFileName) => {
  const sourcePath = path.join(repoRoot, sourceRelativePath);
  const raw = await readFile(sourcePath, "utf8");
  const body = stripFrontmatter(raw).replaceAll(
    "knowledge/",
    "references/knowledge/",
  );
  await writeFile(path.join(referencesDir, targetFileName), body);
};

await mkdir(referencesDir, { recursive: true });
await rm(knowledgeTargetDir, { recursive: true, force: true });
await mkdir(knowledgeTargetDir, { recursive: true });

await cp(knowledgeSourceDir, knowledgeTargetDir, { recursive: true });
await copySkillBody("skills/shopify-admin-cli-auth/SKILL.md", "auth.md");
await copySkillBody("skills/shopify-admin-cli-resources/SKILL.md", "resources.md");

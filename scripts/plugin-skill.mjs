// Regenerate or check the committed opum-quest plugin skill (QCLI-372).
// `bun run scripts/plugin-skill.mjs` exits 1 when the committed copy differs
// from what the CLI generates; `--write` rewrites it.
import { readFile, writeFile } from "node:fs/promises";
import {
  pluginSkillRelPath,
  questSkillDoc,
} from "../src/application/agents/agent-instructions.ts";

const expected = questSkillDoc("plugin");
if (process.argv.includes("--write")) {
  await writeFile(pluginSkillRelPath, expected);
  console.log(`wrote ${pluginSkillRelPath}`);
} else {
  const committed = await readFile(pluginSkillRelPath, "utf8");
  if (committed !== expected) {
    console.error(
      `${pluginSkillRelPath} differs from the generated plugin skill; run: bun run scripts/plugin-skill.mjs --write`,
    );
    process.exit(1);
  }
  console.log(`${pluginSkillRelPath} is current`);
}

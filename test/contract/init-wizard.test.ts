import { expect, test } from "bun:test";

import { runInitWizard } from "../../src/cli/main.ts";

function fakePrompts(answers: {
  readonly name?: string;
  readonly taskIdPrefix?: string;
  readonly writeInstructions?: boolean;
}) {
  const calls: unknown[] = [];
  return {
    prompts: {
      text: async (question: string, defaultValue: string) => {
        calls.push(["text", question, defaultValue]);
        if (question === "Project name") return answers.name ?? defaultValue;
        if (question === "Task ID prefix")
          return answers.taskIdPrefix ?? defaultValue;
        throw new Error(`unexpected text prompt: ${question}`);
      },
      confirm: async (question: string, defaultYes: boolean) => {
        calls.push(["confirm", question, defaultYes]);
        return answers.writeInstructions ?? defaultYes;
      },
    },
    calls,
  };
}

test("the wizard asks name, prefix, then instructions, in that order, with the right defaults", async () => {
  const { prompts, calls } = fakePrompts({});
  const answers = await runInitWizard("quest-cli", prompts);
  expect(calls).toEqual([
    ["text", "Project name", "quest-cli"],
    ["text", "Task ID prefix", "T"],
    ["confirm", "Write the managed AGENTS.md instructions block?", true],
  ]);
  expect(answers).toEqual({
    name: "quest-cli",
    taskIdPrefix: "T",
    writeInstructions: true,
  });
});

test("the wizard returns exactly what was answered", async () => {
  const { prompts } = fakePrompts({
    name: "My Project",
    taskIdPrefix: "QCLI",
    writeInstructions: false,
  });
  expect(await runInitWizard("dirname", prompts)).toEqual({
    name: "My Project",
    taskIdPrefix: "QCLI",
    writeInstructions: false,
  });
});

test("a blank task ID prefix answer falls back to the default instead of an empty prefix", async () => {
  const { prompts } = fakePrompts({ taskIdPrefix: "   " });
  expect((await runInitWizard("dirname", prompts)).taskIdPrefix).toBe("T");
});

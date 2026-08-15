import { expect, test } from "bun:test";

import { createQuestProgram } from "../src/cli/main.ts";

test("the scaffold exposes the reserved quest executable identity", () => {
  expect(createQuestProgram().name()).toBe("quest");
});

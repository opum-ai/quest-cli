import { expect, test } from "bun:test";

import { questGuides } from "../src/application/agents/guides.ts";

/**
 * QCLI-351. QCLI-348 was filed with "The three daemons currently alive on
 * this host are reaped" and there were four within the hour. The criterion
 * stayed clear and checkable and stopped being true. The task-creation guide
 * covered clarity ("verify without asking you what you meant") and not
 * durability, so it now says to enumerate at check time for anything the
 * task does not control.
 *
 * Pinned by reading the guide text, the object an agent reads. The guidance
 * is prose on purpose. No lint rejects digits in a criterion, because a count
 * of what the task produces is safe and nothing can tell the two apart
 * mechanically.
 */

const taskCreation = questGuides.find(
  (guide) => guide.name === "task-creation",
)?.content;

test("task-creation tells the author to enumerate at check time, and why (QCLI-351)", () => {
  expect(taskCreation).toBeDefined();
  const text = (taskCreation ?? "").replace(/\s+/g, " ");
  // The instruction itself.
  expect(text).toContain("enumerate when it is checked");
  // The reason: the criterion stops being true, not clear.
  expect(text).toContain("no longer true");
  // Both halves of the distinction, so it does not read as a ban on numbers.
  expect(text).toContain("A count of what the task itself produces is safe");
  expect(text).toContain("A count of live or external state is not safe");
  expect(text).toContain("not numbers in general");
});

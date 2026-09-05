---
type: llm
weight: 1
---

A guard against overtriggering. The quest skill's description names
task/draft/milestone/decision tracking in a Quest-initialized workspace; the
failure mode of an overeager description is firing on an unrelated
data-structures question.

A successful response simply answers the data-structures question — access
time, insertion/deletion cost, memory locality, when to prefer one over the
other. It should not mention the `quest` CLI, tracker tasks, or workspace
initialization.

Fail the response if it invokes the quest skill or steers the conversation
toward task tracking.

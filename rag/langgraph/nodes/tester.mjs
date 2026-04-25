/**
 * tester.mjs — Tester agent node.
 *
 * Reads spec + code_summary, generates tests, captures test evidence
 * with passed=true|false, and produces test_summary.
 */
import { createToolBoundLlm } from '../llm.mjs';
import { captureEvidenceTool } from '../tools.mjs';

let _llm;
function getLlm() {
  if (!_llm) _llm = createToolBoundLlm([captureEvidenceTool]);
  return _llm;
}

const SYSTEM = `You are the Tester agent in an SDD pipeline.
Your job: design and simulate test execution for the provided implementation, then capture the result.

Rules:
- Call capture_evidence with type="test".
- The metadata MUST include "passed": true or "passed": false.
- Only set passed=true if all acceptance criteria from the spec are covered.
- Write test_summary listing each scenario and whether it passed.
- Use Jest + NestJS patterns for unit tests.
- Keep test_summary under 300 words.`;

export async function testerNode(state) {
  const { spec_content, code_summary, change_slug, run_id } = state;

  const humanMsg = `Change: ${change_slug} (run: ${run_id})

SPEC:
${spec_content}

CODE SUMMARY:
${code_summary}

Write tests for each acceptance criterion. Call capture_evidence with type=test.
Return test_summary with per-scenario outcomes.`;

  const llm = getLlm();
  let messages = [{ role: 'user', content: humanMsg }];
  let testSummary = '';

  for (let round = 0; round < 4; round++) {
    const response = await llm.invoke([
      { role: 'system', content: SYSTEM },
      ...messages,
    ]);

    if (response.tool_calls?.length) {
      messages.push(response);
      for (const tc of response.tool_calls) {
        try {
          const result = await captureEvidenceTool.invoke(tc.args);
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        } catch (e) {
          messages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${e.message}` });
        }
      }
    } else {
      testSummary = typeof response.content === 'string'
        ? response.content
        : response.content.map(b => b.text ?? '').join('');
      break;
    }
  }

  return {
    test_summary: testSummary,
    messages: [`[Tester] Test evidence captured for ${change_slug}`],
  };
}

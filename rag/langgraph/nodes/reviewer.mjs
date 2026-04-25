/**
 * reviewer.mjs — Reviewer agent node.
 *
 * Reads spec + code_summary + test_summary and decides "approve" or "reject".
 * Captures review_decision evidence with metadata { "decision": "approve"|"reject" }.
 */
import { createToolBoundLlm } from '../llm.mjs';
import { captureEvidenceTool } from '../tools.mjs';

let _llm;
function getLlm() {
  if (!_llm) _llm = createToolBoundLlm([captureEvidenceTool]);
  return _llm;
}

const SYSTEM = `You are the Reviewer agent in an SDD pipeline.
Your job: review the implementation and tests against the spec, then record your decision.

Rules:
- Call capture_evidence with type="review_decision".
- The metadata MUST include "decision": "approve" or "decision": "reject".
- Approve ONLY if:
    1. tenantId is NOT taken from query params.
    2. ResponseBuilder is used for all HTTP responses.
    3. All spec acceptance criteria are covered by tests.
    4. Code_summary describes a complete implementation (not a stub).
- When rejecting, include "rejection_reason" in metadata.
- Return review_notes explaining your decision.`;

export async function reviewerNode(state) {
  const { spec_content, code_summary, test_summary, change_slug, run_id } = state;

  const humanMsg = `Change: ${change_slug} (run: ${run_id})

SPEC:
${spec_content}

CODE SUMMARY:
${code_summary}

TEST SUMMARY:
${test_summary}

Review and call capture_evidence with type=review_decision.
Return review_notes with your reasoning.`;

  const llm = getLlm();
  let messages = [{ role: 'user', content: humanMsg }];
  let reviewNotes = '';
  let decision = '';

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
          // Capture the decision from the tool args for routing
          if (tc.name === 'capture_evidence' && tc.args.metadata) {
            try {
              const meta = typeof tc.args.metadata === 'string'
                ? JSON.parse(tc.args.metadata)
                : tc.args.metadata;
              decision = meta.decision ?? '';
            } catch {}
          }
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        } catch (e) {
          messages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${e.message}` });
        }
      }
    } else {
      reviewNotes = typeof response.content === 'string'
        ? response.content
        : response.content.map(b => b.text ?? '').join('');
      break;
    }
  }

  const nextRetryCount = decision === 'approve'
    ? state.retry_count
    : state.retry_count + 1;

  return {
    review_decision: decision,
    review_notes: reviewNotes,
    retry_count: nextRetryCount,
    messages: [`[Reviewer] Decision="${decision}" for ${change_slug}`],
  };
}

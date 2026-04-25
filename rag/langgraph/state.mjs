/**
 * SDDState — shared state for the LangGraph Phase 2 pipeline.
 *
 * Design principles:
 *  - `change_slug` + `run_id` isolate concurrent executions in SQLite.
 *  - Backend and frontend concerns are split; most agents only touch backend fields.
 *  - `retry_count` prevents infinite loops; after max_retries the edge routes to "end".
 *  - `pipeline_result` is the raw JSON output from run-pipeline.mjs (Fase 1 auditor).
 */

/** @typedef {Object} PipelineResult
 * @property {'certified'|'blocked'} status
 * @property {string} current_phase
 * @property {string} [reason]
 * @property {number} score
 * @property {boolean} certified
 * @property {Record<string,number>} counters
 */

/** @typedef {Object} SDDState
 * @property {string} change_slug          - The openspec change identifier.
 * @property {string} run_id               - UUID for this graph run (isolation key).
 * @property {string} spec_content         - Raw content of openspec/changes/<slug>/spec.md.
 * @property {string} [design_notes]       - Architect's notes on implementation approach.
 * @property {string} [code_summary]       - Developer's summary of code produced.
 * @property {string} [test_summary]       - Tester's summary (pass/fail, coverage).
 * @property {string} [review_decision]    - 'approve' | 'reject'.
 * @property {string} [review_notes]       - Reviewer's justification.
 * @property {PipelineResult} [pipeline_result] - Latest output from Auditor node.
 * @property {string} [error]              - Last error message if a node failed.
 * @property {number} retry_count          - How many times we have looped back.
 * @property {number} max_retries          - Max allowed retries before forced end.
 * @property {string[]} messages           - Append-only log of agent messages.
 */

export const initialState = {
  change_slug: '',
  run_id: '',
  spec_content: '',
  design_notes: '',
  code_summary: '',
  test_summary: '',
  review_decision: '',
  review_notes: '',
  pipeline_result: null,
  error: '',
  retry_count: 0,
  max_retries: 3,
  messages: [],
};

/**
 * LangGraph annotation channels.
 * Using plain functions so this works with both langgraph 0.x and 1.x APIs.
 */
export const channels = {
  change_slug: { default: () => '' },
  run_id: { default: () => '' },
  spec_content: { default: () => '' },
  design_notes: { default: () => '' },
  code_summary: { default: () => '' },
  test_summary: { default: () => '' },
  review_decision: { default: () => '' },
  review_notes: { default: () => '' },
  pipeline_result: { default: () => null },
  error: { default: () => '' },
  retry_count: { default: () => 0 },
  max_retries: { default: () => 3 },
  messages: {
    default: () => [],
    reducer: (prev, next) => [...prev, ...next],
  },
};

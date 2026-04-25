#!/usr/bin/env node

/**
 * Fetches Jira issue details and emits normalized outputs for GitHub Actions.
 * Required env:
 * - JIRA_BASE_URL (e.g. https://your-org.atlassian.net)
 * - JIRA_EMAIL
 * - JIRA_API_TOKEN
 * - JIRA_ISSUE_KEY
 */

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function flattenAdf(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    return node.map(flattenAdf).join(" ").replace(/\s+/g, " ").trim();
  }
  const ownText = typeof node.text === "string" ? node.text : "";
  const contentText = flattenAdf(node.content || []);
  return `${ownText} ${contentText}`.replace(/\s+/g, " ").trim();
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function main() {
  const jiraBaseUrl = required("JIRA_BASE_URL").replace(/\/$/, "");
  const jiraEmail = required("JIRA_EMAIL");
  const jiraApiToken = required("JIRA_API_TOKEN");
  const issueKey = required("JIRA_ISSUE_KEY");

  const url = `${jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}`;
  const auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const fields = data.fields || {};
  const summary = String(fields.summary || "").trim();
  const description = flattenAdf(fields.description).trim();
  const labels = Array.isArray(fields.labels) ? fields.labels : [];
  const components = Array.isArray(fields.components)
    ? fields.components.map((c) => c?.name).filter(Boolean)
    : [];

  const inferredStack = labels.includes("agent-frontend")
    ? "frontend"
    : labels.includes("agent-backend")
      ? "backend"
      : "fullstack";

  const slugBase = toSlug(`${issueKey}-${summary}`) || toSlug(issueKey) || "jira-task";
  const branchName = `agent/${slugBase}`;

  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    throw new Error("GITHUB_OUTPUT is not available");
  }

  const fs = await import("node:fs/promises");
  const lines = [
    `issue_key=${issueKey}`,
    `summary=${summary.replace(/\n/g, " ")}`,
    `stack=${inferredStack}`,
    `branch_name=${branchName}`,
    `labels=${labels.join(",")}`,
    `components=${components.join(",")}`,
    `description<<EOF`,
    description,
    `EOF`,
  ];

  await fs.appendFile(outputPath, `${lines.join("\n")}\n`, "utf8");

  console.log(JSON.stringify({ issueKey, summary, branchName, inferredStack }, null, 2));
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});

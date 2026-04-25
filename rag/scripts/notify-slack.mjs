#!/usr/bin/env node
/**
 * Send Framework-SDD notifications to Slack via Incoming Webhook.
 *
 * Usage:
 *   node scripts/notify-slack.mjs --message="text"
 *   node scripts/notify-slack.mjs --title="Pipeline" --status=certified --change=my-change
 *
 * Env:
 *   SLACK_WEBHOOK_URL (required unless --dry-run)
 *   SLACK_CHANNEL (optional)
 *   SLACK_USERNAME (optional)
 */

function parseArgs(argv) {
  const opts = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq > -1) {
      const key = arg.substring(2, eq);
      const value = arg.substring(eq + 1);
      if (value === 'true') opts[key] = true;
      else if (value === 'false') opts[key] = false;
      else opts[key] = value;
    } else {
      opts[arg.substring(2)] = true;
    }
  }
  return opts;
}

function statusMeta(status) {
  if (status === 'certified') return { emoji: ':white_check_mark:', color: '#2eb886' };
  if (status === 'blocked') return { emoji: ':warning:', color: '#e01e5a' };
  return { emoji: ':information_source:', color: '#439fe0' };
}

function buildMessage(opts) {
  const status = opts.status || 'info';
  const meta = statusMeta(status);
  const title = opts.title || 'Framework-SDD notification';
  const change = opts.change || 'n/a';
  const phase = opts.phase || 'n/a';
  const score = opts.score != null ? `${opts.score}%` : 'n/a';
  const reason = opts.reason || '';
  const extra = opts.message || '';
  const overview = opts.overview || '';
  const completed = opts.completed || '';
  const doing = opts.doing || '';
  const how = opts.how || '';
  const next = opts.next || '';
  const compactProgress = opts['compact-progress'] === true;

  if (compactProgress) {
    const phaseLabel = phase || 'n/a';
    const lines = [
      `${meta.emoji} *${title}*`,
      `*Paso actual:* ${phaseLabel}`,
      reason ? `*Qué encontré:* ${reason}` : '',
      extra ? `*Decisión:* ${extra}` : '',
      next ? `*Siguiente paso:* ${next}` : ''
    ].filter(Boolean);

    return {
      text: `${title} | ${phaseLabel} | ${status}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: lines.join('\n')
          }
        }
      ],
      attachments: [
        {
          color: meta.color,
          text: 'Framework-SDD progress update'
        }
      ]
    };
  }

  const lines = [
    `${meta.emoji} *${title}*`,
    `*Status:* ${status}`,
    `*Change:* ${change}`,
    `*Phase:* ${phase}`,
    `*Score:* ${score}`
  ];
  if (reason) lines.push(`*Reason:* ${reason}`);
  if (overview) lines.push(`*Panorama general:* ${overview}`);
  if (completed) lines.push(`*Lo que ya quedó validado:* ${completed}`);
  if (doing) lines.push(`*Qué estoy haciendo:* ${doing}`);
  if (how) lines.push(`*Cómo lo estoy haciendo:* ${how}`);
  if (next) lines.push(`*Qué sigue:* ${next}`);
  if (extra) lines.push(`*Detalle:*\n${extra}`);

  return {
    text: `${title} | status=${status} | change=${change} | score=${score}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: lines.join('\n')
        }
      }
    ],
    attachments: [
      {
        color: meta.color,
        text: 'Framework-SDD lifecycle update'
      }
    ]
  };
}

async function main() {
  let opts;

  // Read payload from stdin (JSON) instead of CLI args
  const stdinData = await new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });

  if (stdinData.trim()) {
    try {
      opts = JSON.parse(stdinData);
    } catch (e) {
      console.error('Failed to parse JSON from stdin:', e.message);
      process.exit(1);
    }
  } else {
    opts = parseArgs(process.argv.slice(2));
  }

  const webhookUrl = opts['webhook-url'] || process.env.SLACK_WEBHOOK_URL;
  const dryRun = opts['dry-run'] === true;

  const payload = buildMessage(opts);

  if (process.env.SLACK_CHANNEL || opts.channel) {
    payload.channel = opts.channel || process.env.SLACK_CHANNEL;
  }
  if (process.env.SLACK_USERNAME || opts.username) {
    payload.username = opts.username || process.env.SLACK_USERNAME;
  }

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, payload }, null, 2));
    return;
  }

  if (!webhookUrl) {
    console.error('Missing Slack webhook URL. Set SLACK_WEBHOOK_URL or use --webhook-url=...');
    process.exit(1);
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`Slack webhook failed: HTTP ${res.status} ${body}`);
    process.exit(1);
  }

  console.log(`ok slack-notified status=${opts.status || 'info'} change=${opts.change || 'n/a'}`);
}

main().catch((err) => {
  console.error('Slack notify failed:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Notificación por correo (sin dependencias npm extra): Resend o SendGrid HTTP API, o fallback a archivo.
 *
 * Uso (desde otros scripts):
 *   node scripts/notify-task-email.mjs <asunto> [cuerpo_texto_o_stdin]
 *
 * Variables (una de las APIs o solo fallback):
 *   TASK_NOTIFY_TO          destinatario obligatorio para enviar correo real
 *   TASK_NOTIFY_FROM        remitente (Resend/SendGrid suelen exigir dominio verificado)
 *   RESEND_API_KEY          preferido si está definido
 *   SENDGRID_API_KEY        alternativa
 *   TASK_NOTIFY_FALLBACK    ruta log si no hay API (default: notifications/task-email.log)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendResend(subject, body) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.TASK_NOTIFY_TO;
  const from =
    process.env.TASK_NOTIFY_FROM || 'SDD Agent <onboarding@resend.dev>';
  if (!key || !to) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(body)}</pre>`,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Resend HTTP ${r.status}: ${t}`);
  }
  return true;
}

async function sendSendGrid(subject, body) {
  const key = process.env.SENDGRID_API_KEY;
  const to = process.env.TASK_NOTIFY_TO;
  const from = process.env.TASK_NOTIFY_FROM;
  if (!key || !to || !from) return false;
  const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: from.match(/<([^>]+)>/)?.[1] || from },
      content: [{ type: 'text/plain', value: body }],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`SendGrid HTTP ${r.status}: ${t}`);
  }
  return true;
}

function fallbackLog(subject, body) {
  const rel =
    process.env.TASK_NOTIFY_FALLBACK ||
    path.join(ROOT, 'notifications', 'task-email.log');
  fs.mkdirSync(path.dirname(rel), { recursive: true });
  const line = `\n---\n${new Date().toISOString()} | ${subject}\n${body}\n`;
  fs.appendFileSync(rel, line, 'utf8');
  return { fallback: true, path: rel };
}

async function main() {
  const subject = process.argv[2] || '(sin asunto)';
  let body = process.env.NOTIFY_BODY?.trim();
  if (!body) {
    body = process.argv.slice(3).join(' ').trim();
  }
  if (!body) {
    try {
      body = fs.readFileSync(0, 'utf8');
    } catch {
      body = '';
    }
  }

  try {
    if (await sendResend(subject, body)) {
      console.log(JSON.stringify({ ok: true, provider: 'resend' }, null, 2));
      return;
    }
    if (await sendSendGrid(subject, body)) {
      console.log(JSON.stringify({ ok: true, provider: 'sendgrid' }, null, 2));
      return;
    }
    const fb = fallbackLog(subject, body);
    console.log(JSON.stringify({ ok: true, ...fb }, null, 2));
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message }));
    try {
      const fb = fallbackLog(`[ERROR] ${subject}`, `${body}\n\n${e.message}`);
      console.log(JSON.stringify({ ok: false, logged: fb.path }, null, 2));
    } catch {
      process.exit(1);
    }
    process.exit(1);
  }
}

main();

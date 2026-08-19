import { randomBytes } from "crypto";

export type EmailTransport = "ethereal-smtp" | "captured";

export interface CapturedEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  messageId: string;
  date: string;
  transport: EmailTransport;
  etherealUrl: string | null;
}

export function createPreviewToken() {
  return randomBytes(18).toString("base64url");
}

export function buildCapturedEmail(input: {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId?: string;
  transport: EmailTransport;
  etherealUrl?: string | null;
}): CapturedEmail {
  const text = stripHtml(input.body);
  const html = looksLikeHtml(input.body) ? input.body : renderPlainTextAsHtml(text);

  return {
    from: input.from,
    to: input.to,
    subject: input.subject,
    html,
    text,
    messageId: input.messageId ?? `<${randomBytes(12).toString("hex")}@reachinbox.local>`,
    date: new Date().toUTCString(),
    transport: input.transport,
    etherealUrl: input.etherealUrl ?? null,
  };
}

export function renderPreviewPage(email: CapturedEmail) {
  const headers = [
    ["From", email.from],
    ["To", email.to],
    ["Subject", email.subject],
    ["Date", email.date],
    ["Message-ID", email.messageId],
    ["X-Transport", email.transport === "ethereal-smtp" ? "Ethereal SMTP" : "ReachInbox catcher"],
  ]
    .map(([key, value]) => `<div class="h-row"><span>${escapeHtml(key)}</span><code>${escapeHtml(value)}</code></div>`)
    .join("");

  const source = [
    `From: ${email.from}`,
    `To: ${email.to}`,
    `Subject: ${email.subject}`,
    `Date: ${email.date}`,
    `Message-ID: ${email.messageId}`,
    "",
    email.text,
  ].join("\n");

  const badge =
    email.transport === "ethereal-smtp"
      ? "Caught by Ethereal SMTP"
      : "Caught locally · not delivered to a real inbox";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(email.subject)} · ReachInbox preview</title>
    <style>
      :root {
        --navy: #092b28;
        --green: #71a070;
        --heading: #2b2f38;
        --body: #48505e;
        --card: #f3f5f4;
        --line: #dce3e0;
        --white: #ffffff;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: var(--card); color: var(--heading); font-family: "General Sans", "Segoe UI", sans-serif; }
      .top {
        background: var(--navy);
        color: white;
        padding: 18px 24px;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
      }
      .brand { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.78; }
      .badge { background: var(--green); color: white; border-radius: 999px; padding: 6px 12px; font-size: 12px; }
      .wrap { max-width: 980px; margin: 0 auto; padding: 28px 20px 48px; }
      .card { background: var(--white); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: 0 18px 40px rgba(9,43,40,0.08); }
      .meta { padding: 22px 24px 8px; }
      .subject { margin: 0 0 8px; font-size: 28px; font-weight: 500; }
      .sub { margin: 0; color: var(--body); font-size: 14px; }
      .tabs { display: flex; gap: 8px; padding: 16px 24px 0; }
      .tabs label {
        cursor: pointer;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 13px;
        color: var(--body);
        background: var(--card);
      }
      #tab-html:checked ~ .tabs label[for="tab-html"],
      #tab-headers:checked ~ .tabs label[for="tab-headers"],
      #tab-source:checked ~ .tabs label[for="tab-source"] {
        background: var(--navy);
        border-color: var(--navy);
        color: white;
      }
      .panel { display: none; padding: 20px 24px 24px; }
      #tab-html:checked ~ .html, #tab-headers:checked ~ .headers, #tab-source:checked ~ .source { display: block; }
      input[type="radio"] { display: none; }
      iframe { width: 100%; min-height: 420px; border: 1px solid var(--line); border-radius: 12px; background: white; }
      .h-row { display: grid; grid-template-columns: 120px 1fr; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
      .h-row span { color: var(--body); }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; white-space: pre-wrap; word-break: break-word; }
      pre { margin: 0; background: var(--card); padding: 16px; border-radius: 12px; color: var(--body); }
    </style>
  </head>
  <body>
    <div class="top">
      <div>
        <div class="brand">ReachInbox catcher</div>
        <div style="margin-top:6px;font-size:15px">Ethereal-style message preview</div>
      </div>
      <div class="badge">${escapeHtml(badge)}</div>
    </div>
    <div class="wrap">
      <div class="card">
        <div class="meta">
          <h1 class="subject">${escapeHtml(email.subject)}</h1>
          <p class="sub">From ${escapeHtml(email.from)} · To ${escapeHtml(email.to)}</p>
        </div>
        <input id="tab-html" type="radio" name="preview-tab" checked />
        <input id="tab-headers" type="radio" name="preview-tab" />
        <input id="tab-source" type="radio" name="preview-tab" />
        <div class="tabs">
          <label for="tab-html">HTML</label>
          <label for="tab-headers">Headers</label>
          <label for="tab-source">Source</label>
        </div>
        <section class="panel html">
          <iframe sandbox title="Email HTML preview" srcdoc="${escapeAttribute(email.html)}"></iframe>
        </section>
        <section class="panel headers">${headers}</section>
        <section class="panel source"><pre>${escapeHtml(source)}</pre></section>
      </div>
    </div>
  </body>
</html>`;
}

function looksLikeHtml(value: string) {
  return /<[a-z][\s\S]*>/i.test(value);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function renderPlainTextAsHtml(text: string) {
  return `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#2b2f38;padding:24px">${escapeHtml(text).replace(/\n/g, "<br/>")}</div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}

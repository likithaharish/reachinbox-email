import { Router } from "express";
import { prisma } from "../db/prisma";
import { renderPreviewPage, type CapturedEmail } from "../services/emailPreview";

export const previewRouter = Router();

function asCapturedEmail(value: unknown): CapturedEmail | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<CapturedEmail>;
  if (!payload.from || !payload.to || !payload.subject || !payload.html || !payload.messageId) {
    return null;
  }
  return {
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text ?? "",
    messageId: payload.messageId,
    date: payload.date ?? new Date().toUTCString(),
    transport: payload.transport === "ethereal-smtp" ? "ethereal-smtp" : "captured",
    etherealUrl: payload.etherealUrl ?? null,
  };
}

previewRouter.get("/preview/:token", async (req, res) => {
  const email = await prisma.scheduledEmail.findUnique({
    where: { previewToken: req.params.token },
    select: { previewPayload: true },
  });
  const payload = asCapturedEmail(email?.previewPayload);
  if (!payload) {
    return res.status(404).type("html").send("<h1>Preview not found</h1>");
  }

  res
    .status(200)
    .set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src data: https: http:; frame-src 'self'")
    .type("html")
    .send(renderPreviewPage(payload));
});

previewRouter.get("/api/v1/email-previews/:token", async (req, res) => {
  const email = await prisma.scheduledEmail.findUnique({
    where: { previewToken: req.params.token },
    select: { previewPayload: true, previewToken: true, status: true },
  });
  const payload = asCapturedEmail(email?.previewPayload);
  if (!payload || !email?.previewToken) {
    return res.status(404).json({ error: "Not Found", message: "Email preview not found" });
  }

  return res.json({
    data: {
      token: email.previewToken,
      status: email.status,
      ...payload,
    },
  });
});

import nodemailer from "nodemailer";

/**
 * Creates a new Ethereal SMTP account and prints env values.
 *
 * Ethereal is a fake SMTP server used for testing email sending.
 * You can run this locally and then copy the printed credentials into
 * `backend/.env`.
 */
async function main() {
  const testAccount = await nodemailer.createTestAccount();

  // eslint-disable-next-line no-console
  console.log("Ethereal SMTP credentials:\n");

  // eslint-disable-next-line no-console
  console.log(`ETHEREAL_SMTP_HOST=${testAccount.smtp.host}`);
  // eslint-disable-next-line no-console
  console.log(`ETHEREAL_SMTP_PORT=${testAccount.smtp.port}`);
  // eslint-disable-next-line no-console
  console.log(`ETHEREAL_SMTP_USER=${testAccount.user}`);
  // eslint-disable-next-line no-console
  console.log(`ETHEREAL_SMTP_PASS=${testAccount.pass}`);

  // eslint-disable-next-line no-console
  console.log(`ETHEREAL_SMTP_FROM_EMAIL=${testAccount.user}\n`);
}

void main();


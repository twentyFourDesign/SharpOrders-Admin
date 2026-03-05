import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "no-reply@vishu.app";

const resend =
  RESEND_API_KEY != null
    ? new Resend(RESEND_API_KEY)
    : null;

export async function sendOtpEmail(params: {
  to: string;
  code: string;
}) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn("[email] RESEND_API_KEY not configured; skipping email send");
    return;
  }

  const { to, code } = params;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your SharpOrder verification code",
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; padding:24px;">
        <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; padding:24px; border:1px solid #e5e7eb;">
          <h1 style="font-size:20px; font-weight:700; color:#111827; margin:0 0 8px;">Verify your email</h1>
          <p style="font-size:14px; color:#4b5563; margin:0 0 16px;">
            Use the code below to finish creating your account on SharpOrder.
          </p>
          <div style="font-size:32px; font-weight:700; letter-spacing:0.2em; text-align:center; padding:12px 0; color:#111827;">
            ${code}
          </div>
          <p style="font-size:13px; color:#6b7280; margin:16px 0 0;">
            This code expires in 10 minutes. If you didn&apos;t request this, you can safely ignore this email.
          </p>
        </div>
        <p style="font-size:11px; color:#9ca3af; text-align:center; margin-top:16px;">
          Sent from SharpOrder · do not reply to this address.
        </p>
      </div>
    `,
  });
}


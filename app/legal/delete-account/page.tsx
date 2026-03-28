import type { Metadata } from "next";
import { LegalShell } from "../_components/legal-shell";
import { SUPPORT_EMAIL } from "../nav-config";

export const metadata: Metadata = {
  title: "Delete Your Account — SharpOrder",
  description: "How to request deletion of your SharpOrder account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <LegalShell
      headerTitle="Delete Your Account"
      lastUpdated="March 28, 2026"
      activeHref="/legal/delete-account"
    >
      <article className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Summary</h2>
          <p>
            You may request deletion of your SharpOrder account and associated personal data, subject
            to legal and legitimate business retention requirements (for example, records we must keep
            for tax, fraud prevention, or unresolved disputes).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">How to request deletion</h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <strong className="text-zinc-800">From the app (preferred):</strong> Open SharpOrder,
              go to <strong className="text-zinc-800">Support</strong>, and submit a ticket asking
              for <strong className="text-zinc-800">account deletion</strong>. Include the email
              address registered on your account so we can verify ownership.
            </li>
            <li>
              <strong className="text-zinc-800">By email:</strong> Send a message from your
              registered email to{" "}
              <a
                className="font-medium text-teal-700 underline decoration-teal-600/30 underline-offset-2 hover:decoration-teal-600"
                href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`}
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              with the subject line <strong className="text-zinc-800">Account deletion request</strong>
              . We may ask you to confirm identity before processing.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">What happens next</h2>
          <p>
            After we verify your request, we will close your account and delete or anonymize personal
            data that we are not required or permitted to retain. Some information may remain in
            backups for a limited period until overwritten, or in aggregate or de-identified form.
            Open financial or legal matters may delay full deletion until resolved.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Logging out vs. deletion</h2>
          <p>
            Signing out or uninstalling the app does not delete your account or data on our servers.
            You must submit a deletion request as described above if you want your account removed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Questions</h2>
          <p>
            For questions about this process, contact{" "}
            <a
              className="font-medium text-teal-700 underline decoration-teal-600/30 underline-offset-2 hover:decoration-teal-600"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            or use in-app support.
          </p>
        </section>
      </article>
    </LegalShell>
  );
}

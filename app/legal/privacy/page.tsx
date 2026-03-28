import type { Metadata } from "next";
import { LegalShell } from "../_components/legal-shell";
import { SUPPORT_EMAIL } from "../nav-config";

export const metadata: Metadata = {
  title: "Privacy Policy — SharpOrder",
  description: "How SharpOrder collects, uses, and shares personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      headerTitle="Privacy Policy"
      lastUpdated="March 28, 2026"
      activeHref="/legal/privacy"
    >
      <article className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Summary</h2>
          <p>
            This Privacy Policy explains how SharpOrder (&quot;we,&quot; &quot;us&quot;) collects, uses,
            stores, and shares information when you use our mobile application and related services.
            By using SharpOrder, you agree to this policy as described here and as updated from time
            to time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">1. Information we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-zinc-800">Account and profile:</strong> email address,
              password (stored securely), name, business name (for shippers), phone number, profile
              photo, and role (shipper or driver).
            </li>
            <li>
              <strong className="text-zinc-800">Operational and logistics data:</strong> load and
              shipment details you enter, bids, trip status, messages or support tickets, documents
              or images you upload (e.g. load photos, license or vehicle images where applicable).
            </li>
            <li>
              <strong className="text-zinc-800">Location:</strong> if you grant permission, we may
              collect location to support routing, pickup/delivery verification, or safety features.
              You can change location permissions in your device settings.
            </li>
            <li>
              <strong className="text-zinc-800">Payments:</strong> payment-related information is
              processed by our payment partners; we may receive limited transaction metadata.
            </li>
            <li>
              <strong className="text-zinc-800">Device and usage:</strong> device type, operating
              system, app version, and diagnostic or crash data to improve reliability and security.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">2. How we use information</h2>
          <p>We use the information above to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Provide, operate, and improve SharpOrder;</li>
            <li>Authenticate users and prevent fraud or abuse;</li>
            <li>Facilitate matching between shippers and drivers and show relevant loads or bids;</li>
            <li>Process payments and payouts where applicable;</li>
            <li>Send service-related notices, security alerts, and support responses;</li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">3. Sharing</h2>
          <p>
            We may share information with service providers who assist us (hosting, analytics,
            payments, customer support) under contractual obligations. We may disclose information
            if required by law, to protect rights and safety, or in connection with a business
            transfer (e.g. merger). Other users may see information you choose to share in the normal
            operation of the marketplace (e.g. load details visible to bidding drivers).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">4. Retention</h2>
          <p>
            We retain information for as long as your account is active and as needed to provide the
            service, resolve disputes, and meet legal, tax, and regulatory requirements. When
            retention is no longer necessary, we delete or anonymize data in line with our internal
            processes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">5. Security</h2>
          <p>
            We use technical and organizational measures designed to protect your information. No
            method of transmission or storage is completely secure; we encourage strong passwords and
            device security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">6. Your rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, delete, or export
            your personal data, or to object to or restrict certain processing. You may exercise these
            through the app where available or by contacting us. You may also lodge a complaint with a
            data protection authority where applicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">7. Children</h2>
          <p>
            SharpOrder is not directed to children under 16 (or the minimum age in your
            jurisdiction). We do not knowingly collect personal information from children.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">8. International transfers</h2>
          <p>
            If you use SharpOrder from outside the country where our servers or processors are
            located, your information may be transferred and processed across borders. We take steps
            designed to ensure appropriate safeguards where required.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">9. Changes</h2>
          <p>
            We may update this Privacy Policy periodically. We will post the revised policy and
            update the &quot;Last updated&quot; date. Material changes may be communicated through the app
            or email where appropriate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">10. Contact</h2>
          <p>
            For privacy questions or requests, contact us at{" "}
            <a
              className="font-medium text-teal-700 underline decoration-teal-600/30 underline-offset-2 hover:decoration-teal-600"
              href={`mailto:${SUPPORT_EMAIL}?subject=Privacy%20inquiry`}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            or through in-app support.
          </p>
        </section>

      </article>
    </LegalShell>
  );
}

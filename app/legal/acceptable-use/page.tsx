import type { Metadata } from "next";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — SharpOrder",
  description: "Rules for acceptable use of the SharpOrder platform.",
};

export default function AcceptableUsePage() {
  return (
    <LegalShell
      headerTitle="Acceptable Use Policy"
      lastUpdated="March 28, 2026"
      activeHref="/legal/acceptable-use"
    >
      <article className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Summary</h2>
          <p>
            This Acceptable Use Policy sets rules for using SharpOrder. It supplements our Terms of
            Service. Violations may result in removal of content, suspension, or termination of your
            account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">1. Lawful use only</h2>
          <p>
            You must comply with all applicable laws and regulations, including those governing
            transportation, labor, taxes, hazardous materials, data protection, and sanctions. You may
            not use SharpOrder to arrange illegal shipments, evade regulations, or misrepresent
            credentials, insurance, or authority.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">2. Honest listings and bids</h2>
          <p>
            Loads, bids, and profiles must be accurate. Do not post fake loads, manipulate pricing
            through collusion, impersonate others, or harvest user data from the platform for
            unsolicited marketing outside SharpOrder without consent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">3. Safety and respect</h2>
          <p>
            Do not harass, threaten, or discriminate against other users. Do not share another
            person&apos;s private information without permission. Report safety concerns through
            in-app support.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">4. Technical abuse</h2>
          <p>
            Do not probe, scan, or test the vulnerability of our systems without authorization. Do
            not overload the service, distribute malware, or use bots or scripts to access the app in
            a way that mimics or replaces normal user interaction, except as we expressly permit.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">5. Enforcement</h2>
          <p>
            We may investigate suspected violations and cooperate with law enforcement. Remedies may
            include warnings, content removal, account suspension, permanent termination, and legal
            action where appropriate.
          </p>
        </section>
      </article>
    </LegalShell>
  );
}

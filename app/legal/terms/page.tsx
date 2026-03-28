import type { Metadata } from "next";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service — SharpOrder",
  description: "Terms and conditions for using the SharpOrder mobile application and related services.",
};

export default function TermsPage() {
  return (
    <LegalShell
      headerTitle="Terms of Service"
      lastUpdated="March 28, 2026"
      activeHref="/legal/terms"
    >
      <article className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Summary</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of SharpOrder
            (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), including our mobile application and any
            related websites or services that link to these Terms. By creating an account or using
            SharpOrder, you agree to these Terms. If you do not agree, do not use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">1. The service</h2>
          <p>
            SharpOrder provides a platform that connects shippers who need freight moved with
            independent drivers and carriers who may bid on or accept loads. We are a technology
            platform; we are not a motor carrier, freight broker, or employer of drivers unless
            expressly stated in a separate written agreement. You are responsible for compliance
            with all laws that apply to your use of the platform and to any transportation or
            logistics activities you arrange through it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">2. Eligibility and accounts</h2>
          <p>
            You must be legally able to enter a binding contract in your jurisdiction to use
            SharpOrder. You agree to provide accurate registration information and to keep it
            updated. You are responsible for safeguarding your credentials and for activity under
            your account. Notify us promptly if you suspect unauthorized access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">3. User conduct</h2>
          <p>
            You will not misuse the service, interfere with other users, attempt unauthorized
            access, scrape or reverse engineer the app except as permitted by law, or use SharpOrder
            for unlawful, fraudulent, or harmful purposes. We may suspend or terminate accounts that
            violate these Terms or our Acceptable Use Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">4. Payments and fees</h2>
          <p>
            Certain features may involve payments, payouts, or fees. Amounts, timing, and processors
            will be shown in the app or in separate agreements where applicable. You authorize us and
            our payment partners to charge or transfer funds as described at the time of the
            transaction. Disputes between shippers and drivers regarding performance of a load are
            primarily between those parties; we may offer support tools but are not liable for
            disputes unless required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">5. Intellectual property</h2>
          <p>
            SharpOrder and its branding, software, and content are owned by us or our licensors.
            We grant you a limited, non-exclusive, non-transferable license to use the app for its
            intended purpose. You may not copy, modify, or distribute our materials without
            permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">6. Disclaimers</h2>
          <p>
            The service is provided &quot;as is&quot; and &quot;as available.&quot; To the fullest extent
            permitted by law, we disclaim warranties of merchantability, fitness for a particular
            purpose, and non-infringement. We do not guarantee uninterrupted or error-free operation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law, we and our affiliates will not be
            liable for indirect, incidental, special, consequential, or punitive damages, or loss of
            profits or data, arising from your use of SharpOrder. Our aggregate liability for claims
            relating to the service is limited to the greater of (a) the amount you paid us for the
            service in the twelve months before the claim or (b) one hundred U.S. dollars (USD 100),
            unless a higher minimum is required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">8. Changes and termination</h2>
          <p>
            We may modify these Terms by posting an updated version and updating the &quot;Last
            updated&quot; date. Continued use after changes constitutes acceptance where permitted by
            law. We may suspend or terminate access with or without notice for conduct that we
            believe violates these Terms or creates risk or legal exposure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">9. Governing law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which SharpOrder operates,
            without regard to conflict-of-law rules, except where consumer protection laws require
            otherwise. Courts in that jurisdiction will have exclusive venue for disputes, subject
            to mandatory rights you may have in your country of residence.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">10. Contact</h2>
          <p>
            For questions about these Terms, contact us through in-app support or at the email
            address listed on our Privacy Policy and Delete Account pages.
          </p>
        </section>

      </article>
    </LegalShell>
  );
}

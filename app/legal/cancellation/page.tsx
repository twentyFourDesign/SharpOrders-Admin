import type { Metadata } from "next";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "Cancellation Policy — SharpOrder",
  description: "Cancellation, refunds, and payout timing for SharpOrder.",
};

export default function CancellationPage() {
  return (
    <LegalShell
      headerTitle="Cancellation Policy"
      lastUpdated="March 28, 2026"
      activeHref="/legal/cancellation"
    >
      <article className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Summary</h2>
          <p>
            This policy describes how cancellations of loads, bids, or trips may work within
            SharpOrder, and how refunds or adjustments may be handled. Specific terms shown in the
            app at the time of booking or payment may apply in addition to this overview.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">1. Loads and bids</h2>
          <p>
            Shippers may cancel or modify loads according to rules presented in the app, which may
            depend on whether a driver has been assigned or a bid accepted. Drivers may withdraw
            bids before acceptance where the app allows. After a firm commitment is formed between
            parties, cancellation may be subject to fees, ratings impact, or dispute resolution as
            described in-app or in separate agreements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">2. Payments and refunds</h2>
          <p>
            When payments are processed through SharpOrder or our partners, refunds—if any—depend on
            the payment method, the stage of the shipment, and applicable law. Authorized refunds are
            typically returned to the original payment method within a reasonable period after
            approval; timing may vary by bank or card issuer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">3. Driver payouts</h2>
          <p>
            Driver payouts may be scheduled after delivery confirmation, verification, or
            administrative review, as shown in the wallet or payout sections of the app. Holds or
            delays may occur for fraud prevention, chargebacks, or compliance checks.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">4. Subscription or recurring fees</h2>
          <p>
            If we introduce subscription or recurring fees, cancellation and billing terms will be
            disclosed at signup and in your account settings. Until such features are offered, this
            section serves as a placeholder for future clarity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">5. Contact</h2>
          <p>
            For cancellation or billing questions, use in-app support so we can reference your
            specific transaction.
          </p>
        </section>
      </article>
    </LegalShell>
  );
}

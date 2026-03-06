import type { Metadata } from "next";
import { OfficialPageShell } from "@/components/site/official-page-shell";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | StoryWeaver",
  description:
    "Refund and cancellation policy for StoryWeaver services operated by Abhiroop Prasad Ventures.",
};

export default function RefundCancellationPolicyPage() {
  return (
    <OfficialPageShell
      title="Refund and Cancellation Policy"
      subtitle="Effective date: March 6, 2026"
    >
      <div className="official-stack">
        <section>
          <h2>1. Scope</h2>
          <p>
            This policy applies to digital purchases made for StoryWeaver,
            including one-time purchases and recurring subscriptions.
          </p>
        </section>

        <section>
          <h2>2. Cancellation Policy</h2>
          <p>
            Subscription plans can be canceled at any time before the next
            billing date to avoid future charges. One-time purchases cannot be
            canceled once payment is successfully completed.
          </p>
        </section>

        <section>
          <h2>3. Refund Eligibility</h2>
          <p>Refund requests may be approved when:</p>
          <ul>
            <li>A duplicate payment is made for the same order.</li>
            <li>
              Payment is successful but service/credits are not delivered.
            </li>
            <li>
              A verified technical issue prevents use of purchased features and
              is not resolved within a reasonable time.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Non-Refundable Cases</h2>
          <p>Refunds are generally not provided for:</p>
          <ul>
            <li>Partially or fully consumed usage/credits.</li>
            <li>Change of mind after successful service delivery.</li>
            <li>Requests made after 7 calendar days from payment date.</li>
          </ul>
        </section>

        <section>
          <h2>5. Refund Request Timeline</h2>
          <p>
            Raise refund requests within 7 days of transaction date by emailing{" "}
            <a href="mailto:abhirooprasad@gmail.com">abhirooprasad@gmail.com</a>{" "}
            with transaction details.
          </p>
        </section>

        <section>
          <h2>6. Refund Processing Time</h2>
          <p>
            Approved refunds are initiated within 5 to 10 business days and are
            credited to the original payment method, subject to payment partner
            and bank timelines.
          </p>
        </section>

        <section>
          <h2>7. Payment Partner</h2>
          <p>
            Online payments are processed through authorized gateways including
            Cashfree. Gateway or bank processing times may vary.
          </p>
        </section>
      </div>
    </OfficialPageShell>
  );
}

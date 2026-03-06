import type { Metadata } from "next";
import { OfficialPageShell } from "@/components/site/official-page-shell";

export const metadata: Metadata = {
  title: "Terms and Conditions | StoryWeaver",
  description: "Terms and Conditions governing use of StoryWeaver services.",
};

export default function TermsAndConditionsPage() {
  return (
    <OfficialPageShell
      title="Terms and Conditions"
      subtitle="Effective date: March 6, 2026"
    >
      <div className="official-stack">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By using StoryWeaver, you agree to these Terms and Conditions. If
            you do not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2>2. Service Description</h2>
          <p>
            StoryWeaver is a digital platform that provides AI-assisted content
            and story generation tools for creative and professional use.
          </p>
        </section>

        <section>
          <h2>3. Eligibility</h2>
          <p>
            You must be at least 18 years old and legally capable of entering
            into contracts in your jurisdiction to use paid services.
          </p>
        </section>

        <section>
          <h2>4. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining account confidentiality and for
            all activity under your account.
          </p>
        </section>

        <section>
          <h2>5. Acceptable Use</h2>
          <p>You agree not to use StoryWeaver for:</p>
          <ul>
            <li>Illegal, fraudulent, or deceptive activity.</li>
            <li>Infringing third-party intellectual property rights.</li>
            <li>Generating harmful, abusive, or defamatory content.</li>
            <li>Attempting unauthorized access to systems or data.</li>
          </ul>
        </section>

        <section>
          <h2>6. Payments</h2>
          <p>
            Payments are processed through approved payment partners including
            Cashfree. You agree to provide accurate billing details and
            authorize applicable charges.
          </p>
        </section>

        <section>
          <h2>7. Content Ownership</h2>
          <p>
            You retain rights to your original inputs. Subject to applicable
            law and third-party rights, you may use generated outputs for
            lawful commercial and personal purposes. You grant us a limited
            license to process content only to provide and improve the service.
          </p>
        </section>

        <section>
          <h2>8. Suspension or Termination</h2>
          <p>
            We may suspend or terminate access if these terms are violated, if
            payment obligations are not met, or if use creates legal/security
            risk.
          </p>
        </section>

        <section>
          <h2>9. Disclaimer and Liability</h2>
          <p>
            Services are provided on an &quot;as is&quot; and &quot;as available&quot;
            basis. To the maximum extent permitted by law, Abhiroop Prasad
            Ventures is not liable for indirect, incidental, or consequential
            damages.
          </p>
        </section>

        <section>
          <h2>10. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Courts in Bengaluru,
            Karnataka will have jurisdiction over related disputes.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            For legal or policy queries, email{" "}
            <a href="mailto:abhirooprasad@gmail.com">abhirooprasad@gmail.com</a>.
          </p>
        </section>
      </div>
    </OfficialPageShell>
  );
}

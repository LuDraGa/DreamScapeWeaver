import Link from "next/link";
import { OfficialPageShell } from "@/components/site/official-page-shell";

export default function HomePage() {
  return (
    <OfficialPageShell
      title="StoryWeaver"
      subtitle="AI-powered story creation for creators, marketers, and video teams."
    >
      <div className="official-grid">
        <article>
          <h2>Fast content generation</h2>
          <p>
            Generate platform-ready storytelling formats with guided templates,
            structured prompts, and smart refinement loops.
          </p>
        </article>

        <article>
          <h2>Built for practical output</h2>
          <p>
            Create short-form hooks, long-form scripts, marketing copy, and
            production-ready variants in minutes.
          </p>
        </article>

        <article>
          <h2>Payments and compliance ready</h2>
          <p>
            Contact details and legal policy pages are published for payment
            gateway approval and customer trust.
          </p>
        </article>
      </div>

      <div className="official-actions">
        <Link href="/app/create" className="official-btn">
          Launch App
        </Link>
        <Link href="/contact" className="official-btn secondary">
          Contact Us
        </Link>
      </div>
    </OfficialPageShell>
  );
}

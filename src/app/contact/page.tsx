import type { Metadata } from "next";
import { OfficialPageShell } from "@/components/site/official-page-shell";

export const metadata: Metadata = {
  title: "Contact | StoryWeaver",
  description: "Business contact details for StoryWeaver by Abhiroop Prasad Ventures.",
};

export default function ContactPage() {
  return (
    <OfficialPageShell
      title="Contact Us"
      subtitle="Business and support information for customer queries, billing, and policy requests."
    >
      <div className="official-stack">
        <section>
          <h2>Business Name</h2>
          <p>Abhiroop Prasad Ventures</p>
        </section>

        <section>
          <h2>Email</h2>
          <p>
            <a href="mailto:abhirooprasad@gmail.com">abhirooprasad@gmail.com</a>
          </p>
        </section>

        <section>
          <h2>Business Address</h2>
          <p>Kamannahalli, Bengaluru - 560043, India</p>
        </section>

        <section>
          <h2>Support Window</h2>
          <p>Monday to Friday, 10:00 AM - 6:00 PM IST</p>
        </section>
      </div>
    </OfficialPageShell>
  );
}

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <div className="space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
            <p>
              By accessing and using FreshTrack, you accept and agree to be bound by the 
              terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Use License</h2>
            <p>
              FreshTrack grants you a personal, non-transferable license to use the application 
              for managing your grocery inventory and reducing food waste.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Provide accurate information when creating your account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service in compliance with all applicable laws</li>
              <li>Not misuse or abuse the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Service Availability</h2>
            <p>
              We strive to keep FreshTrack available 24/7, but we cannot guarantee 
              uninterrupted access. We may modify or discontinue features with notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
            <p>
              FreshTrack provides grocery tracking and management tools. We are not 
              responsible for food safety decisions. Always use your judgment regarding 
              food freshness and safety.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Intellectual Property</h2>
            <p>
              All content, features, and functionality of FreshTrack are owned by us 
              and protected by international copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violations of 
              these terms. You may close your account at any time through the app settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of 
              the service constitutes acceptance of modified terms.
            </p>
          </section>

          <section className="text-sm text-muted-foreground">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;

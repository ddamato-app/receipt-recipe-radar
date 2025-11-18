import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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
        
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
            <p>FreshTrack collects the following information:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Account information (email address) when you sign up</li>
              <li>Grocery item data you input or scan</li>
              <li>Receipt images you upload</li>
              <li>Usage data to improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Provide and maintain the FreshTrack service</li>
              <li>Process receipt images and extract grocery information</li>
              <li>Send you notifications about expiring items</li>
              <li>Improve our AI-powered features</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Storage and Security</h2>
            <p>
              Your data is securely stored using industry-standard encryption. 
              Receipt images are processed using AI and stored securely. 
              We do not share your personal information with third parties without your consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Camera Permissions</h2>
            <p>
              FreshTrack requires camera access to scan receipts. Images are only used for 
              processing grocery information and are stored securely in your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Access your personal data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at 
              privacy@freshtrack.app
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

export default Privacy;

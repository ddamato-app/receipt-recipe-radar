import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-primary via-primary/90 to-blue-600">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Stop Asking<br />'What's for Dinner?'
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Your smart fridge companion that saves money, reduces waste, and always knows what to cook.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg"
              onClick={() => navigate("/")}
              className="text-lg px-8 py-6 h-auto bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 h-auto bg-transparent text-white border-2 border-white hover:bg-white/10 hover:scale-105 transition-all duration-200"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch How It Works
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-6 text-white/90 text-sm md:text-base pt-4">
            <span className="flex items-center gap-2">
              <span className="text-lg">✓</span> Free to start
            </span>
            <span className="flex items-center gap-2">
              <span className="text-lg">✓</span> No credit card needed
            </span>
            <span className="flex items-center gap-2">
              <span className="text-lg">✓</span> Works on any device
            </span>
          </div>

          {/* Social Proof */}
          <p className="text-white/80 text-lg pt-8">
            Join 1,000+ families already reducing food waste
          </p>
        </div>

        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/5 pointer-events-none" />
      </section>

      {/* The Story Section */}
      <section className="py-20 md:py-32 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left: Image Placeholder */}
            <div className="order-2 md:order-1 animate-fade-in">
              <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center overflow-hidden shadow-lg">
                <div className="text-center p-8 text-muted-foreground">
                  <p className="text-lg">📸 Image:</p>
                  <p className="text-sm mt-2">Couple looking at fridge</p>
                </div>
              </div>
            </div>

            {/* Right: Story Text */}
            <div className="order-1 md:order-2 space-y-6 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                It Started With a Simple Question
              </h2>

              <div className="space-y-4 text-lg text-foreground/80 leading-relaxed">
                <p>Every single evening, the same routine.</p>

                <p>I&apos;d open the fridge and ask my wife: &apos;What should we make for dinner tonight?&apos;</p>

                <p>We&apos;d stare at the shelves, seeing the same ingredients. Nothing felt inspiring.</p>

                <p>So we&apos;d stop at the grocery store. Or order online. Quick, easy, convenient.</p>

                <p>Until the delivery arrived.</p>

                <p>&apos;Wait... didn&apos;t we already have milk?&apos;</p>

                <p>That forgotten food would sit there until we&apos;d find it again - expired, wilted, wasted.</p>

                <p className="font-semibold text-foreground">
                  We weren&apos;t alone. Families waste $1,500 to $3,000 every year on food that never gets eaten.
                </p>

                <p className="text-xl font-medium text-foreground">
                  FreshTrack was born from our kitchen frustration. Now that daily &apos;what&apos;s for dinner?&apos; conversation is easy.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate("/")}
                  className="text-lg px-8 py-6 h-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Start Using FreshTrack
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

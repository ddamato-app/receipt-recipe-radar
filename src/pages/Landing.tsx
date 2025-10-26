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
    </div>
  );
};

export default Landing;

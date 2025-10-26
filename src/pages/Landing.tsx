import { Button } from "@/components/ui/button";
import { Package, ChefHat, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-background py-12 md:py-20 lg:py-24 px-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-8 order-2 md:order-1">
              {/* Pre-headline */}
              <p className="text-sm md:text-base font-medium text-primary uppercase tracking-wide">
                Your Smart Kitchen Companion
              </p>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
                Never Waste Food or Money Again
              </h1>
              
              {/* Subheading */}
              <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
                Track what's in your fridge. Get recipe ideas. Save money on groceries.
              </p>

              {/* Value Props */}
              <div className="space-y-6 pt-4">
                {/* Prop 1 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Track Your Groceries
                    </h3>
                    <p className="text-base text-foreground/70 leading-relaxed">
                      Scan receipts or add items manually. Always know what you have and when it expires.
                    </p>
                  </div>
                </div>

                {/* Prop 2 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Smart Recipe Suggestions
                    </h3>
                    <p className="text-base text-foreground/70 leading-relaxed">
                      Get recipes using ingredients you already have. Prioritize items expiring soon.
                    </p>
                  </div>
                </div>

                {/* Prop 3 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      See Your Savings
                    </h3>
                    <p className="text-base text-foreground/70 leading-relaxed">
                      Track money saved vs wasted. Average family saves $1,500+ per year.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  size="lg"
                  onClick={() => navigate("/")}
                  className="text-base md:text-lg px-8 py-6 h-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg w-full sm:w-auto font-semibold"
                >
                  Start Free - No Credit Card
                </Button>
                <button 
                  onClick={() => navigate("/")}
                  className="text-base md:text-lg text-primary font-semibold hover:text-primary/80 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  See How It Works →
                </button>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap gap-6 text-foreground/60 text-sm pt-4">
                <span className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Free forever plan
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 1,000+ families saving
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Works on any device
                </span>
              </div>
            </div>

            {/* Right: App Mockup */}
            <div className="order-1 md:order-2">
              <div className="relative max-w-sm mx-auto md:max-w-none">
                {/* Phone mockup frame with shadow */}
                <div className="relative bg-gradient-to-br from-primary/5 to-blue-600/5 rounded-3xl p-6 md:p-8">
                  <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border-[10px] border-foreground/10">
                    {/* Phone screen content */}
                    <div className="aspect-[9/19.5] bg-background">
                      {/* App header */}
                      <div className="bg-primary text-primary-foreground p-4 text-center">
                        <h3 className="font-semibold text-lg">My Fridge</h3>
                      </div>
                      
                      {/* App content - Item list */}
                      <div className="p-4 space-y-3">
                        {/* Item 1 */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🥛</div>
                            <div>
                              <p className="font-medium text-sm">Milk</p>
                              <p className="text-xs text-foreground/60">Dairy • 1 liter</p>
                            </div>
                          </div>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">2d left</span>
                        </div>

                        {/* Item 2 */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🍎</div>
                            <div>
                              <p className="font-medium text-sm">Apples</p>
                              <p className="text-xs text-foreground/60">Fruits • 6 items</p>
                            </div>
                          </div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">5d left</span>
                        </div>

                        {/* Item 3 */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🥬</div>
                            <div>
                              <p className="font-medium text-sm">Lettuce</p>
                              <p className="text-xs text-foreground/60">Vegetables • 1 head</p>
                            </div>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">4d left</span>
                        </div>

                        {/* Item 4 */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🧀</div>
                            <div>
                              <p className="font-medium text-sm">Cheese</p>
                              <p className="text-xs text-foreground/60">Dairy • 200g</p>
                            </div>
                          </div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">7d left</span>
                        </div>

                        {/* Item 5 */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🍞</div>
                            <div>
                              <p className="font-medium text-sm">Bread</p>
                              <p className="text-xs text-foreground/60">Grains • 1 loaf</p>
                            </div>
                          </div>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">3d left</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-12 md:py-32 px-6 bg-background">
        <div className="w-[90%] max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
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
              <h2 className="text-[1.75rem] md:text-5xl font-bold text-foreground leading-[1.2]">
                It Started With a Simple Question
              </h2>

              <div className="space-y-6 text-base text-foreground/80 leading-[1.6]">
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

                <p className="text-lg md:text-xl font-medium text-foreground">
                  FreshTrack was born from our kitchen frustration. Now that daily &apos;what&apos;s for dinner?&apos; conversation is easy.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate("/")}
                  className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-lg w-full sm:w-auto"
                >
                  Start Using FreshTrack
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 md:py-32 px-6 bg-muted/30">
        <div className="w-[90%] max-w-7xl mx-auto space-y-8 md:space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-[1.75rem] md:text-5xl font-bold text-foreground leading-[1.2]">
              The Hidden Cost of Forgotten Food
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-3xl mx-auto leading-[1.6]">
              Food waste isn&apos;t just an environmental problem—it&apos;s draining your wallet
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {/* Card 1 */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 text-center space-y-3 md:space-y-4">
              <div className="text-5xl md:text-6xl mb-3 md:mb-4">💸</div>
              <div className="text-4xl md:text-5xl font-bold text-primary">
                $1,500-$3,000
              </div>
              <p className="text-sm md:text-base text-foreground/70 leading-[1.6]">
                Wasted per year by the average family of four
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 text-center space-y-3 md:space-y-4">
              <div className="text-5xl md:text-6xl mb-3 md:mb-4">🗑️</div>
              <div className="text-4xl md:text-5xl font-bold text-primary">
                325 pounds
              </div>
              <p className="text-sm md:text-base text-foreground/70 leading-[1.6]">
                of food thrown away per person annually in the US
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 text-center space-y-3 md:space-y-4">
              <div className="text-5xl md:text-6xl mb-3 md:mb-4">🌍</div>
              <div className="text-4xl md:text-5xl font-bold text-primary">
                40%
              </div>
              <p className="text-sm md:text-base text-foreground/70 leading-[1.6]">
                of all food produced goes uneaten in America
              </p>
            </div>
          </div>

          {/* Bottom Text */}
          <p className="text-center text-base md:text-xl text-foreground/80 max-w-2xl mx-auto pt-6 md:pt-8 animate-fade-in leading-[1.6]">
            That&apos;s like throwing away one out of every five grocery bags you buy.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-32 px-6 bg-background">
        <div className="w-[90%] max-w-7xl mx-auto space-y-12 md:space-y-20">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-[1.75rem] md:text-5xl font-bold text-foreground leading-[1.2]">
              Meet Your Smart Fridge Companion
            </h2>
          </div>

          {/* Feature 1 - Text Left, Image Right */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="space-y-4 md:space-y-6 animate-fade-in">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">📸</div>
              <h3 className="text-xl md:text-4xl font-bold text-foreground leading-[1.2]">
                Never Forget What You Have
              </h3>
              <p className="text-base md:text-lg text-foreground/80 leading-[1.6]">
                Forward your grocery receipt or add items manually. FreshTrack tracks everything in your fridge.
              </p>
              <ul className="space-y-3 text-base text-foreground/70">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Scan receipts automatically</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Track expiration dates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>See what&apos;s expiring soon</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Get reminded before items go bad</span>
                </li>
              </ul>
            </div>
            <div className="animate-fade-in">
              <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center shadow-lg">
                <p className="text-muted-foreground text-sm">Screenshot: Fridge inventory</p>
              </div>
            </div>
          </div>

          {/* Feature 2 - Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="order-2 md:order-1 animate-fade-in">
              <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center shadow-lg">
                <p className="text-muted-foreground text-sm">Screenshot: Recipe suggestions</p>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4 md:space-y-6 animate-fade-in">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">🍳</div>
              <h3 className="text-xl md:text-4xl font-bold text-foreground leading-[1.2]">
                Know What to Cook Tonight
              </h3>
              <p className="text-base md:text-lg text-foreground/80 leading-[1.6]">
                Get instant recipe suggestions using exactly what you have.
              </p>
              <ul className="space-y-3 text-base text-foreground/70">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Recipes using your ingredients</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Filter by time & dietary needs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Use up expiring items first</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 - Text Left, Image Right */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="space-y-4 md:space-y-6 animate-fade-in">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">💰</div>
              <h3 className="text-xl md:text-4xl font-bold text-foreground leading-[1.2]">
                See Your Savings Add Up
              </h3>
              <p className="text-base md:text-lg text-foreground/80 leading-[1.6]">
                Track every dollar saved by using food before it expires.
              </p>
              <ul className="space-y-3 text-base text-foreground/70">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Money saved vs wasted</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Monthly spending insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Waste reduction trends</span>
                </li>
              </ul>
            </div>
            <div className="animate-fade-in">
              <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center shadow-lg">
                <p className="text-muted-foreground text-sm">Screenshot: Savings dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-32 px-6 bg-muted/30">
        <div className="w-[90%] max-w-7xl mx-auto space-y-8 md:space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-[1.75rem] md:text-5xl font-bold text-foreground leading-[1.2]">
              Start Free, Upgrade When Ready
            </h2>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-stretch md:items-center">
            {/* Card 1 - FREE */}
            <div className="bg-background rounded-2xl p-8 shadow-lg border border-border animate-fade-in">
              <div className="text-center space-y-4 mb-6">
                <h3 className="text-2xl font-bold text-foreground">FREE</h3>
                <div className="text-4xl font-bold text-foreground">$0<span className="text-lg text-foreground/60">/month</span></div>
                <p className="text-sm text-foreground/70">Perfect to start</p>
              </div>
              <ul className="space-y-3 mb-8 text-foreground/70">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>15 items max</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Basic tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>3 recipes/day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>This device only</span>
                </li>
              </ul>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Get Started
              </Button>
            </div>

            {/* Card 2 - FREE ACCOUNT (Highlighted) */}
            <div className="bg-background rounded-2xl p-8 shadow-2xl border-2 border-primary relative md:scale-105 animate-fade-in">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most popular!
              </div>
              <div className="text-center space-y-4 mb-6 mt-2">
                <h3 className="text-2xl font-bold text-foreground">FREE ACCOUNT</h3>
                <div className="text-4xl font-bold text-foreground">$0<span className="text-lg text-foreground/60">/month</span></div>
              </div>
              <ul className="space-y-3 mb-8 text-foreground/70">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Unlimited items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>All features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Sync devices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Family sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>3 month history</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate("/")}
              >
                Create Account
              </Button>
            </div>

            {/* Card 3 - PRO */}
            <div className="bg-background rounded-2xl p-8 shadow-lg border border-border animate-fade-in">
              <div className="text-center space-y-4 mb-6">
                <h3 className="text-2xl font-bold text-foreground">PRO</h3>
                <div className="text-4xl font-bold text-foreground">$4.99<span className="text-lg text-foreground/60">/month</span></div>
                <p className="text-sm text-foreground/70">For power users</p>
              </div>
              <ul className="space-y-3 mb-8 text-foreground/70">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Everything above +</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Receipt scanning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Meal planning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Price tracking</span>
                </li>
              </ul>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Start Free Trial
              </Button>
            </div>
          </div>

          {/* Bottom Text */}
          <p className="text-center text-base md:text-lg text-foreground/80 max-w-2xl mx-auto animate-fade-in leading-[1.6]">
            💡 Average family saves $1,500/year. FreshTrack pays for itself.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-32 px-6 bg-gradient-to-br from-primary via-primary/90 to-blue-600">
        <div className="w-[90%] max-w-4xl mx-auto text-center space-y-6 md:space-y-8 animate-fade-in">
          <h2 className="text-[1.75rem] md:text-6xl font-bold text-white leading-[1.2]">
            Ready to Stop Wasting Food and Money?
          </h2>
          
          <p className="text-lg md:text-2xl text-white/90 leading-[1.6]">
            Join thousands of families who&apos;ve transformed their kitchens.
          </p>

          <div className="pt-4">
            <Button 
              size="lg"
              onClick={() => navigate("/")}
              className="text-base md:text-xl px-8 md:px-12 py-6 md:py-8 h-auto bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-200 shadow-2xl font-bold w-full sm:w-auto"
            >
              Start Using FreshTrack Free
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-white/90 text-sm md:text-base pt-4">
            <span className="flex items-center gap-2">
              <span className="text-base md:text-lg">✓</span> No credit card required
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base md:text-lg">✓</span> Free forever plan
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base md:text-lg">✓</span> Upgrade anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Product</h3>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Company</h3>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press Kit</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Resources</h3>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              </ul>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Connect</h3>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Email</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border text-center text-sm text-foreground/60">
            © 2025 FreshTrack. Made with 💚 to help families waste less.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

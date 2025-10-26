import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Check, DollarSign, Trash2, Globe, ShoppingCart, ChefHat, TrendingUp, Heart, Users, Sparkles, ArrowRight, Brain, Clock, RefreshCw, Camera, Utensils, BarChart3, Apple } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/landing-hero-fridge.jpg";
import storyImage from "@/assets/landing-story-couple.jpg";

const Index = () => {
  const [savedMoney, setSavedMoney] = useState(0);
  const [wastePrevent, setWastePrevent] = useState(0);
  const [mealsRescued, setMealsRescued] = useState(0);

  // Animate counters on page load
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targetSaved = 2400000;
    const targetWaste = 12;
    const targetMeals = 45000;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setSavedMoney(Math.floor(targetSaved * progress));
      setWastePrevent(Math.floor(targetWaste * progress));
      setMealsRescued(Math.floor(targetMeals * progress));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center text-white animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Stop Asking "What's for Dinner?"
          </h1>
          <p className="text-xl md:text-3xl mb-12 max-w-4xl mx-auto font-light">
            Your smart fridge companion that saves money, reduces waste, and always knows what to cook.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/home">
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Free Trial
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              onClick={() => scrollToSection("how-it-works")}
            >
              <PlayCircle className="mr-2" />
              Watch How It Works
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap gap-6 justify-center text-sm mb-8">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Works on any device</span>
            </div>
          </div>

          {/* Social Proof */}
          <p className="text-lg mb-6 opacity-90">
            Join 1,000+ families already reducing food waste
          </p>

          {/* Animated Stats */}
          <div className="flex flex-wrap gap-8 justify-center text-center">
            <div>
              <div className="text-3xl font-bold text-primary">💰 ${(savedMoney / 1000000).toFixed(1)}M</div>
              <div className="text-sm opacity-80">saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">🌍 {wastePrevent} tons</div>
              <div className="text-sm opacity-80">waste prevented</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">🍽️ {mealsRescued.toLocaleString()}</div>
              <div className="text-sm opacity-80">meals rescued</div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            It Started With a Simple Question
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in">
              <img 
                src={storyImage} 
                alt="Couple looking at fridge" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Story Text */}
            <div className="space-y-6 text-lg leading-relaxed text-foreground animate-fade-in">
              <p className="font-semibold text-xl">Every single evening, the same routine.</p>
              
              <p>I'd open the fridge and ask my wife: <em>"What should we make for dinner tonight?"</em></p>
              
              <p>We'd stare at the shelves, seeing the same ingredients we saw yesterday. We didn't want to eat the same thing again. Nothing felt inspiring.</p>
              
              <p>So we'd do what millions of families do: stop at the grocery store on the way home. Or order groceries online. Quick, easy, convenient.</p>
              
              <p className="font-semibold">Until the delivery arrived.</p>
              
              <p className="italic text-muted-foreground">
                "Wait... didn't we already have milk?"<br />
                "I thought we finished the chicken?"<br />
                "Why did we buy lettuce? There's a full head in the crisper."
              </p>
              
              <p>Sound familiar?</p>
              
              <p>That forgotten produce would sit there, day after day, until we'd find it again - expired, wilted, wasted. And with it, our hard-earned money thrown in the trash.</p>
              
              <p className="font-semibold text-xl">We weren't alone. Families waste an average of $1,500 to $3,000 every year on food that never gets eaten.</p>
              
              <p>That's when I realized: <strong>we don't have a food problem. We have a memory problem.</strong></p>
              
              <p>FreshTrack was born from our kitchen frustration. A simple app to remember what we have, suggest what to cook, and help us shop smarter.</p>
              
              <p>Now, that daily "what's for dinner?" conversation is easy. We know what we have. We know what's expiring. We know what to make.</p>
              
              <p className="font-semibold">And we've saved hundreds of dollars while eating better food and wasting less.</p>
              
              <p className="text-xl">If you've ever stood in front of your fridge wondering what to cook, FreshTrack is for you.</p>
              
              <div className="pt-4">
                <Link to="/home">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Start Using FreshTrack
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - Statistics */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            The Hidden Cost of Forgotten Food
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto">
            Food waste isn't just an environmental problem—it's draining your wallet
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow animate-scale-in">
              <CardHeader>
                <div className="text-6xl mb-4">💸</div>
                <CardTitle className="text-4xl font-bold text-primary">$1,500-$3,000</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Wasted per year by the average family of four</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow animate-scale-in">
              <CardHeader>
                <div className="text-6xl mb-4">🗑️</div>
                <CardTitle className="text-4xl font-bold text-primary">325 pounds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">of food thrown away per person annually in the US</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow animate-scale-in">
              <CardHeader>
                <div className="text-6xl mb-4">🌍</div>
                <CardTitle className="text-4xl font-bold text-primary">40%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">of all food produced goes uneaten in America</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-2xl text-center font-semibold text-foreground">
            That's like throwing away one out of every five grocery bags you buy.
          </p>
        </div>
      </section>

      {/* Root Causes Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            Why Does This Happen?
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto">
            It's not your fault—modern life makes food waste inevitable
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
              <CardHeader>
                <Brain className="w-16 h-16 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">We Forget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2 italic">"What's already in the fridge?"</p>
                <p className="text-sm">Without checking, we buy duplicates of what we have</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
              <CardHeader>
                <Utensils className="w-16 h-16 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">We Don't Know</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2 italic">"What can I make with this?"</p>
                <p className="text-sm">Good ingredients sit unused while we order takeout</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
              <CardHeader>
                <Clock className="w-16 h-16 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">We Miss Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2 italic">"When did I buy this?"</p>
                <p className="text-sm">Items expire hidden in the back of shelves</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
              <CardHeader>
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">We Repeat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2 italic">"Not again..."</p>
                <p className="text-sm">Same meals over and over, so we buy more variety</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section - Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            Meet Your Smart Fridge Companion
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-20 max-w-3xl mx-auto">
            FreshTrack remembers what you have, suggests what to cook, and helps you shop smarter
          </p>

          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-20 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold text-foreground">Never Forget What You Have</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Forward your grocery receipt or add items manually. FreshTrack tracks everything in your fridge, so you always know what you have before shopping.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Scan receipts automatically</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Track expiration dates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>See what's expiring soon</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Get reminded before items go bad</span>
                </li>
              </ul>
            </div>
            <div className="bg-muted rounded-2xl p-8 aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">📱 Inventory Screenshot</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-20 animate-fade-in">
            <div className="bg-muted rounded-2xl p-8 aspect-video flex items-center justify-center md:order-first order-last">
              <p className="text-muted-foreground">🍳 Recipe Screenshot</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ChefHat className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold text-foreground">Know What to Cook Tonight</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Stop staring at your fridge wondering what to make. Get instant recipe suggestions using exactly what you have—prioritizing items that expire soon.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Recipes using your ingredients</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Filter by time & dietary needs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Step-by-step instructions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Use up expiring items first</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-20 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold text-foreground">See Your Savings Add Up</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Track every dollar saved by using food before it expires. Watch your waste decrease and your savings grow month after month.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Money saved vs wasted</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Monthly spending insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Waste reduction trends</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Set and hit savings goals</span>
                </li>
              </ul>
            </div>
            <div className="bg-muted rounded-2xl p-8 aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">💰 Savings Dashboard</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-20 animate-fade-in">
            <div className="bg-muted rounded-2xl p-8 aspect-video flex items-center justify-center md:order-first order-last">
              <p className="text-muted-foreground">🥗 Health Score</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Apple className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold text-foreground">Eat Healthier Automatically</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Get a health score based on what you're actually eating. Receive personalized recommendations to balance your diet and eat more nutritiously.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Track nutrition balance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Healthy eating insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Recipe suggestions for gaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Improve your diet naturally</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold text-foreground">Shop Smarter Every Time</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Never buy duplicates again. FreshTrack shows what you need, suggests meals to complete, and helps you shop with purpose.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Smart shopping lists</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Meal-based suggestions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>See what you already have</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Budget tracking</span>
                </li>
              </ul>
            </div>
            <div className="bg-muted rounded-2xl p-8 aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">🛒 Shopping Mode</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Start Saving in 3 Simple Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 animate-fade-in">
              <CardHeader>
                <div className="text-6xl font-bold text-primary mb-4">1️⃣</div>
                <CardTitle className="text-2xl">Track Your Fridge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Forward grocery receipts or add items manually. FreshTrack knows what you have and when it expires.
                </p>
                <div className="bg-muted rounded-lg p-4 aspect-video flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Add Items Screen</p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 animate-fade-in">
              <CardHeader>
                <div className="text-6xl font-bold text-primary mb-4">2️⃣</div>
                <CardTitle className="text-2xl">Get Recipe Ideas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Every day, see what you can cook with what you have. Use items before they expire.
                </p>
                <div className="bg-muted rounded-lg p-4 aspect-video flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Recipe Suggestions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 animate-fade-in">
              <CardHeader>
                <div className="text-6xl font-bold text-primary mb-4">3️⃣</div>
                <CardTitle className="text-2xl">Watch Savings Grow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Track your progress. Reduce waste. Save hundreds per month. Feel good about every meal.
                </p>
                <div className="bg-muted rounded-lg p-4 aspect-video flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Savings Stats</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Families Are Already Saving
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="shadow-lg hover:shadow-xl transition-shadow animate-scale-in">
              <CardHeader>
                <div className="text-warning text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg italic text-foreground">
                  "We've saved over $400 in three months! No more buying duplicates or letting produce rot. This app has changed how our family eats."
                </p>
                <p className="text-sm text-muted-foreground font-semibold">— Sarah M., Mother of 3</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow animate-scale-in">
              <CardHeader>
                <div className="text-warning text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg italic text-foreground">
                  "I used to throw away so much food. Now I actually use what I buy. The recipe suggestions are genius!"
                </p>
                <p className="text-sm text-muted-foreground font-semibold">— David K., Busy Professional</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow animate-scale-in">
              <CardHeader>
                <div className="text-warning text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg italic text-foreground">
                  "Finally! An app that actually helps me meal plan. No more 'what's for dinner?' stress."
                </p>
                <p className="text-sm text-muted-foreground font-semibold">— Jennifer L., Working Mom</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Start Free, Upgrade When Ready
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Free</CardTitle>
                <div className="text-4xl font-bold text-center text-foreground my-4">$0<span className="text-lg text-muted-foreground">/month</span></div>
                <CardDescription className="text-center">Perfect to start</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>15 items max</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Basic tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>3 recipes/day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>This device only</span>
                  </li>
                </ul>
                <Link to="/home" className="block">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 border-primary relative animate-scale-in">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Free Account</CardTitle>
                <div className="text-4xl font-bold text-center text-foreground my-4">$0<span className="text-lg text-muted-foreground">/month</span></div>
                <CardDescription className="text-center">Everything you need</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Unlimited items</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>All features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Sync devices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Family sharing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>3 month history</span>
                  </li>
                </ul>
                <Link to="/home" className="block">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Create Account</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Pro</CardTitle>
                <div className="text-4xl font-bold text-center text-foreground my-4">$4.99<span className="text-lg text-muted-foreground">/month</span></div>
                <CardDescription className="text-center">For power users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Everything in Free +</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Receipt scanning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Meal planning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>Price tracking</span>
                  </li>
                </ul>
                <Link to="/home" className="block">
                  <Button variant="outline" className="w-full">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto">
            💡 Average family saves $1,500/year in wasted food. FreshTrack pays for itself instantly.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Stop Wasting Food and Money?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Join thousands of families who've transformed their kitchens with FreshTrack.
          </p>
          
          <Link to="/home">
            <Button size="lg" className="text-lg px-12 py-6 bg-white text-primary hover:bg-white/90 mb-8">
              Start Using FreshTrack Free
              <ArrowRight className="ml-2" />
            </Button>
          </Link>

          <div className="flex flex-wrap gap-6 justify-center text-sm mb-8">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Upgrade anytime</span>
            </div>
          </div>

          <p className="text-sm opacity-80">Available on web, iOS, and Android</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#story" className="hover:text-primary transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press Kit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Email</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 FreshTrack. Made with 💚 to help families waste less and eat better.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

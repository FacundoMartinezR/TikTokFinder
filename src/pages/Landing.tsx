"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle, Search, Star, Target, Users, Zap } from "lucide-react"


const Landing = () => {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="absolute inset-0"></div>

        <div className="relative container mx-auto px-6 py-10 lg:py-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium animate-pulse-glow">
              🚀 Early Access - Limited Time ⌛
            </Badge>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Find Perfect
              <span className="text-primary block animate-float">TikTok Creators</span>
              in Seconds
            </h1>

            {/* Subheading */}
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Stop wasting hours searching. Our AI-powered platform connects you with
              <span className="text-primary font-semibold"> micro-influencers </span>
              that match your exact niche and budget.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 animate-pulse-glow group"
                  onClick={() => (window.location.href = "https://tiktokfinder.onrender.com/auth/google")}
                >
                  Get Early Access for $19
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg font-medium rounded-xl border-2 hover:bg-black/40 shadow-xl hover:text-white transition-all duration-300 bg-transparent"
                  onClick={() => (window.location.href = "https://tiktokfinder.onrender.com/auth/google")}
                >
                  Free Trial
                </Button>
              </>
          </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>10+ early adopters</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to find and connect with the right influencers for your brand
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Search</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Filter by niche, location, engagement rate, and follower count. Find creators that perfectly match
                  your brand values.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary/20 transition-colors">
                  <Target className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Verified Profiles</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All influencer data is verified and updated weekly. Get accurate metrics and authentic engagement
                  rates.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Instant Results</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No more endless scrolling. Get a curated list of perfect matches in under 30 seconds.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                200+
              </div>
              <p className="text-muted-foreground font-medium">Verified Creators</p>
            </div>
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform">
                5+
              </div>
              <p className="text-muted-foreground font-medium">Niches Covered</p>
            </div>
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                95%
              </div>
              <p className="text-muted-foreground font-medium">Match Accuracy</p>
            </div>
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform">
                24/7
              </div>
              <p className="text-muted-foreground font-medium">Online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Loved by Marketers</h2>
            <p className="text-xl text-muted-foreground">See what our early adopters are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "Marketing Director",
                content: "This platform saved me 20+ hours per campaign. The quality of matches is incredible!",
                rating: 5,
              },
              {
                name: "Mike Rodriguez",
                role: "Brand Manager",
                content: "Finally, a tool that actually understands micro-influencer marketing. Game changer!",
                rating: 5,
              },
              {
                name: "Emma Thompson",
                role: "Social Media Manager",
                content: "The ROI on our campaigns increased by 300% since using this platform.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">Ready to Transform Your Influencer Marketing?</h2>
          <p className="text-xl lg:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Join 500+ brands already using our platform to find perfect micro-influencers. Limited early access pricing
            ends soon!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              variant="secondary"
              className="bg-background text-foreground hover:bg-background/90 px-10 py-4 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              Start Free Trial - $19/month
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>24h Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold text-primary">InfluencerFinder</div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>  )
}

export default Landing
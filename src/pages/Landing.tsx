"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle, Search, Star, Target, Users, Zap, Crown, Gift, LogIn } from "lucide-react"

const Landing = () => {
  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}

      <div className="absolute top-6 right-6 z-10">
          <Button
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold px-6 py-2 rounded-lg transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm"
            onClick={() => (window.location.href = "https://tiktokfinder.onrender.com/auth/google")}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.05),transparent_50%)]"></div>

        <div className="relative container mx-auto px-6 max-md:py-20 py-12">
          <div className="text-center max-w-5xl mx-auto">
            <Badge className="mb-2 px-6 py-2 text-sm font-semibold bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 transition-colors">
              🚀 Early Access Available - Limited Spots
            </Badge>

            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight text-slate-900">
              Find Perfect
              <span className="text-orange-500 block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                TikTok Creators
              </span>
              in Seconds
            </h1>

            <p className="text-xl lg:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto leading-relaxed">
              Stop wasting hours searching. Our AI-powered platform connects you with
              <span className="text-orange-600 font-semibold"> verified micro-influencers </span>
              that perfectly match your brand and budget.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => (window.location.href = "https://tiktokfinder.onrender.com/auth/google")}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-4 text-lg font-semibold rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all duration-300 bg-transparent"
                onClick={scrollToPricing}
              >
                See Pricing
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full border-2 border-white flex items-center justify-center"
                    >
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
                <span className="font-medium">50+ early adopters</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                ))}
                <span className="ml-2 font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-900">Why Choose Our Platform?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to find and connect with the right influencers for your brand
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                  <Search className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Smart Search</h3>
                <p className="text-slate-600 leading-relaxed">
                  Filter by niche, location, engagement rate, and follower count. Find creators that perfectly match
                  your brand values and target audience.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-200 transition-colors">
                  <Target className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Verified Profiles</h3>
                <p className="text-slate-600 leading-relaxed">
                  All influencer data is verified and updated weekly. Get accurate metrics and authentic engagement
                  rates you can trust.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-md bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                  <Zap className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Instant Results</h3>
                <p className="text-slate-600 leading-relaxed">
                  No more endless scrolling. Get a curated list of perfect matches in under 30 seconds with our AI
                  algorithm.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-900">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose the plan that works best for your influencer marketing needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900">Free</h3>
                  <div className="text-4xl font-bold text-slate-900 mb-2">$0</div>
                  <p className="text-slate-600">Perfect for getting started</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Access to 50 verified creators</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Basic search filters</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Email support</span>
                  </li>
                </ul>

                <Button
                  className="w-full py-3 text-lg font-semibold rounded-xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-300"
                  variant="outline"
                  onClick={() => (window.location.href = "https://tiktokfinder.onrender.com/auth/google")}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Early Access Plan */}
            <Card className="relative border-2 border-orange-300 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-orange-500 text-white px-4 py-1 text-sm font-semibold">Most Popular</Badge>
              </div>

              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900">Early Access</h3>
                  <div className="text-4xl font-bold text-orange-600 mb-2">$19</div>
                  <p className="text-slate-600">per month • Limited time offer</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Access to 200+ verified creators</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Advanced search & filters</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Unlimited searches</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Priority support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Export creator lists</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">Early access to new features</span>
                  </li>
                </ul>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  onClick={() => (window.location.href = "https://tiktokfinder.onrender.com/auth/google")}
                >
                  Start Early Access
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                200+
              </div>
              <p className="text-slate-600 font-medium">Verified Creators</p>
            </div>
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-slate-700 mb-2 group-hover:scale-110 transition-transform">
                15+
              </div>
              <p className="text-slate-600 font-medium">Niches Covered</p>
            </div>
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                95%
              </div>
              <p className="text-slate-600 font-medium">Match Accuracy</p>
            </div>
            <div className="group">
              <div className="text-4xl lg:text-5xl font-bold text-slate-700 mb-2 group-hover:scale-110 transition-transform">
                24/7
              </div>
              <p className="text-slate-600 font-medium">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-900">Loved by Marketers</h2>
            <p className="text-xl text-slate-600">See what our early adopters are saying</p>
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
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-6 leading-relaxed text-lg">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">Ready to Transform Your Influencer Marketing?</h2>
          <p className="text-xl lg:text-2xl mb-10 opacity-90 max-w-4xl mx-auto">
            Join 500+ brands already using our platform to find perfect micro-influencers. Limited early access pricing
            ends soon!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-slate-50 px-10 py-4 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
              onClick={() => (window.location.href = "https://tiktokfinder.onrender.com/auth/google")}
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm opacity-90">
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
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold text-orange-400">InfluencerFinder</div>
            <div className="flex gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; 2024 InfluencerFinder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default Landing

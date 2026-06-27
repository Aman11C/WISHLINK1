import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/navbar';
import { Sparkles, Search, Send, Heart, Users, Star, ArrowRight, Gift, RefreshCw, MapPin, MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6 text-sm font-medium border-primary/30 text-primary bg-primary/5">
              <Sparkles className="w-3 h-3 mr-1" />
              The Reverse Marketplace
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Post what you want.{' '}
              <span className="text-primary">Let the world help.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              WishLink flips the traditional marketplace. Post your wish — items, services, or experiences — and let the community respond with offers, gifts, exchanges, and recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-base" asChild>
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/wishes">Browse Wishes</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to get exactly what you need
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Send,
                title: 'Post Your Wish',
                description: 'Describe what you need, set your budget, add photos, and set a deadline. The community sees your wish instantly.',
              },
              {
                icon: Search,
                title: 'Receive Offers',
                description: 'Community members offer to sell, gift, exchange, or recommend alternatives. You browse and choose.',
              },
              {
                icon: Heart,
                title: 'Get Fulfilled',
                description: 'Connect via messaging, finalize the deal, and leave reviews to build trust in the community.',
              },
            ].map((step, i) => (
              <Card key={step.title} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-sm font-semibold text-primary mb-2">Step {i + 1}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Offer Types */}
      <section className="py-20 lg:py-28 bg-muted/50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Multiple Ways to Help</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Responders can fulfill wishes in many ways — not just selling
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Gift, label: 'Gift', desc: 'Give it for free' },
              { icon: Star, label: 'Sell', desc: 'Offer a price' },
              { icon: RefreshCw, label: 'Exchange', desc: 'Trade items' },
              { icon: MessageCircle, label: 'Recommend', desc: 'Suggest alternatives' },
              { icon: MapPin, label: 'Local Store', desc: 'Point to nearby shops' },
              { icon: Sparkles, label: 'Custom', desc: 'Make something unique' },
            ].map((item) => (
              <Card key={item.label} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary dark:bg-primary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Ready to make your first wish?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Join thousands of people who are getting what they need through the power of community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
              <Link href="/auth/signup">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white text-white hover:bg-white/10" asChild>
              <Link href="/wishes">Explore Wishes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-foreground">WishLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with care. The reverse marketplace for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Minus, Clock, RefreshCw, CreditCard, Users, MessageCircle, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { PLANS } from "@/lib/stripe"

export default function PricingPage() {
  const { translations: t } = useLanguage()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  
  if (!t?.pricing) {
    return null
  }

  const pricing = t.pricing as NonNullable<typeof t.pricing>

  const handleSubscribe = async (priceId: string) => {
    try {
      console.log('Subscribing with priceId:', priceId)
      console.log('Session status:', session)
      setIsLoading(priceId)
      
      if (!session) {
        console.log('No session found, redirecting to login')
        toast.error(t.auth.error.notLoggedIn)
        window.location.href = `/login?callbackUrl=${encodeURIComponent('/pricing')}`
        return
      }

      console.log('User is logged in, proceeding with subscription')
      console.log('Making API request to /api/subscription')
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
        }),
      })

      console.log('API Response:', response)
      const data = await response.json()
      console.log('API Data:', data)
      
      if (!response.ok) {
        throw new Error(data.message)
      }

      // 重定向到 Stripe Checkout
      console.log('Redirecting to:', data.url)
      window.location.href = data.url
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error(t.error.default)
    } finally {
      setIsLoading(null)
    }
  }

  const tiers = useMemo(() => {
    console.log('PLANS:', PLANS)
    console.log('Monthly Price ID:', PLANS.monthly.priceId)
    console.log('Yearly Price ID:', PLANS.yearly.priceId)
    console.log('Env Monthly ID:', process.env.STRIPE_MONTHLY_PRICE_ID)
    console.log('Env Yearly ID:', process.env.STRIPE_YEARLY_PRICE_ID)
    return [
    {
      id: "free" as const,
      price: "$0",
      features: pricing.tiers.free.features
    },
    {
      id: "yearly" as const,
      price: "$99.99",
      priceId: PLANS.yearly.priceId,
      isRecommended: true,
      features: pricing.tiers.yearly.features
    },
    {
      id: "monthly" as const,
      price: "$9.99",
      priceId: PLANS.monthly.priceId,
      features: pricing.tiers.monthly.features
    }
  ]}, [pricing])

  const renderFeatureSection = (features: string[], title: string) => (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">{pricing.features[title]}</h4>
      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className="container py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{pricing.title}</h1>
        <p className="text-xl text-muted-foreground">
          {pricing.subtitle}
        </p>
      </div>

      {/* 桌面版定价方案 */}
      <div className="hidden md:grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <Card 
            key={tier.id}
            className={cn(
              "relative p-8 rounded-lg border",
              tier.isRecommended && "border-2 border-primary shadow-lg"
            )}
          >
            {tier.isRecommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  {pricing.tiers.yearly.recommended}
                </span>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{pricing.tiers[tier.id].name}</h2>
              <p className="text-muted-foreground mb-4">{pricing.tiers[tier.id].description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.id !== "free" && (
                  <span className="text-muted-foreground">
                    /{pricing.tiers[tier.id].name}
                  </span>
                )}
                {tier.id === "yearly" && (
                  <span className="ml-2 inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/10">
                    {pricing.tiers.yearly.discount}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {renderFeatureSection(tier.features.basic, 'basic')}
              {renderFeatureSection(tier.features.advanced, 'advanced')}
              {renderFeatureSection(tier.features.support, 'support')}
            </div>

            {tier.id === "free" ? (
              <Link href="/translate" className="w-full">
                <Button className="w-full" variant="outline">
                  {pricing.tiers.free.cta}
                </Button>
              </Link>
            ) : (
              <Button 
                className="w-full"
                variant={tier.isRecommended ? "default" : "outline"}
                onClick={() => handleSubscribe(tier.priceId!)}
                disabled={isLoading === tier.priceId}
              >
                {isLoading === tier.priceId ? t.loading : pricing.tiers[tier.id].cta}
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* 移动端定价方案 */}
      <div className="space-y-6 md:hidden">
        {tiers.map((tier) => (
          <Card 
            key={tier.id}
            className={cn(
              "p-6",
              tier.isRecommended && "border-2 border-primary"
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">{pricing.tiers[tier.id].name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{pricing.tiers[tier.id].description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{tier.price}</span>
                {tier.id !== "free" && (
                  <div className="text-sm text-muted-foreground">
                    /{pricing.tiers[tier.id].name}
                  </div>
                )}
                {tier.id === "yearly" && (
                  <span className="mt-1 inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/10">
                    {pricing.tiers.yearly.discount}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-4 mb-6">
              {renderFeatureSection(tier.features.basic, 'basic')}
              {renderFeatureSection(tier.features.advanced, 'advanced')}
              {renderFeatureSection(tier.features.support, 'support')}
            </div>
            {tier.id === "free" ? (
              <Link href="/translate" className="w-full">
                <Button className="w-full" variant="outline">
                  {pricing.tiers.free.cta}
                </Button>
              </Link>
            ) : (
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleSubscribe(tier.priceId!)}
                disabled={isLoading === tier.priceId}
              >
                {isLoading === tier.priceId ? t.loading : pricing.tiers[tier.id].cta}
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* FAQ部分 */}
      <div className="mt-24 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">{pricing.faq.title}</h3>
          <p className="text-muted-foreground">
            {pricing.faq.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries({
            security: { icon: Shield },
            quota: { icon: Clock },
            payment: { icon: CreditCard },
            support: { icon: MessageCircle }
          }).map(([key, { icon: Icon }]) => (
            <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
              <h4 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                {pricing.faq.cards[key].title}
              </h4>
              <p className="text-muted-foreground">
                {pricing.faq.cards[key].content}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 
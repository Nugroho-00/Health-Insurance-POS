import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateOrder } from '@/hooks/usePayment'
import { formatCurrency, generateWixOrderId } from '@/lib/utils'
import type { InsurancePlan } from '@/types'
import { CheckCircle, CreditCard, Crown, Heart, Loader2, Lock, Shield } from 'lucide-react'
import { useState } from 'react'

const PLANS: InsurancePlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 50,
    currency: 'USD',
    description: 'Essential coverage for individuals',
    badge: 'Starter',
    features: [
      'General practitioner visits',
      'Emergency coverage',
      'Prescription drugs (generic)',
      'Annual health check',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    price: 150,
    currency: 'USD',
    description: 'Comprehensive coverage for the whole family',
    badge: 'Most Popular',
    features: [
      'Everything in Basic',
      'Specialist consultations',
      'Dental & vision coverage',
      'Mental health support',
      'Up to 4 family members',
    ],
  },
  {
    id: 'executive',
    name: 'Executive',
    price: 500,
    currency: 'USD',
    description: 'Premium coverage with concierge service',
    badge: 'Premium',
    features: [
      'Everything in Family',
      'International coverage',
      'Private hospital rooms',
      'Dedicated health advisor',
      'Same-day appointments',
      'Wellness programs',
    ],
  },
]

const PLAN_ICONS = { basic: Shield, family: Heart, executive: Crown }

type PaymentState = 'idle' | 'processing' | 'success' | 'declined'

const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19)

const formatExpiry = (v: string) =>
  v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').substring(0, 5)

export default function Storefront() {
  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan | null>(null)
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [lastOrderId, setLastOrderId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  const createOrderMutation = useCreateOrder()

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || createOrderMutation.isPending) return
    const wixOrderId = generateWixOrderId()
    setLastOrderId(wixOrderId)
    setPaymentState('processing')
    try {
      await createOrderMutation.mutateAsync({
        wixOrderId,
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        description: `${selectedPlan.name} Monthly Health Premium`,
        customerEmail: email,
      })
      setPaymentState('success')
    } catch {
      setPaymentState('declined')
    }
  }

  const handleReset = () => {
    setPaymentState('idle')
    setSelectedPlan(null)
    setName(''); setEmail(''); setCardNumber(''); setExpiry(''); setCvc('')
    createOrderMutation.reset()
  }

  return (
    <div className="min-h-screen bg-slate-950 dark">
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Heart className="size-4 text-white fill-white" />
            </div>
            <div>
              <span className="text-white font-semibold text-sm tracking-tight">HealthSafe</span>
              <span className="text-slate-500 text-xs block leading-none mt-0.5">Insurance Payments</span>
            </div>
          </div>
          <a href="/admin" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Back Office →
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-14">
        {paymentState === 'success' && (
          <div className="max-w-sm mx-auto text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-400">
            <div className="size-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="size-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Accepted</h2>
            <p className="text-slate-400 text-sm mb-1">
              Your <span className="text-white font-medium">{selectedPlan?.name}</span> plan is being activated.
            </p>
            <p className="text-xs text-slate-600 font-mono mb-8">{lastOrderId}</p>
            <p className="text-xs text-slate-500 mb-6 bg-white/5 rounded-lg p-3 border border-white/10">
              Payment queued for processing.{' '}
              <a href="/admin" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                View in Back Office →
              </a>
            </p>
            <Button onClick={handleReset} variant="outline" className="border-white/15 text-slate-300 hover:text-white">
              Buy Another Plan
            </Button>
          </div>
        )}

        {paymentState === 'declined' && (
          <div className="max-w-sm mx-auto text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-400">
            <div className="size-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="size-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Declined</h2>
            <p className="text-slate-400 text-sm mb-8">
              The gateway declined this transaction (~10% simulated failure rate).
            </p>
            <Button onClick={handleReset} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Try Again
            </Button>
          </div>
        )}

        {(paymentState === 'idle' || paymentState === 'processing') && (
          <>
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">
                Wix SPI · Double-Entry Ledger
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Choose your{' '}
                <span className="gradient-text">health plan</span>
              </h1>
              <p className="text-slate-400 text-base max-w-md mx-auto">
                Secure premium payments with HMAC-SHA256 verification and immutable financial ledger.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id as keyof typeof PLAN_ICONS]
                const isSelected = selectedPlan?.id === plan.id
                const isPopular = plan.id === 'family'

                return (
                  <button
                    key={plan.id}
                    id={`plan-${plan.id}`}
                    onClick={() => setSelectedPlan(plan)}
                    disabled={paymentState === 'processing'}
                    className={`
                      relative text-left rounded-xl border p-5 transition-all duration-200 group
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }
                    `}
                  >
                    {isPopular && (
                      <div className="absolute -top-2.5 left-4">
                        <span className="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className={`
                      size-9 rounded-lg flex items-center justify-center mb-4 transition-colors
                      ${isSelected ? 'bg-indigo-600' : 'bg-white/10 group-hover:bg-white/10'}
                    `}>
                      <Icon className={`size-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </div>

                    <div className="mb-1">
                      <span className="text-white font-semibold">{plan.name}</span>
                      {isSelected && (
                        <span className="ml-2 text-xs text-indigo-400 font-medium">✓ Selected</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{plan.description}</p>

                    <div className="mb-5">
                      <span className="text-3xl font-bold text-white">{formatCurrency(plan.price, plan.currency)}</span>
                      <span className="text-slate-500 text-sm">/mo</span>
                    </div>

                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="size-1.5 rounded-full bg-indigo-400/60 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>

            {selectedPlan && (
              <div className="max-w-md mx-auto animate-in slide-in-from-bottom-3 fade-in-0 duration-300">
                <Card className="bg-white/5 border-white/10 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <CreditCard className="size-4 text-indigo-400" />
                      Checkout — {selectedPlan.name}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {formatCurrency(selectedPlan.price, selectedPlan.currency)}/month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePay} className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-slate-300 text-xs font-medium">Full Name</Label>
                          <Input
                            id="name" placeholder="John Doe" value={name}
                            onChange={(e) => setName(e.target.value.replace(/[0-9]/g, ''))} required
                            pattern="^[a-zA-Z\s\-']+$" title="Please use only letters, spaces, hyphens, or apostrophes without numbers"
                            disabled={paymentState === 'processing'}
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-slate-300 text-xs font-medium">Email</Label>
                          <Input
                            id="email" type="email" placeholder="john@example.com" value={email}
                            onChange={(e) => setEmail(e.target.value)} required
                            pattern="[^\s@]+@[^\s@]+\.[^\s@]+" title="Please provide a valid email format"
                            disabled={paymentState === 'processing'}
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-9"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 space-y-3">
                        <p className="text-xs text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Lock className="size-3" /> Demo Card Details
                        </p>
                        <div className="space-y-1.5">
                          <Label htmlFor="card" className="text-slate-300 text-xs font-medium">Card Number</Label>
                          <Input
                            id="card" placeholder="4242 4242 4242 4242" value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} required
                            disabled={paymentState === 'processing'}
                            minLength={19} maxLength={19} title="A valid 16-digit card number is required"
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono focus-visible:ring-indigo-500 h-9"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="expiry" className="text-slate-300 text-xs font-medium">Expiry</Label>
                            <Input
                              id="expiry" placeholder="MM/YY" value={expiry}
                              onChange={(e) => setExpiry(formatExpiry(e.target.value))} required
                              disabled={paymentState === 'processing'}
                              pattern="(0[1-9]|1[0-2])\/\d{2}" title="Must be a valid Month/Year (MM/YY)"
                              minLength={5} maxLength={5}
                              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono focus-visible:ring-indigo-500 h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="cvc" className="text-slate-300 text-xs font-medium">CVC</Label>
                            <Input
                              id="cvc" placeholder="123" maxLength={3} value={cvc}
                              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))} required
                              disabled={paymentState === 'processing'}
                              minLength={3} pattern="\d{3}" title="CVV must be 3 digits long"
                              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono focus-visible:ring-indigo-500 h-9"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        id="pay-button"
                        type="submit"
                        size="xl"
                        disabled={paymentState === 'processing'}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 mt-1"
                      >
                        {paymentState === 'processing' ? (
                          <><Loader2 className="size-4 animate-spin" /> Processing...</>
                        ) : (
                          <>
                            <Lock className="size-4" />
                            Pay {formatCurrency(selectedPlan.price, selectedPlan.currency)}/month
                          </>
                        )}
                      </Button>

                      <p className="text-center text-xs text-slate-600">
                        HMAC-SHA256 secured · Wix SPI compliant
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLedgerAudit, useReconciliation, useTransactions } from '@/hooks/usePayment'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { IdempotencyStatus } from '@/types'
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Heart,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'

const StatusBadge = memo(function StatusBadge({ status }: { status: IdempotencyStatus }) {
  const variants = {
    COMPLETED: 'success',
    FAILED: 'destructive',
    PENDING: 'pending',
  } as const
  return <Badge variant={variants[status]}>{status}</Badge>
})

const LedgerAuditPanel = memo(function LedgerAuditPanel({ transactionId }: { transactionId: string }) {
  const { data, isLoading, error } = useLedgerAudit(transactionId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 px-5 text-slate-500 text-sm">
        <Loader2 className="size-3.5 animate-spin" /> Loading ledger…
      </div>
    )
  }
  if (error || !data) {
    return <div className="px-5 py-3 text-red-400 text-sm">Failed to load ledger entries</div>
  }

  return (
    <div className="px-5 py-4 bg-slate-900/60 border-t border-white/6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <BarChart3 className="size-3.5 text-indigo-400" /> Double-Entry Ledger
        </span>
        <Badge variant={data.isBalanced ? 'success' : 'destructive'} className="text-xs">
          Balance: {data.isBalanced ? '0.0000 ✓' : data.balance}
        </Badge>
      </div>
      <div className="rounded-lg border border-white/8 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/4">
              <th className="px-3 py-2 text-left text-slate-500 font-medium">Account</th>
              <th className="px-3 py-2 text-right text-slate-500 font-medium">Amount</th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">Type</th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.ledgerEntries.map((entry) => {
              const isCredit = parseFloat(entry.amount) > 0
              return (
                <tr key={entry.id} className="border-t border-white/5">
                  <td className="px-3 py-2 font-mono text-slate-300">{entry.accountType}</td>
                  <td className={`px-3 py-2 text-right font-mono font-semibold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCredit ? '+' : ''}{formatCurrency(entry.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-semibold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCredit ? 'CREDIT' : 'DEBIT'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(entry.createdAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {data.isBalanced && (
        <p className="text-xs text-emerald-500/70 mt-2.5 flex items-center gap-1.5">
          <CheckCircle2 className="size-3" /> CREDIT + DEBIT = 0.0000 — invariant verified
        </p>
      )}
    </div>
  )
})

export default function BackOffice() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const { data: transactions, isLoading, refetch, isFetching } = useTransactions()
  const { data: reconciliation, refetch: fetchReconciliation, isFetching: reconciling } = useReconciliation()

  const completed = transactions?.filter((t) => t.status === 'COMPLETED').length ?? 0
  const failed = transactions?.filter((t) => t.status === 'FAILED').length ?? 0
  const pending = transactions?.filter((t) => t.status === 'PENDING').length ?? 0
  const totalRevenue = transactions
    ?.filter((t) => t.status === 'COMPLETED' && t.amount)
    .reduce((sum, t) => sum + parseFloat(t.amount!), 0) ?? 0

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/8 bg-slate-950/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Heart className="size-4 text-white fill-white" />
            </div>
            <div>
              <span className="text-white font-semibold text-sm tracking-tight">HealthSafe Back Office</span>
              <span className="text-slate-500 text-xs block leading-none mt-0.5">Payment Audit & Reconciliation</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-xs text-slate-500">Live · 5s</span>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="border-white/12 text-slate-400 hover:text-white h-8 text-xs">
                <ArrowLeft className="size-3" /> Storefront
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: `${completed} completed`, color: 'text-white' },
            { label: 'Successful', value: String(completed), sub: 'transactions', color: 'text-emerald-400' },
            { label: 'Failed', value: String(failed), sub: '~10% gateway rate', color: 'text-red-400' },
            { label: 'Pending', value: String(pending), sub: 'in queue', color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/4 border border-white/8 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        <Card className="bg-white/4 border-white/8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Activity className="size-4 text-indigo-400" /> Transaction Monitor
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs mt-0.5">
                  Click a row to view double-entry ledger entries
                </CardDescription>
              </div>
              <Button
                id="refresh-btn"
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="text-slate-400 hover:text-white h-8 text-xs"
              >
                <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center gap-2 py-10 justify-center text-slate-500 text-sm">
                <Loader2 className="size-4 animate-spin" /> Loading transactions…
              </div>
            ) : !transactions?.length ? (
              <div className="text-center py-12 text-slate-600">
                <Activity className="size-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="text-xs mt-1">
                  Go to the{' '}
                  <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">Storefront</Link>
                  {' '}to make a payment
                </p>
              </div>
            ) : (
              <div className="border-t border-white/6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6">
                      <th className="px-5 py-3 text-left text-xs text-slate-600 font-medium w-8"></th>
                      <th className="px-5 py-3 text-left text-xs text-slate-600 font-medium">Order ID</th>
                      <th className="px-5 py-3 text-left text-xs text-slate-600 font-medium">Email</th>
                      <th className="px-5 py-3 text-right text-xs text-slate-600 font-medium">Amount</th>
                      <th className="px-5 py-3 text-left text-xs text-slate-600 font-medium">Status</th>
                      <th className="px-5 py-3 text-left text-xs text-slate-600 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <>
                        <tr
                          key={tx.id}
                          id={`tx-row-${tx.id}`}
                          onClick={() => setExpandedRow(expandedRow === tx.id ? null : tx.id)}
                          className="border-b border-white/4 hover:bg-white/4 cursor-pointer transition-colors duration-100"
                        >
                          <td className="px-5 py-3 text-slate-600">
                            {expandedRow === tx.id
                              ? <ChevronDown className="size-3.5" />
                              : <ChevronRight className="size-3.5" />}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-400 max-w-[160px] truncate">
                            {tx.wixOrderId}
                          </td>
                          <td className="px-5 py-3 text-slate-300 text-xs">{tx.customerEmail ?? '—'}</td>
                          <td className="px-5 py-3 text-right font-semibold text-white text-sm">
                            {tx.amount ? formatCurrency(tx.amount, tx.currency ?? 'USD') : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={tx.status} />
                          </td>
                          <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(tx.createdAt)}</td>
                        </tr>
                        {expandedRow === tx.id && tx.status === 'COMPLETED' && (
                          <tr key={`${tx.id}-ledger`}>
                            <td colSpan={6} className="p-0">
                              <LedgerAuditPanel transactionId={tx.id} />
                            </td>
                          </tr>
                        )}
                        {expandedRow === tx.id && tx.status !== 'COMPLETED' && (
                          <tr key={`${tx.id}-empty`}>
                            <td colSpan={6} className="px-5 py-3 bg-slate-900/40 border-t border-white/5">
                              <p className="text-xs text-slate-600 italic">
                                No ledger entries — transaction is {tx.status.toLowerCase()}.
                              </p>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/4 border-white/8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <BarChart3 className="size-4 text-indigo-400" /> Gateway Reconciliation
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs mt-0.5">
                  Compare ledger records against the mock gateway report
                </CardDescription>
              </div>
              <Button
                id="reconcile-btn"
                size="sm"
                onClick={() => fetchReconciliation()}
                disabled={reconciling}
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs"
              >
                {reconciling
                  ? <><Loader2 className="size-3.5 animate-spin" /> Fetching…</>
                  : <><RefreshCw className="size-3.5" /> Fetch Report</>}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!reconciliation ? (
              <div className="text-center py-10 text-slate-600">
                <BarChart3 className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click "Fetch Report" to run reconciliation</p>
              </div>
            ) : reconciliation.length === 0 ? (
              <p className="text-center py-8 text-slate-600 text-sm">No completed transactions to reconcile.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <Badge variant="success" className="text-xs">
                    ✓ {reconciliation.filter((r) => r.status === 'MATCH').length} Matched
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    ⚠ {reconciliation.filter((r) => r.status === 'DISCREPANCY').length} Discrepancies
                  </Badge>
                </div>
                <div className="rounded-lg border border-white/8 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/4 border-b border-white/6">
                        <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-medium">Order ID</th>
                        <th className="px-4 py-2.5 text-right text-xs text-slate-500 font-medium">Ledger</th>
                        <th className="px-4 py-2.5 text-right text-xs text-slate-500 font-medium">Gateway</th>
                        <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-medium">Status</th>
                        <th className="px-4 py-2.5 text-left text-xs text-slate-500 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliation.map((item) => (
                        <tr
                          key={item.orderId}
                          className={`border-t border-white/5 ${item.status === 'DISCREPANCY' ? 'bg-red-950/25' : ''}`}
                        >
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-400 max-w-[160px] truncate">
                            {item.orderId}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold text-emerald-400">
                            {formatCurrency(item.ledgerAmount)}
                          </td>
                          <td className={`px-4 py-2.5 text-right text-xs font-semibold ${item.status === 'DISCREPANCY' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formatCurrency(item.gatewayAmount)}
                          </td>
                          <td className="px-4 py-2.5">
                            {item.status === 'DISCREPANCY' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
                                <AlertTriangle className="size-3" /> DISCREPANCY
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-400 font-semibold">✓ MATCH</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{item.discrepancyReason ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

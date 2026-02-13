import { useEffect, useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { transactionService } from '../../services/transactionService'
import { budgetService } from '../../services/budgetService'
import { savingsService } from '../../services/savingsService'
import { userSettingsService } from '../../services/userSettingsService'
import { formatCurrency } from '../../utils/formatCurrency'

const CHART_COLORS = ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#65a30d', '#be185d']

export const Analytics = () => {
  const { user } = useAuth()
  const [currency, setCurrency] = useState('USD')
  const [txList, setTxList] = useState<Awaited<ReturnType<typeof transactionService.list>>>([])
  const [budgets, setBudgets] = useState<Awaited<ReturnType<typeof budgetService.list>>>([])
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof savingsService.list>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        setLoading(true)
        const [settings, txs, buds, sav] = await Promise.all([
          userSettingsService.getForUser(user.id),
          transactionService.list(user.id),
          budgetService.list(user.id),
          savingsService.list(user.id),
        ])
        if (settings?.currency) setCurrency(settings.currency)
        setTxList(txs)
        setBudgets(buds)
        setGoals(sav)
      } catch (err) {
        console.error('Failed to load analytics data:', err)
      } finally { setLoading(false) }
    }
    void load()
  }, [user])

  const spendingByCategory = useMemo(() => {
    const expenseTx = txList.filter((t) => t.type === 'expense')
    const byCat: Record<string, number> = {}
    expenseTx.forEach((t) => {
      const name = t.category?.name ?? 'Uncategorized'
      byCat[name] = (byCat[name] ?? 0) + t.amount
    })
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [txList])

  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: { month: string; income: number; expenses: number; balance: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString().slice(0, 10)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const inMonth = txList.filter((t) => t.date >= start && t.date <= end)
      const income = inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      months.push({ month: label, income, expenses, balance: income - expenses })
    }
    return months
  }, [txList])

  const incomeByCategory = useMemo(() => {
    const incomeTx = txList.filter((t) => t.type === 'income')
    const byCat: Record<string, number> = {}
    incomeTx.forEach((t) => {
      const name = t.category?.name ?? 'Uncategorized'
      byCat[name] = (byCat[name] ?? 0) + t.amount
    })
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [txList])

  const savingsProgress = useMemo(
    () =>
      goals.map((g) => ({
        name: g.name.length > 12 ? g.name.slice(0, 12) + '…' : g.name,
        current: g.current_amount,
        target: g.target_amount,
        pct: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
      })),
    [goals],
  )

  const totalIncome = useMemo(
    () => txList.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [txList],
  )
  const totalExpenses = useMemo(
    () => txList.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [txList],
  )
  const totalBudget = useMemo(
    () => (budgets as { amount: number }[]).reduce((s, b) => s + Number(b.amount), 0),
    [budgets],
  )

  const tooltipStyle = useMemo(
    () => ({ background: 'var(--card-bg)', border: '1px solid var(--border)' }),
    [],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-semibold text-[var(--text)]">Analytics</h1>
          <p className="text-sm text-[var(--text-muted)]">Charts and insights from your data.</p>
        </header>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[var(--text)]">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)]">Spending, income, and savings over time.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Total income</p>
          <p className="mt-1 text-xl font-semibold text-income">{formatCurrency(totalIncome, currency)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Total expenses</p>
          <p className="mt-1 text-xl font-semibold text-expense">{formatCurrency(totalExpenses, currency)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Net (all time)</p>
          <p className={`mt-1 text-xl font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(totalIncome - totalExpenses, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Total budget</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatCurrency(totalBudget, currency)}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Income vs expenses (last 12 months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                  tickFormatter={(v) => `${v}`} 
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v ?? 0), currency)} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text)' }} />
                <Bar dataKey="income" fill="#059669" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#92400e" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Monthly balance trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v ?? 0), currency)} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text)' }} />
                <Line type="monotone" dataKey="balance" stroke="#2563eb" name="Balance" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Spending by category</h2>
          <div className="h-72">
            {spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${formatCurrency(value, currency)}`}
                  >
                    {spendingByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v ?? 0), currency)} contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No expense data</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Top expense categories (bar)</h2>
          <div className="h-72">
            {spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingByCategory} layout="vertical" margin={{ top: 4, right: 24, left: 60, bottom: 4 }}>
                  <XAxis 
                    type="number" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                    tickFormatter={(v) => formatCurrency(v, currency)} 
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v ?? 0), currency)} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No expense data</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Income by category</h2>
          <div className="h-64">
            {incomeByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${formatCurrency(value, currency)}`}
                  >
                    {incomeByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v ?? 0), currency)} contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No income data</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Savings goals progress</h2>
          <div className="h-64">
            {savingsProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsProgress} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }} 
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                    tickFormatter={(v) => `${v}%`} 
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v: any, _name: any, item: any) => item.payload ? [formatCurrency(item.payload.current, currency) + ' / ' + formatCurrency(item.payload.target, currency), 'Progress'] : [String(v ?? 0) + '%', 'Progress']} contentStyle={tooltipStyle} />
                  <Bar dataKey="pct" fill="#059669" name="Progress %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No savings goals</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Plus,
  PiggyBank,
  Settings,
  Wallet,
} from "lucide-react";
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
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { transactionService } from "../../services/transactionService";
import { userSettingsService } from "../../services/userSettingsService";
import { formatCurrency } from "../../utils/formatCurrency";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

const CHART_COLORS = [
  "#2563eb",
  "#059669",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#c4ab1fcc",
  "#be185d",
];

export const Dashboard = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState("USD");
  const [grossIncome, setGrossIncome] = useState<number | null>(null);
  const [txList, setTxList] = useState<
    Awaited<ReturnType<typeof transactionService.list>>
  >([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [settings, list] = await Promise.all([
          userSettingsService.getForUser(user.id),
          transactionService.list(user.id),
        ]);
        if (settings?.currency) setCurrency(settings.currency);
        if (settings?.gross_income != null)
          setGrossIncome(settings.gross_income);
        setTxList(list);
      } catch (_) {}
    };
    void load();
  }, [user]);

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const thisMonthTx = useMemo(
    () => txList.filter((t) => t.date >= monthStart && t.date <= monthEnd),
    [txList, monthStart, monthEnd],
  );
  const totalExpenses = useMemo(
    () =>
      thisMonthTx
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [thisMonthTx],
  );
  const totalIncomeTx = useMemo(
    () =>
      thisMonthTx
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [thisMonthTx],
  );

  const spendingByCategory = useMemo(() => {
    const expenseTx = thisMonthTx.filter((t) => t.type === "expense");
    const byCat: Record<string, number> = {};
    expenseTx.forEach((t) => {
      const name = t.category?.name ?? "Uncategorized";
      byCat[name] = (byCat[name] ?? 0) + t.amount;
    });
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonthTx]);

  const monthlyOverview = useMemo(() => {
    const now = new Date();
    const months: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString().slice(0, 10);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const inMonth = txList.filter((t) => t.date >= start && t.date <= end);
      const income = inMonth
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expenses = inMonth
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      months.push({ month: label, income, expenses });
    }
    return months;
  }, [txList]);

  const gross = grossIncome ?? 0;
  const { totalBalance, savingsRate } = useMemo(() => {
    const bal = gross + totalIncomeTx - totalExpenses;
    const rate = gross > 0 ? Math.round(((gross - totalExpenses) / gross) * 100) : 0;
    return { totalBalance: bal, savingsRate: rate };
  }, [gross, totalIncomeTx, totalExpenses]);

  const recentTx = useMemo(
    () => txList.slice(0, 5),
    [txList],
  );
  const daysLeftInMonth = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Overview</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Your income, expenses, and savings. Set gross income in Settings.
            Amounts in {currency}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)] shadow-sm transition-all active:scale-[0.98]"
          >
            Set gross income
          </Link>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-primary-hover shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add transaction
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 ring-1 ring-[var(--balance)]/20">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Total balance
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--balance)]">
            {formatCurrency(totalBalance, currency)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">This month</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Income (gross)
            </p>
            <ArrowUpRight className="h-4 w-4 text-income" />
          </div>
          <p className="mt-1 text-2xl font-semibold text-income">
            {formatCurrency(gross, currency)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Set in Settings
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Expenses
            </p>
            <ArrowDownRight className="h-4 w-4 text-expense" />
          </div>
          <p className="mt-1 text-2xl font-semibold text-expense">
            {formatCurrency(totalExpenses, currency)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">This month</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Savings rate
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--savings-rate)]">
            {savingsRate}%
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            of gross income
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
            Spending by category
          </h2>
          <div className="h-80 pt-6 pb-2">
            {spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) =>
                      `${name}: ${formatCurrency(value, currency)}`
                    }
                  >
                    {spendingByCategory.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number | undefined) =>
                      formatCurrency(v ?? 0, currency)
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
                No expense data this month
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
            Monthly overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyOverview}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                barGap={8}
              >
                <XAxis
                  dataKey="month"
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickFormatter={(v) => `${currency === "USD" ? "$" : ""}${v}`}
                />
                <Tooltip
                  formatter={(v: number | undefined) =>
                    formatCurrency(v ?? 0, currency)
                  }
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                  }}
                  labelStyle={{ color: "var(--text)" }}
                />
                <Bar
                  dataKey="income"
                  fill="#10b981"
                  name="Income"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Bar
                  dataKey="expenses"
                  fill="#ef4444"
                  name="Expenses"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Recent transactions
            </h2>
            <Link
              to="/transactions"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-2">
              No transactions yet. Add one to get started.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentTx.map((t) => (
                <li
                  key={t.id}
                  className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0"
                >
                  <span className="text-[var(--text)] truncate mr-2">
                    {t.description || t.category?.name || "—"}
                  </span>
                  <span
                    className={`shrink-0 font-medium ${
                      t.type === "expense" ? "text-expense" : "text-income"
                    }`}
                  >
                    {t.type === "expense" ? "−" : "+"}
                    {formatCurrency(t.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
            Quick links
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/transactions"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <ClipboardList className="h-4 w-4 shrink-0" />
              Transactions
            </Link>
            <Link
              to="/budgets"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <Wallet className="h-4 w-4 shrink-0" />
              Budgets
            </Link>
            <Link
              to="/savings-goals"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <PiggyBank className="h-4 w-4 shrink-0" />
              Savings
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              Settings
            </Link>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {daysLeftInMonth} days left in the month. Set gross income in
            Settings to see accurate balance.
          </p>
        </div>
      </section>


    </div>
  );
};

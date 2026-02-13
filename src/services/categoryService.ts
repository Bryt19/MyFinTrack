import { supabase } from './supabase'

export type TransactionType = 'income' | 'expense'

export type Category = {
  id: string
  user_id: string
  name: string
  type: TransactionType
  budget_limit: number | null
  color: string
}

// Unique categories: one entry per (name, type). No duplicates.
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id'>[] = [
  // Income
  { name: 'Salary / Wages', type: 'income', budget_limit: null, color: '#059669' },
  { name: 'Business / Freelance', type: 'income', budget_limit: null, color: '#10b981' },
  { name: 'Investments', type: 'income', budget_limit: null, color: '#0d9488' },
  { name: 'Gifts / Support', type: 'income', budget_limit: null, color: '#34d399' },
  { name: 'Other Income', type: 'income', budget_limit: null, color: '#bbf7d0' },
  // Expense
  { name: 'Housing / Rent', type: 'expense', budget_limit: null, color: '#a855f7' },
  { name: 'Food / Groceries', type: 'expense', budget_limit: null, color: '#f59e0b' },
  { name: 'Transportation', type: 'expense', budget_limit: null, color: '#3b82f6' },
  { name: 'Bills & Subscriptions', type: 'expense', budget_limit: null, color: '#8b5cf6' },
  { name: 'Health & Personal Care', type: 'expense', budget_limit: null, color: '#06b6d4' },
  { name: 'Other Expenses', type: 'expense', budget_limit: null, color: '#64748b' },
]

const categoryCache = new Map<string, Category[]>()

export const categoryService = {
  async list(userId: string): Promise<Category[]> {
    if (categoryCache.has(userId)) return categoryCache.get(userId)!

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('type')
      .order('name')
    if (error) throw error
    const rows = (data ?? []) as Category[]
    
    // Deduplicate by (name, type)
    const seen = new Map<string, Category>()
    rows.forEach(c => {
      const key = `${c.type}:${c.name.toLowerCase().trim()}`
      if (!seen.has(key)) seen.set(key, c)
    })
    const uniqueRows = Array.from(seen.values())

    const getTop5 = (type: TransactionType) => {
      const typeSpecific = uniqueRows.filter(c => c.type === type)
      const defaultsNames = DEFAULT_CATEGORIES.filter(d => d.type === type).map(d => d.name.toLowerCase().trim())
      
      // Separate into "requested defaults" and "others"
      const requested = typeSpecific.filter(c => defaultsNames.includes(c.name.toLowerCase().trim()))
      const others = typeSpecific.filter(c => !defaultsNames.includes(c.name.toLowerCase().trim()))
      
      // Sort requested to match the order in DEFAULT_CATEGORIES
      requested.sort((a, b) => {
        const idxA = defaultsNames.indexOf(a.name.toLowerCase().trim())
        const idxB = defaultsNames.indexOf(b.name.toLowerCase().trim())
        return idxA - idxB
      })

      return [...requested, ...others].slice(0, Math.max(5, defaultsNames.length))
    }

    const income = getTop5('income')
    const expense = getTop5('expense')
    
    const result = [...income, ...expense]
    categoryCache.set(userId, result)
    return result
  },

  async ensureDefaults(userId: string): Promise<Category[]> {
    const existing = await this.list(userId)
    
    // Find defaults that are missing in the database
    const toInsert = DEFAULT_CATEGORIES.filter(def => 
      !existing.find(ex => ex.name.toLowerCase().trim() === def.name.toLowerCase().trim() && ex.type === def.type)
    ).map((c) => ({
      user_id: userId,
      name: c.name,
      type: c.type,
      budget_limit: c.budget_limit,
      color: c.color,
    }))

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('categories')
        .insert(toInsert)
        .select()
      if (error) throw error
      categoryCache.delete(userId)
      // Re-fetch to get complete list with new IDs
      return this.list(userId)
    }
    
    return existing
  },

  async getUncategorizedId(userId: string): Promise<string> {
    const categories = await this.ensureDefaults(userId)
    // Fallback to first expense if "Housing / Rent" is the new primary expense category
    const mainExpense = categories.find((c) => c.name.includes('Housing') && c.type === 'expense')
    return mainExpense?.id ?? categories.find(c => c.type === 'expense')?.id ?? categories[0]?.id ?? ''
  },
}

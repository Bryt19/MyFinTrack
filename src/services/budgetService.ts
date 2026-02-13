import { supabase } from './supabase'

export type Budget = {
  id: string
  user_id: string
  category_id: string
  amount: number
  period: string
  start_date: string
  end_date: string
  description: string | null
}

export const budgetService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(id, name)')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as (Budget & { categories: { id: string; name: string } | null })[]
  },

  async create(input: {
    userId: string
    categoryId: string
    amount: number
    period: string
    startDate: string
    endDate: string
    description?: string
  }) {
    const { data, error } = await supabase
      .from('budgets')
      .insert([{
        user_id: input.userId,
        category_id: input.categoryId,
        amount: input.amount,
        period: input.period,
        start_date: input.startDate,
        end_date: input.endDate,
        description: input.description || null,
      }])
      .select()
      .single()
    if (error) throw error
    return data as Budget
  },

  async update(id: string, input: { categoryId?: string; amount?: number; startDate?: string; endDate?: string; description?: string | null }) {
    const body: Record<string, unknown> = {}
    if (input.categoryId != null) body.category_id = input.categoryId
    if (input.amount != null) body.amount = input.amount
    if (input.startDate != null) body.start_date = input.startDate
    if (input.endDate != null) body.end_date = input.endDate
    if (input.description !== undefined) body.description = input.description
    const { data, error } = await supabase.from('budgets').update(body).eq('id', id).select().single()
    if (error) throw error
    return data as Budget
  },

  async delete(id: string) {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
  },
}

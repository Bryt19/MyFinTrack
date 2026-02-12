import { supabase } from './supabase'

export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category_id: string
  date: string
  description: string | null
  receipt_url: string | null
  created_at?: string
  updated_at?: string
}

export type Category = {
  id: string
  name: string
  type: TransactionType
}

export const transactionService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(
        'id, user_id, amount, type, date, description, receipt_url, categories(id, name, type)',
      )
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    return (
      data?.map((row: any) => ({
        id: row.id as string,
        user_id: row.user_id as string,
        amount: Number(row.amount),
        type: row.type as TransactionType,
        date: row.date as string,
        description: (row.description ?? null) as string | null,
        receipt_url: (row.receipt_url ?? null) as string | null,
        category: row.categories as Category | null,
      })) ?? []
    )
  },

  async create(input: {
    userId: string
    amount: number
    type: TransactionType
    categoryId: string
    date: string
    description?: string
    receiptUrl?: string | null
  }) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: input.userId,
          amount: input.amount,
          type: input.type,
          category_id: input.categoryId,
          date: input.date,
          description: input.description ?? null,
          receipt_url: input.receiptUrl ?? null,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as Transaction
  },

  async update(id: string, input: {
    amount?: number
    type?: TransactionType
    categoryId?: string
    date?: string
    description?: string | null
    receiptUrl?: string | null
  }) {
    const body: Record<string, unknown> = {}
    if (input.amount != null) body.amount = input.amount
    if (input.type != null) body.type = input.type
    if (input.categoryId != null) body.category_id = input.categoryId
    if (input.date != null) body.date = input.date
    if (input.description !== undefined) body.description = input.description
    if (input.receiptUrl !== undefined) body.receipt_url = input.receiptUrl
    const { data, error } = await supabase
      .from('transactions')
      .update(body)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Transaction
  },

  async delete(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
  },

  async uploadReceipt(file: File, userId: string) {
    const ext = file.name.split('.').pop() ?? 'dat'
    const safeExt = ext.toLowerCase()
    const allowed = ['png', 'jpg', 'jpeg', 'pdf']
    if (!allowed.includes(safeExt)) {
      throw new Error('Only PNG, JPG, and PDF receipts are allowed.')
    }

    const path = `${userId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, file)

    if (uploadError) {
      // Provide user-friendly error message for missing bucket
      if (uploadError.message?.includes('Bucket not found')) {
        throw new Error(
          'Receipt storage is not configured. Please contact support or set up the storage bucket in Supabase.'
        )
      }
      throw uploadError
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('receipts').getPublicUrl(path)

    return { publicUrl, path }
  },
}


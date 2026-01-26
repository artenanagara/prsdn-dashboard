// Database Types for Supabase
// This file contains TypeScript types for the database schema
// You can auto-generate this file using: npx supabase gen types typescript --local

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            members: {
                Row: {
                    id: string
                    full_name: string
                    birth_place: string
                    birth_date: string
                    rt: '01' | '02' | '03' | '04'
                    phone: string
                    instagram: string | null
                    job: string | null
                    education_status: 'school' | 'not_school'
                    education_level: 'SD' | 'SMP' | 'SMA/SMK' | 'College' | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    birth_place: string
                    birth_date: string
                    rt: '01' | '02' | '03' | '04'
                    phone: string
                    instagram?: string | null
                    job?: string | null
                    education_status: 'school' | 'not_school'
                    education_level?: 'SD' | 'SMP' | 'SMA/SMK' | 'College' | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    birth_place?: string
                    birth_date?: string
                    rt?: '01' | '02' | '03' | '04'
                    phone?: string
                    instagram?: string | null
                    job?: string | null
                    education_status?: 'school' | 'not_school'
                    education_level?: 'SD' | 'SMP' | 'SMA/SMK' | 'College' | null
                    created_at?: string
                    updated_at?: string
                }
            }
            account_applications: {
                Row: {
                    id: string
                    full_name: string
                    birth_place: string
                    birth_date: string
                    rt: '01' | '02' | '03' | '04'
                    phone: string
                    instagram: string | null
                    job: string | null
                    education_status: 'school' | 'not_school'
                    education_level: 'SD' | 'SMP' | 'SMA/SMK' | 'College' | null
                    username: string
                    password: string
                    status: 'pending' | 'approved' | 'rejected'
                    submitted_at: string
                    reviewed_at: string | null
                    reviewed_by_admin_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    birth_place: string
                    birth_date: string
                    rt: '01' | '02' | '03' | '04'
                    phone: string
                    instagram?: string | null
                    job?: string | null
                    education_status: 'school' | 'not_school'
                    education_level?: 'SD' | 'SMP' | 'SMA/SMK' | 'College' | null
                    username: string
                    password: string
                    status?: 'pending' | 'approved' | 'rejected'
                    submitted_at?: string
                    reviewed_at?: string | null
                    reviewed_by_admin_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    birth_place?: string
                    birth_date?: string
                    rt?: '01' | '02' | '03' | '04'
                    phone?: string
                    instagram?: string | null
                    job?: string | null
                    education_status?: 'school' | 'not_school'
                    education_level?: 'SD' | 'SMP' | 'SMA/SMK' | 'College' | null
                    username?: string
                    password?: string
                    status?: 'pending' | 'approved' | 'rejected'
                    submitted_at?: string
                    reviewed_at?: string | null
                    reviewed_by_admin_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            user_accounts: {
                Row: {
                    id: string
                    member_id: string | null
                    username: string
                    password: string
                    role: 'admin' | 'user'
                    status: 'active' | 'inactive'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    member_id?: string | null
                    username: string
                    password: string
                    role: 'admin' | 'user'
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    member_id?: string | null
                    username?: string
                    password?: string
                    role?: 'admin' | 'user'
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
            }
            attendance_records: {
                Row: {
                    id: string
                    date: string
                    month_key: string
                    attendee_member_ids: string[]
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    date: string
                    month_key: string
                    attendee_member_ids?: string[]
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    date?: string
                    month_key?: string
                    attendee_member_ids?: string[]
                    created_at?: string
                    updated_at?: string
                }
            }
            finance_transactions: {
                Row: {
                    id: string
                    type: 'income' | 'expense'
                    category: string
                    title: string
                    amount: number
                    date: string
                    note: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    type: 'income' | 'expense'
                    category: string
                    title: string
                    amount: number
                    date: string
                    note?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    type?: 'income' | 'expense'
                    category?: string
                    title?: string
                    amount?: number
                    date?: string
                    note?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            kas_payments: {
                Row: {
                    id: string
                    month_key: string
                    year: number
                    member_id: string
                    amount: number
                    paid_at: string | null
                    status: 'paid' | 'unpaid'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    month_key: string
                    year: number
                    member_id: string
                    amount: number
                    paid_at?: string | null
                    status?: 'paid' | 'unpaid'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    month_key?: string
                    year?: number
                    member_id?: string
                    amount?: number
                    paid_at?: string | null
                    status?: 'paid' | 'unpaid'
                    created_at?: string
                    updated_at?: string
                }
            }
            events: {
                Row: {
                    id: string
                    title: string
                    date: string
                    type: 'event' | 'program' | 'birthday'
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    date: string
                    type: 'event' | 'program' | 'birthday'
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    date?: string
                    type?: 'event' | 'program' | 'birthday'
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            attendance_events: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    date: string
                    start_time: string | null
                    end_time: string | null
                    is_active: boolean
                    token: string
                    token_expires_at: number
                    created_by_admin_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    date: string
                    start_time?: string | null
                    end_time?: string | null
                    is_active?: boolean
                    token: string
                    token_expires_at: number
                    created_by_admin_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    date?: string
                    start_time?: string | null
                    end_time?: string | null
                    is_active?: boolean
                    token?: string
                    token_expires_at?: number
                    created_by_admin_id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            attendance_checkins: {
                Row: {
                    id: string
                    event_id: string
                    member_id: string
                    checked_in_at: number
                    token_used: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    member_id: string
                    checked_in_at: number
                    token_used: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    member_id?: string
                    checked_in_at?: number
                    token_used?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_user_role: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            get_user_member_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            generate_token: {
                Args: {
                    length: number
                }
                Returns: string
            }
            get_member_stats_by_rt: {
                Args: Record<PropertyKey, never>
                Returns: {
                    rt: string
                    member_count: number
                }[]
            }
            get_finance_summary_by_month: {
                Args: {
                    target_month: string
                }
                Returns: {
                    total_income: number
                    total_expense: number
                    balance: number
                }[]
            }
            get_kas_summary_by_month: {
                Args: {
                    target_month_key: string
                }
                Returns: {
                    total_members: number
                    paid_count: number
                    unpaid_count: number
                    total_collected: number
                }[]
            }
            initialize_kas_payments_for_month: {
                Args: {
                    target_month_key: string
                    default_amount?: number
                }
                Returns: number
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Shield, Calendar, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('participant')

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_roles').select('role').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
      ])

      if (profileRes.data) {
        setFullName(profileRes.data.full_name || '')
      }
      if (roleRes.data) {
        setRole(roleRes.data.role)
      }
      setLoading(false)
    }

    loadProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Profile updated successfully')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse mb-6" />
        <div className="glass-card p-8 space-y-4">
          <div className="h-10 bg-slate-800 rounded animate-pulse" />
          <div className="h-10 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal account details, credentials, and competition role.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-4 pb-6 border-b border-neutral-800 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-glow-sm">
            {(fullName || user?.email || 'U')[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{fullName || 'Competitor'}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${role === 'admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                {role}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="form-input max-w-md"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Primary Email (Registered)
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="form-input max-w-md bg-neutral-900/60 text-slate-400 cursor-not-allowed border-neutral-800"
            />
            <p className="text-xs text-slate-500 mt-1">
              Primary email is managed through your authentication provider.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              User ID (UUID)
            </label>
            <code className="text-xs font-mono text-slate-400 bg-neutral-900/80 px-3 py-2 rounded-lg border border-neutral-800 block max-w-md select-all">
              {user?.id}
            </code>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm px-6 py-2.5"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

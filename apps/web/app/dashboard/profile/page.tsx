'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ firstName: '', lastName: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName, lastName: user.lastName })
  }, [user])

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg('')
    try {
      await api.put('/api/v1/profile', profile)
      setProfileMsg('Profile updated successfully')
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    try {
      await api.put('/api/v1/profile/password', pwForm)
      setPwMsg('Password updated successfully')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err: unknown) {
      setPwMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="min-h-screen bg-bg">
      {/* Profile hero */}
      <div className="bg-gradient-to-b from-[#0d3d2c] to-bg px-4 pt-8 pb-10 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-primary">{initials}</span>
        </div>
        <h1 className="text-lg font-bold text-white">{user?.firstName} {user?.lastName}</h1>
        <p className="text-white/40 text-sm mt-0.5">{user?.email}</p>
        {user?.role !== 'USER' && (
          <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-secondary/20 text-secondary">
            {user?.role}
          </span>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-6">
        {/* Account details */}
        <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="font-semibold text-sm text-surface">Account Details</h2>
          </div>
          <div className="p-4">
            {profileMsg && (
              <div className={`text-sm mb-4 p-3 rounded-xl flex items-center gap-2 ${
                profileMsg.includes('success') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
              }`}>
                <span>{profileMsg.includes('success') ? '✓' : '!'}</span>
                {profileMsg}
              </div>
            )}
            <form onSubmit={handleProfile} className="space-y-3">
              {(['firstName', 'lastName'] as const).map(k => (
                <div key={k}>
                  <label className="block text-xs font-medium text-surface/50 mb-1.5 uppercase tracking-wide">
                    {k === 'firstName' ? 'First Name' : 'Last Name'}
                  </label>
                  <input
                    value={profile[k]}
                    onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))}
                    className="w-full bg-sidebar border border-white/10 rounded-xl px-4 py-3 text-surface focus:outline-none focus:border-primary text-sm"
                    required
                  />
                </div>
              ))}
              <button type="submit"
                className="w-full bg-primary text-bg font-semibold py-3 rounded-xl mt-1 active:scale-95 transition-transform text-sm">
                Save Changes
              </button>
            </form>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="font-semibold text-sm text-surface">Change Password</h2>
          </div>
          <div className="p-4">
            {pwMsg && (
              <div className={`text-sm mb-4 p-3 rounded-xl flex items-center gap-2 ${
                pwMsg.includes('success') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
              }`}>
                <span>{pwMsg.includes('success') ? '✓' : '!'}</span>
                {pwMsg}
              </div>
            )}
            <form onSubmit={handlePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface/50 mb-1.5 uppercase tracking-wide">Current Password</label>
                <PasswordInput
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full bg-sidebar border border-white/10 rounded-xl px-4 py-3 text-surface focus:outline-none focus:border-primary text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface/50 mb-1.5 uppercase tracking-wide">New Password</label>
                <PasswordInput
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full bg-sidebar border border-white/10 rounded-xl px-4 py-3 text-surface focus:outline-none focus:border-primary text-sm"
                  required minLength={8}
                />
              </div>
              <button type="submit"
                className="w-full bg-sidebar border border-white/10 text-surface font-semibold py-3 rounded-xl active:scale-95 transition-transform text-sm hover:border-primary/40">
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Account info row */}
        <div className="bg-card rounded-2xl border border-white/5 divide-y divide-white/5">
          {[
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-surface/50">{row.label}</span>
              <span className="text-sm text-surface font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

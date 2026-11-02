'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'

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
      setProfileMsg('Profile updated')
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    try {
      await api.put('/api/v1/profile/password', pwForm)
      setPwMsg('Password updated')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err: unknown) {
      setPwMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-xl space-y-6">
      <h2 className="text-xl md:text-2xl font-bold">Profile</h2>

      <div className="bg-card rounded-xl border border-white/5 p-6">
        <h3 className="font-semibold mb-4">Account Details</h3>
        <p className="text-sm text-surface/50 mb-4">{user?.email}</p>
        {profileMsg && (
          <p className={`text-sm mb-4 p-3 rounded-lg ${profileMsg === 'Profile updated' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
            {profileMsg}
          </p>
        )}
        <form onSubmit={handleProfile} className="space-y-4">
          {(['firstName', 'lastName'] as const).map(k => (
            <div key={k}>
              <label className="block text-sm text-surface/60 mb-1 capitalize">{k.replace('N', ' N')}</label>
              <input
                value={profile[k]}
                onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))}
                className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
                required
              />
            </div>
          ))}
          <button type="submit" className="bg-primary text-bg font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition">
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-card rounded-xl border border-white/5 p-6">
        <h3 className="font-semibold mb-4">Change Password</h3>
        {pwMsg && (
          <p className={`text-sm mb-4 p-3 rounded-lg ${pwMsg === 'Password updated' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
            {pwMsg}
          </p>
        )}
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Current Password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-surface/60 mb-1">New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
              required minLength={8}
            />
          </div>
          <button type="submit" className="bg-primary text-bg font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition">
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}

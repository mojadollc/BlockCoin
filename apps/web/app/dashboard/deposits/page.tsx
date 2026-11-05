'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/services/api'

interface Wallet { id: string; label: string; status: string }
interface DepositAddresses { ETH_ERC20: string; TRON_TRC20: string }
interface DepositRequest {
  id: string
  network: string
  txHash: string
  amountDisplay: string
  status: string
  adminNote: string | null
  createdAt: string
  wallet: { label: string }
}

const NETWORK_META: Record<string, { label: string; short: string; placeholder: string }> = {
  TRON_TRC20: { label: 'TRON (TRC-20 USDT)', short: 'USDT TRC20', placeholder: 'e.g. a1b2c3d4e5f6...' },
  ETH_ERC20:  { label: 'Ethereum (ERC-20 USDT)', short: 'USDT ERC20', placeholder: '0x1a2b3c4d...' },
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-warning/20 text-warning',
  APPROVED: 'bg-primary/20 text-primary',
  REJECTED: 'bg-danger/20 text-danger',
}

export default function DepositsPage() {
  const searchParams = useSearchParams()
  const [addresses, setAddresses] = useState<DepositAddresses | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [form, setForm] = useState({
    walletId: searchParams.get('walletId') ?? '',
    network: 'TRON_TRC20',
    txHash: '',
    amountDisplay: '',
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const load = useCallback(async () => {
    const [addr, wals, deps] = await Promise.allSettled([
      api.get<DepositAddresses>('/api/v1/deposits/addresses'),
      api.get<Wallet[]>('/api/v1/wallets'),
      api.get<{ items: DepositRequest[] }>('/api/v1/deposits'),
    ])
    if (addr.status === 'fulfilled') setAddresses(addr.value)
    if (wals.status === 'fulfilled') setWallets(wals.value.filter(w => w.status === 'ACTIVE'))
    if (deps.status === 'fulfilled') setDeposits(deps.value.items)
  }, [])

  useEffect(() => { load() }, [load])

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await api.post('/api/v1/deposits', form)
      setMsg('Deposit submitted! Awaiting admin approval.')
      setSubmitted(true)
      setForm(f => ({ ...f, txHash: '', amountDisplay: '' }))
      load()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedAddress = addresses?.[form.network as keyof DepositAddresses]
  const meta = NETWORK_META[form.network]

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h2 className="text-xl md:text-2xl font-bold mb-1">Deposit USDT</h2>
      <p className="text-surface/50 text-sm mb-6">Follow the steps below to deposit USDT into your wallet.</p>

      {/* How it works */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <span className="text-primary text-lg mt-0.5">ℹ️</span>
        <div className="text-sm text-surface/70 space-y-1">
          <p className="font-semibold text-surface">How it works</p>
          <p>1. Enter the amount you want to deposit.</p>
          <p>2. Send that exact amount to the address shown.</p>
          <p>3. Copy your transaction hash from your wallet app.</p>
          <p>4. Submit the hash — our team will verify and credit your balance.</p>
        </div>
      </div>

      {/* Step 1 */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <p className="text-xs text-surface/40 uppercase tracking-wider mb-1">Step 1</p>
        <h3 className="font-semibold text-lg mb-4">Complete Your Payment</h3>

        {/* Network selector */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-surface/40 uppercase tracking-wider mb-2">① Choose Network</p>
          <div className="flex gap-3">
            {(['TRON_TRC20', 'ETH_ERC20'] as const).map(net => (
              <button
                key={net}
                type="button"
                onClick={() => { setForm(f => ({ ...f, network: net })); setCopied(false) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  form.network === net ? 'bg-primary text-bg' : 'bg-white/5 text-surface/60 hover:bg-white/10'
                }`}
              >
                {NETWORK_META[net].short}
              </button>
            ))}
          </div>
        </div>

        {/* Amount input — Step 1 */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-surface/40 uppercase tracking-wider mb-2">② Enter Amount to Deposit</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface/50 font-semibold">$</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.amountDisplay}
              onChange={e => setForm(f => ({ ...f, amountDisplay: e.target.value }))}
              placeholder="0.00"
              className="w-full bg-sidebar border border-white/10 rounded-lg pl-8 pr-16 py-3 text-surface font-mono text-lg focus:outline-none focus:border-primary"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-surface/40 text-sm font-semibold">USDT</span>
          </div>
          {form.amountDisplay && parseFloat(form.amountDisplay) > 0 && (
            <div className="mt-2 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
              <span className="text-primary text-lg">💰</span>
              <p className="text-sm text-primary font-semibold">
                You are depositing: ${parseFloat(form.amountDisplay).toFixed(2)} USDT
              </p>
            </div>
          )}
        </div>

        {/* Address + QR */}
        {selectedAddress ? (
          <div className="bg-sidebar rounded-xl p-5">
            <p className="text-xs font-semibold text-surface/40 uppercase tracking-wider mb-4">③ Send to this Address</p>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-5">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG
                  value={selectedAddress}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <p className="text-xs text-surface/40 mt-2">Scan with your wallet app</p>
              {/* Amount below QR */}
              <div className="mt-3 text-center">
                {form.amountDisplay && parseFloat(form.amountDisplay) > 0 ? (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-5 py-2">
                    <p className="text-xs text-surface/50 mb-0.5">Amount to Send</p>
                    <p className="text-xl font-bold text-primary">${parseFloat(form.amountDisplay).toFixed(2)} USDT</p>
                    <p className="text-xs text-surface/40 mt-0.5">via {meta.short}</p>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg px-5 py-2">
                    <p className="text-xs text-surface/40 mb-0.5">Amount to Deposit</p>
                    <p className="text-sm text-surface/30 italic">Enter amount above ↑</p>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet address */}
            <div>
              <p className="text-xs text-surface/40 mb-2">Wallet Address:</p>
              <div className="flex items-center gap-3 bg-bg/50 rounded-lg px-4 py-3 border border-white/5">
                <code className="text-sm font-mono text-primary break-all flex-1">{selectedAddress}</code>
                <button
                  type="button"
                  onClick={() => copy(selectedAddress)}
                  className="shrink-0 px-3 py-1.5 bg-primary/20 text-primary text-xs rounded-lg hover:bg-primary/30 transition font-medium"
                >
                  {copied ? '✓ Copied' : 'Copy Address'}
                </button>
              </div>
            </div>

            <p className="text-xs text-warning mt-4">
              ⚠ Only send USDT on the {form.network === 'TRON_TRC20' ? 'TRON' : 'Ethereum'} network to this address. Sending other tokens or using the wrong network may result in permanent loss.
            </p>
          </div>
        ) : (
          <div className="bg-sidebar rounded-xl p-5 text-center">
            <p className="text-surface/40 text-sm">Deposit address not configured. Contact support.</p>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div className="bg-card rounded-xl border border-white/5 p-6 mb-6">
        <p className="text-xs text-surface/40 uppercase tracking-wider mb-1">Step 2</p>
        <h3 className="font-semibold text-lg mb-1">Submit Your Transaction</h3>
        <p className="text-sm text-surface/50 mb-4">After sending, find your transaction hash in your wallet app and submit it below for approval.</p>

        {msg && (
          <p className={`text-sm mb-4 p-3 rounded-lg ${
            msg.includes('submitted') ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
          }`}>{msg}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-surface/60 mb-1">Wallet to credit</label>
            <select
              value={form.walletId}
              onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface focus:outline-none focus:border-primary"
              required
            >
              <option value="">Select wallet…</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>

          {form.amountDisplay && parseFloat(form.amountDisplay) > 0 && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-2">
              <span className="text-primary text-xl">💰</span>
              <div>
                <p className="text-xs text-surface/50">Deposit Amount</p>
                <p className="font-bold text-primary text-lg">${parseFloat(form.amountDisplay).toFixed(2)} USDT</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-surface/60 mb-1">Amount Sent (USDT)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface/50 font-semibold">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={form.amountDisplay}
                onChange={e => setForm(f => ({ ...f, amountDisplay: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-sidebar border border-white/10 rounded-lg pl-8 pr-16 py-2.5 text-surface font-mono focus:outline-none focus:border-primary"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-surface/40 text-sm font-semibold">USDT</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-surface/60 mb-1">Transaction Hash (TxID)</label>
            <input
              value={form.txHash}
              onChange={e => setForm(f => ({ ...f, txHash: e.target.value }))}
              placeholder={meta.placeholder}
              className="w-full bg-sidebar border border-white/10 rounded-lg px-4 py-2.5 text-surface font-mono text-sm focus:outline-none focus:border-primary"
              required
            />
            <p className="text-xs text-surface/40 mt-1.5">
              📋 Find this in your wallet app under transaction history — it&apos;s a long string of letters and numbers.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedAddress}
            className="w-full bg-primary text-bg font-semibold py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition text-base"
          >
            {loading ? 'Submitting…' : submitted ? '✓ Submitted — Submit Another' : '🚀 Submit for Approval'}
          </button>
          {submitted && (
            <p className="text-center text-xs text-surface/50 mt-2">Our team will verify your transaction and credit your balance within 24 hours.</p>
          )}
        </form>
      </div>

      {/* Deposit history */}
      {deposits.length > 0 && (
        <div className="bg-card rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold">My Deposit Requests</h3>
          </div>
          <div className="divide-y divide-white/5">
            {deposits.map(d => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>{d.status}</span>
                      <span className="text-xs text-surface/40">{NETWORK_META[d.network]?.short ?? d.network}</span>
                    </div>
                    <p className="text-sm font-mono text-surface/60 truncate">{d.txHash}</p>
                    <p className="text-xs text-surface/40 mt-0.5">{d.wallet.label} · {new Date(d.createdAt).toLocaleString()}</p>
                    {d.adminNote && <p className="text-xs text-warning mt-1">Note: {d.adminNote}</p>}
                  </div>
                  <p className="font-mono font-semibold text-primary shrink-0">{d.amountDisplay} USDT</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

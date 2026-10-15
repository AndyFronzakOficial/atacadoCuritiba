import { useState, type FormEvent } from 'react'
import { LockKeyhole, ShieldCheck, X } from 'lucide-react'

export default function AdminLoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try { await onLogin(email, password) }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível entrar.') }
    finally { setBusy(false) }
  }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-login-modal" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
        <button className="modal-close" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        <div className="admin-login-mark"><LockKeyhole size={22} /></div>
        <span className="eyebrow">ACESSO RESTRITO</span>
        <h2 id="admin-login-title">Painel do administrador</h2>
        <p>Entre com o usuário que recebeu permissão de administrador no Supabase.</p>
        <form onSubmit={submit} className="admin-login-form">
          <label className="field">E-mail<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@loja.com" /></label>
          <label className="field">Senha<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-full" disabled={busy}>{busy ? <span className="button-spinner" /> : 'Entrar no painel'}</button>
        </form>
        <div className="admin-login-secure"><ShieldCheck size={15} /> Acesso validado pelo Supabase Auth e RLS</div>
      </section>
    </div>
  )
}

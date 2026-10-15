import { CheckCircle2, Info, X } from 'lucide-react'

export default function Toast({ message, onClose, tone = 'success' }: { message: string; onClose: () => void; tone?: 'success' | 'error' | 'info' }) {
  if (!message) return null
  const Icon = tone === 'success' ? CheckCircle2 : Info
  return (
    <div className={`toast toast-${tone}`} role="status">
      <Icon size={18} strokeWidth={2.4} />
      <span>{message}</span>
      <button aria-label="Fechar aviso" onClick={onClose}><X size={16} /></button>
    </div>
  )
}

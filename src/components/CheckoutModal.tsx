import { useState, type FormEvent } from 'react'
import { ArrowLeft, Check, CheckCircle2, MapPin, MessageCircle, ShieldCheck, ShoppingBag, X } from 'lucide-react'
import type { Customer, Order, Product } from '../types'
import { currency, maskCep, maskCpf, maskPhone, whatsappUrl } from '../lib/format'
import { getGoogleDriveImageUrl } from '../lib/googleDrive'

export interface CheckoutLine {
  product: Product
  quantity: number
}

type AuthMode = 'register' | 'login'

const initialCustomer: Customer = {
  name: '', email: '', phone: '', cpf: '', cep: '', address: '', number: '', complement: '', neighborhood: '', city: '', state: '',
}

function orderWhatsappText(order: Order) {
  const lines = order.items.map((item) =>
    `• ${item.name}\n  Qtd: ${item.quantity} | Unit.: ${currency(item.unitPrice)} | Subtotal: ${currency(item.subtotal)}`,
  )
  return [
    `Olá! Quero confirmar o pedido *${order.orderNumber}* da Atacadão Curitiba.`,
    `Cliente: ${order.customer.name}`,
    '',
    ...lines,
    '',
    `*TOTAL DOS PRODUTOS: ${currency(order.total)}*`,
    'Frete e forma de pagamento a combinar.',
  ].join('\n')
}

export default function CheckoutModal({
  lines, total, onClose, onSubmit, supabaseEnabled,
}: {
  lines: CheckoutLine[]
  total: number
  onClose: () => void
  onSubmit: (customer: Customer, password: string, mode: AuthMode) => Promise<Order>
  supabaseEnabled: boolean
}) {
  const [customer, setCustomer] = useState<Customer>(initialCustomer)
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<AuthMode>('register')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [whatsappHref, setWhatsappHref] = useState('')

  const update = (key: keyof Customer, value: string) => setCustomer((current) => ({ ...current, [key]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const saved = await onSubmit(customer, password, mode)
      const href = whatsappUrl(orderWhatsappText(saved))
      setOrder(saved)
      setWhatsappHref(href)
      // Abre a conversa no gesto do checkout; o link de continuidade também fica disponível abaixo.
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o pedido. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  if (order) {
    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section className="checkout-modal order-success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <button className="modal-close" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
          <div className="success-check"><CheckCircle2 size={34} /></div>
          <span className="eyebrow">PEDIDO REGISTRADO</span>
          <h2 id="success-title">Tudo certo, {order.customer.name.split(' ')[0]}!</h2>
          <p className="muted-copy">Seu pedido foi salvo no painel da loja. Agora é só confirmar os detalhes pelo WhatsApp.</p>
          <div className="success-order-number"><span>Número do pedido</span><strong>{order.orderNumber}</strong></div>
          <div className="success-summary">
            {order.items.map((item) => (
              <div className="success-line" key={`${item.productId}-${item.sku}`}>
                <span><b>{item.quantity}×</b> {item.name}</span><strong>{currency(item.subtotal)}</strong>
              </div>
            ))}
            <div className="success-total"><span>Total dos produtos</span><strong>{currency(order.total)}</strong></div>
          </div>
          <a className="button button-whatsapp button-full" href={whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircle size={19} /> Finalizar no WhatsApp
          </a>
          <button className="button button-quiet button-full success-back" onClick={onClose}>Voltar à loja</button>
          <p className="privacy-footnote"><ShieldCheck size={14} /> CPF, endereço e senha não são enviados na mensagem.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <header className="checkout-header">
          <div>
            <button className="back-link" onClick={onClose}><ArrowLeft size={16} /> Voltar ao carrinho</button>
            <h2 id="checkout-title">Finalizar pedido</h2>
            <p>Precisamos dos seus dados para registrar a compra.</p>
          </div>
          <button className="modal-close" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="checkout-body">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-section-title"><span className="step-number">1</span><div><h3>Seus dados</h3><p>Cadastro seguro para acompanhar seu pedido</p></div></div>
            <div className="form-grid">
              <label className="field field-wide">Nome completo<input required autoComplete="name" value={customer.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex.: Maria da Silva" /></label>
              <label className="field">E-mail<input required type="email" autoComplete="email" value={customer.email} onChange={(e) => update('email', e.target.value)} placeholder="voce@email.com" /></label>
              <label className="field">Celular / WhatsApp<input required inputMode="tel" autoComplete="tel" value={customer.phone} onChange={(e) => update('phone', maskPhone(e.target.value))} placeholder="(41) 99999-9999" /></label>
              <label className="field">CPF<input required inputMode="numeric" autoComplete="off" value={customer.cpf} onChange={(e) => update('cpf', maskCpf(e.target.value))} placeholder="000.000.000-00" minLength={14} /></label>
              <label className="field">CEP<input required inputMode="numeric" autoComplete="postal-code" value={customer.cep} onChange={(e) => update('cep', maskCep(e.target.value))} placeholder="80000-000" minLength={9} /></label>
              <label className="field field-wide">Endereço<input required autoComplete="street-address" value={customer.address} onChange={(e) => update('address', e.target.value)} placeholder="Rua, avenida..." /></label>
              <label className="field">Número<input required value={customer.number} onChange={(e) => update('number', e.target.value)} placeholder="Nº" /></label>
              <label className="field">Complemento <span className="optional">opcional</span><input value={customer.complement} onChange={(e) => update('complement', e.target.value)} placeholder="Casa, bloco, ap..." /></label>
              <label className="field">Bairro<input required autoComplete="address-level3" value={customer.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} placeholder="Seu bairro" /></label>
              <label className="field">Cidade<input required autoComplete="address-level2" value={customer.city} onChange={(e) => update('city', e.target.value)} placeholder="Curitiba" /></label>
              <label className="field field-state">UF<input required maxLength={2} autoComplete="address-level1" value={customer.state} onChange={(e) => update('state', e.target.value.toUpperCase())} placeholder="PR" /></label>
            </div>

            <div className="checkout-section-title password-title"><span className="step-number">2</span><div><h3>{mode === 'register' ? 'Crie sua senha' : 'Entre na sua conta'}</h3><p>{mode === 'register' ? 'Use pelo menos 8 caracteres.' : 'Informe a senha da sua conta Atacadão Curitiba.'}</p></div></div>
            {supabaseEnabled && (
              <div className="auth-mode-switch" role="tablist" aria-label="Tipo de acesso">
                <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Quero me cadastrar</button>
                <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Já tenho cadastro</button>
              </div>
            )}
            <label className="field">Senha<input required type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" /></label>
            <div className="checkout-secure-note"><ShieldCheck size={17} /><span>{supabaseEnabled ? 'Seus dados são protegidos pela autenticação do Supabase.' : 'Modo demonstração: a senha não é armazenada.'}</span></div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="checkout-footer-mobile">
              <button className="button button-primary button-full" type="submit" disabled={busy || !lines.length}>
                {busy ? <span className="button-spinner" /> : <><Check size={18} /> Confirmar pedido · {currency(total)}</>}
              </button>
              <p>Frete e forma de pagamento serão combinados pelo WhatsApp.</p>
            </div>
          </form>

          <aside className="checkout-summary">
            <div className="summary-card-heading"><ShoppingBag size={18} /><h3>Resumo do pedido</h3><span>{lines.reduce((sum, line) => sum + line.quantity, 0)} itens</span></div>
            <div className="checkout-lines">
              {lines.map(({ product, quantity }) => (
                <div className="checkout-line" key={product.id}>
                  <div className="checkout-line-art">
                    {product.imageUrl && <img src={getGoogleDriveImageUrl(product.imageUrl)} alt={product.name} onError={(event) => { event.currentTarget.style.display = 'none'; const fallback = event.currentTarget.nextElementSibling as HTMLElement | null; if (fallback) fallback.hidden = false }} />}
                    <span style={{ display: product.imageUrl ? 'none' : 'flex' }}>{product.visual === 'bulb' ? '💡' : product.visual === 'drill' ? '🔧' : product.visual === 'camera' ? '📹' : product.visual === 'speaker' ? '🔊' : product.visual === 'earbuds' ? '🎧' : '📦'}</span>
                  </div>
                  <div className="checkout-line-copy"><strong>{product.name}</strong><small>{quantity} × {currency(product.price)}</small></div>
                  <b>{currency(product.price * quantity)}</b>
                </div>
              ))}
            </div>
            <div className="summary-total-row"><span>Subtotal</span><strong>{currency(total)}</strong></div>
            <div className="summary-total-row freight-row"><span><MapPin size={15} /> Frete</span><span>A combinar</span></div>
            <div className="summary-total-row order-total-row"><span>Total dos produtos</span><strong>{currency(total)}</strong></div>
            <p className="summary-note">Ao confirmar, você será direcionado ao WhatsApp para combinar pagamento e entrega.</p>
            <button className="button button-primary button-full checkout-submit-desktop" type="button" onClick={() => document.querySelector<HTMLFormElement>('.checkout-form')?.requestSubmit()} disabled={busy || !lines.length}>
              {busy ? <span className="button-spinner" /> : <>Confirmar pedido <span>{currency(total)}</span></>}
            </button>
            <div className="checkout-safe"><ShieldCheck size={16} /> Compra segura <span>•</span> Dados protegidos</div>
          </aside>
        </div>
      </section>
    </div>
  )
}

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Barcode, ImagePlus, PackageCheck, Trash2, UploadCloud, X } from 'lucide-react'
import { categories } from '../lib/demo-data'
import type { Product, ProductInput } from '../types'

const visualByCategory: Record<string, string> = {
  Ferramentas: 'tools', Elétrica: 'extension', Iluminação: 'bulb', Celulares: 'charger', Áudio: 'speaker', Segurança: 'camera', Bazar: 'organizer',
}
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
type Draft = Omit<ProductInput, 'id'>

const blankDraft = (sku: string): Draft => ({
  sku, name: '', barcode: '', description: '', category: 'Ferramentas', stock: 0,
  initialPrice: 0, price: 0, discountPercent: 0, visual: 'tools', imageUrl: '', active: true,
})

export default function ProductFormModal({
  product, nextSku, onClose, onSave,
}: {
  product: Product | null
  nextSku: string
  onClose: () => void
  onSave: (input: ProductInput, imageFile: File | null) => Promise<void>
}) {
  const [draft, setDraft] = useState<Draft>(blankDraft(nextSku))
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setImageFile(null)
    if (product) {
      const { id: _id, ...rest } = product
      setDraft({ ...rest, imageUrl: product.imageUrl || '' })
      setImagePreview(product.imageUrl || '')
    } else {
      setDraft(blankDraft(nextSku))
      setImagePreview('')
    }
  }, [product, nextSku])

  function updatePrice(key: 'initialPrice' | 'price' | 'discountPercent', value: number) {
    setDraft((current) => {
      if (key === 'initialPrice') {
        const discountPercent = value > 0 ? Math.max(0, Math.min(100, Math.round((1 - current.price / value) * 100))) : 0
        return { ...current, initialPrice: value, discountPercent }
      }
      if (key === 'price') {
        const discountPercent = current.initialPrice > 0 ? Math.max(0, Math.min(100, Math.round((1 - value / current.initialPrice) * 100))) : 0
        return { ...current, price: value, discountPercent }
      }
      const discountPercent = Math.max(0, Math.min(100, value))
      const price = Math.max(0, current.initialPrice * (1 - discountPercent / 100))
      return { ...current, discountPercent, price: Number(price.toFixed(2)) }
    })
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!acceptedImageTypes.includes(file.type)) {
      setError('Escolha uma imagem JPG, PNG ou WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 10 MB.')
      return
    }
    setError('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setImagePreview(reader.result)
    }
    reader.onerror = () => setError('Não foi possível abrir essa imagem. Tente outro arquivo.')
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview('')
    setDraft((current) => ({ ...current, imageUrl: '' }))
    setError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (draft.initialPrice > 0 && draft.price > draft.initialPrice) {
      setError('O valor final não pode ser maior que o valor inicial.')
      return
    }
    setBusy(true)
    try {
      await onSave({ ...draft, ...(product ? { id: product.id } : {}), visual: draft.visual || visualByCategory[draft.category] || 'organizer' }, imageFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o produto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-form-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
        <header className="product-form-header">
          <div className="product-form-icon"><PackageCheck size={22} /></div>
          <div><span className="eyebrow">CATÁLOGO</span><h2 id="product-form-title">{product ? 'Editar produto' : 'Adicionar produto'}</h2><p>Preencha os detalhes para manter seu catálogo atualizado.</p></div>
          <button className="modal-close" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        </header>
        <form onSubmit={submit} className="product-form">
          <div className="form-grid">
            <label className="field">Código interno / SKU<input required value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })} placeholder="ATC-013" /></label>
            <label className="field">Código de barras <span className="optional">EAN/GTIN</span><div className="input-icon-wrap"><Barcode size={16} /><input value={draft.barcode} onChange={(e) => setDraft({ ...draft, barcode: e.target.value.replace(/\D/g, '') })} placeholder="7890000000000" /></div></label>
            <label className="field field-wide">Nome do produto<input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ex.: Kit de ferramentas profissional" /></label>
            <label className="field">Categoria<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value, visual: visualByCategory[e.target.value] || draft.visual })}>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
            <label className="field">Quantidade em estoque<input required type="number" min="0" step="1" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Math.max(0, Number(e.target.value)) })} /></label>
            <label className="field field-wide">Descrição<textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Detalhes que ajudam o cliente a escolher..." /></label>

            <div className="field field-wide image-field">
              <span className="image-field-label">Imagem do produto <span className="optional">opcional</span></span>
              <div className={`image-upload-box ${imagePreview ? 'has-preview' : ''}`}>
                <div className="image-preview-area">
                  {imagePreview ? <img src={imagePreview} alt="Pré-visualização do produto" /> : <div className="image-placeholder"><ImagePlus size={27} /><span>Sua foto aparecerá nos cards da loja</span></div>}
                </div>
                <div className="image-upload-copy">
                  <strong>{imagePreview ? 'Imagem selecionada' : 'Adicione uma foto do produto'}</strong>
                  <span>JPG, PNG ou WebP · até 10 MB</span>
                  <div className="image-upload-actions">
                    <label className="image-pick-button"><UploadCloud size={15} />{imagePreview ? 'Trocar imagem' : 'Escolher imagem'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /></label>
                    {imagePreview && <button type="button" className="image-remove-button" onClick={removeImage}><Trash2 size={14} /> Remover</button>}
                  </div>
                </div>
              </div>
              <small className="image-field-note">A foto será otimizada e enviada ao Google Drive da loja. O link público é salvo no produto para exibição no catálogo, carrinho e painel; no primeiro envio, autorize a conta Google da loja.</small>
            </div>

            <div className="price-form-field"><label className="field">Valor inicial (R$)<input required type="number" min="0" step="0.01" value={draft.initialPrice} onChange={(e) => updatePrice('initialPrice', Number(e.target.value))} /></label></div>
            <div className="price-form-field"><label className="field">Valor final (R$)<input required type="number" min="0" step="0.01" value={draft.price} onChange={(e) => updatePrice('price', Number(e.target.value))} /></label></div>
            <div className="price-form-field field-discount"><label className="field">Desconto (%)<div className="percent-input"><input type="number" min="0" max="100" step="1" value={draft.discountPercent} onChange={(e) => updatePrice('discountPercent', Number(e.target.value))} /><span>%</span></div></label></div>
          </div>
          <div className="product-form-hint"><ImagePlus size={17} /><span>Sem uma foto enviada, o produto continuará usando a arte ilustrativa da categoria.</span></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <footer className="product-form-footer"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <span className="button-spinner" /> : product ? 'Salvar alterações' : 'Adicionar ao catálogo'}</button></footer>
        </form>
      </section>
    </div>
  )
}

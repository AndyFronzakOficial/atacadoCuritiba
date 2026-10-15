import type { Product } from '../types'

const art: Record<string, string> = {
  drill: '🔧', tools: '🧰', bulb: '💡', led: '🌈', camera: '📹', speaker: '🔊',
  charger: '🔌', cable: '🧵', extension: '⚡', organizer: '📦', earbuds: '🎧', pliers: '🛠️',
}

export default function ProductArtwork({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className={`product-art art-${product.visual} ${compact ? 'product-art-compact' : ''}`} aria-label={product.name}>
      <span className="art-orbit art-orbit-one" />
      <span className="art-orbit art-orbit-two" />
      <span className="art-spark art-spark-one">✦</span>
      <span className="art-spark art-spark-two">✦</span>
      <span className="art-symbol">{art[product.visual] || '📦'}</span>
      <span className="art-caption">{product.category}</span>
    </div>
  )
}

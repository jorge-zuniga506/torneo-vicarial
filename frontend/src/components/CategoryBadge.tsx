import { Venus } from 'lucide-react'
import type { MatchCategory } from '../types/tournament'
import { CATEGORY_LABELS } from '../utils/matchLabels'

/**
 * Pill de categoría. Solo se muestra para FEMENINO (el partido de exhibición):
 * la competición masculina es lo "normal" y no necesita etiqueta.
 */
export function CategoryBadge({
  category,
  className = '',
}: {
  category: MatchCategory
  className?: string
}) {
  if (category !== 'FEMENINO') return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-viol-100 px-2 py-0.5 text-[11px] font-semibold text-viol-600 ${className}`}
    >
      <Venus className="h-3 w-3" />
      {CATEGORY_LABELS.FEMENINO}
    </span>
  )
}

import type { Team } from '../types/tournament'

const SIZES = {
  sm: { swatch: 'h-6 w-6 text-[10px]', text: 'text-sm' },
  md: { swatch: 'h-10 w-10 text-sm', text: 'text-base' },
  lg: { swatch: 'h-16 w-16 text-lg', text: 'text-xl' },
}

export function TeamBadge({
  team,
  size = 'md',
  direction = 'row',
}: {
  team: Pick<Team, 'name' | 'short_name' | 'logo_url' | 'color'> | null | undefined
  size?: keyof typeof SIZES
  direction?: 'row' | 'col'
}) {
  const { swatch, text } = SIZES[size]
  const name = team?.name ?? 'Por definir'
  const initials = (team?.short_name ?? '?').slice(0, 3).toUpperCase()

  return (
    <div className={`flex items-center gap-2.5 ${direction === 'col' ? 'flex-col text-center' : ''}`}>
      {team?.logo_url ? (
        <img src={team.logo_url} alt={name} className={`${swatch} rounded-full object-cover`} />
      ) : (
        <span
          className={`flex ${swatch} flex-none items-center justify-center rounded-full font-bold text-white`}
          style={{ backgroundColor: team?.color ?? '#5a1f4d' }}
        >
          {initials}
        </span>
      )}
      <span className={`${text} font-semibold text-tinta`}>{name}</span>
    </div>
  )
}

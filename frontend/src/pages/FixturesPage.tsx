import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useMatches } from '../hooks/useMatches'
import { useGroups } from '../hooks/useGroups'
import { MatchRow } from '../components/MatchRow'
import { STAGE_LABELS_SHORT, isLive, isWomensMatch } from '../utils/matchLabels'
import type { MatchStage, MatchWithTeams } from '../types/tournament'

type Tab = 'en-vivo' | 'proximos' | 'finalizados'

const TABS: { id: Tab; label: string }[] = [
  { id: 'en-vivo', label: 'En vivo' },
  { id: 'proximos', label: 'Próximos' },
  { id: 'finalizados', label: 'Finalizados' },
]

function tabOf(m: MatchWithTeams): Tab {
  if (isLive(m.status)) return 'en-vivo'
  if (m.status === 'FINALIZADO') return 'finalizados'
  return 'proximos'
}

export function FixturesPage() {
  const [params, setParams] = useSearchParams()
  const { tournament } = useTournament()
  const { matches, loading } = useMatches(tournament?.id)
  const { groups, byId } = useGroups(tournament?.id)

  const rawTab = params.get('tab') as Tab | null
  const tab: Tab = TABS.some((t) => t.id === rawTab) ? (rawTab as Tab) : 'proximos'
  const filter = params.get('filtro') ?? 'todos' // 'todos' | group:<id> | stage:<STAGE>

  const stagesPresent = useMemo(() => {
    const set = new Set<MatchStage>()
    for (const m of matches) if (m.stage !== 'GROUP' && m.stage !== 'EXHIBITION') set.add(m.stage)
    return [...set]
  }, [matches])

  const hasWomensMatch = useMemo(() => matches.some((m) => isWomensMatch(m)), [matches])

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { 'en-vivo': 0, proximos: 0, finalizados: 0 }
    for (const m of matches) c[tabOf(m)] += 1
    return c
  }, [matches])

  const visible = matches
    .filter((m) => tabOf(m) === tab)
    .filter((m) => {
      if (filter === 'todos') return true
      if (filter.startsWith('group:')) return m.group_id === filter.slice(6)
      if (filter.startsWith('stage:')) return m.stage === filter.slice(6)
      if (filter === 'cat:FEMENINO') return isWomensMatch(m)
      return true
    })
    .sort((a, b) =>
      tab === 'finalizados'
        ? new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
        : new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    )

  const setTab = (id: Tab) => {
    params.set('tab', id)
    setParams(params, { replace: true })
  }
  const setFilter = (value: string) => {
    if (value === 'todos') params.delete('filtro')
    else params.set('filtro', value)
    setParams(params, { replace: true })
  }

  const chip = (value: string, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        filter === value
          ? 'bg-azul-600/10 text-azul-600 ring-1 ring-azul-600/30'
          : 'bg-panel text-tinta-2 ring-1 ring-linea hover:text-tinta'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-azul-600" />
        <h1 className="text-2xl font-black text-tinta">Partidos</h1>
      </div>

      <div className="flex gap-1 rounded-full border border-linea bg-panel p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-azul-600 text-white' : 'text-tinta-2 hover:text-tinta'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${tab === t.id ? 'text-azul-100' : 'text-tinta-3'}`}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {chip('todos', 'Todos')}
        {groups.map((g) => chip(`group:${g.id}`, `Grupo ${g.name}`))}
        {stagesPresent.map((s) => chip(`stage:${s}`, STAGE_LABELS_SHORT[s]))}
        {hasWomensMatch && chip('cat:FEMENINO', 'Femenino')}
      </div>

      {loading ? (
        <p className="py-16 text-center text-tinta-2">Cargando partidos…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea-2 py-16 text-center text-sm text-tinta-3">
          No hay partidos en esta vista.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((m) => (
            <MatchRow key={m.id} match={m} groupName={m.group_id ? byId.get(m.group_id)?.name : null} />
          ))}
        </div>
      )}
    </div>
  )
}

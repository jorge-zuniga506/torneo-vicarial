import { Trophy } from 'lucide-react'
import type { MatchWithTeams } from '../types/tournament'
import { formatKickoff, isLive } from '../utils/matchLabels'

const COLUMNS: { title: string; slots: string[] }[] = [
  { title: 'Cuartos de final', slots: ['QF1', 'QF2', 'QF3', 'QF4'] },
  { title: 'Semifinales', slots: ['SF1', 'SF2'] },
  { title: 'Final', slots: ['FINAL'] },
]

function Side({
  name,
  score,
  show,
  isWinner,
}: {
  name: string
  score: number
  show: boolean
  isWinner: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
        isWinner ? 'font-bold text-tinta' : 'text-tinta-2'
      }`}
    >
      <span className="min-w-0 truncate">{name}</span>
      {show && <span className="flex-none font-mono tabular-nums">{score}</span>}
    </div>
  )
}

function BracketMatch({ match }: { match: MatchWithTeams | undefined }) {
  if (!match) {
    return (
      <div className="rounded-xl border border-dashed border-linea-2 px-3 py-4 text-center text-xs text-tinta-3">
        Por definir
      </div>
    )
  }
  const live = isLive(match.status)
  const finished = match.status === 'FINALIZADO'
  const showScore = live || finished
  const homeName = match.home_team?.short_name ?? match.home_team?.name ?? 'Por definir'
  const awayName = match.away_team?.short_name ?? match.away_team?.name ?? 'Por definir'
  const homeWon = finished && match.winner_team_id === match.home_team_id
  const awayWon = finished && match.winner_team_id === match.away_team_id

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-panel ${
        live ? 'border-vino-400/50' : 'border-linea'
      }`}
    >
      <Side name={homeName} score={match.home_score} show={showScore} isWinner={homeWon} />
      <div className="h-px bg-linea" />
      <Side name={awayName} score={match.away_score} show={showScore} isWinner={awayWon} />
      <div className="border-t border-linea bg-crema px-3 py-1 text-[10px] font-medium text-tinta-3">
        {live ? 'En vivo' : finished ? 'Finalizado' : formatKickoff(match.scheduled_at)}
      </div>
    </div>
  )
}

/** Cuadro de eliminación: cuartos → semis → final. Todo sale de `matches`. */
export function BracketView({ matches }: { matches: MatchWithTeams[] }) {
  const bySlot = new Map(matches.filter((m) => m.bracket_slot).map((m) => [m.bracket_slot as string, m]))
  const champion = bySlot.get('FINAL')?.winner_team_id
    ? bySlot.get('FINAL')?.winner_team_id === bySlot.get('FINAL')?.home_team_id
      ? bySlot.get('FINAL')?.home_team
      : bySlot.get('FINAL')?.away_team
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h3 className="text-xs font-bold tracking-widest text-tinta-3 uppercase">{col.title}</h3>
            <div className="flex flex-col gap-3">
              {col.slots.map((slot) => (
                <BracketMatch key={slot} match={bySlot.get(slot)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {champion && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-azul-200 bg-azul-50 px-4 py-3 text-sm font-bold text-azul-700">
          <Trophy className="h-4 w-4" />
          Campeón: {champion.name}
        </div>
      )}
    </div>
  )
}

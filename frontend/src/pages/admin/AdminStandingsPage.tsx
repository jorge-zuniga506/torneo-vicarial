import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, ListOrdered, Shuffle, Trophy, XCircle } from 'lucide-react'
import { useTournament } from '../../hooks/useTournament'
import { useQualification } from '../../hooks/useQualification'
import { setManualTiebreak, recalculateStandings } from '../../services/teams'
import { drawQuarterfinals } from '../../services/roulette'
import { toast } from '../../lib/toast'
import { TeamBadge } from '../../components/TeamBadge'
import type { StandingWithTeam } from '../../types/tournament'

export function AdminStandingsPage() {
  const { tournament } = useTournament()
  const { qualification, groupStageComplete, byGroup, groups, matches, loading } = useQualification(
    tournament?.id,
  )

  const [busyTeam, setBusyTeam] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [confirmDraw, setConfirmDraw] = useState(false)

  if (loading) return <p className="py-24 text-center text-tinta-2">Cargando…</p>
  if (!tournament) return <p className="py-24 text-center text-tinta-2">No hay un torneo configurado.</p>

  const groupMatches = matches.filter((m) => m.stage === 'GROUP' && m.category !== 'FEMENINO')
  const played = groupMatches.filter((m) => m.status === 'FINALIZADO').length

  async function bumpTiebreak(row: StandingWithTeam, delta: number) {
    if (!tournament) return
    setBusyTeam(row.team_id)
    try {
      await setManualTiebreak(row.team_id, (row.team?.manual_tiebreak ?? 0) + delta)
      await recalculateStandings(tournament.id)
      toast.ok('Desempate manual actualizado', row.team?.name)
    } catch (e) {
      toast.err(e, 'No se pudo actualizar el desempate')
    } finally {
      setBusyTeam(null)
    }
  }

  async function runDraw() {
    if (!tournament) return
    setDrawing(true)
    setConfirmDraw(false)
    try {
      await drawQuarterfinals(tournament.id)
      toast.ok('Cuartos sorteados', 'Revisá y ajustá las llaves en Partidos')
    } catch (e) {
      toast.err(e, 'No se pudo sortear los cuartos')
    } finally {
      setDrawing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <ListOrdered className="h-5 w-5 text-azul-600" />
        <h1 className="text-2xl font-black text-tinta">Clasificación</h1>
      </header>

      {/* Clasificados / eliminado + sorteo de cuartos */}
      <section className="flex flex-col gap-4 rounded-2xl border border-linea bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-tinta">Clasificados a cuartos</h2>
          <span className="text-xs text-tinta-3">
            {played}/{groupMatches.length} partidos de grupos jugados
          </span>
        </div>

        {!groupStageComplete ? (
          <p className="rounded-lg border border-dashed border-linea-2 px-3 py-6 text-center text-sm text-tinta-3">
            Cuando terminen los {groupMatches.length} partidos de fase de grupos vas a ver acá los 8
            clasificados y el equipo eliminado, y se habilita el sorteo de cuartos.
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {qualification.qualified.map(({ standing, label }) => (
                <div
                  key={standing.team_id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-azul-200 bg-azul-50 px-3 py-2"
                >
                  <TeamBadge team={standing.team} size="sm" />
                  <span className="flex-none text-[11px] font-semibold text-azul-600">{label}</span>
                </div>
              ))}
            </div>
            {qualification.eliminated.map((s) => (
              <div
                key={s.team_id}
                className="flex items-center justify-between gap-2 rounded-xl border border-vino-400/40 bg-vino-50 px-3 py-2"
              >
                <TeamBadge team={s.team} size="sm" />
                <span className="flex items-center gap-1 text-[11px] font-semibold text-vino-600">
                  <XCircle className="h-3.5 w-3.5" />
                  Eliminado (peor 3.º)
                </span>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3 border-t border-linea pt-4">
              {confirmDraw ? (
                <>
                  <span className="text-sm text-tinta-2">
                    Esto reescribe QF1–QF4 con los 8 clasificados. ¿Seguro?
                  </span>
                  <button
                    type="button"
                    disabled={drawing}
                    onClick={runDraw}
                    className="rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500 disabled:opacity-60"
                  >
                    Sí, sortear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDraw(false)}
                    className="rounded-full border border-linea px-4 py-2 text-sm text-tinta-2 hover:bg-crema"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={drawing}
                  onClick={() => setConfirmDraw(true)}
                  className="flex items-center gap-1.5 rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500 disabled:opacity-60"
                >
                  <Shuffle className="h-4 w-4" />
                  {drawing ? 'Sorteando…' : 'Sortear cuartos'}
                </button>
              )}
              <Link
                to="/admin/matches"
                className="flex items-center gap-1 text-xs font-medium text-azul-600 hover:underline"
              >
                Editar llaves a mano
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Tablas por grupo con desempate manual */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const rows = [...(byGroup.get(group.id) ?? [])].sort(
            (a, b) => (a.position ?? 99) - (b.position ?? 99),
          )
          return (
            <section key={group.id} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">
                Grupo {group.name}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-linea bg-panel">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-linea text-[11px] text-tinta-3 uppercase">
                      <th className="w-8 px-2 py-2 text-center font-semibold">#</th>
                      <th className="px-2 py-2 text-left font-semibold">Equipo</th>
                      <th className="w-10 px-1 py-2 text-center font-semibold" title="Diferencia de gol">
                        DG
                      </th>
                      <th className="w-10 px-1 py-2 text-center font-semibold">PTS</th>
                      <th className="w-20 px-1 py-2 text-center font-semibold" title="Desempate manual">
                        Manual
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.id} className="border-b border-linea last:border-0">
                        <td className="px-2 py-2 text-center font-bold text-tinta-3">
                          {row.position ?? i + 1}
                        </td>
                        <td className="px-2 py-2">
                          <TeamBadge team={row.team} size="sm" />
                        </td>
                        <td className="px-1 py-2 text-center tabular-nums text-tinta-2">
                          {row.goal_diff > 0 ? '+' : ''}
                          {row.goal_diff}
                        </td>
                        <td className="px-1 py-2 text-center font-black tabular-nums text-tinta">
                          {row.points}
                        </td>
                        <td className="px-1 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={busyTeam === row.team_id}
                              onClick={() => bumpTiebreak(row, 1)}
                              className="rounded p-0.5 text-tinta-3 hover:bg-crema hover:text-azul-600 disabled:opacity-40"
                              aria-label="Subir en el desempate"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <span className="w-4 text-center text-xs font-semibold text-tinta-2 tabular-nums">
                              {row.team?.manual_tiebreak ?? 0}
                            </span>
                            <button
                              type="button"
                              disabled={busyTeam === row.team_id}
                              onClick={() => bumpTiebreak(row, -1)}
                              className="rounded p-0.5 text-tinta-3 hover:bg-crema hover:text-vino-600 disabled:opacity-40"
                              aria-label="Bajar en el desempate"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>

      <p className="flex items-start gap-2 text-xs text-tinta-3">
        <Trophy className="mt-0.5 h-3.5 w-3.5 flex-none" />
        Orden de desempate: puntos, diferencia de gol, goles a favor, resultado entre los empatados
        y, por último, el desempate manual de arriba (mayor = mejor). En grupos de 3 un triple empate
        se resuelve solo con el desempate manual.
      </p>
    </div>
  )
}

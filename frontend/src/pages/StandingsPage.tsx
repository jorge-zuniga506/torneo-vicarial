import { ListOrdered, Trophy, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTournament } from '../hooks/useTournament'
import { useQualification } from '../hooks/useQualification'
import { StandingsTable, StandingsLegend } from '../components/StandingsTable'
import { TeamBadge } from '../components/TeamBadge'

export function StandingsPage() {
  const { tournament, settings } = useTournament()
  const { byGroup, groups, qualification, groupStageComplete, loading } = useQualification(
    tournament?.id,
  )

  if (loading) {
    return <p className="py-24 text-center text-tinta-2">Cargando tablas…</p>
  }

  if (groups.length === 0) {
    return <p className="py-24 text-center text-tinta-2">Todavía no hay grupos configurados.</p>
  }

  const perGroup = settings?.qualifiers_per_group ?? 0
  const bestThirds = settings?.best_third_places ?? 0
  const legendStatuses = new Set(qualification.statusByTeam.values())

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-azul-600" />
          <h1 className="text-2xl font-black text-tinta">Tablas de posiciones</h1>
        </div>
        {perGroup > 0 && (
          <p className="flex items-center gap-2 text-xs text-tinta-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-azul-600" />
            Clasifican {perGroup} por grupo{bestThirds > 0 ? ` + ${bestThirds} mejores terceros` : ''}
          </p>
        )}
      </header>

      {groupStageComplete && qualification.qualified.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-azul-200 bg-azul-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-azul-700 uppercase">
            <Trophy className="h-4 w-4" />
            Clasificados a cuartos
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {qualification.qualified.map(({ standing, label }) => (
              <div
                key={standing.team_id}
                className="flex flex-col gap-1 rounded-xl border border-azul-200 bg-panel px-3 py-2"
              >
                <span className="text-[10px] font-semibold text-azul-600 uppercase">{label}</span>
                <TeamBadge team={standing.team} size="sm" />
              </div>
            ))}
          </div>
          {qualification.eliminated.map((s) => (
            <div
              key={s.team_id}
              className="flex items-center gap-2 rounded-xl border border-vino-400/40 bg-vino-50 px-3 py-2 text-sm"
            >
              <TeamBadge team={s.team} size="sm" />
              <span className="flex items-center gap-1 text-[11px] font-semibold text-vino-600">
                <XCircle className="h-3.5 w-3.5" />
                Equipo eliminado (peor 3.º)
              </span>
            </div>
          ))}
          <Link to="/bracket" className="text-xs font-medium text-azul-600 hover:underline">
            Ver cuadro de eliminación →
          </Link>
        </section>
      )}

      {legendStatuses.size > 0 && (
        <StandingsLegend statuses={legendStatuses} />
      )}

      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">
              Grupo {group.name}
            </h2>
            <StandingsTable
              rows={byGroup.get(group.id) ?? []}
              qualifiers={perGroup}
              statusByTeam={qualification.statusByTeam}
            />
          </section>
        ))}
      </div>

      <p className="text-xs text-tinta-3">
        PJ · Jugados · G · Ganados · E · Empatados · P · Perdidos · GF · Goles a favor · GC · Goles en
        contra · DG · Diferencia · PTS · Puntos. Se actualizan solas cuando el admin carga un
        resultado. Desempate: PTS, DG, GF, resultado entre los empatados y resolución manual del
        admin. Colores: verde clasifica, ámbar repechaje (3.º peleando plaza de mejor tercero), rojo
        eliminado.
      </p>
    </div>
  )
}

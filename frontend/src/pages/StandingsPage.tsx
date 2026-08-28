import { ListOrdered } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useStandings } from '../hooks/useStandings'
import { useGroups } from '../hooks/useGroups'
import { StandingsTable } from '../components/StandingsTable'

export function StandingsPage() {
  const { tournament, settings } = useTournament()
  const { byGroup, loading } = useStandings(tournament?.id)
  const { groups, loading: loadingGroups } = useGroups(tournament?.id)

  if (loading || loadingGroups) {
    return <p className="py-24 text-center text-tinta-2">Cargando tablas…</p>
  }

  if (groups.length === 0) {
    return <p className="py-24 text-center text-tinta-2">Todavía no hay grupos configurados.</p>
  }

  const qualifiers = settings?.qualifiers_per_group ?? 0

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-azul-600" />
          <h1 className="text-2xl font-black text-tinta">Tablas de posiciones</h1>
        </div>
        {qualifiers > 0 && (
          <p className="flex items-center gap-2 text-xs text-tinta-2">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-azul-100 text-[10px] font-bold text-azul-600">
              1
            </span>
            Clasifican {qualifiers} por grupo
          </p>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">
              Grupo {group.name}
            </h2>
            <StandingsTable rows={byGroup.get(group.id) ?? []} qualifiers={qualifiers} />
          </section>
        ))}
      </div>

      <p className="text-xs text-tinta-3">
        PJ · Jugados · G · Ganados · E · Empatados · P · Perdidos · GF · Goles a favor · GC · Goles en
        contra · DG · Diferencia · PTS · Puntos. Se actualizan solas cuando el admin carga un
        resultado.
      </p>
    </div>
  )
}

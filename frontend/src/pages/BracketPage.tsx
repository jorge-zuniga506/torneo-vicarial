import { GitBranch } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useQualification } from '../hooks/useQualification'
import { BracketView } from '../components/BracketView'
import { TeamBadge } from '../components/TeamBadge'

export function BracketPage() {
  const { tournament } = useTournament()
  const { qualification, groupStageComplete, matches, loading } = useQualification(tournament?.id)

  if (loading) return <p className="py-24 text-center text-tinta-2">Cargando cuadro…</p>
  if (!tournament) return <p className="py-24 text-center text-tinta-2">Todavía no hay un torneo configurado.</p>

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-azul-600" />
        <h1 className="text-2xl font-black text-tinta">Cuadro de eliminación</h1>
      </header>

      {groupStageComplete && qualification.qualified.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">
            Clasificados a cuartos
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {qualification.qualified.map(({ standing, label }) => (
              <div
                key={standing.team_id}
                className="flex flex-col gap-1 rounded-xl border border-azul-200 bg-azul-50 px-3 py-2"
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
              <span className="text-[11px] font-semibold text-vino-600">Eliminado (peor 3.º)</span>
            </div>
          ))}
        </section>
      )}

      <BracketView matches={matches} />

      {!groupStageComplete && (
        <p className="text-xs text-tinta-3">
          Las llaves se completan cuando termina la fase de grupos y el administrador sortea los
          cuartos. Los ganadores avanzan automáticamente.
        </p>
      )}
    </div>
  )
}

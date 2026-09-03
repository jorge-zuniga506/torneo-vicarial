import { Link } from 'react-router-dom'
import { Users2 } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useTeams } from '../hooks/useTeams'
import { useStandings } from '../hooks/useStandings'
import { useGroups } from '../hooks/useGroups'
import { TeamBadge } from '../components/TeamBadge'
import { CategoryBadge } from '../components/CategoryBadge'

export function TeamsPage() {
  const { tournament } = useTournament()
  const { teams, loading } = useTeams(tournament?.id)
  const { standings } = useStandings(tournament?.id)
  const { groups, byId } = useGroups(tournament?.id)

  if (loading) {
    return <p className="py-24 text-center text-tinta-2">Cargando equipos…</p>
  }

  const standingByTeam = new Map(standings.map((s) => [s.team_id, s]))
  const mascTeams = teams.filter((t) => t.category !== 'FEMENINO')
  const femTeams = teams.filter((t) => t.category === 'FEMENINO')
  const orderedGroupIds = [
    ...groups.map((g) => g.id),
    ...(mascTeams.some((t) => !t.group_id) ? [null] : []),
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Users2 className="h-5 w-5 text-azul-600" />
        <h1 className="text-2xl font-black text-tinta">Equipos</h1>
        <span className="text-sm text-tinta-3">· {mascTeams.length}</span>
      </div>

      {orderedGroupIds.map((groupId) => {
        const groupTeams = mascTeams.filter((t) => t.group_id === groupId)
        if (groupTeams.length === 0) return null
        return (
          <section key={groupId ?? 'sin-grupo'} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">
              {groupId ? `Grupo ${byId.get(groupId)?.name}` : 'Sin grupo'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupTeams.map((team) => {
                const s = standingByTeam.get(team.id)
                return (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-linea bg-panel p-5 transition-colors hover:border-azul-600/40"
                  >
                    <div className="flex items-center justify-between">
                      <TeamBadge team={team} size="md" />
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: team.color ?? '#5a1f4d' }}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        ['PJ', s?.played ?? 0],
                        ['V', s?.won ?? 0],
                        ['E', s?.drawn ?? 0],
                        ['D', s?.lost ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-crema py-2">
                          <p className="text-base font-black text-tinta tabular-nums">{value}</p>
                          <p className="text-[10px] text-tinta-3">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-tinta-2">
                      <span>
                        Goles{' '}
                        <span className="font-semibold text-tinta">
                          {s?.goals_for ?? 0}:{s?.goals_against ?? 0}
                        </span>
                      </span>
                      <span className="rounded-full bg-azul-600/10 px-2 py-0.5 font-bold text-azul-600">
                        {s?.points ?? 0} PTS
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {femTeams.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-tinta-2 uppercase">
            Partido femenino
            <CategoryBadge category="FEMENINO" />
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {femTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-2xl border border-linea bg-panel p-5"
              >
                <TeamBadge team={team} size="md" />
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: team.color ?? '#5a1f4d' }}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

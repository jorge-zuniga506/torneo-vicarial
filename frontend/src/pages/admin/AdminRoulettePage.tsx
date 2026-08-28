import { useMemo, useState } from 'react'
import { Dices, RotateCcw, Trophy } from 'lucide-react'
import { sileo } from 'sileo'
import { useAuth } from '../../hooks/useAuth'
import { useTournament } from '../../hooks/useTournament'
import { useTeams } from '../../hooks/useTeams'
import { useGroups } from '../../hooks/useGroups'
import { useTournamentPlayers } from '../../hooks/useTournamentPlayers'
import { RouletteWheel } from '../../components/admin/RouletteWheel'
import type { WheelItem } from '../../components/admin/RouletteWheel'
import { createTeam, updateTeam } from '../../services/teams'
import { saveRouletteDraw } from '../../services/roulette'
import { toast } from '../../lib/toast'

type Mode = 'positions' | 'teams' | 'players'

const MODES: { id: Mode; label: string }[] = [
  { id: 'positions', label: 'Sorteo de posiciones' },
  { id: 'teams', label: 'Elegir equipo' },
  { id: 'players', label: 'Elegir jugador' },
]

const COLORS = ['#0d3060', '#5a1f4d', '#99122f', '#1c4f8c', '#7c3a6b', '#c33b53']

interface Assignment {
  nameId: string
  slotLabel: string
  name: string
  teamId: string
}

export function AdminRoulettePage() {
  const { session } = useAuth()
  const { tournament, settings } = useTournament()
  const { teams } = useTeams(tournament?.id)
  const { groups } = useGroups(tournament?.id)
  const { players } = useTournamentPlayers(tournament?.id)

  const [mode, setMode] = useState<Mode>('positions')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // --- modo "sorteo de posiciones" ---
  const [namesText, setNamesText] = useState('')
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const teamsPerGroup = settings?.teams_per_group ?? 3
  const slots = useMemo(
    () =>
      groups.flatMap((g) =>
        Array.from({ length: teamsPerGroup }, (_, i) => ({
          label: `${g.name}${i + 1}`,
          groupId: g.id,
        })),
      ),
    [groups, teamsPerGroup],
  )

  const parsedNames = useMemo(
    () =>
      namesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((label, i) => ({ id: `n${i}`, label })),
    [namesText],
  )
  const assignedNameIds = new Set(assignments.map((a) => a.nameId))
  const usedTeamIds = new Set(assignments.map((a) => a.teamId))
  const namePool = parsedNames.filter((n) => !assignedNameIds.has(n.id))
  const nextSlot = slots[assignments.length]

  // --- modos "elegir equipo / jugador" ---
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [winner, setWinner] = useState<WheelItem | null>(null)
  const [msg, setMsg] = useState('')

  function resetAll() {
    setRemoved(new Set())
    setWinner(null)
    setAssignments([])
    setMsg('')
    setError('')
  }
  function switchMode(m: Mode) {
    setMode(m)
    resetAll()
  }

  const simplePool: WheelItem[] =
    mode === 'players'
      ? players.filter((p) => !removed.has(p.id)).map((p) => ({ id: p.id, label: p.name }))
      : teams.filter((t) => !removed.has(t.id)).map((t) => ({ id: t.id, label: t.short_name, color: t.color }))

  async function handlePositionResult(item: WheelItem) {
    if (!tournament || !nextSlot) return
    setBusy(true)
    setError('')
    const name = item.label
    const nameId = item.id
    try {
      const available = [...teams]
        .filter((t) => !usedTeamIds.has(t.id))
        .sort((a, b) => a.short_name.localeCompare(b.short_name))
      let teamId: string
      if (available[0]) {
        teamId = available[0].id
        await updateTeam(teamId, {
          name,
          short_name: nextSlot.label,
          group_id: nextSlot.groupId,
        })
      } else {
        const created = await createTeam({
          tournament_id: tournament.id,
          name,
          short_name: nextSlot.label,
          group_id: nextSlot.groupId,
          color: COLORS[assignments.length % COLORS.length],
        })
        teamId = created.id
      }
      await saveRouletteDraw({
        tournament_id: tournament.id,
        draw_type: 'TEAM_GROUP_ASSIGNMENT',
        group_id: nextSlot.groupId,
        result_team_id: teamId,
        eliminated_ids: assignments.map((a) => a.teamId),
        created_by: session?.user.id ?? null,
      })
      setAssignments((prev) => [...prev, { nameId, slotLabel: nextSlot.label, name, teamId }])

      const done = assignments.length + 1
      sileo.success({
        title: `Equipo ${done}/${slots.length} asignado`,
        description: `${nextSlot.label} — ${name}`,
        position: 'top-center',
      })
      if (done === slots.length) {
        sileo.success({
          title: 'Sorteo completo',
          description: `${slots.length} equipos ubicados en sus grupos`,
          position: 'top-center',
          duration: 6000,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar.')
      toast.err(e, 'No se pudo asignar el equipo')
    } finally {
      setBusy(false)
    }
  }

  async function handleSimpleResult(item: WheelItem) {
    setWinner(item)
    toast.ok('Salió en la ruleta', item.label)
  }

  async function registerSimple() {
    if (!winner || !tournament) return
    setError('')
    try {
      await saveRouletteDraw({
        tournament_id: tournament.id,
        draw_type: 'RANDOM_SELECTION',
        result_team_id: mode === 'teams' ? winner.id : null,
        result_player_id: mode === 'players' ? winner.id : null,
        eliminated_ids: [...removed],
        created_by: session?.user.id ?? null,
      })
      setMsg('Resultado registrado.')
      toast.ok('Resultado registrado', winner.label)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar.')
      toast.err(e, 'No se pudo registrar el resultado')
    }
  }

  function removeWinner() {
    if (!winner) return
    setRemoved((s) => new Set(s).add(winner.id))
    toast.info('Quitado del sorteo', winner.label)
    setWinner(null)
    setMsg('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Dices className="h-5 w-5 text-azul-600" />
        <h1 className="text-2xl font-black text-tinta">Ruleta</h1>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => switchMode(m.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === m.id
                ? 'bg-azul-600/10 text-azul-600 ring-1 ring-azul-600/30'
                : 'bg-panel text-tinta-2 ring-1 ring-linea hover:text-tinta'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-vino-400/40 bg-vino-50 px-3 py-2 text-sm text-vino-600">
          {error}
        </p>
      )}

      {mode === 'positions' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Nombres (uno por línea)
              <textarea
                rows={10}
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder={'Los Tigres\nReal Norte\nBarrio FC\n…'}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
            <p className="text-[11px] text-tinta-3">
              {parsedNames.length} nombres · {slots.length} posiciones (A1, A2, …). Cada giro toma un
              nombre al azar y lo pone en la siguiente posición, renombrando ese equipo y asignándole
              el grupo. Queda registrado en <code>roulette_draws</code>.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {slots.map((s, i) => {
                const a = assignments[i]
                return (
                  <div
                    key={s.label}
                    className={`rounded-xl border p-2 text-center ${
                      a
                        ? 'border-azul-200 bg-azul-50'
                        : i === assignments.length
                          ? 'border-azul-600'
                          : 'border-linea bg-panel'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-tinta-3">{s.label}</p>
                    <p className="truncate text-xs font-semibold text-tinta">{a?.name ?? '—'}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-3xl border border-linea bg-panel p-6">
            {slots.length === 0 ? (
              <p className="py-10 text-center text-sm text-tinta-3">
                No hay grupos configurados todavía.
              </p>
            ) : !nextSlot ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Trophy className="h-8 w-8 text-azul-600" />
                <p className="text-lg font-black text-tinta">Sorteo completo</p>
                <p className="text-sm text-tinta-2">Las {slots.length} posiciones quedaron asignadas.</p>
              </div>
            ) : namePool.length === 0 ? (
              <p className="py-10 text-center text-sm text-tinta-3">
                Cargá nombres a la izquierda para empezar.
              </p>
            ) : (
              <>
                <p className="text-xs font-bold tracking-widest text-tinta-3 uppercase">
                  Sorteando {nextSlot.label}
                </p>
                <RouletteWheel items={namePool} disabled={busy} onResult={handlePositionResult} />
              </>
            )}
            {assignments.length > 0 && (
              <button
                type="button"
                onClick={() => setAssignments([])}
                className="flex items-center gap-1 text-xs text-tinta-3 hover:text-tinta-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reiniciar sorteo (no deshace los nombres ya guardados)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-linea bg-panel p-6">
          {winner ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Trophy className="h-8 w-8 text-azul-600" />
              <p className="text-xs font-bold tracking-widest text-tinta-3 uppercase">Seleccionado</p>
              <p className="text-3xl font-black text-tinta">{winner.label}</p>
              {msg && <p className="text-sm text-tinta-2">{msg}</p>}
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWinner(null)
                    setMsg('')
                  }}
                  className="rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500"
                >
                  Girar de nuevo
                </button>
                <button
                  type="button"
                  onClick={removeWinner}
                  className="rounded-full border border-linea px-4 py-2 text-sm text-tinta-2 hover:bg-crema"
                >
                  Quitar del sorteo
                </button>
                <button
                  type="button"
                  onClick={registerSimple}
                  className="rounded-full border border-linea px-4 py-2 text-sm text-tinta-2 hover:bg-crema"
                >
                  Registrar resultado
                </button>
              </div>
            </div>
          ) : (
            <RouletteWheel items={simplePool} disabled={busy} onResult={handleSimpleResult} />
          )}

          <div className="flex items-center gap-3 text-xs text-tinta-3">
            <span>{simplePool.length} en juego</span>
            {removed.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRemoved(new Set())
                  setWinner(null)
                }}
                className="flex items-center gap-1 hover:text-tinta-2"
              >
                <RotateCcw className="h-3 w-3" />
                Restablecer ({removed.size} fuera)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

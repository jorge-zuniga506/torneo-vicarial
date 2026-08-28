import { useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Star, Trash2, UserRound, X } from 'lucide-react'
import { useTournament } from '../../hooks/useTournament'
import { useTeams } from '../../hooks/useTeams'
import { usePlayers } from '../../hooks/usePlayers'
import { usePlayerStats } from '../../hooks/usePlayerStats'
import { createPlayer, updatePlayer, deletePlayer } from '../../services/players'
import { updateTeam } from '../../services/teams'
import { toast } from '../../lib/toast'
import { TeamBadge } from '../../components/TeamBadge'
import type { Player } from '../../types/tournament'

interface Draft {
  name: string
  jersey_number: string
  position: string
  photo_url: string
}

const emptyDraft: Draft = { name: '', jersey_number: '', position: '', photo_url: '' }

function toDraft(p: Player): Draft {
  return {
    name: p.name,
    jersey_number: p.jersey_number?.toString() ?? '',
    position: p.position ?? '',
    photo_url: p.photo_url ?? '',
  }
}

export function AdminPlayersPage() {
  const { tournament } = useTournament()
  const { teams, loading: loadingTeams } = useTeams(tournament?.id)
  const { stats } = usePlayerStats(tournament?.id)

  // Sin efecto: si el admin no eligió equipo todavía, se usa el primero.
  const [pickedTeamId, setPickedTeamId] = useState<string>('')
  const teamId = pickedTeamId || teams[0]?.id || ''
  const setTeamId = setPickedTeamId

  const { players, loading: loadingPlayers } = usePlayers(teamId || undefined)
  const team = teams.find((t) => t.id === teamId)

  const [editing, setEditing] = useState<'new' | Player | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openNew() {
    setEditing('new')
    setDraft(emptyDraft)
    setError('')
  }
  function openEdit(p: Player) {
    setEditing(p)
    setDraft(toDraft(p))
    setError('')
  }
  function close() {
    setEditing(null)
    setError('')
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!teamId) return
    setSaving(true)
    setError('')
    const payload = {
      name: draft.name.trim(),
      jersey_number: draft.jersey_number ? Number(draft.jersey_number) : null,
      position: draft.position.trim() || null,
      photo_url: draft.photo_url.trim() || null,
    }
    try {
      if (editing === 'new') {
        await createPlayer({ ...payload, team_id: teamId })
        toast.ok('Jugador agregado', payload.name)
      } else if (editing) {
        await updatePlayer(editing.id, payload)
        toast.ok('Jugador actualizado', payload.name)
      }
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      toast.err(err, 'No se pudo guardar el jugador')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setError('')
    const name = players.find((p) => p.id === id)?.name
    try {
      if (team?.captain_player_id === id) await updateTeam(team.id, { captain_player_id: null })
      await deletePlayer(id)
      setConfirmDelete(null)
      toast.ok('Jugador eliminado', name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const friendly = /foreign key|violates/i.test(msg)
        ? 'No se puede eliminar: el jugador tiene eventos registrados.'
        : msg || 'No se pudo eliminar.'
      setError(friendly)
      toast.err(friendly)
    }
  }

  async function toggleCaptain(id: string) {
    if (!team) return
    setError('')
    const isNow = team.captain_player_id !== id
    try {
      await updateTeam(team.id, { captain_player_id: isNow ? id : null })
      const name = players.find((p) => p.id === id)?.name
      toast.ok(isNow ? 'Nuevo capitán' : 'Capitán quitado', name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el capitán.')
      toast.err(err, 'No se pudo cambiar el capitán')
    }
  }

  if (loadingTeams) return <p className="py-24 text-center text-tinta-2">Cargando…</p>
  if (teams.length === 0) {
    return (
      <p className="py-24 text-center text-tinta-2">
        Primero creá equipos en <span className="font-semibold">Equipos</span>.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <UserRound className="h-5 w-5 text-azul-600" />
        <h1 className="text-2xl font-black text-tinta">Jugadores</h1>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {teams.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTeamId(t.id)
              close()
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              teamId === t.id
                ? 'bg-azul-600/10 text-azul-600 ring-1 ring-azul-600/30'
                : 'bg-panel text-tinta-2 ring-1 ring-linea hover:text-tinta'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {team && <TeamBadge team={team} size="sm" />}
          <span className="text-xs text-tinta-3">· {players.length} jugadores</span>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo jugador
        </button>
      </div>

      {error && !editing && (
        <p className="rounded-lg border border-vino-400/40 bg-vino-50 px-3 py-2 text-sm text-vino-600">
          {error}
        </p>
      )}

      {editing && (
        <form
          onSubmit={save}
          className="flex flex-col gap-4 rounded-2xl border border-azul-200 bg-panel p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-tinta">
              {editing === 'new' ? 'Nuevo jugador' : `Editar ${editing.name}`}
            </h2>
            <button type="button" onClick={close} className="text-tinta-3 hover:text-tinta">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Nombre
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Dorsal
              <input
                type="number"
                min={0}
                value={draft.jersey_number}
                onChange={(e) => setDraft({ ...draft, jersey_number: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Posición (opcional)
              <input
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                placeholder="Arquero, defensa…"
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              URL de foto (opcional)
              <input
                value={draft.photo_url}
                onChange={(e) => setDraft({ ...draft, photo_url: e.target.value })}
                placeholder="https://…"
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
          </div>
          {error && <p className="text-sm text-vino-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-linea px-4 py-2 text-sm text-tinta-2 hover:bg-crema"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loadingPlayers ? (
        <p className="py-10 text-center text-tinta-2">Cargando…</p>
      ) : players.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea-2 py-12 text-center text-sm text-tinta-3">
          Este equipo no tiene jugadores. Agregá el primero.
        </p>
      ) : (
        <ul className="divide-y divide-linea rounded-2xl border border-linea bg-panel">
          {players.map((p) => {
            const s = stats.find((x) => x.player_id === p.id)
            const isCaptain = team?.captain_player_id === p.id
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="w-6 flex-none text-center font-mono text-xs text-tinta-3">
                  {p.jersey_number ?? '–'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleCaptain(p.id)}
                  title={isCaptain ? 'Quitar capitán' : 'Marcar como capitán'}
                  className={`flex-none rounded p-1 ${
                    isCaptain ? 'text-azul-600' : 'text-tinta-3 hover:text-tinta-2'
                  }`}
                >
                  <Star className={`h-4 w-4 ${isCaptain ? 'fill-current' : ''}`} />
                </button>
                <span className="flex-1 text-tinta">{p.name}</span>
                {p.position && <span className="text-xs text-tinta-3">{p.position}</span>}
                <span className="flex items-center gap-2 text-xs text-tinta-2">
                  <span title="Goles">G {s?.goals ?? 0}</span>
                  <span title="Asistencias">A {s?.assists ?? 0}</span>
                  <span title="Amarillas / rojas">
                    T {s?.yellow_cards ?? 0}/{s?.red_cards ?? 0}
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  {confirmDelete === p.id ? (
                    <>
                      <span className="text-xs text-tinta-2">¿Eliminar?</span>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        className="rounded-full bg-vino-500 px-3 py-1 text-xs font-semibold text-white hover:bg-vino-600"
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-full border border-linea px-3 py-1 text-xs text-tinta-2 hover:bg-crema"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-1.5 text-tinta-3 hover:bg-crema hover:text-azul-600"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(p.id)
                          setError('')
                        }}
                        className="rounded-lg p-1.5 text-tinta-3 hover:bg-crema hover:text-vino-600"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

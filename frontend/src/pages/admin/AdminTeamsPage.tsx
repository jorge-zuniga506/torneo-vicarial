import { useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2, Users2, X } from 'lucide-react'
import { useTournament } from '../../hooks/useTournament'
import { useTeams } from '../../hooks/useTeams'
import { useGroups } from '../../hooks/useGroups'
import { createTeam, updateTeam, deleteTeam } from '../../services/teams'
import { toast } from '../../lib/toast'
import { TeamBadge } from '../../components/TeamBadge'
import type { Team } from '../../types/tournament'

interface Draft {
  name: string
  short_name: string
  group_id: string
  color: string
  logo_url: string
}

const emptyDraft: Draft = { name: '', short_name: '', group_id: '', color: '#0d3060', logo_url: '' }

function toDraft(t: Team): Draft {
  return {
    name: t.name,
    short_name: t.short_name,
    group_id: t.group_id ?? '',
    color: t.color ?? '#0d3060',
    logo_url: t.logo_url ?? '',
  }
}

export function AdminTeamsPage() {
  const { tournament } = useTournament()
  const { teams, loading } = useTeams(tournament?.id)
  const { groups, byId } = useGroups(tournament?.id)

  const [editing, setEditing] = useState<'new' | Team | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openNew() {
    setEditing('new')
    setDraft(emptyDraft)
    setError('')
  }
  function openEdit(t: Team) {
    setEditing(t)
    setDraft(toDraft(t))
    setError('')
  }
  function close() {
    setEditing(null)
    setError('')
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!tournament) return
    setSaving(true)
    setError('')
    const payload = {
      name: draft.name.trim(),
      short_name: draft.short_name.trim(),
      group_id: draft.group_id || null,
      color: draft.color || null,
      logo_url: draft.logo_url.trim() || null,
    }
    try {
      if (editing === 'new') {
        await createTeam({ ...payload, tournament_id: tournament.id })
        toast.ok('Equipo creado', payload.name)
      } else if (editing) {
        await updateTeam(editing.id, payload)
        toast.ok('Equipo actualizado', payload.name)
      }
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      toast.err(err, 'No se pudo guardar el equipo')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setError('')
    const name = teams.find((t) => t.id === id)?.name
    try {
      await deleteTeam(id)
      setConfirmDelete(null)
      toast.ok('Equipo eliminado', name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const friendly = /foreign key|violates/i.test(msg)
        ? 'No se puede eliminar: el equipo tiene partidos o jugadores asignados.'
        : msg || 'No se pudo eliminar.'
      setError(friendly)
      toast.err(friendly)
    }
  }

  const orderedGroupIds: (string | null)[] = [
    ...groups.map((g) => g.id),
    ...(teams.some((t) => !t.group_id) ? [null] : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-azul-600" />
          <h1 className="text-2xl font-black text-tinta">Equipos</h1>
          <span className="text-sm text-tinta-3">· {teams.length}</span>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo equipo
        </button>
      </header>

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
              {editing === 'new' ? 'Nuevo equipo' : `Editar ${editing.name}`}
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
              Nombre corto
              <input
                required
                maxLength={5}
                value={draft.short_name}
                onChange={(e) => setDraft({ ...draft, short_name: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Grupo
              <select
                value={draft.group_id}
                onChange={(e) => setDraft({ ...draft, group_id: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              >
                <option value="">Sin grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    Grupo {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Color
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  className="h-9 w-12 flex-none rounded border border-linea bg-crema"
                />
                <input
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  className="w-full rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2 sm:col-span-2">
              URL del logo (opcional)
              <input
                value={draft.logo_url}
                onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })}
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

      {loading ? (
        <p className="py-16 text-center text-tinta-2">Cargando…</p>
      ) : (
        <div className="flex flex-col gap-6">
          {orderedGroupIds.map((gid) => {
            const list = teams.filter((t) => t.group_id === gid)
            if (list.length === 0) return null
            return (
              <section key={gid ?? 'sin'} className="flex flex-col gap-2">
                <h2 className="text-xs font-bold tracking-widest text-tinta-2 uppercase">
                  {gid ? `Grupo ${byId.get(gid)?.name}` : 'Sin grupo'}
                </h2>
                <ul className="divide-y divide-linea rounded-2xl border border-linea bg-panel">
                  {list.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <TeamBadge team={t} size="sm" />
                      <span className="text-xs text-tinta-3">{t.short_name}</span>
                      <div className="ml-auto flex items-center gap-1">
                        {confirmDelete === t.id ? (
                          <>
                            <span className="text-xs text-tinta-2">¿Eliminar?</span>
                            <button
                              type="button"
                              onClick={() => remove(t.id)}
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
                              onClick={() => openEdit(t)}
                              className="rounded-lg p-1.5 text-tinta-3 hover:bg-crema hover:text-azul-600"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDelete(t.id)
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
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

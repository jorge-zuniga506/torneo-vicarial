import { useMemo, useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GripVertical, Pencil, Plus, Radio, RefreshCw, Swords, Trash2, X } from 'lucide-react'
import { useTournament } from '../../hooks/useTournament'
import { useMatches } from '../../hooks/useMatches'
import { useTeams } from '../../hooks/useTeams'
import { useGroups } from '../../hooks/useGroups'
import { createMatch, updateMatch, deleteMatch, updateMatchTimes } from '../../services/matches'
import { updateTournamentSettings } from '../../services/tournament'
import { toast } from '../../lib/toast'
import { scheduleChanges, localDatePart, timeToMinutes } from '../../utils/schedule'
import {
  STATUS_LABELS,
  STATUS_PILL,
  STAGE_LABELS,
  STAGE_LABELS_SHORT,
  formatKickoff,
} from '../../utils/matchLabels'
import type { MatchStage, MatchStatus, MatchWithTeams } from '../../types/tournament'

const STAGES: MatchStage[] = ['GROUP', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL']
const STATUSES: MatchStatus[] = [
  'PROGRAMADO',
  'CALENTAMIENTO',
  'EN_JUEGO',
  'DESCANSO',
  'FINALIZADO',
  'SUSPENDIDO',
  'CANCELADO',
]

const pad = (n: number) => String(n).padStart(2, '0')

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocalInput(s: string): string {
  return new Date(s).toISOString()
}
/** minutos desde medianoche -> "12:15 p. m." */
function minuteLabel(min: number): string {
  const base = new Date()
  base.setHours(0, min, 0, 0)
  return base.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

interface Draft {
  stage: MatchStage
  group_id: string
  matchday: string
  home_team_id: string
  away_team_id: string
  scheduled_at: string
  venue: string
  status: MatchStatus
}

function newDraft(): Draft {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  return {
    stage: 'GROUP',
    group_id: '',
    matchday: '',
    home_team_id: '',
    away_team_id: '',
    scheduled_at: toLocalInput(d.toISOString()),
    venue: 'Cancha principal',
    status: 'PROGRAMADO',
  }
}

function toDraft(m: MatchWithTeams): Draft {
  return {
    stage: m.stage,
    group_id: m.group_id ?? '',
    matchday: m.matchday?.toString() ?? '',
    home_team_id: m.home_team_id ?? '',
    away_team_id: m.away_team_id ?? '',
    scheduled_at: toLocalInput(m.scheduled_at),
    venue: m.venue,
    status: m.status,
  }
}

export function AdminMatchesPage() {
  const { tournament, settings } = useTournament()
  const { matches, loading } = useMatches(tournament?.id)
  const { teams } = useTeams(tournament?.id)
  const { groups, byId: groupsById } = useGroups(tournament?.id)

  const [editing, setEditing] = useState<'new' | MatchWithTeams | null>(null)
  const [draft, setDraft] = useState<Draft>(newDraft())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [slotOverride, setSlotOverride] = useState<number | null>(null)
  const [savingSlot, setSavingSlot] = useState(false)
  const [reflowing, setReflowing] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)

  const slotMinutes = slotOverride ?? settings?.slot_minutes ?? 15

  const sorted = useMemo(
    () =>
      [...matches].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      ),
    [matches],
  )

  const displayOrder = useMemo(() => {
    if (!pendingOrder) return sorted
    const byId = new Map(sorted.map((m) => [m.id, m]))
    const head = pendingOrder.map((id) => byId.get(id)).filter((m): m is MatchWithTeams => !!m)
    const tail = sorted.filter((m) => !pendingOrder.includes(m.id))
    return [...head, ...tail]
  }, [sorted, pendingOrder])

  const anchorDate = displayOrder[0]
    ? localDatePart(displayOrder[0].scheduled_at)
    : tournament?.starts_at
      ? localDatePart(tournament.starts_at)
      : localDatePart(new Date().toISOString())

  const breakStartMin = settings?.break_start_time ? timeToMinutes(settings.break_start_time) : null
  const breakEndMin = settings?.break_end_time ? timeToMinutes(settings.break_end_time) : null
  const storedMin = (iso: string) => {
    const d = new Date(iso)
    return d.getHours() * 60 + d.getMinutes()
  }

  function openNew() {
    setEditing('new')
    setDraft(newDraft())
    setError('')
  }
  function openEdit(m: MatchWithTeams) {
    setEditing(m)
    setDraft(toDraft(m))
    setError('')
  }
  function close() {
    setEditing(null)
    setError('')
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!tournament) return
    if (draft.home_team_id && draft.home_team_id === draft.away_team_id) {
      setError('El local y el visitante no pueden ser el mismo equipo.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      stage: draft.stage,
      group_id: draft.stage === 'GROUP' ? draft.group_id || null : null,
      matchday: draft.matchday ? Number(draft.matchday) : null,
      home_team_id: draft.home_team_id || null,
      away_team_id: draft.away_team_id || null,
      scheduled_at: fromLocalInput(draft.scheduled_at),
      venue: draft.venue.trim() || 'Cancha principal',
    }
    try {
      if (editing === 'new') {
        await createMatch({ ...payload, tournament_id: tournament.id })
        toast.ok('Partido creado')
      } else if (editing) {
        await updateMatch(editing.id, { ...payload, status: draft.status })
        toast.ok('Partido actualizado')
      }
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      toast.err(err, 'No se pudo guardar el partido')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setError('')
    try {
      await deleteMatch(id)
      setConfirmDelete(null)
      toast.ok('Partido eliminado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.')
      toast.err(err, 'No se pudo eliminar el partido')
    }
  }

  async function persist(changes: { id: string; scheduled_at: string }[]) {
    if (changes.length === 0) {
      setTimeout(() => setPendingOrder(null), 400)
      return
    }
    setReflowing(true)
    setError('')
    try {
      await updateMatchTimes(changes)
      toast.ok('Horarios recalculados', `${changes.length} partido(s)`)
      // dar tiempo a que Realtime traiga los nuevos horarios antes de soltar
      // el orden optimista, así la lista no parpadea.
      setTimeout(() => setPendingOrder(null), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los horarios.')
      toast.err(err, 'No se pudieron guardar los horarios')
      setPendingOrder(null)
    } finally {
      setReflowing(false)
    }
  }

  function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault()
    const srcId = dragIdRef.current
    setDragId(null)
    setOverId(null)
    dragIdRef.current = null
    if (!srcId || srcId === targetId || !settings) return

    const ids = displayOrder.map((m) => m.id)
    const from = ids.indexOf(srcId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, srcId)
    setPendingOrder(ids)

    const orderedSlots = ids
      .map((id) => sorted.find((m) => m.id === id))
      .filter((m): m is MatchWithTeams => !!m)
      .map((m) => ({ id: m.id, scheduled_at: m.scheduled_at }))
    void persist(scheduleChanges(orderedSlots, settings, anchorDate, slotMinutes))
  }

  function recalc() {
    if (!settings) return
    setPendingOrder(displayOrder.map((m) => m.id))
    void persist(
      scheduleChanges(
        displayOrder.map((m) => ({ id: m.id, scheduled_at: m.scheduled_at })),
        settings,
        anchorDate,
        slotMinutes,
      ),
    )
  }

  async function saveSlot() {
    if (!tournament) return
    setSavingSlot(true)
    setError('')
    try {
      await updateTournamentSettings(tournament.id, { slot_minutes: slotMinutes })
      toast.ok('Intervalo guardado', `${slotMinutes} min entre partidos`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el intervalo.')
      toast.err(err, 'No se pudo guardar el intervalo')
    } finally {
      setSavingSlot(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-azul-600" />
          <h1 className="text-2xl font-black text-tinta">Partidos</h1>
          <span className="text-sm text-tinta-3">· {matches.length}</span>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo partido
        </button>
      </header>

      {/* Programación automática */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-linea bg-panel p-4">
        <label className="flex items-center gap-2 text-xs font-medium text-tinta-2">
          Minutos entre partidos
          <input
            type="number"
            min={1}
            value={slotMinutes}
            onChange={(e) => setSlotOverride(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 rounded-lg border border-linea bg-crema px-2 py-1.5 text-sm text-tinta outline-none focus:border-azul-600"
          />
        </label>
        <button
          type="button"
          onClick={saveSlot}
          disabled={savingSlot || slotMinutes === (settings?.slot_minutes ?? 15)}
          className="rounded-full border border-linea px-3 py-1.5 text-xs font-semibold text-tinta-2 hover:bg-crema disabled:opacity-40"
        >
          {savingSlot ? 'Guardando…' : 'Guardar intervalo'}
        </button>
        <button
          type="button"
          onClick={recalc}
          disabled={reflowing || displayOrder.length === 0}
          className="flex items-center gap-1.5 rounded-full bg-azul-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-azul-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${reflowing ? 'animate-spin' : ''}`} />
          Recalcular horarios
        </button>
        <p className="w-full text-[11px] text-tinta-3">
          Arrastrá un partido para cambiar su lugar en el orden: los horarios se reasignan solos
          desde {settings ? minuteLabel(timeToMinutes(settings.tournament_start_time)) : '—'}, y los
          que caen en la pausa se corren después de ella.
        </p>
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
              {editing === 'new' ? 'Nuevo partido' : 'Editar partido'}
            </h2>
            <button type="button" onClick={close} className="text-tinta-3 hover:text-tinta">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Fase
              <select
                value={draft.stage}
                onChange={(e) => setDraft({ ...draft, stage: e.target.value as MatchStage })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>

            {draft.stage === 'GROUP' ? (
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
            ) : (
              <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
                Jornada (opcional)
                <input
                  type="number"
                  min={1}
                  value={draft.matchday}
                  onChange={(e) => setDraft({ ...draft, matchday: e.target.value })}
                  className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Local
              <select
                value={draft.home_team_id}
                onChange={(e) => setDraft({ ...draft, home_team_id: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              >
                <option value="">Por definir</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Visitante
              <select
                value={draft.away_team_id}
                onChange={(e) => setDraft({ ...draft, away_team_id: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              >
                <option value="">Por definir</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Fecha y hora
              <input
                type="datetime-local"
                required
                value={draft.scheduled_at}
                onChange={(e) => setDraft({ ...draft, scheduled_at: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
              <span className="text-[11px] font-normal text-tinta-3">
                Ojo: al arrastrar o recalcular se sobrescribe con el horario automático.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
              Cancha
              <input
                value={draft.venue}
                onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
                className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>

            {editing !== 'new' && (
              <label className="flex flex-col gap-1.5 text-xs font-medium text-tinta-2">
                Estado
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as MatchStatus })}
                  className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] font-normal text-tinta-3">
                  Para jugar el partido usá el control en vivo, no este campo.
                </span>
              </label>
            )}
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
      ) : displayOrder.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea-2 py-16 text-center text-sm text-tinta-3">
          No hay partidos. Creá el primero con “Nuevo partido”.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {displayOrder.map((m, idx) => {
            const prevM = idx > 0 ? displayOrder[idx - 1] : null
            const showBreak =
              breakStartMin != null &&
              breakEndMin != null &&
              prevM != null &&
              storedMin(prevM.scheduled_at) < breakStartMin &&
              storedMin(m.scheduled_at) >= breakEndMin
            return (
              <li key={m.id}>
                {showBreak && (
                  <div className="my-1 flex items-center gap-2 px-2 text-[11px] font-bold tracking-widest text-vino-600 uppercase">
                    <span className="h-px flex-1 bg-vino-400/40" />
                    Pausa {minuteLabel(breakStartMin!)} – {minuteLabel(breakEndMin!)}
                    <span className="h-px flex-1 bg-vino-400/40" />
                  </div>
                )}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (overId !== m.id) setOverId(m.id)
                  }}
                  onDrop={(e) => handleDrop(e, m.id)}
                  className={`flex flex-col gap-2 rounded-2xl border bg-panel p-3 transition-colors sm:flex-row sm:items-center sm:gap-3 ${
                    overId === m.id && dragId && dragId !== m.id
                      ? 'border-azul-600 ring-1 ring-azul-600/30'
                      : 'border-linea'
                  } ${dragId === m.id ? 'opacity-50' : ''}`}
                >
                  {/* Fila meta */}
                  <div className="flex items-center gap-2 sm:flex-none">
                    <span
                      draggable
                      onDragStart={(e) => {
                        dragIdRef.current = m.id
                        setDragId(m.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverId(null)
                        dragIdRef.current = null
                      }}
                      className="flex-none cursor-grab touch-none text-tinta-3 hover:text-tinta-2 active:cursor-grabbing"
                      title="Arrastrar para reordenar"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>

                    <span className="w-14 flex-none font-mono text-sm font-bold text-tinta">
                      {formatKickoff(m.scheduled_at)}
                    </span>

                    <span className="rounded-full bg-crema px-2 py-0.5 text-[11px] font-medium text-tinta-2">
                      {STAGE_LABELS_SHORT[m.stage]}
                      {m.group_id ? ` · ${groupsById.get(m.group_id)?.name ?? ''}` : ''}
                    </span>

                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold sm:ml-0 ${STATUS_PILL[m.status]}`}
                    >
                      {STATUS_LABELS[m.status]}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-tinta">
                    <span className="truncate">{m.home_team?.name ?? 'Por definir'}</span>
                    <span className="font-mono font-bold text-tinta-3">vs</span>
                    <span className="truncate">{m.away_team?.name ?? 'Por definir'}</span>
                  </div>

                  <div className="flex flex-none items-center gap-1 self-end sm:self-auto">
                    {confirmDelete === m.id ? (
                      <>
                        <span className="text-xs text-tinta-2">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => remove(m.id)}
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
                        <Link
                          to={`/admin/matches/${m.id}`}
                          className="flex items-center gap-1 rounded-full border border-azul-200 px-3 py-1 text-xs font-semibold text-azul-600 hover:bg-azul-50"
                        >
                          <Radio className="h-3.5 w-3.5" />
                          Control
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="rounded-lg p-1.5 text-tinta-3 hover:bg-crema hover:text-azul-600"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDelete(m.id)
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
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

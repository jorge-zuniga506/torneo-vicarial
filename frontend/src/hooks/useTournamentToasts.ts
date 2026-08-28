import { useEffect, useRef } from 'react'
import { sileo } from 'sileo'
import { supabase } from '../lib/supabase'
import { fetchMatchById } from '../services/matches'
import type { EventType } from '../types/tournament'

interface EventRow {
  id: string
  match_id: string
  team_id: string | null
  player_id: string | null
  event_type: EventType
}

const TOASTED: EventType[] = ['GOAL', 'START', 'HALFTIME', 'RESUME', 'END', 'YELLOW_CARD', 'RED_CARD']

/**
 * Escucha Realtime y muestra un toast (sileo) cuando pasa algo importante:
 * gol, inicio, descanso, segundo tiempo, final y campeón. Se monta una sola
 * vez (ver <TournamentToasts/>), así vale para la página pública y el admin.
 */
export function useTournamentToasts(tournamentId: string | undefined) {
  const seen = useRef<Set<string>>(new Set())
  const championAnnounced = useRef(false)

  useEffect(() => {
    if (!tournamentId) return
    let alive = true

    async function onEvent(payload: { new: EventRow }) {
      const ev = payload.new
      if (!ev?.id || seen.current.has(ev.id) || !TOASTED.includes(ev.event_type)) return
      seen.current.add(ev.id)

      let match
      try {
        match = await fetchMatchById(ev.match_id)
      } catch {
        return
      }
      if (!alive || match.tournament_id !== tournamentId) return

      const hn = match.home_team?.short_name ?? match.home_team?.name ?? 'Local'
      const an = match.away_team?.short_name ?? match.away_team?.name ?? 'Visitante'
      const score = `${hn} ${match.home_score} - ${match.away_score} ${an}`
      const pos = 'top-center' as const

      if (ev.event_type === 'GOAL') {
        let scorer = ''
        if (ev.player_id) {
          const { data } = await supabase
            .from('players')
            .select('name')
            .eq('id', ev.player_id)
            .maybeSingle()
          if (data?.name) scorer = data.name
        }
        const team =
          ev.team_id === match.home_team_id
            ? (match.home_team?.name ?? hn)
            : (match.away_team?.name ?? an)
        sileo.success({
          title: '¡GOL!',
          description: scorer ? `${scorer} — ${team}  ·  ${score}` : `${team}  ·  ${score}`,
          position: pos,
          duration: 5000,
        })
      } else if (ev.event_type === 'START') {
        sileo.info({ title: 'Comenzó el partido', description: `${hn} vs ${an}`, position: pos })
      } else if (ev.event_type === 'HALFTIME') {
        sileo.info({ title: 'Entretiempo', description: score, position: pos })
      } else if (ev.event_type === 'RESUME') {
        sileo.info({ title: 'Arrancó el segundo tiempo', description: score, position: pos })
      } else if (ev.event_type === 'END') {
        sileo.info({ title: 'Final del partido', description: score, position: pos })
      } else if (ev.event_type === 'YELLOW_CARD') {
        sileo.warning({ title: 'Tarjeta amarilla', description: score, position: pos })
      } else if (ev.event_type === 'RED_CARD') {
        sileo.error({ title: 'Tarjeta roja', description: score, position: pos })
      }
    }

    function onTournament(payload: { new: { id: string; champion_team_id: string | null } }) {
      const t = payload.new
      if (t?.id !== tournamentId || !t.champion_team_id || championAnnounced.current) return
      championAnnounced.current = true
      supabase
        .from('teams')
        .select('name')
        .eq('id', t.champion_team_id)
        .maybeSingle()
        .then(({ data }) => {
          if (alive && data?.name) {
            sileo.success({
              title: '¡Tenemos campeón!',
              description: data.name,
              position: 'top-center',
              duration: 8000,
            })
          }
        })
    }

    const channel = supabase
      .channel(`toasts-${tournamentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_events' },
        onEvent,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
        onTournament,
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [tournamentId])
}

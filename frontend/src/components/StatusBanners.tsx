import { ArrowRight, PauseCircle, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PauseBanner({ resumeTime }: { resumeTime: string | null }) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-3xl border border-linea bg-panel py-16 text-center">
      <PauseCircle className="h-10 w-10 text-tinta-3" />
      <h2 className="text-xl font-bold text-tinta">Pausa del torneo</h2>
      {resumeTime && <p className="text-tinta-2">El torneo continúa a las {resumeTime}</p>}
    </section>
  )
}

export function FinishedBanner() {
  return (
    <Link
      to="/champion"
      className="flex flex-col items-center gap-2 rounded-3xl border border-viol-600/30 bg-panel py-16 text-center transition hover:border-viol-600/60"
    >
      <Trophy className="h-10 w-10 text-viol-600" />
      <h2 className="text-xl font-bold text-tinta">Torneo finalizado</h2>
      <p className="flex items-center gap-1 text-tinta-2">
        Ver al campeón <ArrowRight className="h-4 w-4" />
      </p>
    </Link>
  )
}

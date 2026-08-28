import { Construction } from 'lucide-react'

/** Placeholder honesto para páginas todavía no construidas (ver lista de tareas). */
export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-linea-2 py-24 text-center text-tinta-2">
      <Construction className="h-8 w-8 text-tinta-3" />
      <h1 className="text-lg font-semibold text-tinta">{title}</h1>
      {note && <p className="max-w-md text-sm">{note}</p>}
    </div>
  )
}

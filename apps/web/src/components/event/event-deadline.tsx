export function EventDeadline({ label, date }: { label: string; date: string }) {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <time dateTime={date}>{new Date(date).toLocaleString('pt-BR')}</time>
    </p>
  )
}

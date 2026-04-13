interface LiveIndicatorProps {
  label?: string
  color?: 'green' | 'yellow' | 'red'
}

export default function LiveIndicator({
  label = 'Live',
  color = 'green'
}: LiveIndicatorProps) {
  const colors = {
    green:  { dot: 'bg-green-500',  ring: 'bg-green-500', text: 'text-green-400' },
    yellow: { dot: 'bg-yellow-500', ring: 'bg-yellow-500', text: 'text-yellow-400' },
    red:    { dot: 'bg-red-500',    ring: 'bg-red-500',    text: 'text-red-400' },
  }
  const c = colors[color]

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <div className={`absolute w-3 h-3 rounded-full ${c.ring} opacity-30 animate-ping`} />
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
      </div>
      <span className={`text-xs font-medium ${c.text}`}>{label}</span>
    </div>
  )
}
import LiveIndicator from './LiveIndicator'

interface SensorCardProps {
  label: string
  value: number | string
  unit: string
  icon: string
  status: 'normal' | 'warning' | 'danger'
  safeRange?: string
  live?: boolean
}

export default function SensorCard({
  label, value, unit, icon, status, safeRange, live = false
}: SensorCardProps) {
  const statusColors = {
    normal:  'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    danger:  'border-red-500/30 bg-red-500/5',
  }
  const valueColors = {
    normal:  'text-green-400',
    warning: 'text-yellow-400',
    danger:  'text-red-400',
  }
  const liveColor = {
    normal:  'green' as const,
    warning: 'yellow' as const,
    danger:  'red' as const,
  }

  return (
    <div className={`rounded-xl border p-5 transition-all duration-300 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {live
          ? <LiveIndicator color={liveColor[status]} />
          : <div className={`w-2 h-2 rounded-full ${
              status === 'normal' ? 'bg-green-500' :
              status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
        }
      </div>
      <div className={`text-3xl font-bold ${valueColors[status]} mb-1`}>
        {value}
        <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>
      </div>
      <div className="text-sm text-gray-400">{label}</div>
      {safeRange && (
        <div className="text-xs text-gray-600 mt-1">Safe: {safeRange}</div>
      )}
    </div>
  )
}
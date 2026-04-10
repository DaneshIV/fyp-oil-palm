interface SensorCardProps {
  label: string
  value: number | string
  unit: string
  icon: string
  status: 'normal' | 'warning' | 'danger'
}

export default function SensorCard({
  label, value, unit, icon, status
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
  const dotColors = {
    normal:  'bg-green-500',
    warning: 'bg-yellow-500',
    danger:  'bg-red-500',
  }

  return (
    <div className={`rounded-xl border p-5 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className={`w-2 h-2 rounded-full ${dotColors[status]} animate-pulse`} />
      </div>
      <div className={`text-3xl font-bold ${valueColors[status]} mb-1`}>
        {value}
        <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}
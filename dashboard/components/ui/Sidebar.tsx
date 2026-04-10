'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Activity,
  Microscope,
  Settings,
  BarChart3,
  Leaf,
} from 'lucide-react'

const navItems = [
  { href: '/',           label: 'Overview',   icon: LayoutDashboard },
  { href: '/sensors',    label: 'Sensors',    icon: Activity },
  { href: '/disease',    label: 'Disease AI', icon: Microscope },
  { href: '/automation', label: 'Automation', icon: Settings },
  { href: '/reports',    label: 'Reports',    icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Oil Palm IoT</div>
            <div className="text-xs text-gray-400">FYP Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          IRIV PiControl AgriBox v2
        </div>
        <div className="text-xs text-gray-600 text-center mt-1">
          v1.0.0 — FYP 2024
        </div>
      </div>
    </aside>
  )
}
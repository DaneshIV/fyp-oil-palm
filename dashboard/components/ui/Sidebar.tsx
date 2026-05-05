'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Activity,
  Microscope,
  Settings,
  BarChart3,
  Leaf,
  Camera,
  Shield,
  LogOut,
} from 'lucide-react'
import Cookies from 'js-cookie'

const navItems = [
  { href: '/',               label: 'Overview',   icon: LayoutDashboard },
  { href: '/sensors',        label: 'Sensors',    icon: Activity },
  { href: '/disease',        label: 'Disease AI', icon: Microscope },
  { href: '/disease/detect', label: 'AI Test',    icon: Camera },
  { href: '/security',       label: 'Security',   icon: Shield },
  { href: '/security/snapshots', label: 'Snapshots', icon: Camera },
  { href: '/automation',     label: 'Automation', icon: Settings },
  { href: '/reports',        label: 'Reports',    icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const username = Cookies.get('username') || 'Admin'

  const handleLogout = () => {
    Cookies.remove('auth_token')
    Cookies.remove('username')
    router.push('/login')
  }

  return (
    <aside className="w-full md:w-60 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col md:h-screen">
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Oil Palm IoT</div>
            <div className="text-xs text-gray-400 hidden md:block">FYP Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex md:flex-col p-2 md:p-4 gap-1 overflow-x-auto md:overflow-x-visible">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm transition-colors whitespace-nowrap ${
                active
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="hidden md:block mt-auto p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          IRIV PiControl AgriBox v2
        </div>
        <div className="text-xs text-gray-600 text-center mt-1">
          v1.0.0 — FYP 2024
        </div>
      </div>

      {/* User + Logout */}
      <div className="border-t border-gray-800 pt-4 mt-2 px-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-semibold">{username}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors group"
            title="Logout"
          >
            <LogOut size={16} className="text-gray-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  )
}
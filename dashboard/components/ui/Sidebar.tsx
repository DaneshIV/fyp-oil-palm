'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Activity, Microscope, Camera,
  Shield, Map, Settings, BarChart3, Zap,
  LogOut, ChevronRight, Terminal, Cpu,
} from 'lucide-react'
import Cookies from 'js-cookie'

const NAV_ITEMS = [
  { href: '/',                   label: 'Command Overview', icon: LayoutDashboard, group: 'MONITORING' },
  { href: '/sensors',            label: 'Sensor Matrix',    icon: Activity,        group: 'MONITORING' },
  { href: '/disease',            label: 'Disease AI',       icon: Microscope,      group: 'ANALYSIS'   },
  { href: '/disease/detect',     label: 'AI Detection',     icon: Camera,          group: 'ANALYSIS'   },
  { href: '/security',           label: 'Security Monitor', icon: Shield,          group: 'SECURITY'   },
  { href: '/security/snapshots', label: 'Snapshots',        icon: Camera,          group: 'SECURITY'   },
  { href: '/map',                label: 'Block Map',        icon: Map,             group: 'FIELD'      },
  { href: '/automation',         label: 'Relay Control',    icon: Settings,        group: 'CONTROL'    },
  { href: '/reports',            label: 'Reports',          icon: BarChart3,       group: 'DATA'       },
]

const GROUPS = ['MONITORING', 'ANALYSIS', 'SECURITY', 'FIELD', 'CONTROL', 'DATA']

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const username = Cookies.get('username') || 'admin'

  const handleLogout = () => {
    Cookies.remove('auth_token')
    Cookies.remove('username')
    window.location.href = '/login'
  }

  return (
    <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen shrink-0 font-mono relative">
      {/* Top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

      {/* Logo */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-emerald-400/10 border border-emerald-400/20">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-100">
              AgriBox v2
            </p>
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">
              IRIV PiControl // IoT
            </p>
          </div>
        </div>

        {/* System status */}
        <div className="flex items-center gap-1.5 mt-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-emerald-400">
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {GROUPS.map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group)
          if (!items.length) return null
          return (
            <div key={group}>
              <p className="text-[8px] uppercase tracking-widest text-zinc-700 font-bold px-2 mb-1">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== '/' && pathname.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-md
                        text-[11px] uppercase tracking-widest
                        transition-all duration-200 group relative
                        ${active
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/30'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400 rounded-r" />
                      )}
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-emerald-400/60" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* System info */}
      <div className="px-4 py-3 border-t border-zinc-800/50">
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { label: 'MODEL',   value: 'YOLOv8n v4' },
            { label: 'MAP50',   value: '74.6%'      },
            { label: 'RELAYS',  value: '5-CH'       },
            { label: 'DB',      value: 'MySQL 8.0'  },
          ].map(stat => (
            <div key={stat.label} className="bg-zinc-950 rounded px-2 py-1 border border-zinc-800">
              <p className="text-[7px] uppercase tracking-widest text-zinc-700">{stat.label}</p>
              <p className="text-[9px] font-mono text-zinc-500">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User + logout */}
      <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Terminal className="w-3 h-3 text-zinc-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-300 font-bold">{username}</p>
              <p className="text-[8px] uppercase tracking-widest text-zinc-600">OPERATOR</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors group cursor-pointer border border-transparent hover:border-rose-500/20"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-600 group-hover:text-rose-500 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  )
}
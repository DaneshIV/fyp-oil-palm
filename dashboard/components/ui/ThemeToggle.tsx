'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      title="Toggle theme"
    >
      {dark
        ? <Sun size={14} className="text-yellow-400" />
        : <Moon size={14} className="text-blue-400" />
      }
    </button>
  )
}
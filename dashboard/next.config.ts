import path from 'path'
import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest:          'public',
  register:      true,
  skipWaiting:   true,
  disable:       process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  turbopack: {},
}

module.exports = withPWA(nextConfig)
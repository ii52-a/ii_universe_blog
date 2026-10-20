import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  outputFileTracingRoot: path.resolve('.'),
  poweredByHeader: false,
}

export default nextConfig

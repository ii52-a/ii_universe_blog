import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  outputFileTracingRoot: path.resolve('.'),
  outputFileTracingIncludes: { '/*': ['./db/tutorials/*.md'] },
  poweredByHeader: false,
  webpack(config, { isServer, nextRuntime }) {
    // Node workers load their emitted chunk beside the server runtime.
    if (isServer && nextRuntime === 'nodejs') config.output.workerPublicPath = './'
    return config
  },
}

export default nextConfig

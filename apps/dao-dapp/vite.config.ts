import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoRoot = path.resolve(__dirname, '../..')

function appVersion(): string {
  const pkgPath = path.join(__dirname, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }
  return pkg.version
}

function gitShortSha(): string {
  const full =
    process.env.GITHUB_SHA ||
    process.env.CI_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA
  if (full) return full.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      cwd: repoRoot
    }).trim()
  } catch {
    return 'local'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
    __GIT_SHA__: JSON.stringify(gitShortSha())
  },
  resolve: {
    alias: {
      '@docs': path.resolve(__dirname, '../../docs'),
    },
  },
})

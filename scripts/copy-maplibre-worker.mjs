// MapLibre GL v6 loads its web worker from a separate ESM file, resolving the URL
// from import.meta.url inside the library. Under Next/Turbopack that resolves to a
// bundled chunk path where the worker isn't served, so the worker is never created
// — and because GeoJSON is parsed IN that worker, every GeoJSON source hangs
// unloaded while raster tiles (which need no parsing) draw normally. The result is
// a basemap with none of our arcs or airport dots on it.
//
// Copying the worker into public/ gives it a stable served URL that
// NetworkMap.jsx passes to setWorkerUrl(). maplibre-gl-shared.mjs must come with
// it and must keep that exact filename: the worker imports it as a sibling
// ("./maplibre-gl-shared.mjs"), so shipping the worker alone leaves the module
// unable to instantiate — silently, and with the same blank-map symptom.
//
// Re-copied on every build so these can never drift from the installed version.
import { copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'node_modules/maplibre-gl/dist')
const publicDir = resolve(root, 'public')

const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

await mkdir(publicDir, { recursive: true })

for (const name of FILES) {
  const src = resolve(distDir, name)
  if (!existsSync(src)) {
    console.error(`[maplibre-worker] missing ${src} — is maplibre-gl installed?`)
    process.exit(1)
  }
  await copyFile(src, resolve(publicDir, name))
}

console.log(`[maplibre-worker] copied ${FILES.join(', ')} -> public/`)

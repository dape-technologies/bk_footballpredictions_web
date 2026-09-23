import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(scriptDir, '..')
const apiRoot = resolve(webRoot, '..', 'bk_footballpredictions_api')
const source = resolve(webRoot, 'dist')
const destination = resolve(apiRoot, 'frontend_dist')

await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true })

console.log(`Prepared cPanel frontend at ${destination}`)

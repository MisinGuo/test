/**
 * ESA 构建后处理脚本
 *
 * opennextjs-cloudflare 产物中的 worker.js 是为 Cloudflare Workers 运行时设计的：
 *   - node:* 模块依赖 Cloudflare 的 nodejs_compat flag 在运行时提供
 *   - cloudflare:workers 用于 DurableObjects（ESA 无此功能，已在 open-next.config.ts 禁用）
 *
 * ESA 平台会对 entry 文件再跑一次 esbuild，导致无法解析上述模块。
 * 本脚本用 esbuild 将 worker.js 重新打包：
 *   - 将 node:* / cloudflare:* 标记为 external（ESA 运行时会提供）
 *   - 输出单文件，ESA 的打包器收到后无需再做任何解析
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..')
const input = path.join(root, '.open-next', 'worker.js')
const output = path.join(root, '.open-next', 'worker.esa.js')

if (!fs.existsSync(input)) {
  console.error('[bundle-for-esa] .open-next/worker.js not found, did the build fail?')
  process.exit(1)
}

console.log('[bundle-for-esa] Re-bundling worker.js for ESA platform...')

// esbuild 由 opennextjs-cloudflare 依赖链提供，直接使用 npx 调用
const cmd = [
  'npx esbuild',
  `"${input}"`,
  '--bundle',
  '--format=esm',
  '--platform=neutral',   // 不假设 Node.js 或浏览器环境
  '--target=es2022',
  // node:* 标记为 external：ESA 运行时通过 nodejs_compat 提供
  '--external:node:*',
  // cloudflare:* 标记为 external：DurableObjects 已禁用，保留以防万一
  '--external:cloudflare:*',
  `--outfile="${output}"`,
  '--log-level=warning',
].join(' ')

try {
  execSync(cmd, { stdio: 'inherit', cwd: root })
  console.log(`[bundle-for-esa] Done → .open-next/worker.esa.js`)

  // 用重打包后的文件替换原 worker.js，ESA 读取的 entry 路径不变
  fs.copyFileSync(output, input)
  console.log('[bundle-for-esa] Replaced .open-next/worker.js with bundled version.')
} catch (e) {
  console.error('[bundle-for-esa] esbuild failed:', e.message)
  process.exit(1)
}

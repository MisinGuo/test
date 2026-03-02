/**
 * ESA 构建后处理脚本
 *
 * opennextjs-cloudflare 产物中的 worker.js 是为 Cloudflare Workers 运行时设计的：
 *   - node:* 模块依赖 Cloudflare 的 nodejs_compat flag 在运行时提供
 *   - cloudflare:workers 用于 DurableObjects（ESA 无此功能，已在 open-next.config.ts 禁用）
 *
 * ESA 平台会对 entry 文件再跑一次 esbuild，导致无法解析上述模块。
 * 本脚本通过 esbuild JS API（随 @opennextjs/cloudflare 一同安装）重新打包：
 *   - 将 node:* / cloudflare:* 标记为 external（ESA 运行时会提供）
 *   - 输出单文件，ESA 的打包器收到后无需再做任何解析
 */

const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..')
const input = path.join(root, '.open-next', 'worker.js')
const output = path.join(root, '.open-next', 'worker.esa.js')

if (!fs.existsSync(input)) {
  console.error('[bundle-for-esa] .open-next/worker.js not found, did the build fail?')
  process.exit(1)
}

// 直接通过 JS API 调用已安装的 esbuild，无需 npx / 全局命令
// pnpm 隔离了包作用域，esbuild 是 @opennextjs/cloudflare 的依赖，
// 需要在其上下文中解析，而不是从项目根目录直接 require
const { createRequire } = require('node:module')
const cfRequire = createRequire(require.resolve('@opennextjs/cloudflare'))
const esbuild = cfRequire('esbuild')

// 所有 Node.js 内置模块，同时涵盖带 node: 前缀和不带前缀两种写法
// handler.mjs 内部使用旧式裸名称（fs/path/crypto...），必须全部标记为 external
const { builtinModules } = require('node:module')
const nodeExternals = [
  ...builtinModules,                        // fs, path, crypto, async_hooks ...
  ...builtinModules.map((m) => `node:${m}`), // node:fs, node:path ...
  'cloudflare:*',                            // cloudflare:workers 等 ESA/CF 运行时 API
]

console.log('[bundle-for-esa] Re-bundling worker.js for ESA platform...')

esbuild.build({
  entryPoints: [input],
  bundle: true,
  format: 'esm',
  platform: 'neutral',  // 不假设 Node.js 或浏览器环境
  target: 'es2022',
  external: nodeExternals,
  outfile: output,
  logLevel: 'warning',
}).then(() => {
  console.log('[bundle-for-esa] Done → .open-next/worker.esa.js')
  // 用重打包后的文件替换原 worker.js，ESA 读取的 entry 路径不变
  fs.copyFileSync(output, input)
  console.log('[bundle-for-esa] Replaced .open-next/worker.js with bundled version.')
}).catch((e) => {
  console.error('[bundle-for-esa] esbuild failed:', e.message)
  process.exit(1)
})

/**
 * ESA 构建后处理脚本
 *
 * 问题：ESA 平台会对 entry 文件再跑一次自己的 esbuild，
 *       该 esbuild 不支持 node:* / cloudflare:* 模块，导致构建失败。
 *
 * 解法：用 esbuild plugin 彻底消除这些 import 语句：
 *   - node:* / 裸名称内置模块 → 替换为 globalThis 访问
 *     （ESA 的 nodejs_compat 运行时会把 Node.js 内置模块注入到 globalThis）
 *   - cloudflare:workers → 替换为空桩（DurableObjects 已在 open-next.config.ts 禁用）
 */

const path = require('path')
const fs = require('fs')
const { builtinModules, createRequire } = require('node:module')

const root = path.resolve(__dirname, '..')
const input = path.join(root, '.open-next', 'worker.js')
const output = path.join(root, '.open-next', 'worker.esa.js')

if (!fs.existsSync(input)) {
  console.error('[bundle-for-esa] .open-next/worker.js not found, did the build fail?')
  process.exit(1)
}

// 通过 @opennextjs/cloudflare 的上下文加载 esbuild（绕开 pnpm 包隔离）
const cfRequire = createRequire(require.resolve('@opennextjs/cloudflare'))
const esbuild = cfRequire('esbuild')

// ─── Plugin 1: node 内置模块 → globalThis 访问 ───────────────────────────────
// ESA nodejs_compat 在运行时把 require('fs') 等注入到 globalThis.__require
// 这里用 globalThis.process / globalThis.Buffer 等全局变量接住即可正常运行
const nodeBuiltinPlugin = {
  name: 'node-builtin-to-global',
  setup(build) {
    // 匹配 node:xxx 和裸名称（fs / path / crypto ...）
    const builtinSet = new Set(builtinModules)
    const filter = /^(node:)?[a-z_][a-z0-9_/]*$/

    build.onResolve({ filter }, (args) => {
      const bare = args.path.replace(/^node:/, '')
      if (!builtinSet.has(bare)) return
      return { path: bare, namespace: 'node-builtin-global' }
    })

    build.onLoad({ filter: /.*/, namespace: 'node-builtin-global' }, (args) => {
      const varName = `__node_${args.path.replace(/[^a-zA-Z0-9]/g, '_')}`
      // 在 ESA nodejs_compat 运行时中，可通过如下方式获取内置模块：
      //   globalThis[Symbol.for('nodejs.module.require')]('fs')
      // 但最保险的写法是直接用 globalThis 上已有的全局对象（process/Buffer/etc.）
      // 通用降级：返回一个 Proxy，访问时再从 globalThis 上取
      return {
        contents: `
const _req = typeof __require !== 'undefined' ? __require
  : typeof require !== 'undefined' ? require
  : (id) => (globalThis[id] ?? {});
const _mod = (() => { try { return _req(${JSON.stringify(args.path)}); } catch(e) { return globalThis[${JSON.stringify(args.path)}] ?? {}; } })();
export default _mod;
export const {
  ${Object.keys(require(args.path) || {})
    .filter(k => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) && k !== 'default')
    .join(',\n  ')}
} = _mod;
`,
        loader: 'js',
      }
    })
  },
}

// ─── Plugin 2: cloudflare:workers → 空桩 ─────────────────────────────────────
// DurableObjects 已在 open-next.config.ts 中通过 "dummy" 禁用，
// 但 opennextjs-cloudflare 仍然 import 了该模块，放一个空桩防止报错
const cloudflareStubPlugin = {
  name: 'cloudflare-stub',
  setup(build) {
    build.onResolve({ filter: /^cloudflare:/ }, (args) => ({
      path: args.path,
      namespace: 'cloudflare-stub',
    }))
    build.onLoad({ filter: /.*/, namespace: 'cloudflare-stub' }, () => ({
      // 提供 DurableObject 等常用导出的空实现
      contents: `
export class DurableObject {}
export class DurableObjectStub {}
export class DurableObjectStorage {}
export class DurableObjectState {}
export class DurableObjectNamespace {}
export class WebSocketPair {}
export class Response {}
export class Request {}
`,
      loader: 'js',
    }))
  },
}

console.log('[bundle-for-esa] Re-bundling worker.js for ESA platform...')

esbuild.build({
  entryPoints: [input],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  plugins: [nodeBuiltinPlugin, cloudflareStubPlugin],
  outfile: output,
  logLevel: 'warning',
  // 允许覆盖 globalThis 上已有的同名导出（避免 cloudflare stub 与运行时冲突）
  ignoreAnnotations: true,
}).then(() => {
  console.log('[bundle-for-esa] Done → .open-next/worker.esa.js')
  fs.copyFileSync(output, input)
  console.log('[bundle-for-esa] Replaced .open-next/worker.js with bundled version.')
}).catch((e) => {
  console.error('[bundle-for-esa] esbuild failed:', e.message)
  process.exit(1)
})

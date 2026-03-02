/**
 * ESA 构建后处理脚本
 *
 * 问题：ESA 平台对 entry 文件再跑一遍自己的 esbuild，不支持 node:* / cloudflare:* 导入。
 *
 * 解法：直接对 worker.js 做文本级正则替换，把 ESM import 语句改写为
 *       运行时动态加载（globalThis.__require 或全局变量），
 *       彻底消除 ESA 打包器能看到的静态 import，同时保留运行时能力。
 *
 * ESA nodejs_compat 运行时会在 globalThis 注入 __require / require，
 * 所以改写后的代码在 ESA 边缘节点上可以正常执行。
 */

const path = require('path')
const fs   = require('fs')

const root   = path.resolve(__dirname, '..')
const target = path.join(root, '.open-next', 'worker.js')

if (!fs.existsSync(target)) {
  console.error('[bundle-for-esa] .open-next/worker.js not found, did the build fail?')
  process.exit(1)
}

console.log('[bundle-for-esa] Patching worker.js for ESA platform...')

let code = fs.readFileSync(target, 'utf-8')

// ─── 辅助：把"需要运行时提供"的模块调用包成不被静态分析的动态 require ──────────
// 使用 new Function 绕过 esbuild 静态分析，同时兼容 require 不存在的情况
const safeRequire = `(function(id){
  try {
    if (typeof __require === 'function') return __require(id);
    if (typeof require  === 'function') return require(id);
  } catch(e) {}
  return {};
})`

// ─── 1. import { A, B, C } from "node:xxx"  →  const { A, B, C } = safeRequire("node:xxx") ──
code = code.replace(
  /import\s+\{([^}]+)\}\s+from\s+"(node:[^"]+)";?\n?/g,
  (_, names, mod) => {
    // 对 node:timers 的导出优先使用全局变量（事件循环 API 本身就是全局的）
    const timerGlobals = new Set(['setTimeout','clearTimeout','setInterval','clearInterval','setImmediate','clearImmediate'])
    const entries = names.split(',').map(n => n.trim()).map(n => {
      const alias = n.includes(' as ') ? n.split(' as ')[1].trim() : n
      const orig  = n.includes(' as ') ? n.split(' as ')[0].trim() : n
      if (timerGlobals.has(orig)) {
        return `const ${alias} = globalThis.${orig} ?? ${safeRequire}(${JSON.stringify(mod)}).${orig};`
      }
      return `const ${alias} = ${safeRequire}(${JSON.stringify(mod)}).${orig};`
    })
    return entries.join('\n') + '\n'
  }
)

// ─── 2. import * as X from "node:xxx"  →  const X = safeRequire("node:xxx") ──────────────────
code = code.replace(
  /import\s+\*\s+as\s+(\w+)\s+from\s+"(node:[^"]+)";?\n?/g,
  (_, varName, mod) =>
    `const ${varName} = ${safeRequire}(${JSON.stringify(mod)});\n`
)

// ─── 3. import X from "node:xxx"  →  const X = safeRequire("node:xxx") ────────────────────────
code = code.replace(
  /import\s+(\w+)\s+from\s+"(node:[^"]+)";?\n?/g,
  (_, varName, mod) =>
    `const ${varName} = ${safeRequire}(${JSON.stringify(mod)});\n`
)

// ─── 4. import { DurableObject … } from "cloudflare:workers"  →  空桩 ────────────────────────
// open-next.config.ts 已禁用 DurableObjects（incrementalCache/tagCache/queue: dummy）
// 但 bundle 里仍保留了 import，用空类桩代替即可
code = code.replace(
  /import\s+\{([^}]+)\}\s+from\s+"cloudflare:[^"]+";?\n?/g,
  (_, names) => {
    const stubs = names.split(',').map(n => {
      const alias = n.trim().includes(' as ') ? n.trim().split(' as ')[1].trim() : n.trim()
      return `class ${alias} {}`
    })
    return stubs.join('\n') + '\n'
  }
)

// ─── 5. import X from "cloudflare:xxx"  →  const X = {} ─────────────────────────────────────
code = code.replace(
  /import\s+(\w+)\s+from\s+"cloudflare:[^"]+";?\n?/g,
  (_, varName) => `const ${varName} = {};\n`
)

fs.writeFileSync(target, code, 'utf-8')
console.log('[bundle-for-esa] Patch complete. .open-next/worker.js is ready for ESA.')

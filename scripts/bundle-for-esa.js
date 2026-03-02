/**
 * ESA 构建后处理脚本
 *
 * 问题：ESA 平台会扫描整个 .open-next/ 目录，对每个文件都跑一遍自己的 esbuild，
 *       不支持 node:* / cloudflare:* 的静态 import 语句。
 *
 * 解法：递归遍历 .open-next/ 下所有 .js/.mjs 文件，
 *       把 ESM import 语句改写为运行时动态加载，彻底消除静态 import。
 */

const path = require('path')
const fs   = require('fs')

const openNextDir = path.resolve(__dirname, '..', '.open-next')

if (!fs.existsSync(openNextDir)) {
  console.error('[bundle-for-esa] .open-next/ not found, did the build fail?')
  process.exit(1)
}

// ─── 辅助：运行时安全 require（匿名函数，ESA esbuild 无法静态解析）────────────
const safeRequire = `(function(id){
  try {
    if (typeof __require === 'function') return __require(id);
    if (typeof require  === 'function') return require(id);
  } catch(e) {}
  return {};
})`

const { builtinModules } = require('module')
const BUILTIN_SET = new Set(builtinModules) // fs, path, async_hooks, url ...

// node:timers 中的这些 API 本身就是 JS 全局变量
const TIMER_GLOBALS = new Set([
  'setTimeout','clearTimeout','setInterval','clearInterval',
  'setImmediate','clearImmediate',
])

// V8 Isolate（Cloudflare Workers / Aliyun ESA）中部分 node 模块导出有对应全局变量或可内联 polyfill。
// key = "裸模块名.导出名"
// value.global   = globalThis 上的属性名（若平台提供）
// value.polyfill = 当 global 不可用时使用的内联回退表达式（字符串）
const V8_GLOBAL_MAP = {
  // node:async_hooks — V8 Isolate 可能没有全局 AsyncLocalStorage，提供内联 polyfill
  'async_hooks.AsyncLocalStorage': {
    global: 'AsyncLocalStorage',
    polyfill: [
      'class AsyncLocalStorage{',
      '#s=undefined;',
      'run(s,f,...a){const p=this.#s;this.#s=s;try{return f(...a)}finally{this.#s=p}}',
      'getStore(){return this.#s}',
      'enterWith(s){this.#s=s}',
      'disable(){}',
      'static bind(fn){return fn}',
      'static snapshot(){return(f,...a)=>f(...a)}',
      '}',
    ].join(''),
  },
  'async_hooks.AsyncResource': {
    global: 'AsyncResource',
    polyfill: [
      'class AsyncResource{',
      'constructor(t){this.type=t}',
      'runInAsyncScope(f,...a){return f.apply(this,a)}',
      'static bind(fn,t,ctx){return fn.bind(ctx)}',
      'emitDestroy(){return this}',
      '}',
    ].join(''),
  },
  // node:buffer
  'buffer.Buffer':  { global: 'Buffer',  polyfill: null },
  'buffer.Blob':    { global: 'Blob',    polyfill: null },
  // node:url
  'url.URL':             { global: 'URL',             polyfill: null },
  'url.URLSearchParams': { global: 'URLSearchParams', polyfill: null },
}

// 对给定的 node 模块裸名 + 导出名，返回最佳的运行时表达式
function resolveNodeExport(bareMod, orig, mod) {
  const key   = `${bareMod}.${orig}`
  const entry = V8_GLOBAL_MAP[key]
  if (entry) {
    const g        = entry.global
    const fallback = entry.polyfill
      ? `(${entry.polyfill})`                                        // 内联 polyfill 类
      : `${safeRequire}(${JSON.stringify(mod)}).${orig}`             // 通用回退
    return `(typeof globalThis.${g} !== 'undefined' ? globalThis.${g} : ${fallback})`
  }
  if (TIMER_GLOBALS.has(orig)) {
    return `(globalThis.${orig} ?? ${safeRequire}(${JSON.stringify(mod)}).${orig})`
  }
  return `${safeRequire}(${JSON.stringify(mod)}).${orig}`
}

function patchCode(code) {
  // 1. import { A, B as C } from "node:xxx"  （\s* 兼容 minified 无空格情形）
  code = code.replace(
    /import\s*\{([^}]+)\}\s*from\s*"(node:[^"]+)";?[ \t]*\n?/g,
    (_, names, mod) => {
      const bareMod = mod.replace(/^node:/, '')
      const lines = names.split(',').map(n => {
        n = n.trim()
        const parts = n.split(/\s+as\s+/)
        const orig  = parts[0].trim()
        const alias = (parts[1] || parts[0]).trim()
        return `const ${alias} = ${resolveNodeExport(bareMod, orig, mod)};`
      })
      return lines.join('\n') + '\n'
    }
  )

  // 2. import * as X from "node:xxx"
  code = code.replace(
    /import\s*\*\s*as\s+(\w+)\s+from\s*"(node:[^"]+)";?[ \t]*\n?/g,
    (_, varName, mod) =>
      `const ${varName} = ${safeRequire}(${JSON.stringify(mod)});\n`
  )

  // 3. import X from "node:xxx"
  code = code.replace(
    /import\s+(\w+)\s*from\s*"(node:[^"]+)";?[ \t]*\n?/g,
    (_, varName, mod) =>
      `const ${varName} = ${safeRequire}(${JSON.stringify(mod)});\n`
  )

  // 4. import { DurableObject, ... } from "cloudflare:workers" → 空桩类
  code = code.replace(
    /import\s*\{([^}]+)\}\s*from\s*"cloudflare:[^"]+";?[ \t]*\n?/g,
    (_, names) => {
      const stubs = names.split(',').map(n => {
        n = n.trim()
        const alias = n.includes(' as ') ? n.split(/\s+as\s+/)[1].trim() : n
        return `class ${alias} {}`
      })
      return stubs.join('\n') + '\n'
    }
  )

  // 5. import X from "cloudflare:xxx"
  code = code.replace(
    /import\s+(\w+)\s*from\s*"cloudflare:[^"]+";?[ \t]*\n?/g,
    (_, varName) => `const ${varName} = {};\n`
  )

  // 6. require("fs") / require("async_hooks") 等裸名称 CJS require
  //    minified bundle 内有大量此类调用，ESA esbuild 同样会静态解析
  //    替换为 safeRequire 匿名函数调用，绕过 ESA 的静态模块解析
  //    (?<!\.) 负向后瞻：排除 obj.require("xxx") 这类对象方法调用，避免生成非法语法
  code = code.replace(
    /(?<!\.)require\("([^"]+)"\)/g,
    (match, id) => {
      const bare = id.replace(/^node:/, '')
      if (BUILTIN_SET.has(bare)) {
        return `${safeRequire}(${JSON.stringify(id)})`
      }
      return match // 非内置模块保持不变
    }
  )

  return code
}

// ─── 递归遍历 .open-next/，处理所有 .js / .mjs 文件 ──────────────────────────
function walkAndPatch(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkAndPatch(fullPath)
    } else if (entry.isFile() && /\.(js|mjs)$/.test(entry.name)) {
      const original = fs.readFileSync(fullPath, 'utf-8')
      // 快速检测：只处理含有问题 import/require 的文件，跳过纯静态资源
      if (!original.includes('from "node:') &&
          !original.includes('from"node:') &&
          !original.includes('from "cloudflare:') &&
          !original.includes('from"cloudflare:') &&
          !original.includes('require("')) {
        continue
      }
      const patched = patchCode(original)
      if (patched !== original) {
        fs.writeFileSync(fullPath, patched, 'utf-8')
        console.log(`[bundle-for-esa] Patched: ${path.relative(openNextDir, fullPath)}`)
      }
    }
  }
}

console.log('[bundle-for-esa] Scanning .open-next/ for problematic imports...')
walkAndPatch(openNextDir)
console.log('[bundle-for-esa] Patch complete. All files are ready for ESA.')


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

// ─── 整个模块的内联 polyfill（当 safeRequire 返回 {} 时使用）────────────────────
// key = 裸模块名；value = 可直接嵌入代码的 JS 表达式（IIFE，返回模块对象）
const MODULE_POLYFILLS = {
  'path': `(function(){var r={sep:'/',delimiter:':',
normalize:function(p){var abs=p[0]=='/';var segs=p.split('/');var o=[];for(var i=0;i<segs.length;i++){var s=segs[i];if(s===''||s==='.')continue;if(s==='..'){if(o.length>0)o.pop();}else o.push(s);}return(abs?'/':'')+o.join('/')||'.';},
join:function(){return r.normalize(Array.prototype.slice.call(arguments).join('/'));},
resolve:function(){var p='';for(var i=arguments.length-1;i>=0;i--){var s=arguments[i];if(!s)continue;p=s+(p?'/'+p:'');if(s[0]=='/')break;}return r.normalize(p[0]=='/'?p:'/'+p);},
dirname:function(p){var i=p.lastIndexOf('/');return i<0?'.':i===0?'/':p.slice(0,i);},
basename:function(p,e){var b=p.split('/').pop()||'';if(e&&b.slice(-e.length)===e)b=b.slice(0,-e.length);return b;},
extname:function(p){var b=p.split('/').pop()||'';var i=b.lastIndexOf('.');return i<=0?'':b.slice(i);},
isAbsolute:function(p){return p[0]=='/';},
relative:function(f,t){var a=r.resolve(f).split('/').filter(Boolean);var b=r.resolve(t).split('/').filter(Boolean);var i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return[].concat(new Array(a.length-i).fill('..'),b.slice(i)).join('/')||'.';},
format:function(o){return(o.dir?o.dir+'/':'')+((o.base)||(o.name||'')+(o.ext||''));},
parse:function(p){var b=r.basename(p);var e=r.extname(b);return{root:'',dir:r.dirname(p),base:b,ext:e,name:b.slice(0,b.length-e.length)};},
};r.posix=r;r.win32=r;return r;})()`,
  // node:path 的 posix 子对象与 path 本身相同
  'posix': null, // 由 path.posix 提供，无需单独 polyfill
}
// node:path 与 path 同一 polyfill
MODULE_POLYFILLS['node:path'] = MODULE_POLYFILLS['path']

// node:process polyfill — V8 Isolate 没有全局 process
const PROCESS_POLYFILL = `(function(){
var _env={};
try{if(typeof __env__!=='undefined')_env=__env__;}catch(e){}
var _p={
  env:_env,
  cwd:function(){return '/'},
  argv:['node','worker.js'],
  argv0:'node',
  platform:'linux',
  version:'v18.0.0',
  versions:{node:'18.0.0'},
  release:{name:'node'},
  hrtime:function(p){var n=Date.now();var s=Math.floor(n/1000);var ms=(n%1000)*1e6;if(p)return[s-p[0],(ms-p[1]+1e9)%1e9];return[s,ms];},
  hrtime:{bigint:function(){return BigInt(Date.now())*BigInt(1e6)}},
  nextTick:function(fn){Promise.resolve().then(fn);},
  exit:function(){},
  exitCode:0,
  pid:1,
  ppid:0,
  title:'node',
  arch:'x64',
  execPath:'/usr/bin/node',
  execArgv:[],
  umask:function(){return 0o022;},
  on:function(){return _p;},
  off:function(){return _p;},
  once:function(){return _p;},
  emit:function(){return false;},
  removeListener:function(){return _p;},
  removeAllListeners:function(){return _p;},
};
_p.hrtime.bigint=function(){return BigInt(Date.now())*BigInt(1e6);};
return _p;
})()`

MODULE_POLYFILLS['process'     ] = PROCESS_POLYFILL
MODULE_POLYFILLS['node:process'] = PROCESS_POLYFILL

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
      const bareMod    = mod.replace(/^node:/, '')
      const modPolyfill = MODULE_POLYFILLS[bareMod]
      if (modPolyfill) {
        // 批量从 polyfill 解构，避免多次构造对象
        const parts = names.split(',').map(n => {
          n = n.trim()
          const ps    = n.split(/\s+as\s+/)
          const orig  = ps[0].trim()
          const alias = (ps[1] || ps[0]).trim()
          return orig === alias ? orig : `${orig}: ${alias}`
        })
        return `const { ${parts.join(', ')} } = ${modPolyfill};\n`
      }
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
    (_, varName, mod) => {
      const bareMod    = mod.replace(/^node:/, '')
      const modPolyfill = MODULE_POLYFILLS[bareMod]
      if (modPolyfill) return `const ${varName} = ${modPolyfill};\n`
      return `const ${varName} = ${safeRequire}(${JSON.stringify(mod)});\n`
    }
  )

  // 3. import X from "node:xxx"
  code = code.replace(
    /import\s+(\w+)\s*from\s*"(node:[^"]+)";?[ \t]*\n?/g,
    (_, varName, mod) => {
      const bareMod    = mod.replace(/^node:/, '')
      const modPolyfill = MODULE_POLYFILLS[bareMod]
      if (modPolyfill) return `const ${varName} = ${modPolyfill};\n`
      return `const ${varName} = ${safeRequire}(${JSON.stringify(mod)});\n`
    }
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

  // 6. require("fs") / require("async_hooks") / require("process") 等裸名称 CJS require
  //    minified bundle 内有大量此类调用，ESA esbuild 同样会静态解析
  //    (?<!\.） 负向后瞻：排除 obj.require("xxx") 这类对象方法调用，避免生成非法语法
  code = code.replace(
    /(?<!\.)require\("([^"]+)"\)/g,
    (match, id) => {
      const bare = id.replace(/^node:/, '')
      // 若有整模块 polyfill，直接内联，避免运行时返回 {}
      const modPoly = MODULE_POLYFILLS[bare] || MODULE_POLYFILLS[id]
      if (modPoly) return modPoly
      if (BUILTIN_SET.has(bare)) {
        return `${safeRequire}(${JSON.stringify(id)})`
      }
      return match // 非内置模块保持不变
    }
  )

  // 7. ctx.waitUntil(...) / ctx.passThroughOnException()
  //    ESA ExecutionContext 可能不提供这些方法，或 ctx 本身为 undefined，
  //    改为可选链调用，缺失时静默忽略（不影响响应逻辑，只影响后台任务生命周期）
  code = code.replace(/\.waitUntil\s*\(/g, '?.waitUntil?.(')
  code = code.replace(/\.passThroughOnException\s*\(\s*\)/g, '?.passThroughOnException?.()')

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
      // 快速检测：只处理含有问题 import/require 或 ctx API 的文件，跳过纯静态资源
      if (!original.includes('from "node:') &&
          !original.includes('from"node:') &&
          !original.includes('from "cloudflare:') &&
          !original.includes('from"cloudflare:') &&
          !original.includes('require("') &&
          !original.includes('.waitUntil(') &&
          !original.includes('.passThroughOnException(')) {
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

// ─── 向关键入口文件注入 process / globalThis 修复 ────────────────────────────
// 代码里大量使用裸 process.env 而不导入，需在最顶部保证 process 全局存在
function injectProcessGlobal(filePath) {
  if (!fs.existsSync(filePath)) return
  const original = fs.readFileSync(filePath, 'utf-8')
  const guard = '/* esa-process-polyfill */'
  if (original.includes(guard)) return // 已注入，跳过
  const injection = [
    guard,
    `if (typeof globalThis.process === 'undefined' || typeof globalThis.process.env === 'undefined') {`,
    `  globalThis.process = ${PROCESS_POLYFILL};`,
    `}`,
    '',
  ].join('\n')
  fs.writeFileSync(filePath, injection + original, 'utf-8')
  console.log(`[bundle-for-esa] Injected process polyfill: ${path.relative(openNextDir, filePath)}`)
}

console.log('[bundle-for-esa] Scanning .open-next/ for problematic imports...')
walkAndPatch(openNextDir)

// 向所有入口文件注入 process global（worker.js + handler.mjs 文件）
const ENTRY_FILES = [
  path.join(openNextDir, 'worker.js'),
  path.join(openNextDir, 'middleware', 'handler.mjs'),
  path.join(openNextDir, 'server-functions', 'default', 'handler.mjs'),
  path.join(openNextDir, 'server-functions', 'default', 'index.mjs'),
]
ENTRY_FILES.forEach(injectProcessGlobal)

console.log('[bundle-for-esa] Patch complete. All files are ready for ESA.')


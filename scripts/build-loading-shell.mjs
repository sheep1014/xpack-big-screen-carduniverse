// Preserve the approved V916 wordmark geometry and sweep in the inline boot shell.
import { readFileSync, writeFileSync } from 'node:fs'
import { renderBrandLoading } from './brand-loading/brandMark.mjs'
const css = readFileSync('scripts/brand-loading/brand-loading.css', 'utf8')
const logo = readFileSync('src/public-screen/assets/xpack-logo.svg', 'utf8')
const mark = renderBrandLoading(logo, 'public-boot')
  .replace('class="xp-brand-loading"', 'id="boot" class="xp-brand-loading"')
  .replace('class="xp-brand-loading__caption"', 'id="boot-status" class="xp-brand-loading__caption"')
  .replace('>Loading</p>', '>正在載入展示內容…</p><button id="boot-retry" hidden onclick="location.reload()">重新載入</button><noscript>請啟用 JavaScript 以開啟展示。</noscript>')
writeFileSync('src/public-screen/index.html', `<!doctype html>
<html lang="zh-Hant"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><meta name="theme-color" content="#030507"/><title>XPACK · Public Screen</title>
<style>
html,body{-webkit-user-select:none;user-select:none;margin:0;background:#030507;color:#b8cad7;font-family:Arial,'PingFang TC',sans-serif}
${css}
#boot{position:fixed;--xp-color-surface-page:#030507;--xp-color-text-strong:#dbe5eb;--xp-color-text-muted:#8fa4b3;--xp-font-sans:Arial,'PingFang TC',sans-serif}
#boot .xp-brand-mark{width:clamp(168px,16vw,320px)}
#boot button{background:transparent;color:#c3d5e0;border:1px solid #526875;padding:12px 24px;border-radius:4px;cursor:pointer}
</style></head><body><div id="root">${mark}</div>
<script>setTimeout(function(){var b=document.getElementById('boot-retry');if(b)b.hidden=false},20000)</script>
<script type="module" src="./main.tsx" onerror="document.getElementById('boot-status').textContent='展示內容未能載入，請檢查網絡後重試';document.getElementById('boot-retry').hidden=false"></script></body></html>\n`)

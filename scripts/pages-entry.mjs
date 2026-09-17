import { readFileSync, writeFileSync } from 'node:fs'
const html = readFileSync('dist-public-screen/src/public-screen/index.html', 'utf8')
writeFileSync('dist-public-screen/index.html', html.replaceAll('../../assets/', './assets/'))
writeFileSync('dist-public-screen/.nojekyll', '')

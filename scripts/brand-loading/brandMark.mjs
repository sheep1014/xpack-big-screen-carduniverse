/** Shared original brand geometry, with light confined to its existing white surfaces. */
export function renderBrandLoading(svgSource, prefix = 'xpack-loading') {
  if (!/^[a-z][a-z0-9-]*$/.test(prefix)) throw new Error('Invalid SVG ID prefix')
  const paths = svgSource.match(/<path\b[^>]*\/>/g)
  if (paths?.length !== 3) throw new Error('Review the updated wordmark before animating it')
  // Only replace the white paint. All coordinates and compound-path holes survive.
  const geometry = paths.map(path => path.replace(/ fill="white"/g, '')).join('\n')
  return `<div class="xp-brand-loading" data-state="loading" aria-busy="true">
    <div class="xp-brand-loading__composition">
      <svg class="xp-brand-mark" viewBox="0 0 251 53" width="251" height="53" aria-hidden="true" focusable="false">
        <defs>
          <g id="${prefix}-shape">${geometry}</g>
          <mask id="${prefix}-clip" maskUnits="userSpaceOnUse" x="0" y="0" width="251" height="53" style="mask-type:alpha"><use href="#${prefix}-shape" fill="white" /></mask>
          <linearGradient id="${prefix}-metal" x1="0" y1="0" x2=".2" y2="1">
            <stop offset="0" class="xp-brand-stop xp-brand-stop--top" />
            <stop offset=".28" class="xp-brand-stop xp-brand-stop--upper" />
            <stop offset=".5" class="xp-brand-stop xp-brand-stop--middle" />
            <stop offset=".78" class="xp-brand-stop xp-brand-stop--lower" />
            <stop offset="1" class="xp-brand-stop xp-brand-stop--bottom" />
          </linearGradient>
          <linearGradient id="${prefix}-light">
            <stop offset="0" stop-color="white" stop-opacity="0" />
            <stop offset=".18" stop-color="white" stop-opacity=".12" />
            <stop offset=".4" stop-color="white" stop-opacity=".84" />
            <stop offset=".6" stop-color="white" stop-opacity="1" />
            <stop offset=".82" stop-color="white" stop-opacity=".24" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="${prefix}-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="white" stop-opacity="0" />
            <stop offset=".65" stop-color="white" stop-opacity=".03" />
            <stop offset="1" stop-color="white" stop-opacity=".55" />
          </linearGradient>
        </defs>
        <g class="xp-brand-mark__material">
          <use href="#${prefix}-shape" fill="url(#${prefix}-metal)" />
          <use class="xp-brand-mark__lower-edge" href="#${prefix}-shape" fill="url(#${prefix}-edge)" />
          <g mask="url(#${prefix}-clip)">
            <g class="xp-brand-mark__light">
              <path d="M-72 -8H0L-12 61H-84Z" fill="url(#${prefix}-light)" />
            </g>
          </g>
          <use class="xp-brand-mark__resolved" href="#${prefix}-shape" fill="white" />
        </g>
      </svg>
      <p class="xp-brand-loading__caption" role="status" aria-live="polite" aria-atomic="true">Loading</p>
    </div>
  </div>`
}

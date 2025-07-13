let config = {
  wallSize: 1,
  wallHeight: 3,
  walkSize: 2,
  width: 20,
  height: 20,
  levels: 3,
  block: 'stone',
  includeSides: true,
  addRoof: false,
  showBlockLegend: true,
  showChunkBorders: false
}

config = new Proxy(config, {
  get: function (target, prop) {
    const el = document.querySelector(`[data-for="${String(prop)}"]`) as HTMLInputElement | undefined
    const fallback = (target as any)[prop]
    if (!el) return fallback

    const data = el.value!
    if (typeof fallback === 'number') {
      return Number.isNaN(+data) ? fallback : +data
    } else if (typeof fallback === 'boolean') {
      return el.checked
    }
    return data
  }
})

export { config }

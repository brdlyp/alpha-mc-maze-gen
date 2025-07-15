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
  showChunkBorders: false,
  generateHoles: true, // Enable/disable generation of holes between levels
  holesPerLevel: 1,    // Number of holes per level
  generateLadders: true, // Enable/disable ladder generation for holes
  generateLadders3D: true, // Enable/disable ladder generation for 3D maze
  mazeGenerationMode: '3D' // '2D' for independent level generation, '3D' for connected multi-level maze
}

config = new Proxy(config, {
  get: function (target, prop) {
    const el = document.querySelector(`[data-for="${String(prop)}"]`) as HTMLInputElement | undefined
    const fallback = (target as any)[prop]
    if (!el) return fallback

    // Handle radio buttons - find the checked radio button with the same name
    if (el.type === 'radio') {
      const checkedRadio = document.querySelector(`input[name="${el.name}"]:checked`) as HTMLInputElement | undefined
      return checkedRadio ? checkedRadio.value : fallback
    }

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

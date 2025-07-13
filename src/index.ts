import generate from 'generate-maze'

import { config } from './config'

const canvas = document.querySelector('canvas')!
const context = canvas.getContext('2d')!

function debounce (func: () => void, wait: number) {
  let timeout: number
  const later = function () {
    timeout = 0
    func()
  }

  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function draw () {
  let { width, height, wallSize, walkSize, includeSides } = config

  const cellSize = wallSize * 2 + walkSize
  const cellOffset = wallSize + walkSize

  const maze = generate(width, height, includeSides)

  canvas.width = (width * wallSize) + (width * walkSize) + wallSize
  canvas.height = (height * wallSize) + (height * walkSize) + wallSize
  document.querySelector('[data-show=dimensions]')!.innerHTML = `${canvas.width} &times; ${canvas.height}`

  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'black'

  maze.forEach(row => {
    row.forEach(cell => {
      // Top left
      const x = cell.x * cellOffset
      const y = cell.y * cellOffset
      if (cell.top) {
        context.fillRect(x, y, cellSize, wallSize)
      }
      if (cell.left) {
        context.fillRect(x, y, wallSize, cellSize)
      }
      if (cell.right) {
        context.fillRect(x + wallSize + walkSize, y, wallSize, cellSize)
      }
      if (cell.bottom) {
        context.fillRect(x, y + wallSize + walkSize, cellSize, wallSize)
      }
    })
  })
}

function generateCommand () {
  if (canvas.width * canvas.height > 2 ** 16 && confirm('Maze is probably too large, this may crash your browser. Continue?')) {
    return
  }

  let { width, height, wallSize, wallHeight, walkSize, block } = config
  // MineCraft... 0 wallSize = 1 block
  wallSize--
  walkSize--
  wallHeight--

  let size = wallSize + walkSize
  if (!size) size = 1

  const commands: string[] = [
    `# Clear maze blocks\n`
  ]

  const clearSize = Math.floor(Math.sqrt(32768 / (wallHeight + 1)))
  for (let y = 0; y < canvas.height; y += clearSize) {
    for (let x = 0; x < canvas.width; x += clearSize) {
      const xMax = Math.min(x + clearSize, canvas.width)
      const yMax = Math.min(y + clearSize, canvas.height)
      commands.push(`fill ~${x} ~ ~${y} ~${xMax - 1} ~${wallHeight} ~${yMax - 1} air\n`)
    }
  }

  commands.push(`# Fill maze blocks\n`)

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const { data } = context.getImageData(x, y, 1, 1)
      if (data[0]) continue
      commands.push(`fill ~${x} ~ ~${y} ~${x} ~${wallHeight} ~${y} ${block}\n`)
    }
  }

  // Generate filename based on selected naming option
  let filename: string
  const namingOption = (document.querySelector('input[name="naming"]:checked') as HTMLInputElement)?.value
  
  switch (namingOption) {
    case 'simple':
      filename = 'maze.mcfunction'
      break
    case 'detailed':
      // Format: <width>x<height>maze-<ww#><wh#><pw#><wb"word">.mcfunction
      filename = `${width}x${height}maze-ww${wallSize + 1}wh${wallHeight + 1}pw${walkSize + 1}wb${block}.mcfunction`
      break
    case 'custom':
      const customName = (document.querySelector('[data-for="customName"]') as HTMLInputElement)?.value?.trim()
      if (customName) {
        filename = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`
      } else {
        // Fallback to simple if no custom name provided
        filename = 'maze.mcfunction'
      }
      break
    default:
      filename = 'maze.mcfunction'
  }

  const element = document.body.appendChild(document.createElement('a'))

  const commandData = new Blob(commands, { type: 'text/plain' })
  element.href = URL.createObjectURL(commandData)
  element.setAttribute('download', filename)
  element.style.display = 'none'
  element.click()
  document.body.removeChild(element)
}

const drawDelay = debounce(draw, 500)

function updateDetailedFilename() {
  let { width, height, wallSize, wallHeight, walkSize, block } = config
  const filename = `${width}x${height}maze-ww${wallSize + 1}wh${wallHeight + 1}pw${walkSize + 1}wb${block}.mcfunction`
  const detailedNameElement = document.querySelector('[data-show="detailed-name"]')
  if (detailedNameElement) {
    detailedNameElement.textContent = filename
  }
}

function updateCustomNamePreview() {
  const customNameInput = document.querySelector('[data-for="customName"]') as HTMLInputElement
  const customNamePreview = document.getElementById('customNamePreview')
  const customNameText = document.getElementById('customNameText')
  const customRadio = document.querySelector('input[name="naming"][value="custom"]') as HTMLInputElement
  
  if (customNameInput && customNamePreview && customNameText) {
    const customName = customNameInput.value.trim()
    
    if (customRadio.checked && customName) {
      // Remove .mcfunction if user typed it, then show preview
      const cleanName = customName.replace(/\.mcfunction$/i, '')
      customNameText.textContent = cleanName
      customNamePreview.style.display = 'block'
    } else {
      customNamePreview.style.display = 'none'
    }
  }
}

function validate () {
  Array.from(document.querySelectorAll('input')).forEach(element => {
    if (element.type === 'number') {
      if (+element.value > +element.max) {
        element.value = element.max
      } else if (+element.value < +element.min) {
        element.value = element.min
      }
    }
  })

  updateDetailedFilename()
  updateCustomNamePreview()
  drawDelay()
}

document.addEventListener('change', validate)
document.addEventListener('input', (event) => {
  const target = event.target as HTMLElement
  if (target.getAttribute('data-for') === 'customName') {
    updateCustomNamePreview()
  }
})

document.querySelector('button')!.addEventListener('click', generateCommand)

draw()
updateDetailedFilename()
updateCustomNamePreview()

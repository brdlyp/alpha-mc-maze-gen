(function () {
  'use strict';

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
      holesPerLevel: 1, // Number of holes per level
      generateLadders: true // Enable/disable ladder generation for holes
  };
  config = new Proxy(config, {
      get: function (target, prop) {
          const el = document.querySelector(`[data-for="${String(prop)}"]`);
          const fallback = target[prop];
          if (!el)
              return fallback;
          const data = el.value;
          if (typeof fallback === 'number') {
              return Number.isNaN(+data) ? fallback : +data;
          }
          else if (typeof fallback === 'boolean') {
              return el.checked;
          }
          return data;
      }
  });

  // Multi-Level Maze Generator
  class MultiLevelMaze {
      constructor(width, height, levels) {
          this.width = width;
          this.height = height;
          this.levels = levels;
          this.currentLevel = 0;
          this.mazes = [];
          this.grid = [];
          // Direction constants
          this.NORTH = 1;
          this.SOUTH = 2;
          this.EAST = 4;
          this.WEST = 8;
          this.UP = 16;
          this.DOWN = 32;
          this.directions = [this.NORTH, this.SOUTH, this.EAST, this.WEST, this.UP, this.DOWN];
          this.opposite = {
              [this.NORTH]: this.SOUTH,
              [this.SOUTH]: this.NORTH,
              [this.EAST]: this.WEST,
              [this.WEST]: this.EAST,
              [this.UP]: this.DOWN,
              [this.DOWN]: this.UP
          };
          this.dx = {
              [this.NORTH]: 0,
              [this.SOUTH]: 0,
              [this.EAST]: 1,
              [this.WEST]: -1,
              [this.UP]: 0,
              [this.DOWN]: 0
          };
          this.dy = {
              [this.NORTH]: -1,
              [this.SOUTH]: 1,
              [this.EAST]: 0,
              [this.WEST]: 0,
              [this.UP]: 0,
              [this.DOWN]: 0
          };
          this.dz = {
              [this.NORTH]: 0,
              [this.SOUTH]: 0,
              [this.EAST]: 0,
              [this.WEST]: 0,
              [this.UP]: 1,
              [this.DOWN]: -1
          };
      }
      generate() {
          // Initialize 3D grid
          this.grid = [];
          for (let z = 0; z < this.levels; z++) {
              this.grid[z] = [];
              for (let y = 0; y < this.height; y++) {
                  this.grid[z][y] = [];
                  for (let x = 0; x < this.width; x++) {
                      this.grid[z][y][x] = 0;
                  }
              }
          }
          // Generate maze using depth-first search
          this.generateMaze();
          // Create individual maze objects for each level
          this.createLevelMazes();
      }
      generateMaze() {
          // Use Growing Tree algorithm with 50/50 split between random and newest
          const cells = [];
          const visited = new Set();
          // Start from a random cell
          const startX = Math.floor(Math.random() * this.width);
          const startY = Math.floor(Math.random() * this.height);
          const startZ = Math.floor(Math.random() * this.levels);
          cells.push({ x: startX, y: startY, z: startZ });
          visited.add(`${startX},${startY},${startZ}`);
          while (cells.length > 0) {
              // Choose cell selection method: 50% random, 50% newest
              const useRandom = Math.random() < 0.5;
              const index = useRandom ? Math.floor(Math.random() * cells.length) : cells.length - 1;
              const current = cells[index];
              const neighbors = this.getUnvisitedNeighbors(current.x, current.y, current.z, visited);
              if (neighbors.length === 0) {
                  // No unvisited neighbors, remove this cell
                  cells.splice(index, 1);
              }
              else {
                  // Choose a random unvisited neighbor
                  const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                  const direction = this.getDirection(current, next);
                  // Carve passage
                  this.grid[current.z][current.y][current.x] |= direction;
                  this.grid[next.z][next.y][next.x] |= this.opposite[direction];
                  visited.add(`${next.x},${next.y},${next.z}`);
                  cells.push(next);
              }
          }
          // Ensure entrance and exit
          this.grid[0][0][0] |= this.WEST;
          this.grid[this.levels - 1][this.height - 1][this.width - 1] |= this.EAST;
      }
      getUnvisitedNeighbors(x, y, z, visited) {
          const neighbors = [];
          for (const dir of this.directions) {
              const nx = x + this.dx[dir];
              const ny = y + this.dy[dir];
              const nz = z + this.dz[dir];
              if (this.isValidCell(nx, ny, nz) && !visited.has(`${nx},${ny},${nz}`)) {
                  neighbors.push({ x: nx, y: ny, z: nz });
              }
          }
          return neighbors;
      }
      getDirection(from, to) {
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dz = to.z - from.z;
          if (dx === 1)
              return this.EAST;
          if (dx === -1)
              return this.WEST;
          if (dy === 1)
              return this.SOUTH;
          if (dy === -1)
              return this.NORTH;
          if (dz === 1)
              return this.UP;
          if (dz === -1)
              return this.DOWN;
          return 0;
      }
      isValidCell(x, y, z) {
          return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.levels;
      }
      createLevelMazes() {
          this.mazes = [];
          for (let z = 0; z < this.levels; z++) {
              const levelMaze = {
                  width: this.width,
                  height: this.height,
                  level: z,
                  grid: []
              };
              for (let y = 0; y < this.height; y++) {
                  levelMaze.grid[y] = [];
                  for (let x = 0; x < this.width; x++) {
                      levelMaze.grid[y][x] = {
                          walls: this.grid[z][y][x],
                          hasUp: (this.grid[z][y][x] & this.UP) !== 0,
                          hasDown: (this.grid[z][y][x] & this.DOWN) !== 0
                      };
                  }
              }
              this.mazes.push(levelMaze);
          }
      }
      renderLevel(levelIndex) {
          const maze = this.mazes[levelIndex];
          if (!maze)
              return '';
          // Get current wall and path sizes from config
          const { wallSize, walkSize, generateHoles, holesPerLevel, generateLadders } = config;
          let html = '<div class="maze-grid">';
          // Calculate total grid dimensions based on wall and path sizes
          const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
          // Top border row (all walls)
          html += '<div class="maze-row">';
          for (let x = 0; x < totalWidth; x++) {
              html += '<div class="maze-cell wall"></div>';
          }
          html += '</div>';
          for (let y = 0; y < maze.height; y++) {
              // For each maze row, we need walkSize rows in the display
              for (let displayRow = 0; displayRow < walkSize; displayRow++) {
                  html += '<div class="maze-row">';
                  // Left border wall
                  if (levelIndex === 0 && y === 0) {
                      // Entrance hole for first cell of first level
                      for (let i = 0; i < walkSize; i++) {
                          html += '<div class="maze-cell path"></div>';
                      }
                  }
                  else {
                      // Solid left border wall
                      for (let i = 0; i < wallSize; i++) {
                          html += '<div class="maze-cell wall"></div>';
                      }
                  }
                  // Cells with passages
                  for (let x = 0; x < maze.width; x++) {
                      const cell = maze.grid[y][x];
                      const hasEast = (cell.walls & this.EAST) !== 0;
                      // Cell content (path area)
                      for (let i = 0; i < walkSize; i++) {
                          html += '<div class="maze-cell path">';
                          // Add up/down indicators only in the center of the path
                          if (displayRow === Math.floor(walkSize / 2)) {
                              // Use the shared function to determine which cells should show indicators
                              const holeCells = this.getHoleCells(levelIndex, generateHoles, holesPerLevel);
                              const isHoleCell = holeCells.some(hole => hole.x === x && hole.y === y);
                              let showUp = false;
                              let showDown = false;
                              if (isHoleCell) {
                                  const holeCell = holeCells.find(hole => hole.x === x && hole.y === y);
                                  if (holeCell) {
                                      showUp = holeCell.hasUp;
                                      showDown = holeCell.hasDown;
                                  }
                              }
                              // Show indicators based on config
                              if (showUp && generateLadders) {
                                  html += `<div class="maze-indicator up"></div>`;
                              }
                              else if (showUp && !generateLadders) {
                                  html += `<div class="maze-indicator horizontal" style="background: #ffaaaa;" title="Hole only (no ladder)"></div>`;
                              }
                              else {
                                  html += `<div class="maze-indicator horizontal"></div>`;
                              }
                              if (showDown && generateLadders) {
                                  html += `<div class="maze-indicator down"></div>`;
                              }
                              else if (showDown && !generateLadders) {
                                  html += `<div class="maze-indicator horizontal" style="background: #aaaaff;" title="Hole only (no ladder)"></div>`;
                              }
                              else {
                                  html += `<div class="maze-indicator horizontal"></div>`;
                              }
                          }
                          html += '</div>';
                      }
                      // Right wall of cell
                      if (hasEast || (levelIndex === this.levels - 1 && y === maze.height - 1 && x === maze.width - 1)) {
                          // Path opening - either east passage or exit hole for last cell of last level
                          for (let i = 0; i < walkSize; i++) {
                              html += '<div class="maze-cell path"></div>';
                          }
                      }
                      else {
                          // Solid wall
                          for (let i = 0; i < wallSize; i++) {
                              html += '<div class="maze-cell wall"></div>';
                          }
                      }
                  }
                  html += '</div>';
              }
              // Bottom wall row (except last maze row)
              if (y < maze.height - 1) {
                  html += '<div class="maze-row">';
                  // Left border wall
                  for (let i = 0; i < wallSize; i++) {
                      html += '<div class="maze-cell wall"></div>';
                  }
                  for (let x = 0; x < maze.width; x++) {
                      const cell = maze.grid[y][x];
                      const hasSouth = (cell.walls & this.SOUTH) !== 0;
                      if (hasSouth) {
                          // Path opening
                          for (let i = 0; i < walkSize; i++) {
                              html += '<div class="maze-cell path"></div>';
                          }
                      }
                      else {
                          // Solid wall
                          for (let i = 0; i < wallSize; i++) {
                              html += '<div class="maze-cell wall"></div>';
                          }
                      }
                      // Wall intersection
                      for (let i = 0; i < wallSize; i++) {
                          html += '<div class="maze-cell wall"></div>';
                      }
                  }
                  html += '</div>';
              }
          }
          // Bottom border row (all walls)
          html += '<div class="maze-row">';
          for (let x = 0; x < totalWidth; x++) {
              html += '<div class="maze-cell wall"></div>';
          }
          html += '</div>';
          html += '</div>';
          return html;
      }
      // New method: Render exact one-to-one block representation
      renderExactBlockLayout(levelIndex) {
          const maze = this.mazes[levelIndex];
          if (!maze)
              return '';
          const { wallSize, walkSize, generateHoles, holesPerLevel, generateLadders } = config;
          // Calculate exact dimensions (same as command generation)
          const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
          const totalHeight = maze.height * walkSize + (maze.height + 1) * wallSize;
          let html = '<div class="exact-maze-grid" style="border: 2px solid #333; background: #333; display: inline-block;">';
          html += '<div class="grid-info" style="background: #f0f0f0; padding: 5px; margin-bottom: 10px; font-size: 12px;">';
          html += `Exact Block Layout - Level ${levelIndex + 1} | Dimensions: ${totalWidth}×${totalHeight} blocks`;
          html += '</div>';
          // Render each block exactly as it appears in Minecraft
          for (let z = 0; z < totalHeight; z++) {
              html += '<div class="exact-maze-row" style="display: flex;">';
              for (let x = 0; x < totalWidth; x++) {
                  const blockType = this.getBlockTypeAt(levelIndex, x, z, wallSize, walkSize, generateHoles, holesPerLevel, generateLadders);
                  const blockClass = this.getBlockClass(blockType);
                  const blockTitle = this.getBlockTitle(blockType, x, z);
                  html += `<div class="exact-maze-cell ${blockClass}" title="${blockTitle}" data-x="${x}" data-z="${z}"></div>`;
              }
              html += '</div>';
          }
          html += '</div>';
          return html;
      }
      // Helper method to determine block type at specific coordinates
      getBlockTypeAt(levelIndex, x, z, wallSize, walkSize, generateHoles, holesPerLevel, generateLadders) {
          const maze = this.mazes[levelIndex];
          if (!maze)
              return 'unknown';
          // Calculate which maze cell this block belongs to
          const cellX = Math.floor(x / (walkSize + wallSize));
          const cellZ = Math.floor(z / (walkSize + wallSize));
          // Check if this is a border block
          if (x === 0 || x === maze.width * walkSize + (maze.width + 1) * wallSize - 1 ||
              z === 0 || z === maze.height * walkSize + (maze.height + 1) * wallSize - 1) {
              // Check for entrance/exit openings
              if (levelIndex === 0 && x === 0 && z === wallSize + Math.floor(walkSize / 2)) {
                  return 'entrance';
              }
              if (levelIndex === this.levels - 1 && x === maze.width * walkSize + (maze.width + 1) * wallSize - 1 &&
                  z === wallSize + (maze.height - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2)) {
                  return 'exit';
              }
              return 'border-wall';
          }
          // Check if this is a wall intersection (pillar)
          const isWallX = (x % (walkSize + wallSize)) < wallSize;
          const isWallZ = (z % (walkSize + wallSize)) < wallSize;
          if (isWallX && isWallZ) {
              return 'wall-pillar';
          }
          // Check if this is a vertical wall
          if (isWallX && !isWallZ) {
              const cell = maze.grid[cellZ][cellX];
              const hasEast = (cell && (cell.walls & this.EAST) !== 0);
              return hasEast ? 'path' : 'vertical-wall';
          }
          // Check if this is a horizontal wall
          if (!isWallX && isWallZ) {
              const cell = maze.grid[cellZ][cellX];
              const hasSouth = (cell && (cell.walls & this.SOUTH) !== 0);
              return hasSouth ? 'path' : 'horizontal-wall';
          }
          // This is a path block
          // Check if it's a hole location
          if (generateHoles) {
              const holeCells = this.getHoleCells(levelIndex, generateHoles, holesPerLevel);
              const isHoleCell = holeCells.some(hole => hole.x === cellX && hole.y === cellZ);
              if (isHoleCell) {
                  const holeCell = holeCells.find(hole => hole.x === cellX && hole.y === cellZ);
                  if (holeCell) {
                      if (holeCell.hasUp && generateLadders)
                          return 'hole-up-ladder';
                      if (holeCell.hasUp && !generateLadders)
                          return 'hole-up-only';
                      if (holeCell.hasDown && generateLadders)
                          return 'hole-down-ladder';
                      if (holeCell.hasDown && !generateLadders)
                          return 'hole-down-only';
                  }
              }
          }
          return 'path';
      }
      // Helper method to get CSS class for block type
      getBlockClass(blockType) {
          const classes = {
              'path': 'exact-path',
              'border-wall': 'exact-border-wall',
              'vertical-wall': 'exact-vertical-wall',
              'horizontal-wall': 'exact-horizontal-wall',
              'wall-pillar': 'exact-wall-pillar',
              'entrance': 'exact-entrance',
              'exit': 'exact-exit',
              'hole-up-ladder': 'exact-hole-up-ladder',
              'hole-down-ladder': 'exact-hole-down-ladder',
              'hole-up-only': 'exact-hole-up-only',
              'hole-down-only': 'exact-hole-down-only',
              'unknown': 'exact-unknown'
          };
          return classes[blockType] || 'exact-unknown';
      }
      // Helper method to get title/tooltip for block
      getBlockTitle(blockType, x, z) {
          const titles = {
              'path': `Path block at (${x}, ${z})`,
              'border-wall': `Border wall at (${x}, ${z})`,
              'vertical-wall': `Vertical wall at (${x}, ${z})`,
              'horizontal-wall': `Horizontal wall at (${x}, ${z})`,
              'wall-pillar': `Wall pillar at (${x}, ${z})`,
              'entrance': `Entrance at (${x}, ${z})`,
              'exit': `Exit at (${x}, ${z})`,
              'hole-up-ladder': `Hole with up ladder at (${x}, ${z})`,
              'hole-down-ladder': `Hole with down ladder at (${x}, ${z})`,
              'hole-up-only': `Hole only (up) at (${x}, ${z})`,
              'hole-down-only': `Hole only (down) at (${x}, ${z})`,
              'unknown': `Unknown block at (${x}, ${z})`
          };
          return titles[blockType] || `Unknown block at (${x}, ${z})`;
      }
      renderTreeView() {
          let html = '';
          for (let i = 0; i < this.levels; i++) {
              const activeClass = i === this.currentLevel ? 'active' : '';
              html += `<div class="tree-item ${activeClass}" onclick="selectLevel(${i})">Level ${i + 1}</div>`;
          }
          return html;
      }
      // Shared function to determine which cells should have holes/ladders
      getHoleCells(levelIndex, generateHoles, holesPerLevel) {
          const holeCells = [];
          if (!generateHoles)
              return holeCells;
          const maze = this.mazes[levelIndex];
          if (!maze)
              return holeCells;
          let holesGenerated = 0;
          for (let y = 0; y < maze.height; y++) {
              for (let x = 0; x < maze.width; x++) {
                  if (holesGenerated >= holesPerLevel)
                      break;
                  const cell = maze.grid[y][x];
                  if ((cell.hasUp && levelIndex < this.levels - 1) || (cell.hasDown && levelIndex > 0)) {
                      holeCells.push({
                          x: x,
                          y: y,
                          hasUp: cell.hasUp && levelIndex < this.levels - 1,
                          hasDown: cell.hasDown && levelIndex > 0
                      });
                      holesGenerated++;
                  }
              }
              if (holesGenerated >= holesPerLevel)
                  break;
          }
          return holeCells;
      }
  }
  // Global variables
  let mazeGenerator = null;
  let currentDisplayMode = 'schematic';
  function debounce(func, wait) {
      let timeout;
      const later = function () {
          timeout = 0;
          func();
      };
      return () => {
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
      };
  }
  function updateDetailedFilename() {
      let { width, height, wallSize, wallHeight, walkSize, block, levels, addRoof } = config;
      let suffix = '';
      if (addRoof)
          suffix = '-wceiling';
      const filename = `${width}x${height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
      const detailedNameElement = document.querySelector('[data-show="detailed-name"]');
      if (detailedNameElement) {
          detailedNameElement.textContent = filename;
      }
  }
  function updateCustomNamePreview() {
      const customNameInput = document.querySelector('[data-for="customName"]');
      const customNamePreview = document.getElementById('customNamePreview');
      const customNameText = document.getElementById('customNameText');
      const customRadio = document.querySelector('input[name="naming"][value="custom"]');
      if (customNameInput && customNamePreview && customNameText) {
          const customName = customNameInput.value.trim();
          if (customRadio.checked && customName) {
              // Remove .mcfunction if user typed it, then show preview
              const cleanName = customName.replace(/\.mcfunction$/i, '');
              customNameText.textContent = cleanName;
              customNamePreview.style.display = 'block';
          }
          else {
              customNamePreview.style.display = 'none';
          }
      }
  }
  function updateDimensions() {
      let { width, height, wallSize, walkSize } = config;
      const totalWidth = width * walkSize + (width + 1) * wallSize;
      const totalHeight = height * walkSize + (height + 1) * wallSize;
      document.querySelector('[data-show=dimensions]').innerHTML = `${totalWidth} &times; ${totalHeight}`;
  }
  function validate() {
      Array.from(document.querySelectorAll('input')).forEach(element => {
          if (element.type === 'number') {
              if (+element.value > +element.max) {
                  element.value = element.max;
              }
              else if (+element.value < +element.min) {
                  element.value = element.min;
              }
          }
      });
      updateDetailedFilename();
      updateCustomNamePreview();
      updateDimensions();
      // Check if dimensions changed (requires full regeneration)
      const currentWidth = config.width;
      const currentHeight = config.height;
      const currentLevels = config.levels;
      if (!mazeGenerator ||
          currentWidth !== mazeGenerator.width ||
          currentHeight !== mazeGenerator.height ||
          currentLevels !== mazeGenerator.levels) {
          // Dimensions changed - regenerate maze
          drawDelay();
      }
      else {
          // Only visual options changed - just refresh display
          refreshDisplay();
      }
  }
  function refreshDisplay() {
      // Only update the visual display without regenerating the maze
      if (mazeGenerator) {
          updateDisplay();
      }
  }
  function regenerateMaze() {
      // Force a complete maze regeneration
      draw();
  }
  function updateDisplay() {
      if (!mazeGenerator)
          return;
      // Update maze display
      const mazeDisplay = document.getElementById('mazeDisplay');
      if (mazeDisplay) {
          // Render based on current display mode
          if (currentDisplayMode === 'exact') {
              mazeDisplay.innerHTML = mazeGenerator.renderExactBlockLayout(mazeGenerator.currentLevel);
          }
          else {
              mazeDisplay.innerHTML = mazeGenerator.renderLevel(mazeGenerator.currentLevel);
          }
          // Calculate optimal cell size based on available space to ensure perfect squares
          const container = mazeDisplay.parentElement;
          if (container) {
              const containerWidth = container.clientWidth - 60; // Account for padding and borders
              const containerHeight = container.clientHeight - 60; // Account for padding and borders
              // Get current wall and path sizes from config
              const { wallSize, walkSize } = config;
              // Calculate how many cells we need to fit based on dynamic grid structure
              const totalCellsX = mazeGenerator.width * walkSize + (mazeGenerator.width + 1) * wallSize;
              const totalCellsY = mazeGenerator.height * walkSize + (mazeGenerator.height + 1) * wallSize;
              // Calculate maximum cell size that fits both dimensions
              const maxCellWidth = Math.floor(containerWidth / totalCellsX);
              const maxCellHeight = Math.floor(containerHeight / totalCellsY);
              // Use the smaller of the two to ensure perfect squares
              const optimalCellSize = Math.min(maxCellWidth, maxCellHeight, 40); // Max 40px, min 15px
              const finalCellSize = Math.max(optimalCellSize, 15);
              // Apply dynamic sizing to ensure perfect squares
              const mazeGrid = mazeDisplay.querySelector('.maze-grid');
              if (mazeGrid) {
                  const cells = mazeGrid.querySelectorAll('.maze-cell');
                  cells.forEach(cell => {
                      cell.style.width = `${finalCellSize}px`;
                      cell.style.height = `${finalCellSize}px`;
                  });
              }
              // Apply dynamic sizing to exact block layout cells
              const exactMazeGrid = mazeDisplay.querySelector('.exact-maze-grid');
              if (exactMazeGrid) {
                  const exactCells = exactMazeGrid.querySelectorAll('.exact-maze-cell');
                  exactCells.forEach(cell => {
                      cell.style.width = `${finalCellSize}px`;
                      cell.style.height = `${finalCellSize}px`;
                  });
              }
              // --- Block Legend ---
              const blockLegend = document.getElementById('blockLegend');
              if (blockLegend) {
                  if (config.showBlockLegend) {
                      // Render a row legend: [wall][wall]...[path][path]... with labels
                      let legendHtml = '<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">';
                      legendHtml += '<span style="font-size: 0.9em; color: #555; margin-right: 6px;">Wall</span>';
                      for (let i = 0; i < wallSize; i++) {
                          legendHtml += `<div class="maze-cell wall" style="width: ${finalCellSize}px; height: ${finalCellSize}px;"></div>`;
                      }
                      legendHtml += '<span style="font-size: 0.9em; color: #555; margin: 0 6px;">Path</span>';
                      for (let i = 0; i < walkSize; i++) {
                          legendHtml += `<div class="maze-cell path" style="width: ${finalCellSize}px; height: ${finalCellSize}px;"></div>`;
                      }
                      legendHtml += '</div>';
                      blockLegend.innerHTML = legendHtml;
                  }
                  else {
                      blockLegend.innerHTML = '';
                  }
              }
              // --- Chunk Borders ---
              // Remove any previous chunk overlays
              const oldChunkOverlay = document.getElementById('chunkOverlay');
              if (oldChunkOverlay && oldChunkOverlay.parentElement) {
                  oldChunkOverlay.parentElement.removeChild(oldChunkOverlay);
              }
              if (config.showChunkBorders && mazeGrid) {
                  // Create overlay div
                  const overlay = document.createElement('div');
                  overlay.id = 'chunkOverlay';
                  overlay.style.position = 'absolute';
                  const gridRect = mazeGrid;
                  overlay.style.left = gridRect.offsetLeft + 'px';
                  overlay.style.top = gridRect.offsetTop + 'px';
                  overlay.style.pointerEvents = 'none';
                  overlay.style.width = gridRect.offsetWidth + 'px';
                  overlay.style.height = gridRect.offsetHeight + 'px';
                  overlay.style.zIndex = '10';
                  overlay.style.display = 'block';
                  // Draw chunk lines (every 16 blocks)
                  const overlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  overlaySvg.setAttribute('width', overlay.style.width);
                  overlaySvg.setAttribute('height', overlay.style.height);
                  overlaySvg.style.position = 'absolute';
                  overlaySvg.style.left = '0';
                  overlaySvg.style.top = '0';
                  overlaySvg.style.width = '100%';
                  overlaySvg.style.height = '100%';
                  // Vertical lines (every 16 blocks)
                  for (let x = 16; x < totalCellsX; x += 16) {
                      const pos = x * finalCellSize;
                      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                      line.setAttribute('x1', pos.toString());
                      line.setAttribute('y1', '0');
                      line.setAttribute('x2', pos.toString());
                      line.setAttribute('y2', (totalCellsY * finalCellSize).toString());
                      line.setAttribute('stroke', '#ff0000');
                      line.setAttribute('stroke-width', '3');
                      line.setAttribute('stroke-dasharray', '8,8');
                      line.setAttribute('opacity', '0.7');
                      overlaySvg.appendChild(line);
                  }
                  // Horizontal lines (every 16 blocks)
                  for (let y = 16; y < totalCellsY; y += 16) {
                      const pos = y * finalCellSize;
                      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                      line.setAttribute('x1', '0');
                      line.setAttribute('y1', pos.toString());
                      line.setAttribute('x2', (totalCellsX * finalCellSize).toString());
                      line.setAttribute('y2', pos.toString());
                      line.setAttribute('stroke', '#ff0000');
                      line.setAttribute('stroke-width', '3');
                      line.setAttribute('stroke-dasharray', '8,8');
                      line.setAttribute('opacity', '0.7');
                      overlaySvg.appendChild(line);
                  }
                  overlay.appendChild(overlaySvg);
                  mazeDisplay.appendChild(overlay);
              }
          }
      }
      // Update tree view
      const treeView = document.getElementById('treeView');
      if (treeView) {
          treeView.innerHTML = mazeGenerator.renderTreeView();
      }
      // Update level controls
      const currentLevel = document.getElementById('currentLevel');
      const totalLevels = document.getElementById('totalLevels');
      if (currentLevel)
          currentLevel.textContent = (mazeGenerator.currentLevel + 1).toString();
      if (totalLevels)
          totalLevels.textContent = mazeGenerator.levels.toString();
      // Update navigation buttons
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      if (prevBtn)
          prevBtn.disabled = mazeGenerator.currentLevel === 0;
      if (nextBtn)
          nextBtn.disabled = mazeGenerator.currentLevel === mazeGenerator.levels - 1;
  }
  function draw() {
      let { width, height, levels } = config;
      mazeGenerator = new MultiLevelMaze(width, height, levels);
      mazeGenerator.generate();
      updateDisplay();
  }
  function generateCommand() {
      if (!mazeGenerator)
          return;
      let { wallSize, wallHeight, walkSize, block, levels, addRoof, generateHoles, holesPerLevel, generateLadders } = config;
      // Use user values directly
      // Each level: floor (1), walls (wallHeight), so total per level = 1 + wallHeight
      const commands = [
          `# Multi-Level Maze Generator\n`,
          `# Levels: ${levels}\n`,
          `# Dimensions: ${mazeGenerator.width}x${mazeGenerator.height}\n\n`
      ];
      // Calculate maze dimensions in blocks
      // For a maze of N cells, there are N+1 walls in each direction
      let lastWallTopY = 0;
      let totalWidth = 0;
      let totalHeight = 0;
      for (let level = 0; level < levels; level++) {
          commands.push(`# Level ${level + 1}\n`);
          const maze = mazeGenerator.mazes[level];
          if (!maze)
              continue;
          // Y coordinate for this level
          const levelY = level * (1 + wallHeight); // floor + wallHeight, no air gap
          const mazeWidth = maze.width;
          const mazeHeight = maze.height;
          totalWidth = mazeWidth * walkSize + (mazeWidth + 1) * wallSize;
          totalHeight = mazeHeight * walkSize + (mazeHeight + 1) * wallSize;
          const floorY = levelY;
          const wallTopY = levelY + wallHeight; // wallHeight blocks above floor
          // 1. Clear the area for this level
          commands.push(`fill ~0 ~${floorY} ~0 ~${totalWidth - 1} ~${wallTopY} ~${totalHeight - 1} air\n`);
          // 2. Fill the floor (1 block thick)
          commands.push(`fill ~0 ~${floorY} ~0 ~${totalWidth - 1} ~${floorY} ~${totalHeight - 1} stone\n`);
          // 3. Build walls
          // Place all vertical (north-south) walls
          for (let x = 0; x <= mazeWidth; x++) {
              for (let y = 0; y < mazeHeight; y++) {
                  // If this is a wall (either left of cell or rightmost border)
                  if (x === mazeWidth || (x > 0 && (maze.grid[y][x - 1].walls & mazeGenerator.EAST) === 0)) {
                      const wx = x * (walkSize + wallSize);
                      const wz = y * (walkSize + wallSize) + wallSize;
                      commands.push(`fill ~${wx} ~${floorY + 1} ~${wz} ~${wx + wallSize - 1} ~${wallTopY} ~${wz + walkSize - 1} ${block}\n`);
                  }
              }
          }
          // Place all horizontal (west-east) walls
          for (let y = 0; y <= mazeHeight; y++) {
              for (let x = 0; x < mazeWidth; x++) {
                  // If this is a wall (either above cell or bottom border)
                  if (y === mazeHeight || (y > 0 && (maze.grid[y - 1][x].walls & mazeGenerator.SOUTH) === 0)) {
                      const wx = x * (walkSize + wallSize) + wallSize;
                      const wz = y * (walkSize + wallSize);
                      commands.push(`fill ~${wx} ~${floorY + 1} ~${wz} ~${wx + walkSize - 1} ~${wallTopY} ~${wz + wallSize - 1} ${block}\n`);
                  }
              }
          }
          // Place all wall intersections (pillars)
          for (let y = 0; y <= mazeHeight; y++) {
              for (let x = 0; x <= mazeWidth; x++) {
                  const wx = x * (walkSize + wallSize);
                  const wz = y * (walkSize + wallSize);
                  commands.push(`fill ~${wx} ~${floorY + 1} ~${wz} ~${wx + wallSize - 1} ~${wallTopY} ~${wz + wallSize - 1} ${block}\n`);
              }
          }
          // 3b. Add solid perimeter walls, with entrance/exit openings
          // Calculate entrance/exit positions
          const entranceX = 0;
          const entranceZ = wallSize + Math.floor(walkSize / 2);
          const exitX = totalWidth - 1;
          const exitZ = wallSize + (mazeHeight - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2);
          // North edge (z = 0)
          for (let x = 0; x < totalWidth; x++) {
              // Only skip the single entrance block on the first level
              if (level === 0 && x === entranceX && 0 === entranceZ)
                  continue;
              commands.push(`fill ~${x} ~${floorY + 1} ~0 ~${x} ~${wallTopY} ~0 ${block}\n`);
          }
          // South edge (z = totalHeight - 1)
          for (let x = 0; x < totalWidth; x++) {
              commands.push(`fill ~${x} ~${floorY + 1} ~${totalHeight - 1} ~${x} ~${wallTopY} ~${totalHeight - 1} ${block}\n`);
          }
          // West edge (x = 0)
          for (let z = 0; z < totalHeight; z++) {
              // Only skip the single entrance block on the first level
              if (level === 0 && 0 === entranceX && z === entranceZ)
                  continue;
              commands.push(`fill ~0 ~${floorY + 1} ~${z} ~0 ~${wallTopY} ~${z} ${block}\n`);
          }
          // East edge (x = totalWidth - 1)
          for (let z = 0; z < totalHeight; z++) {
              // Only skip the single exit block on the last level
              if (level === levels - 1 && totalWidth - 1 === exitX && z === exitZ)
                  continue;
              commands.push(`fill ~${totalWidth - 1} ~${floorY + 1} ~${z} ~${totalWidth - 1} ~${wallTopY} ~${z} ${block}\n`);
          }
          // 4. Carve floor holes for ladder connections (before ladders are placed)
          if (generateHoles) {
              const holeCells = mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
              for (const holeCell of holeCells) {
                  // Center of the path cell
                  const px = holeCell.x * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
                  const pz = holeCell.y * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
                  // Carve hole in floor for up/down connections
                  commands.push(`# Floor hole at level ${level + 1}, cell (${holeCell.x}, ${holeCell.y}), coordinates (~${px}, ~${floorY}, ~${pz})\n`);
                  commands.push(`setblock ~${px} ~${floorY} ~${pz} air\n`);
              }
          }
          // 5. Explicitly carve entrance and exit holes at the very end (so they are never overwritten)
          // Carve entrance (west wall, first cell, first level)
          if (level === 0) {
              for (let y = floorY + 1; y <= wallTopY; y++) {
                  commands.push(`setblock ~${entranceX} ~${y} ~${entranceZ} air\n`);
              }
          }
          // Carve exit (east wall, last cell, last level)
          if (level === levels - 1) {
              for (let y = floorY + 1; y <= wallTopY; y++) {
                  commands.push(`setblock ~${exitX} ~${y} ~${exitZ} air\n`);
              }
          }
          commands.push('\n');
          lastWallTopY = wallTopY;
      }
      // Add ceiling/roof if enabled (after all levels)
      if (addRoof) {
          commands.push(`# Ceiling/Roof\n`);
          commands.push(`fill ~0 ~${lastWallTopY + 1} ~0 ~${totalWidth - 1} ~${lastWallTopY + 1} ~${totalHeight - 1} ${block}\n`);
      }
      // 6. Place all ladders AFTER all walls and floors are built
      if (generateLadders && generateHoles) {
          commands.push(`# Ladder Placement (after all walls are built)\n`);
          for (let level = 0; level < levels; level++) {
              const maze = mazeGenerator.mazes[level];
              if (!maze)
                  continue;
              const levelY = level * (1 + wallHeight);
              const floorY = levelY;
              const wallTopY = levelY + wallHeight;
              const holeCells = mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
              for (const holeCell of holeCells) {
                  const x = holeCell.x;
                  const y = holeCell.y;
                  // Up ladder (to next level)
                  if (holeCell.hasUp) {
                      commands.push(`# Up ladder at level ${level + 1}, cell (${x}, ${y})\n`);
                      // Try each wall in order: N, S, W, E
                      const wallOptions = [
                          { dx: 0, dz: -1, dir: mazeGenerator.NORTH, facing: 2 }, // North wall, faces south
                          { dx: 0, dz: 1, dir: mazeGenerator.SOUTH, facing: 3 }, // South wall, faces north
                          { dx: -1, dz: 0, dir: mazeGenerator.WEST, facing: 4 }, // West wall, faces east
                          { dx: 1, dz: 0, dir: mazeGenerator.EAST, facing: 5 } // East wall, faces west
                      ];
                      let ladderPlaced = false;
                      for (const wall of wallOptions) {
                          // If the wall is solid (no passage in that direction)
                          if ((maze.grid[y][x].walls & wall.dir) === 0) {
                              // Use the exact same wall coordinate calculation as the wall building logic
                              let wx, wz;
                              if (wall.dx !== 0) {
                                  // East/West wall - use horizontal wall coordinates
                                  wx = x * (walkSize + wallSize) + wallSize;
                                  wz = y * (walkSize + wallSize);
                              }
                              else {
                                  // North/South wall - use vertical wall coordinates
                                  wx = x * (walkSize + wallSize);
                                  wz = y * (walkSize + wallSize) + wallSize;
                              }
                              // Place ladder on the wall
                              for (let ladderY = floorY + 1; ladderY <= wallTopY + 2; ladderY++) {
                                  commands.push(`setblock ~${wx} ~${ladderY} ~${wz} ladder ${wall.facing}\n`);
                              }
                              commands.push(`# Ladder placed on ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${wx}, ~${floorY + 1}-${wallTopY + 2}, ~${wz}), facing ${wall.facing}\n`);
                              ladderPlaced = true;
                              break;
                          }
                      }
                      if (!ladderPlaced) {
                          commands.push(`# WARNING: No solid wall found for up ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
                      }
                  }
                  // Down ladder (to previous level)
                  if (holeCell.hasDown) {
                      commands.push(`# Down ladder at level ${level + 1}, cell (${x}, ${y})\n`);
                      // Try each wall in order: N, S, W, E
                      const wallOptions = [
                          { dx: 0, dz: -1, dir: mazeGenerator.NORTH, facing: 2 }, // North wall, faces south
                          { dx: 0, dz: 1, dir: mazeGenerator.SOUTH, facing: 3 }, // South wall, faces north
                          { dx: -1, dz: 0, dir: mazeGenerator.WEST, facing: 4 }, // West wall, faces east
                          { dx: 1, dz: 0, dir: mazeGenerator.EAST, facing: 5 } // East wall, faces west
                      ];
                      let ladderPlaced = false;
                      for (const wall of wallOptions) {
                          if ((maze.grid[y][x].walls & wall.dir) === 0) {
                              // Use the exact same wall coordinate calculation as the wall building logic
                              let wx, wz;
                              if (wall.dx !== 0) {
                                  // East/West wall - use horizontal wall coordinates
                                  wx = x * (walkSize + wallSize) + wallSize;
                                  wz = y * (walkSize + wallSize);
                              }
                              else {
                                  // North/South wall - use vertical wall coordinates
                                  wx = x * (walkSize + wallSize);
                                  wz = y * (walkSize + wallSize) + wallSize;
                              }
                              // Place ladder on the wall
                              for (let ladderY = floorY + 1; ladderY <= wallTopY + 2; ladderY++) {
                                  commands.push(`setblock ~${wx} ~${ladderY} ~${wz} ladder ${wall.facing}\n`);
                              }
                              commands.push(`# Ladder placed on ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${wx}, ~${floorY + 1}-${wallTopY + 2}, ~${wz}), facing ${wall.facing}\n`);
                              ladderPlaced = true;
                              break;
                          }
                      }
                      if (!ladderPlaced) {
                          commands.push(`# WARNING: No solid wall found for down ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
                      }
                  }
              }
          }
      }
      // Generate filename based on selected naming option
      let filename;
      const namingOption = document.querySelector('input[name="naming"]:checked')?.value;
      switch (namingOption) {
          case 'simple':
              filename = 'maze.mcfunction';
              break;
          case 'detailed': {
              // Format: <width>x<height>x<levels>maze-<ww#><wh#><pw#><wb"word">[-wceiling].mcfunction
              let suffix = '';
              if (addRoof)
                  suffix = '-wceiling';
              filename = `${mazeGenerator.width}x${mazeGenerator.height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
              break;
          }
          case 'custom':
              const customName = document.querySelector('[data-for="customName"]')?.value?.trim();
              if (customName) {
                  filename = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
              }
              else {
                  filename = 'maze.mcfunction';
              }
              break;
          default:
              filename = 'maze.mcfunction';
      }
      const element = document.body.appendChild(document.createElement('a'));
      const commandData = new Blob(commands, { type: 'text/plain' });
      element.href = URL.createObjectURL(commandData);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      element.click();
      document.body.removeChild(element);
  }
  // Navigation functions
  function nextLevel() {
      if (mazeGenerator && mazeGenerator.currentLevel < mazeGenerator.levels - 1) {
          mazeGenerator.currentLevel++;
          updateDisplay();
      }
  }
  function previousLevel() {
      if (mazeGenerator && mazeGenerator.currentLevel > 0) {
          mazeGenerator.currentLevel--;
          updateDisplay();
      }
  }
  function selectLevel(level) {
      if (mazeGenerator && level >= 0 && level < mazeGenerator.levels) {
          mazeGenerator.currentLevel = level;
          updateDisplay();
      }
  }
  function switchDisplay(mode) {
      currentDisplayMode = mode;
      // Update button states
      const schematicBtn = document.getElementById('schematicBtn');
      const exactBtn = document.getElementById('exactBtn');
      if (schematicBtn) {
          schematicBtn.classList.toggle('active', mode === 'schematic');
      }
      if (exactBtn) {
          exactBtn.classList.toggle('active', mode === 'exact');
      }
      // Update legend visibility
      const schematicLegend = document.getElementById('schematic-legend');
      const exactLegend = document.getElementById('exact-legend');
      const legendNote = document.getElementById('legend-note');
      if (schematicLegend) {
          schematicLegend.style.display = mode === 'schematic' ? 'flex' : 'none';
      }
      if (exactLegend) {
          exactLegend.style.display = mode === 'exact' ? 'flex' : 'none';
      }
      if (legendNote) {
          legendNote.textContent = mode === 'schematic'
              ? 'Note: Indicators show hole locations (center of cells). Ladders are placed on adjacent walls.'
              : 'Note: Each pixel represents exactly one Minecraft block. Hover over blocks for coordinate information.';
      }
      // Update display
      updateDisplay();
  }
  const drawDelay = debounce(draw, 500);
  // Event listeners
  document.addEventListener('change', validate);
  document.addEventListener('input', (event) => {
      const target = event.target;
      if (target.getAttribute('data-for') === 'customName') {
          updateCustomNamePreview();
      }
  });
  // Add event listener for addRoof checkbox to update the filename example
  const addRoofCheckbox = document.querySelector('[data-for="addRoof"]');
  if (addRoofCheckbox) {
      addRoofCheckbox.addEventListener('change', updateDetailedFilename);
  }
  // Add event listener to the download button
  const downloadButton = document.querySelector('button.button.is-primary');
  if (downloadButton) {
      downloadButton.addEventListener('click', generateCommand);
  }
  // Handle window resize for dynamic sizing
  window.addEventListener('resize', () => {
      if (mazeGenerator) {
          updateDisplay();
      }
  });
  // Add event listeners for visual aids toggles
  window.addEventListener('DOMContentLoaded', () => {
      const blockLegendToggle = document.querySelector('[data-for="showBlockLegend"]');
      const chunkBordersToggle = document.querySelector('[data-for="showChunkBorders"]');
      const generateHolesToggle = document.querySelector('[data-for="generateHoles"]');
      const holesPerLevelInput = document.querySelector('[data-for="holesPerLevel"]');
      const generateLaddersToggle = document.querySelector('[data-for="generateLadders"]');
      if (blockLegendToggle) {
          blockLegendToggle.checked = config.showBlockLegend;
          blockLegendToggle.addEventListener('change', () => {
              config.showBlockLegend = blockLegendToggle.checked;
              updateDisplay();
          });
      }
      if (chunkBordersToggle) {
          chunkBordersToggle.checked = config.showChunkBorders;
          chunkBordersToggle.addEventListener('change', () => {
              config.showChunkBorders = chunkBordersToggle.checked;
              updateDisplay();
          });
      }
      if (generateHolesToggle) {
          generateHolesToggle.checked = config.generateHoles;
          generateHolesToggle.addEventListener('change', () => {
              config.generateHoles = generateHolesToggle.checked;
              updateDisplay();
          });
      }
      if (holesPerLevelInput) {
          holesPerLevelInput.value = config.holesPerLevel.toString();
          holesPerLevelInput.addEventListener('change', () => {
              config.holesPerLevel = parseInt(holesPerLevelInput.value) || 1;
              updateDisplay();
          });
      }
      if (generateLaddersToggle) {
          generateLaddersToggle.checked = config.generateLadders;
          generateLaddersToggle.addEventListener('change', () => {
              config.generateLadders = generateLaddersToggle.checked;
              updateDisplay();
          });
      }
  });
  // Initialize
  draw();
  updateDetailedFilename();
  updateCustomNamePreview();
  updateDimensions();
  // Make functions globally available
  window.nextLevel = nextLevel;
  window.previousLevel = previousLevel;
  window.selectLevel = selectLevel;
  window.switchDisplay = switchDisplay;
  window.refreshDisplay = refreshDisplay;
  window.regenerateMaze = regenerateMaze;

})();

(function (exports) {
  'use strict';

  // Current display mode
  let currentDisplayMode = 'schematic';
  // Display Manager - handles all rendering and visual display logic
  class DisplayManager {
      constructor() {
          this.mazeGenerator = null;
      }
      setMazeGenerator(generator) {
          this.mazeGenerator = generator;
      }
      renderLevel(levelIndex) {
          if (!this.mazeGenerator)
              return '';
          const maze = this.mazeGenerator.mazes[levelIndex];
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
              // Check for entrance hole on north wall for multi-level mazes
              if (this.mazeGenerator.levels > 1 && levelIndex === 0 && x === wallSize + Math.floor(walkSize / 2)) {
                  html += '<div class="maze-cell path"></div>';
              }
              else {
                  html += '<div class="maze-cell wall"></div>';
              }
          }
          html += '</div>';
          for (let y = 0; y < maze.height; y++) {
              for (let displayRow = 0; displayRow < walkSize; displayRow++) {
                  html += '<div class="maze-row">';
                  // Left border wall
                  for (let i = 0; i < wallSize; i++) {
                      html += '<div class="maze-cell wall"></div>';
                  }
                  for (let x = 0; x < maze.width; x++) {
                      for (let i = 0; i < walkSize; i++) {
                          html += '<div class="maze-cell path">';
                          // Add up/down indicators only in the center of the path
                          if (displayRow === Math.floor(walkSize / 2) && i === Math.floor(walkSize / 2)) {
                              const holeCells = this.mazeGenerator.getHoleCells(levelIndex, generateHoles, holesPerLevel);
                              const isHoleCell = holeCells.some(hole => hole.x === x && hole.y === y);
                              let showUp = false;
                              let showDown = false;
                              let upMethod = null;
                              let downMethod = null;
                              if (isHoleCell) {
                                  const holeCell = holeCells.find(hole => hole.x === x && hole.y === y);
                                  if (holeCell) {
                                      showUp = holeCell.hasUp;
                                      showDown = holeCell.hasDown;
                                      // Simulate method for demo: solid wall for up, fallback for down (in real code, track this)
                                      upMethod = showUp ? 'solid wall' : undefined;
                                      downMethod = showDown ? 'corner placement' : undefined;
                                  }
                              }
                              // Ensure upMethod/downMethod are string or undefined
                              const upTooltipMethod = upMethod ?? undefined;
                              const downTooltipMethod = downMethod ?? undefined;
                              // Show indicators based on config
                              if (showUp && generateLadders) {
                                  html += `<div class="maze-indicator up ladder-solid-wall" title="${this.getEnhancedTooltip('hole-up-ladder', x, y, levelIndex, upTooltipMethod)}"></div>`;
                              }
                              else if (showUp && !generateLadders) {
                                  html += `<div class="maze-indicator horizontal" style="background: #ffaaaa;" title="Hole only (no ladder)"></div>`;
                              }
                              else {
                                  html += `<div class="maze-indicator horizontal"></div>`;
                              }
                              if (showDown && generateLadders) {
                                  html += `<div class="maze-indicator down ladder-corner" title="${this.getEnhancedTooltip('hole-down-ladder', x, y, levelIndex, downTooltipMethod)}"></div>`;
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
                      for (let i = 0; i < wallSize; i++) {
                          // For the last cell in the row, always render wall
                          if (x === maze.width - 1) {
                              html += '<div class="maze-cell wall"></div>';
                          }
                          else {
                              // For internal walls, check if there is an east passage
                              const cell = maze.grid[y][x];
                              const hasEast = (cell.walls & this.mazeGenerator.EAST) !== 0;
                              html += `<div class="maze-cell ${hasEast ? 'path' : 'wall'}"></div>`;
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
                      const hasSouth = (cell.walls & this.mazeGenerator.SOUTH) !== 0;
                      for (let i = 0; i < walkSize; i++) {
                          html += `<div class="maze-cell ${hasSouth ? 'path' : 'wall'}"></div>`;
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
              // Check for exit hole on south wall for multi-level mazes
              if (this.mazeGenerator.levels > 1 && levelIndex === this.mazeGenerator.levels - 1 && x === wallSize + (maze.width - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2)) {
                  html += '<div class="maze-cell path"></div>';
              }
              else {
                  html += '<div class="maze-cell wall"></div>';
              }
          }
          html += '</div>';
          html += '</div>';
          return html;
      }
      // New method: Render exact one-to-one block representation
      renderExactBlockLayout(levelIndex) {
          if (!this.mazeGenerator)
              return '';
          const maze = this.mazeGenerator.mazes[levelIndex];
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
                  // Simulate ladder method for demo: use fallback classes for down ladders, solid for up
                  let ladderMethod = undefined;
                  let extraClass = '';
                  if (blockType === 'hole-up-ladder') {
                      ladderMethod = 'solid wall';
                      extraClass = 'ladder-solid-wall';
                  }
                  else if (blockType === 'hole-down-ladder') {
                      ladderMethod = 'corner placement';
                      extraClass = 'ladder-corner';
                  }
                  const tooltip = this.getEnhancedTooltip(blockType, x, z, levelIndex, ladderMethod);
                  html += `<div class="exact-maze-cell ${blockClass} ${extraClass}" title="${tooltip}" data-x="${x}" data-z="${z}"></div>`;
              }
              html += '</div>';
          }
          html += '</div>';
          return html;
      }
      // Helper method to determine block type at specific coordinates
      getBlockTypeAt(levelIndex, x, z, wallSize, walkSize, generateHoles, holesPerLevel, generateLadders) {
          if (!this.mazeGenerator)
              return 'unknown';
          const maze = this.mazeGenerator.mazes[levelIndex];
          if (!maze)
              return 'unknown';
          // Calculate which maze cell this block belongs to
          const cellX = Math.floor(x / (walkSize + wallSize));
          const cellY = Math.floor(z / (walkSize + wallSize));
          // Check if this is a border block
          if (x === 0 || x === maze.width * walkSize + (maze.width + 1) * wallSize - 1 ||
              z === 0 || z === maze.height * walkSize + (maze.height + 1) * wallSize - 1) {
              // Check for entrance/exit openings based on maze type
              if (this.mazeGenerator.levels === 1) {
                  // Single level maze: entrance on west wall, exit on east wall
                  if (levelIndex === 0 && x === 0 && z === wallSize + Math.floor(walkSize / 2)) {
                      return 'entrance';
                  }
                  if (levelIndex === this.mazeGenerator.levels - 1 && x === maze.width * walkSize + (maze.width + 1) * wallSize - 1 &&
                      z === wallSize + (maze.height - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2)) {
                      return 'exit';
                  }
              }
              else {
                  // Multi-level maze: entrance on north wall of first level, exit on south wall of last level
                  if (levelIndex === 0 && z === 0 && x === wallSize + Math.floor(walkSize / 2)) {
                      return 'entrance';
                  }
                  if (levelIndex === this.mazeGenerator.levels - 1 && z === maze.height * walkSize + (maze.height + 1) * wallSize - 1 &&
                      x === wallSize + (maze.width - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2)) {
                      return 'exit';
                  }
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
              // For vertical walls, check the cell to the left (same logic as command generation)
              const cell = cellX > 0 ? maze.grid[cellY][cellX - 1] : null;
              const hasEast = (cell && (cell.walls & this.mazeGenerator.EAST) !== 0);
              return hasEast ? 'path' : 'vertical-wall';
          }
          // Check if this is a horizontal wall
          if (!isWallX && isWallZ) {
              // For horizontal walls, check the cell above (same logic as command generation)
              const cell = cellY > 0 ? maze.grid[cellY - 1][cellX] : null;
              const hasSouth = (cell && (cell.walls & this.mazeGenerator.SOUTH) !== 0);
              return hasSouth ? 'path' : 'horizontal-wall';
          }
          // This is a path block
          // Check if it's a hole location
          if (generateHoles) {
              const holeCells = this.mazeGenerator.getHoleCells(levelIndex, generateHoles, holesPerLevel);
              const isHoleCell = holeCells.some(hole => hole.x === cellX && hole.y === cellY);
              if (isHoleCell) {
                  const holeCell = holeCells.find(hole => hole.x === cellX && hole.y === cellY);
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
      // Enhanced tooltip method with ladder placement information
      getEnhancedTooltip(blockType, x, z, levelIndex, ladderMethod) {
          const baseInfo = `Level ${levelIndex + 1}, Cell (${x}, ${z})`;
          const blockInfo = this.getBlockTitle(blockType, x, z);
          let tooltip = `${baseInfo}\n${blockInfo}`;
          if (ladderMethod) {
              tooltip += `\nLadder Method: ${ladderMethod}`;
          }
          // Add additional info for hole cells
          if (blockType.includes('hole')) {
              const cellX = Math.floor(x / (config.walkSize + config.wallSize));
              const cellY = Math.floor(z / (config.walkSize + config.wallSize));
              if (!this.mazeGenerator)
                  return tooltip;
              const maze = this.mazeGenerator.mazes[levelIndex];
              if (maze && maze.grid[cellY] && maze.grid[cellY][cellX]) {
                  const cell = maze.grid[cellY][cellX];
                  if (cell.hasUp)
                      tooltip += '\nHas up passage';
                  if (cell.hasDown)
                      tooltip += '\nHas down passage';
              }
          }
          return tooltip;
      }
      renderLevelPagination() {
          if (!this.mazeGenerator)
              return '';
          let html = '';
          for (let i = 0; i < this.mazeGenerator.levels; i++) {
              const activeClass = i === this.mazeGenerator.currentLevel ? 'active' : '';
              const ariaCurrent = i === this.mazeGenerator.currentLevel ? ' aria-current="page"' : '';
              html += `<li class="page-item ${activeClass}">
        <a class="page-link" href="#" onclick="selectLevel(${i})"${ariaCurrent}>${i + 1}</a>
      </li>`;
          }
          return html;
      }
      renderBlockLegend() {
          const { showBlockLegend } = config;
          if (!showBlockLegend)
              return '';
          if (currentDisplayMode === 'schematic') {
              return `
        <div id="schematic-legend" class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background: #ddd; border: 1px solid #999;"></div>
            <span>Wall (${config.wallSize}×${config.wallSize})</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: white; border: 1px solid #999;"></div>
            <span>Path (${config.walkSize}×${config.walkSize})</span>
          </div>
          <div class="legend-item">
            <div class="legend-color ladder-solid-wall" style="border: 2px solid gold;"></div>
            <span>Ladder (Solid Wall)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color ladder-corner" style="border: 2px solid blue;"></div>
            <span>Ladder (Corner/Fallback)</span>
          </div>
        </div>
      `;
          }
          else {
              return `
        <div id="exact-legend" class="legend">
          <div class="legend-item">
            <div class="legend-color exact-border-wall"></div>
            <span>Border Wall</span>
          </div>
          <div class="legend-item">
            <div class="legend-color exact-path"></div>
            <span>Path</span>
          </div>
          <div class="legend-item">
            <div class="legend-color exact-hole-up-ladder ladder-solid-wall"></div>
            <span>Up Ladder</span>
          </div>
          <div class="legend-item">
            <div class="legend-color exact-hole-down-ladder ladder-corner"></div>
            <span>Down Ladder</span>
          </div>
        </div>
      `;
          }
      }
  }
  // Display mode management
  function switchDisplay(mode) {
      currentDisplayMode = mode;
      // Update button states
      const schematicBtn = document.getElementById('schematicBtn');
      const exactBtn = document.getElementById('exactBtn');
      if (schematicBtn) {
          schematicBtn.classList.toggle('active', mode === 'schematic');
          if (mode === 'schematic') {
              schematicBtn.classList.remove('btn-outline-primary');
              schematicBtn.classList.add('btn-primary');
          }
          else {
              schematicBtn.classList.remove('btn-primary');
              schematicBtn.classList.add('btn-outline-primary');
          }
      }
      if (exactBtn) {
          exactBtn.classList.toggle('active', mode === 'exact');
          if (mode === 'exact') {
              exactBtn.classList.remove('btn-outline-primary');
              exactBtn.classList.add('btn-primary');
          }
          else {
              exactBtn.classList.remove('btn-primary');
              exactBtn.classList.add('btn-outline-primary');
          }
      }
      // Update legend visibility
      const schematicLegend = document.getElementById('schematic-legend');
      const exactLegend = document.getElementById('exact-legend');
      const legendNote = document.getElementById('legend-note');
      if (schematicLegend)
          schematicLegend.style.display = mode === 'schematic' ? 'flex' : 'none';
      if (exactLegend)
          exactLegend.style.display = mode === 'exact' ? 'flex' : 'none';
      if (legendNote)
          legendNote.style.display = mode === 'exact' ? 'block' : 'none';
  }

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
          // Always generate 2D mazes
          for (let i = 0; i < this.levels; i++) {
              this.generate2DLevel(i);
          }
          // Generate holes before creating the level mazes
          if (config.generateHoles && this.levels > 1) {
              const usedHoleCoordinates = new Set();
              for (let i = 0; i < this.levels - 1; i++) {
                  const numHoles = config.holesPerLevel;
                  let holesPlaced = 0;
                  let attempts = 0;
                  const maxAttempts = (this.width * this.height) * 2; // Safeguard against infinite loops
                  while (holesPlaced < numHoles && attempts < maxAttempts) {
                      const x = Math.floor(Math.random() * this.width);
                      const y = Math.floor(Math.random() * this.height);
                      const coord = `${x},${y}`;
                      if (!usedHoleCoordinates.has(coord)) {
                          usedHoleCoordinates.add(coord);
                          this.grid[i][y][x] |= this.UP;
                          this.grid[i + 1][y][x] |= this.DOWN;
                          holesPlaced++;
                      }
                      attempts++;
                  }
                  if (holesPlaced < numHoles) {
                      console.warn(`Could only place ${holesPlaced} of ${numHoles} holes for level ${i + 1}. The maze may have fewer holes than requested.`);
                  }
              }
          }
          // Create individual maze objects for each level
          this.createLevelMazes();
      }
      generate2DLevel(level) {
          const stack = [];
          const visited = new Set();
          const startX = 0;
          const startY = 0;
          stack.push({ x: startX, y: startY });
          visited.add(`${startX},${startY}`);
          const directions2D = [this.NORTH, this.SOUTH, this.EAST, this.WEST];
          while (stack.length > 0) {
              const current = stack[stack.length - 1];
              // Get unvisited neighbors for 2D
              const neighbors = [];
              for (const dir of directions2D) {
                  const nx = current.x + this.dx[dir];
                  const ny = current.y + this.dy[dir];
                  if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && !visited.has(`${nx},${ny}`)) {
                      neighbors.push({ x: nx, y: ny, dir: dir });
                  }
              }
              if (neighbors.length === 0) {
                  stack.pop();
              }
              else {
                  const nextNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                  const { x: nextX, y: nextY, dir: direction } = nextNeighbor;
                  // Carve passage
                  this.grid[level][current.y][current.x] |= direction;
                  this.grid[level][nextY][nextX] |= this.opposite[direction];
                  visited.add(`${nextX},${nextY}`);
                  stack.push({ x: nextX, y: nextY });
              }
          }
          // For 2D mazes, we want standard entrance/exit on each level
          // Entrance: west wall of top-left cell
          // Exit: east wall of bottom-right cell
          this.grid[level][0][0] |= this.WEST;
          this.grid[level][this.height - 1][this.width - 1] |= this.EAST;
          // Ensure the exit cell is connected to the maze by forcing a path from a neighboring cell
          // Connect the bottom-right cell to its west neighbor if possible
          if (this.width > 1) {
              this.grid[level][this.height - 1][this.width - 2] |= this.EAST; // West neighbor gets east passage
              this.grid[level][this.height - 1][this.width - 1] |= this.WEST; // Exit cell gets west passage
          }
          // Also connect to north neighbor if possible
          if (this.height > 1) {
              this.grid[level][this.height - 2][this.width - 1] |= this.SOUTH; // North neighbor gets south passage
              this.grid[level][this.height - 1][this.width - 1] |= this.NORTH; // Exit cell gets north passage
          }
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
      // Shared function to determine which cells should have holes/ladders
      getHoleCells(levelIndex, generateHoles, _holesPerLevel) {
          const holeCells = [];
          if (!generateHoles)
              return holeCells;
          const maze = this.mazes[levelIndex];
          if (!maze)
              return holeCells;
          for (let y = 0; y < maze.height; y++) {
              for (let x = 0; x < maze.width; x++) {
                  const cell = maze.grid[y][x];
                  if ((cell.hasUp && levelIndex < this.levels - 1) || (cell.hasDown && levelIndex > 0)) {
                      holeCells.push({
                          x: x,
                          y: y,
                          hasUp: cell.hasUp && levelIndex < this.levels - 1,
                          hasDown: cell.hasDown && levelIndex > 0
                      });
                  }
              }
          }
          return holeCells;
      }
      // Debug function to help understand the maze structure
      debugMazeStructure(levelIndex) {
          const maze = this.mazes[levelIndex];
          if (!maze)
              return 'No maze data';
          let debug = `Maze Level ${levelIndex + 1} Structure:\n`;
          debug += `Dimensions: ${maze.width}x${maze.height}\n\n`;
          for (let y = 0; y < maze.height; y++) {
              for (let x = 0; x < maze.width; x++) {
                  const cell = maze.grid[y][x];
                  const walls = cell.walls;
                  const hasNorth = (walls & this.NORTH) !== 0;
                  const hasSouth = (walls & this.SOUTH) !== 0;
                  const hasEast = (walls & this.EAST) !== 0;
                  const hasWest = (walls & this.WEST) !== 0;
                  debug += `Cell [${x},${y}]: N:${hasNorth ? '1' : '0'} S:${hasSouth ? '1' : '0'} E:${hasEast ? '1' : '0'} W:${hasWest ? '1' : '0'}\n`;
              }
              debug += '\n';
          }
          // Check connectivity for single level mazes
          if (this.levels === 1) {
              debug += `\nConnectivity Check:\n`;
              const entranceCell = maze.grid[0][0];
              const exitCell = maze.grid[maze.height - 1][maze.width - 1];
              debug += `Entrance cell [0,0]: N:${(entranceCell.walls & this.NORTH) !== 0 ? '1' : '0'} S:${(entranceCell.walls & this.SOUTH) !== 0 ? '1' : '0'} E:${(entranceCell.walls & this.EAST) !== 0 ? '1' : '0'} W:${(entranceCell.walls & this.WEST) !== 0 ? '1' : '0'}\n`;
              debug += `Exit cell [${maze.width - 1},${maze.height - 1}]: N:${(exitCell.walls & this.NORTH) !== 0 ? '1' : '0'} S:${(exitCell.walls & this.SOUTH) !== 0 ? '1' : '0'} E:${(exitCell.walls & this.EAST) !== 0 ? '1' : '0'} W:${(exitCell.walls & this.WEST) !== 0 ? '1' : '0'}\n`;
          }
          console.log(debug);
          return debug;
      }
      // Fallback ladder placement strategies
      attemptFallbackLadderPlacement(x, y, level, direction, wallSize, walkSize, wallHeight, floorY, _maze, commands) {
          // This is the only fallback, as others were unreliable.
          // It creates a support pillar and places the ladder on it.
          const centerX = x * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
          const centerZ = y * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
          // Pillar to the SOUTH of the ladder. Ladder faces NORTH (data=2)
          const pillarX = centerX;
          const pillarZ = centerZ + 1;
          let pillarBottomY, pillarTopY, ladderBottomY, ladderTopY;
          if (direction === 'up') {
              // Ladder is in current level's space
              pillarBottomY = floorY + 1;
              pillarTopY = floorY + wallHeight;
              ladderBottomY = floorY + 1;
              ladderTopY = floorY + wallHeight;
          }
          else { // direction === 'down'
              // Ladder is in level below's space
              pillarBottomY = floorY - wallHeight;
              pillarTopY = floorY - 1; // up to block below floor
              ladderBottomY = floorY - wallHeight;
              ladderTopY = floorY; // includes air block of hole
          }
          // Build the pillar
          commands.push(`# FALLBACK: Creating support pillar for ${direction} ladder at (${x},${y}) on level ${level}.\n`);
          commands.push(`fill ~${pillarX} ~${pillarBottomY} ~${pillarZ} ~${pillarX} ~${pillarTopY} ~${pillarZ} stone\n`);
          // Place the ladder
          commands.push(`# FALLBACK: Placing ${direction} ladder at (${x},${y}) on level ${level}.\n`);
          commands.push(`fill ~${centerX} ~${ladderBottomY} ~${centerZ} ~${centerX} ~${ladderTopY} ~${centerZ} ladder 2\n`);
          return { method: 'Pillar Creation', success: true };
      }
      attemptCornerPlacement(_x, _y, _level, _direction, _wallSize, _walkSize, _wallHeight, _floorY, _commands) {
          // Deprecated: Unreliable and buggy.
          return null;
      }
      attemptWallCreation(_x, _y, _level, _direction, _wallSize, _walkSize, _wallHeight, _floorY, _maze, _commands) {
          // Deprecated: Unreliable and buggy.
          return null;
      }
      attemptCeilingMounting(_x, _y, _level, _direction, _wallSize, _walkSize, _wallHeight, _floorY, _commands) {
          // Deprecated: Unreliable and buggy.
          return null;
      }
  }

  // UI Controls - handles user interactions and control logic
  class UIControls {
      constructor(displayManager) {
          this.mazeGenerator = null;
          this.displayManager = displayManager;
          this.drawDelay = this.debounce(() => this.draw(), 500);
      }
      setMazeGenerator(generator) {
          this.mazeGenerator = generator;
          this.displayManager.setMazeGenerator(generator);
          if (this.onMazeGeneratorChange) {
              this.onMazeGeneratorChange(generator);
          }
      }
      setMazeGeneratorChangeCallback(callback) {
          this.onMazeGeneratorChange = callback;
      }
      // Main drawing/generation function
      draw() {
          let { width, height, levels } = config;
          this.setMazeGenerator(new MultiLevelMaze(width, height, levels));
          this.mazeGenerator.generate();
          this.updateDisplay(currentDisplayMode);
      }
      // Display refresh functions
      refreshDisplay() {
          // Only update the visual display without regenerating the maze
          if (this.mazeGenerator) {
              this.updateDisplay(currentDisplayMode);
          }
      }
      regenerateMaze() {
          // Force a complete maze regeneration
          this.draw();
      }
      updateDisplay(mode) {
          if (!this.mazeGenerator)
              return;
          const mazeDisplay = document.getElementById('mazeDisplay');
          if (!mazeDisplay)
              return;
          const currentLevel = this.mazeGenerator.currentLevel;
          // Update level display based on current display mode
          let html = '';
          if (mode === 'schematic') {
              html = this.displayManager.renderLevel(currentLevel);
          }
          else {
              html = this.displayManager.renderExactBlockLayout(currentLevel);
          }
          mazeDisplay.innerHTML = html;
          // Update level pagination
          this.updateLevelPagination();
          this.updateLevelControls();
          // Show/hide chunk overlay
          this.updateChunkOverlay();
          // Update filename preview
          this.updateDetailedFilename();
          this.updateCustomNamePreview();
      }
      updateLevelPagination() {
          if (!this.mazeGenerator)
              return;
          const pagination = document.getElementById('levelPagination');
          if (pagination) {
              // Get the level pagination items
              const levelPaginationItems = this.displayManager.renderLevelPagination();
              // Find the Previous button and Next button elements
              const prevBtn = pagination.querySelector('#prevBtn');
              const nextBtn = pagination.querySelector('#nextBtn');
              if (prevBtn && nextBtn) {
                  // Clear existing level items (everything between prev and next)
                  const prevParent = prevBtn.parentElement;
                  const nextParent = nextBtn.parentElement;
                  // Remove all level page items (keep only prev and next)
                  const allItems = Array.from(pagination.children);
                  allItems.forEach(item => {
                      if (item !== prevParent && item !== nextParent) {
                          item.remove();
                      }
                  });
                  // Insert level items before the next button
                  if (nextParent) {
                      nextParent.insertAdjacentHTML('beforebegin', levelPaginationItems);
                  }
              }
          }
          // Update button states
          const prevBtn = document.getElementById('prevBtn');
          const nextBtn = document.getElementById('nextBtn');
          const prevParent = prevBtn?.parentElement;
          const nextParent = nextBtn?.parentElement;
          if (prevParent) {
              if (this.mazeGenerator.currentLevel === 0) {
                  prevParent.classList.add('disabled');
                  prevBtn.setAttribute('tabindex', '-1');
              }
              else {
                  prevParent.classList.remove('disabled');
                  prevBtn.removeAttribute('tabindex');
              }
          }
          if (nextParent) {
              if (this.mazeGenerator.currentLevel === this.mazeGenerator.levels - 1) {
                  nextParent.classList.add('disabled');
                  nextBtn.setAttribute('tabindex', '-1');
              }
              else {
                  nextParent.classList.remove('disabled');
                  nextBtn.removeAttribute('tabindex');
              }
          }
      }
      updateLevelControls() {
          // This method can be expanded to update other level-specific controls
      }
      updateChunkOverlay() {
          const { showChunkBorders } = config;
          // Remove existing overlay
          const oldChunkOverlay = document.getElementById('chunkOverlay');
          if (oldChunkOverlay) {
              oldChunkOverlay.remove();
          }
          if (!showChunkBorders || !this.mazeGenerator)
              return;
          const mazeDisplay = document.getElementById('mazeDisplay');
          if (!mazeDisplay)
              return;
          // Calculate maze dimensions in blocks
          const maze = this.mazeGenerator.mazes[this.mazeGenerator.currentLevel];
          if (!maze)
              return;
          const { wallSize, walkSize } = config;
          const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
          const totalHeight = maze.height * walkSize + (maze.height + 1) * wallSize;
          // Get the size of maze cells in pixels
          const firstMazeCell = mazeDisplay.querySelector('.maze-cell, .exact-maze-cell');
          if (!firstMazeCell)
              return;
          const cellRect = firstMazeCell.getBoundingClientRect();
          const cellSize = cellRect.width; // Assuming square cells
          // Create chunk overlay container
          const overlay = document.createElement('div');
          overlay.id = 'chunkOverlay';
          overlay.style.position = 'absolute';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '10';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          // Draw vertical chunk lines (every 16 blocks)
          for (let x = 16; x < totalWidth; x += 16) {
              const line = document.createElement('div');
              line.style.position = 'absolute';
              line.style.left = `${x * cellSize}px`;
              line.style.top = '0';
              line.style.width = '2px';
              line.style.height = '100%';
              line.style.background = '#ff6b35';
              line.style.border = '1px dashed #ff6b35';
              line.style.opacity = '0.7';
              overlay.appendChild(line);
          }
          // Draw horizontal chunk lines (every 16 blocks)
          for (let z = 16; z < totalHeight; z += 16) {
              const line = document.createElement('div');
              line.style.position = 'absolute';
              line.style.left = '0';
              line.style.top = `${z * cellSize}px`;
              line.style.width = '100%';
              line.style.height = '2px';
              line.style.background = '#ff6b35';
              line.style.border = '1px dashed #ff6b35';
              line.style.opacity = '0.7';
              overlay.appendChild(line);
          }
          // Add chunk coordinate labels at intersections
          for (let chunkX = 0; chunkX * 16 < totalWidth; chunkX++) {
              for (let chunkZ = 0; chunkZ * 16 < totalHeight; chunkZ++) {
                  if (chunkX === 0 && chunkZ === 0)
                      continue; // Skip origin
                  const label = document.createElement('div');
                  label.style.position = 'absolute';
                  label.style.left = `${chunkX * 16 * cellSize + 2}px`;
                  label.style.top = `${chunkZ * 16 * cellSize + 2}px`;
                  label.style.fontSize = '10px';
                  label.style.color = '#ff6b35';
                  label.style.fontWeight = 'bold';
                  label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
                  label.style.pointerEvents = 'none';
                  label.textContent = `${chunkX},${chunkZ}`;
                  overlay.appendChild(label);
              }
          }
          mazeDisplay.style.position = 'relative';
          mazeDisplay.appendChild(overlay);
      }
      // Navigation functions
      nextLevel() {
          if (this.mazeGenerator && this.mazeGenerator.currentLevel < this.mazeGenerator.levels - 1) {
              this.mazeGenerator.currentLevel++;
              this.updateDisplay(currentDisplayMode);
          }
      }
      previousLevel() {
          if (this.mazeGenerator && this.mazeGenerator.currentLevel > 0) {
              this.mazeGenerator.currentLevel--;
              this.updateDisplay(currentDisplayMode);
          }
      }
      // Debounce function to limit rapid function calls
      debounce(func, wait) {
          let timeout;
          return () => {
              const later = () => {
                  clearTimeout(timeout);
                  func();
              };
              clearTimeout(timeout);
              timeout = window.setTimeout(later, wait);
          };
      }
      // Update detailed filename based on current config
      updateDetailedFilename() {
          const { width, height, levels, wallSize, wallHeight, walkSize, block, addRoof } = config;
          let suffix = '';
          if (addRoof)
              suffix = '-wceiling';
          const filename = `${width}x${height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
          // Update the detailed name span in the radio button label
          const detailedNameSpan = document.querySelector('[data-show="detailed-name"]');
          if (detailedNameSpan) {
              detailedNameSpan.textContent = filename;
          }
      }
      // Update custom name preview
      updateCustomNamePreview() {
          const customNameInput = document.querySelector('input[data-for="customMazeName"]');
          const customNamePreview = document.getElementById('customNamePreview');
          if (customNameInput && customNamePreview) {
              const customName = customNameInput.value.trim();
              if (customName) {
                  customNamePreview.textContent = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
              }
              else {
                  this.updateDetailedFilename(); // Fallback to detailed filename
              }
          }
      }
      // Input validation function
      validate() {
          // Get all inputs and validate them
          const inputs = document.querySelectorAll('input, select');
          inputs.forEach(input => {
              const dataFor = input.getAttribute('data-for');
              // Skip file export options to prevent unnecessary maze regeneration
              if (dataFor && dataFor in config && !this.isFileExportOption(input)) {
                  if (input.type === 'checkbox') {
                      config[dataFor] = input.checked;
                  }
                  else if (input.type === 'number' || input.tagName === 'SELECT') {
                      const value = input.type === 'number' ? parseInt(input.value) : input.value;
                      config[dataFor] = value;
                  }
                  else {
                      config[dataFor] = input.value;
                  }
              }
          });
          // Update filename preview when config changes
          this.updateDetailedFilename();
          this.updateCustomNamePreview();
      }
      // Helper function to identify file export options
      isFileExportOption(input) {
          const inputId = input.id;
          return inputId === 'simpleNaming' ||
              inputId === 'detailedNaming' ||
              inputId === 'customNaming' ||
              inputId === 'customNameInput';
      }
      // Configuration update handler
      onConfigChange() {
          // Check if dimensions or hole settings changed (requires full regeneration)
          const currentWidth = config.width;
          const currentHeight = config.height;
          const currentLevels = config.levels;
          const currentHolesPerLevel = config.holesPerLevel;
          const currentGenerateHoles = config.generateHoles;
          // Store previous values for comparison
          const previousHolesPerLevel = this.mazeGenerator?.previousHolesPerLevel;
          const previousGenerateHoles = this.mazeGenerator?.previousGenerateHoles;
          if (!this.mazeGenerator ||
              currentWidth !== this.mazeGenerator.width ||
              currentHeight !== this.mazeGenerator.height ||
              currentLevels !== this.mazeGenerator.levels ||
              currentHolesPerLevel !== previousHolesPerLevel ||
              currentGenerateHoles !== previousGenerateHoles) {
              // Dimensions or hole settings changed - regenerate maze
              this.drawDelay();
          }
          else {
              // Only visual options changed - just refresh display
              this.refreshDisplay();
          }
          // Store current values for next comparison
          if (this.mazeGenerator) {
              this.mazeGenerator.previousHolesPerLevel = currentHolesPerLevel;
              this.mazeGenerator.previousGenerateHoles = currentGenerateHoles;
          }
      }
      // UI state management
      updateHoleOptionsUI() {
          const generateHoles = document.querySelector('[data-for="generateHoles"]')?.checked;
          const holesPerLevelField = document.getElementById('holesPerLevelField');
          if (holesPerLevelField) {
              holesPerLevelField.style.display = generateHoles ? 'block' : 'none';
          }
      }
      // Initialize event listeners
      initializeEventListeners() {
          // Input validation listeners - exclude file export options
          const inputs = document.querySelectorAll('input, select');
          inputs.forEach(input => {
              // Skip file export options to prevent maze regeneration
              if (!this.isFileExportOption(input)) {
                  input.addEventListener('input', () => {
                      this.validate();
                      this.onConfigChange();
                  });
              }
          });
          // Button event listeners
          document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshDisplay());
          document.getElementById('regenerateBtn')?.addEventListener('click', () => this.regenerateMaze());
          document.getElementById('downloadBtn')?.addEventListener('click', () => this.generateCommand());
          document.getElementById('prevBtn')?.addEventListener('click', () => this.previousLevel());
          document.getElementById('nextBtn')?.addEventListener('click', () => this.nextLevel());
          // Display mode switcher
          document.getElementById('schematicBtn')?.addEventListener('click', () => {
              switchDisplay('schematic');
              this.updateDisplay('schematic');
          });
          document.getElementById('exactBtn')?.addEventListener('click', () => {
              switchDisplay('exact');
              this.updateDisplay('exact');
          });
          // Initial setup
          this.updateDetailedFilename();
          this.updateCustomNamePreview();
          this.updateHoleOptionsUI();
          // Add listener for maze generation mode radio buttons
          const generateHolesCheckbox = document.querySelector('input[data-for="generateHoles"]');
          if (generateHolesCheckbox) {
              generateHolesCheckbox.addEventListener('change', () => {
                  this.updateHoleOptionsUI();
                  this.regenerateMaze();
              });
          }
          this.draw();
      }
      // Placeholder for generateCommand - will be implemented in file-generator module
      generateCommand() {
          console.log('Generate command called - this will be implemented in file-generator module');
      }
  }

  // Helper: returns true if the given wall direction for cell (x, y) is a boundary wall
  function isBoundaryWall(x, y, dir, mazeWidth, mazeHeight, NORTH, SOUTH, WEST, EAST) {
      if (dir === NORTH && y === 0)
          return true;
      if (dir === SOUTH && y === mazeHeight - 1)
          return true;
      if (dir === WEST && x === 0)
          return true;
      if (dir === EAST && x === mazeWidth - 1)
          return true;
      return false;
  }
  // Helper: checks if a given block coordinate corresponds to a solid wall
  function isSolidBlock(blockX, _blockY, blockZ, maze, wallSize, walkSize, SOUTH, EAST) {
      const totalCellSize = walkSize + wallSize;
      // Determine the cell coordinates from the block coordinates
      const cellX = Math.floor(blockX / totalCellSize);
      const cellY = Math.floor(blockZ / totalCellSize);
      // Check if the coordinates fall within the grid
      if (cellY >= 0 && cellY < maze.height && cellX >= 0 && cellX < maze.width) {
          const xInCell = blockX % totalCellSize;
          const zInCell = blockZ % totalCellSize;
          // Check if the block is part of a pillar
          if (xInCell < wallSize && zInCell < wallSize) {
              return true;
          }
          // Check for horizontal walls (along Z axis)
          if (zInCell < wallSize) {
              if (cellY > 0) {
                  // Wall is south of the cell above it
                  return (maze.grid[cellY - 1][cellX].walls & SOUTH) === 0;
              }
              return true; // Top boundary wall
          }
          // Check for vertical walls (along X axis)
          if (xInCell < wallSize) {
              if (cellX > 0) {
                  // Wall is east of the cell to the left
                  return (maze.grid[cellY][cellX - 1].walls & EAST) === 0;
              }
              return true; // Left boundary wall
          }
      }
      // Check for the outer boundary walls
      const totalWidth = maze.width * walkSize + (maze.width + 1) * wallSize;
      const totalHeight = maze.height * walkSize + (maze.height + 1) * wallSize;
      if (blockX >= totalWidth - wallSize || blockZ >= totalHeight - wallSize) {
          return true;
      }
      return false;
  }

  // File Generator - handles Minecraft command generation and file download
  class FileGenerator {
      constructor() {
          this.mazeGenerator = null;
      }
      setMazeGenerator(generator) {
          this.mazeGenerator = generator;
      }
      generateCommand() {
          if (!this.mazeGenerator)
              return;
          let { wallSize, wallHeight, walkSize, block, levels, addRoof, generateHoles, holesPerLevel, generateLadders } = config;
          // Use user values directly
          // Each level: floor (1), walls (wallHeight), so total per level = 1 + wallHeight
          const commands = [
              `# Multi-Level Maze Generator\n`,
              `# Levels: ${levels}\n`,
              `# Dimensions: ${this.mazeGenerator.width}x${this.mazeGenerator.height}\n\n`
          ];
          // Calculate maze dimensions in blocks
          // For a maze of N cells, there are N+1 walls in each direction
          let lastWallTopY = 0;
          let totalWidth = 0;
          let totalHeight = 0;
          for (let level = 0; level < levels; level++) {
              commands.push(`# Level ${level + 1}\n`);
              const maze = this.mazeGenerator.mazes[level];
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
                      if (x === mazeWidth || (x > 0 && (maze.grid[y][x - 1].walls & this.mazeGenerator.EAST) === 0)) {
                          // --- FIX: For the last vertical wall, ensure it's at the true east edge ---
                          let wx;
                          if (x === mazeWidth) {
                              wx = mazeWidth * (walkSize + wallSize); // rightmost edge
                          }
                          else {
                              wx = x * (walkSize + wallSize);
                          }
                          const wz = y * (walkSize + wallSize) + wallSize;
                          commands.push(`fill ~${wx} ~${floorY + 1} ~${wz} ~${wx + wallSize - 1} ~${wallTopY} ~${wz + walkSize - 1} ${block}\n`);
                      }
                  }
              }
              // Place all horizontal (west-east) walls
              for (let y = 0; y <= mazeHeight; y++) {
                  for (let x = 0; x < mazeWidth; x++) {
                      // If this is a wall (either above cell or bottom border)
                      if (y === mazeHeight || (y > 0 && (maze.grid[y - 1][x].walls & this.mazeGenerator.SOUTH) === 0)) {
                          // --- FIX: For the last horizontal wall, ensure it's at the true south edge ---
                          let wz;
                          if (y === mazeHeight) {
                              wz = mazeHeight * (walkSize + wallSize); // bottom edge
                          }
                          else {
                              wz = y * (walkSize + wallSize);
                          }
                          const wx = x * (walkSize + wallSize) + wallSize;
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
              // For single level mazes: entrance on west wall, exit on east wall
              // For multi-level mazes: entrance on north wall of first level, exit on south wall of last level
              let entranceX, entranceZ, exitX, exitZ;
              if (levels === 1) {
                  // Single level maze: entrance on west wall, exit on east wall
                  entranceX = 0;
                  entranceZ = wallSize + Math.floor(walkSize / 2);
                  exitX = totalWidth - 1;
                  exitZ = wallSize + (mazeHeight - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2);
              }
              else {
                  // Multi-level maze: entrance on north wall of first level, exit on south wall of last level
                  entranceX = wallSize + Math.floor(walkSize / 2);
                  entranceZ = 0;
                  exitX = wallSize + (mazeWidth - 1) * (walkSize + wallSize) + Math.floor(walkSize / 2);
                  exitZ = totalHeight - 1;
              }
              // North edge (z = 0)
              for (let x = 0; x < totalWidth; x++) {
                  // Only skip the single entrance block on the first level for multi-level mazes
                  if (levels > 1 && level === 0 && x === entranceX && 0 === entranceZ)
                      continue;
                  commands.push(`fill ~${x} ~${floorY + 1} ~0 ~${x} ~${wallTopY} ~0 ${block}\n`);
              }
              // South edge (z = totalHeight - 1)
              for (let x = 0; x < totalWidth; x++) {
                  // Only skip the single exit block on the last level for multi-level mazes
                  if (levels > 1 && level === levels - 1 && x === exitX && totalHeight - 1 === exitZ)
                      continue;
                  commands.push(`fill ~${x} ~${floorY + 1} ~${totalHeight - 1} ~${x} ~${wallTopY} ~${totalHeight - 1} ${block}\n`);
              }
              // West edge (x = 0)
              for (let z = 0; z < totalHeight; z++) {
                  // Only skip the single entrance block on the first level for single level mazes
                  if (levels === 1 && level === 0 && 0 === entranceX && z === entranceZ)
                      continue;
                  commands.push(`fill ~0 ~${floorY + 1} ~${z} ~0 ~${wallTopY} ~${z} ${block}\n`);
              }
              // East edge (x = totalWidth - 1)
              for (let z = 0; z < totalHeight; z++) {
                  // Only skip the single exit block on the last level for single level mazes
                  if (levels === 1 && level === levels - 1 && totalWidth - 1 === exitX && z === exitZ)
                      continue;
                  commands.push(`fill ~${totalWidth - 1} ~${floorY + 1} ~${z} ~${totalWidth - 1} ~${wallTopY} ~${z} ${block}\n`);
              }
              // 4. Carve floor holes for ladder connections (before ladders are placed)
              if (config.generateHoles) {
                  // --- FIX: Only carve floor holes for levels above 0 ---
                  if (level > 0) {
                      const holeCells = this.mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
                      // Determine entrance/exit cell coordinates for this level
                      let entranceCellX = null, entranceCellY = null, exitCellX = null, exitCellY = null;
                      if (levels === 1) {
                          // Single level: entrance on west wall (cell 0,0), exit on east wall (cell width-1, height-1)
                          entranceCellX = 0;
                          entranceCellY = 0;
                          exitCellX = maze.width - 1;
                          exitCellY = maze.height - 1;
                      }
                      else {
                          // Multi-level: entrance on north wall of first level (cell 0,0), exit on south wall of last level (cell width-1, height-1)
                          if (level === 0) {
                              entranceCellX = 0;
                              entranceCellY = 0;
                          }
                          if (level === levels - 1) {
                              exitCellX = maze.width - 1;
                              exitCellY = maze.height - 1;
                          }
                      }
                      for (const holeCell of holeCells) {
                          // Skip if this cell is the entrance or exit for this level
                          if ((entranceCellX !== null && holeCell.x === entranceCellX && holeCell.y === entranceCellY) ||
                              (exitCellX !== null && holeCell.x === exitCellX && holeCell.y === exitCellY)) {
                              continue;
                          }
                          // --- Prevent holes at south/east edge except exit ---
                          if ((holeCell.y === maze.height - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y)) ||
                              (holeCell.x === maze.width - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y))) {
                              continue;
                          }
                          // Center of the path cell
                          const px = holeCell.x * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
                          const pz = holeCell.y * (walkSize + wallSize) + wallSize + Math.floor(walkSize / 2);
                          // Carve hole in floor for up/down connections
                          commands.push(`# Floor hole at level ${level + 1}, cell (${holeCell.x}, ${holeCell.y}), coordinates (~${px}, ~${floorY}, ~${pz})\n`);
                          commands.push(`setblock ~${px} ~${floorY} ~${pz} air\n`);
                      }
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
                  const maze = this.mazeGenerator.mazes[level];
                  if (!maze)
                      continue;
                  const levelY = level * (1 + wallHeight);
                  const floorY = levelY;
                  const holeCells = this.mazeGenerator.getHoleCells(level, generateHoles, holesPerLevel);
                  // Determine entrance/exit cell coordinates for this level
                  let entranceCellX = null, entranceCellY = null, exitCellX = null, exitCellY = null;
                  if (levels === 1) {
                      entranceCellX = 0;
                      entranceCellY = 0;
                      exitCellX = maze.width - 1;
                      exitCellY = maze.height - 1;
                  }
                  else {
                      if (level === 0) {
                          entranceCellX = 0;
                          entranceCellY = 0;
                      }
                      if (level === levels - 1) {
                          exitCellX = maze.width - 1;
                          exitCellY = maze.height - 1;
                      }
                  }
                  for (const holeCell of holeCells) {
                      // Skip if this cell is the entrance or exit for this level
                      if ((entranceCellX !== null && holeCell.x === entranceCellX && holeCell.y === entranceCellY) ||
                          (exitCellX !== null && holeCell.x === exitCellX && holeCell.y === exitCellY)) {
                          continue;
                      }
                      // --- Prevent ladders at south/east edge except exit ---
                      if ((holeCell.y === maze.height - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y)) ||
                          (holeCell.x === maze.width - 1 && !(exitCellX === holeCell.x && exitCellY === holeCell.y))) {
                          continue;
                      }
                      const x = holeCell.x;
                      const y = holeCell.y;
                      const processLadder = (direction) => {
                          if (!this.mazeGenerator)
                              return;
                          commands.push(`# ${direction === 'up' ? 'Up' : 'Down'} ladder at level ${level + 1}, cell (${x}, ${y})\n`);
                          const wallOptions = [
                              { dx: 0, dz: -1, dir: this.mazeGenerator.NORTH, facing: 3 }, // North wall, faces south
                              { dx: 0, dz: 1, dir: this.mazeGenerator.SOUTH, facing: 2 }, // South wall, faces north
                              { dx: -1, dz: 0, dir: this.mazeGenerator.WEST, facing: 5 }, // West wall, faces east
                              { dx: 1, dz: 0, dir: this.mazeGenerator.EAST, facing: 4 } // East wall, faces west
                          ];
                          let bestWall = null;
                          for (const wall of wallOptions) {
                              if ((maze.grid[y][x].walls & wall.dir) === 0 && !isBoundaryWall(x, y, wall.dir, maze.width, maze.height, this.mazeGenerator.NORTH, this.mazeGenerator.SOUTH, this.mazeGenerator.WEST, this.mazeGenerator.EAST)) {
                                  let wallX, wallZ;
                                  if (wall.dir === this.mazeGenerator.NORTH || wall.dir === this.mazeGenerator.SOUTH) {
                                      wallX = x * (walkSize + wallSize) + wallSize;
                                      wallZ = y * (walkSize + wallSize);
                                  }
                                  else {
                                      wallX = x * (walkSize + wallSize);
                                      wallZ = y * (walkSize + wallSize) + wallSize;
                                  }
                                  let score = 0;
                                  const ladderStartY = direction === 'up' ? floorY + 1 : floorY - wallHeight;
                                  const ladderEndY = direction === 'up' ? floorY + wallHeight : floorY;
                                  for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
                                      if (isSolidBlock(wallX, ladderY, wallZ, maze, wallSize, walkSize, this.mazeGenerator.SOUTH, this.mazeGenerator.EAST)) {
                                          score++;
                                      }
                                  }
                                  if (bestWall === null || score > bestWall.score) {
                                      let ladderX = wallX + wall.dx;
                                      let ladderZ = wallZ + wall.dz;
                                      const maxX = maze.width * (walkSize + wallSize) + wallSize - 1;
                                      const maxZ = maze.height * (walkSize + wallSize) + wallSize - 1;
                                      ladderX = Math.max(0, Math.min(ladderX, maxX));
                                      ladderZ = Math.max(0, Math.min(ladderZ, maxZ));
                                      bestWall = { score, wall, ladderX, ladderZ, wallX, wallZ };
                                  }
                              }
                          }
                          if (bestWall && bestWall.score > 0) {
                              const ladderStartY = direction === 'up' ? floorY + 1 : floorY - wallHeight;
                              const ladderEndY = direction === 'up' ? floorY + wallHeight : floorY;
                              for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
                                  if (isSolidBlock(bestWall.wallX, ladderY, bestWall.wallZ, maze, wallSize, walkSize, this.mazeGenerator.SOUTH, this.mazeGenerator.EAST)) {
                                      commands.push(`setblock ~${bestWall.ladderX} ~${ladderY} ~${bestWall.ladderZ} ladder ${bestWall.wall.facing}\n`);
                                  }
                              }
                              const ladderCount = ladderEndY - ladderStartY + 1;
                              commands.push(`# Ladder placed on best wall with score ${bestWall.score}, facing ${bestWall.wall.facing} (${ladderCount} rungs)\n`);
                          }
                          else {
                              commands.push(`# WARNING: No suitable wall found for ${direction} ladder at cell (${x}, ${y}). Attempting fallback.\n`);
                              const fallbackResult = this.mazeGenerator.attemptFallbackLadderPlacement(x, y, level, direction, wallSize, walkSize, wallHeight, floorY, maze, commands);
                              if (fallbackResult) {
                                  commands.push(`# Fallback placement successful using ${fallbackResult.method}.\n`);
                              }
                              else {
                                  commands.push(`# ERROR: All fallback strategies failed for ${direction} ladder at cell (${x}, ${y}).\n`);
                              }
                          }
                      };
                      // Up ladder (to next level)
                      if (holeCell.hasUp && level < levels - 1) {
                          processLadder('up');
                      }
                      // Down ladder (to previous level)
                      if (holeCell.hasDown) {
                          processLadder('down');
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
                  filename = `${this.mazeGenerator.width}x${this.mazeGenerator.height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
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
          // Download the file
          this.downloadFile(commands, filename);
      }
      downloadFile(commands, filename) {
          const element = document.createElement('a');
          const commandData = new Blob(commands, { type: 'text/plain' });
          element.href = URL.createObjectURL(commandData);
          element.setAttribute('download', filename);
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
      }
  }

  // Initialize the global config object with default values
  window.config = {
      width: 20,
      height: 20,
      levels: 3,
      wallSize: 1,
      wallHeight: 3,
      walkSize: 1,
      block: 'stone',
      addRoof: false,
      generateHoles: true,
      holesPerLevel: 10,
      generateLadders: true,
      showBlockLegend: true,
      showChunkBorders: false,
      customName: ''
  };
  // Global instances
  exports.mazeGenerator = null;
  exports.displayManager = void 0;
  exports.uiControls = void 0;
  exports.fileGenerator = void 0;
  // Global function for tree view level selection
  window.selectLevel = function (levelIndex) {
      if (exports.mazeGenerator && levelIndex >= 0 && levelIndex < exports.mazeGenerator.levels) {
          exports.mazeGenerator.currentLevel = levelIndex;
          exports.uiControls.updateDisplay(currentDisplayMode);
      }
  };
  // Initialize the application
  document.addEventListener('DOMContentLoaded', () => {
      // Create instances
      exports.displayManager = new DisplayManager();
      exports.uiControls = new UIControls(exports.displayManager);
      exports.fileGenerator = new FileGenerator();
      // Override the generateCommand method in UIControls to use FileGenerator
      exports.uiControls.generateCommand = () => {
          if (exports.mazeGenerator) {
              exports.fileGenerator.generateCommand();
          }
      };
      // Set up the maze generator update callback
      exports.uiControls.setMazeGeneratorChangeCallback((generator) => {
          exports.mazeGenerator = generator;
          exports.fileGenerator.setMazeGenerator(generator);
      });
      // Initialize event listeners and start the application
      exports.uiControls.initializeEventListeners();
  });
  // Global debug function
  window.debugMaze = function () {
      if (exports.mazeGenerator) {
          return exports.mazeGenerator.debugMazeStructure(exports.mazeGenerator.currentLevel);
      }
      return 'No maze generator available';
  };

  return exports;

})({});

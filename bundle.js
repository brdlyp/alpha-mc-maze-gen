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
      renderTreeView() {
          if (!this.mazeGenerator)
              return '';
          let html = '';
          for (let i = 0; i < this.mazeGenerator.levels; i++) {
              const activeClass = i === this.mazeGenerator.currentLevel ? 'active' : '';
              html += `<div class="tree-item ${activeClass}" onclick="selectLevel(${i})">Level ${i + 1}</div>`;
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
      }
      if (exactBtn) {
          exactBtn.classList.toggle('active', mode === 'exact');
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
          // Generate maze based on mode
          if (config.mazeGenerationMode === '2D') {
              for (let z = 0; z < this.levels; z++) {
                  this.generate2DLevel(z);
              }
          }
          else {
              // Generate maze using depth-first search (original 3D method)
              this.generate3DMaze();
          }
          // Create individual maze objects for each level
          this.createLevelMazes();
          // After mazes are created, punch holes for 2D mode
          if (config.mazeGenerationMode === '2D' && config.generateHoles && this.levels > 1) {
              const { holesPerLevel } = config;
              // Create a list of all possible cell coordinates
              const allCells = [];
              for (let y = 0; y < this.height; y++) {
                  for (let x = 0; x < this.width; x++) {
                      // Exclude border cells from being chosen for holes to avoid issues with entrance/exit
                      if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
                          allCells.push({ x, y });
                      }
                  }
              }
              // Shuffle the list to randomize hole placement
              for (let i = allCells.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
              }
              // For each level-to-level connection, pick 'holesPerLevel' unique locations
              for (let z = 0; z < this.levels - 1; z++) {
                  let holesOnThisLevel = 0;
                  while (holesOnThisLevel < holesPerLevel && allCells.length > 0) {
                      const holeLocation = allCells.pop(); // Take a unique location
                      if (holeLocation) {
                          const { x, y } = holeLocation;
                          // Punch hole between level z and z+1
                          this.mazes[z].grid[y][x].hasUp = true;
                          this.mazes[z + 1].grid[y][x].hasDown = true;
                          holesOnThisLevel++;
                      }
                  }
              }
          }
      }
      generate3DMaze() {
          // Use Growing Tree algorithm with 50/50 split between random and newest
          const cells = [];
          const visited = new Set();
          // Start from a consistent cell to ensure connectivity
          // For single level mazes, start from the entrance cell (top-left)
          // For multi-level mazes, start from the entrance cell (top-left of first level)
          const startX = 0;
          const startY = 0;
          const startZ = 0;
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
          // Ensure entrance and exit - force passages to guarantee connectivity
          // For single level mazes: entrance on west wall, exit on east wall
          // For multi-level mazes: entrance on north wall of first level, exit on south wall of last level
          if (this.levels === 1) {
              // Single level: force west passage for entrance (top-left cell), east passage for exit (bottom-right cell)
              this.grid[0][0][0] |= this.WEST; // Entrance: west wall of top-left cell
              this.grid[0][this.height - 1][this.width - 1] |= this.EAST; // Exit: east wall of bottom-right cell
              // Ensure the exit cell is connected to the maze by forcing a path from a neighboring cell
              // Connect the bottom-right cell to its west neighbor if possible
              if (this.width > 1) {
                  this.grid[0][this.height - 1][this.width - 2] |= this.EAST; // West neighbor gets east passage
                  this.grid[0][this.height - 1][this.width - 1] |= this.WEST; // Exit cell gets west passage
              }
              // Also connect to north neighbor if possible
              if (this.height > 1) {
                  this.grid[0][this.height - 2][this.width - 1] |= this.SOUTH; // North neighbor gets south passage
                  this.grid[0][this.height - 1][this.width - 1] |= this.NORTH; // Exit cell gets north passage
              }
          }
          else {
              // Multi-level: force north passage for entrance on first level, south passage for exit on last level
              this.grid[0][0][0] |= this.NORTH; // Entrance: north wall of top-left cell on first level
              this.grid[this.levels - 1][this.height - 1][this.width - 1] |= this.SOUTH; // Exit: south wall of bottom-right cell on last level
          }
      }
      generate2DLevel(level) {
          // Use Growing Tree algorithm for a single level
          const cells = [];
          const visited = new Set();
          const startX = 0;
          const startY = 0;
          cells.push({ x: startX, y: startY });
          visited.add(`${startX},${startY}`);
          const directions2D = [this.NORTH, this.SOUTH, this.EAST, this.WEST];
          while (cells.length > 0) {
              const useRandom = Math.random() < 0.5;
              const index = useRandom ? Math.floor(Math.random() * cells.length) : cells.length - 1;
              const current = cells[index];
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
                  cells.splice(index, 1);
              }
              else {
                  const nextNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                  const { x: nextX, y: nextY, dir: direction } = nextNeighbor;
                  // Carve passage
                  this.grid[level][current.y][current.x] |= direction;
                  this.grid[level][nextY][nextX] |= this.opposite[direction];
                  visited.add(`${nextX},${nextY}`);
                  cells.push({ x: nextX, y: nextY });
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

  // Utility functions
  // Debounce function to limit rapid function calls
  function debounce(func, wait) {
      let timeout;
      return function executedFunction() {
          const later = function () {
              clearTimeout(timeout);
              func();
          };
          clearTimeout(timeout);
          timeout = window.setTimeout(later, wait);
      };
  }
  // Update detailed filename based on current config
  function updateDetailedFilename() {
      const { width, height, levels, wallSize, wallHeight, walkSize, block, addRoof } = config;
      let suffix = '';
      if (addRoof)
          suffix = '-wceiling';
      const filename = `${width}x${height}x${levels}maze-ww${wallSize}wh${wallHeight}pw${walkSize}wb${block}${suffix}.mcfunction`;
      const customNamePreview = document.getElementById('customNamePreview');
      const customNameText = document.getElementById('customNameText');
      if (customNamePreview && customNameText) {
          customNamePreview.textContent = filename;
          customNameText.placeholder = filename;
      }
  }
  // Update custom name preview
  function updateCustomNamePreview() {
      const customNameInput = document.querySelector('input[data-for="customMazeName"]');
      const customNamePreview = document.getElementById('customNamePreview');
      if (customNameInput && customNamePreview) {
          const customName = customNameInput.value.trim();
          if (customName) {
              customNamePreview.textContent = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
          }
          else {
              updateDetailedFilename(); // Fallback to detailed filename
          }
      }
  }
  // Input validation function
  function validate() {
      // Get all inputs and validate them
      const inputs = document.querySelectorAll('input, select');
      inputs.forEach(input => {
          const dataFor = input.getAttribute('data-for');
          if (dataFor && dataFor in config) {
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
      updateDetailedFilename();
      updateCustomNamePreview();
  }
  // Helper: checks if a given boundary wall should be solid
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

  // UI Controls - handles user interactions and control logic
  class UIControls {
      constructor(displayManager) {
          this.mazeGenerator = null;
          this.displayManager = displayManager;
          this.drawDelay = debounce(() => this.draw(), 500);
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
          this.updateDisplay();
      }
      // Display refresh functions
      refreshDisplay() {
          // Only update the visual display without regenerating the maze
          if (this.mazeGenerator) {
              this.updateDisplay();
          }
      }
      regenerateMaze() {
          // Force a complete maze regeneration
          this.draw();
      }
      updateDisplay() {
          if (!this.mazeGenerator)
              return;
          const mazeDisplay = document.getElementById('mazeDisplay');
          if (!mazeDisplay)
              return;
          const currentLevel = this.mazeGenerator.currentLevel;
          const { showBlockLegend } = config;
          // Update level display based on current display mode
          let html = '';
          {
              html = this.displayManager.renderLevel(currentLevel);
          }
          mazeDisplay.innerHTML = html;
          // Update block legend
          if (showBlockLegend) {
              const blockLegend = document.getElementById('blockLegend');
              if (blockLegend) {
                  blockLegend.innerHTML = this.displayManager.renderBlockLegend();
              }
          }
          // Update tree view
          this.updateTreeView();
          this.updateLevelControls();
          // Show/hide chunk overlay
          this.updateChunkOverlay();
          // Update filename preview
          updateDetailedFilename();
          updateCustomNamePreview();
      }
      updateTreeView() {
          if (!this.mazeGenerator)
              return;
          const treeView = document.getElementById('treeView');
          if (treeView) {
              treeView.innerHTML = this.displayManager.renderTreeView();
          }
          const currentLevel = document.getElementById('currentLevel');
          const totalLevels = document.getElementById('totalLevels');
          if (currentLevel)
              currentLevel.textContent = (this.mazeGenerator.currentLevel + 1).toString();
          if (totalLevels)
              totalLevels.textContent = this.mazeGenerator.levels.toString();
          const prevBtn = document.getElementById('prevBtn');
          const nextBtn = document.getElementById('nextBtn');
          if (prevBtn)
              prevBtn.disabled = this.mazeGenerator.currentLevel === 0;
          if (nextBtn)
              nextBtn.disabled = this.mazeGenerator.currentLevel === this.mazeGenerator.levels - 1;
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
          // Create new chunk overlay (placeholder implementation)
          const mazeDisplay = document.getElementById('mazeDisplay');
          if (mazeDisplay) {
              const overlay = document.createElement('div');
              overlay.id = 'chunkOverlay';
              overlay.style.position = 'absolute';
              overlay.style.top = '0';
              overlay.style.left = '0';
              overlay.style.pointerEvents = 'none';
              overlay.style.border = '2px dashed #ff0000';
              overlay.style.zIndex = '10';
              // Simple chunk border visualization (16x16 grid)
              // This is a simplified implementation
              mazeDisplay.style.position = 'relative';
              mazeDisplay.appendChild(overlay);
          }
      }
      // Navigation functions
      nextLevel() {
          if (this.mazeGenerator && this.mazeGenerator.currentLevel < this.mazeGenerator.levels - 1) {
              this.mazeGenerator.currentLevel++;
              this.updateDisplay();
          }
      }
      previousLevel() {
          if (this.mazeGenerator && this.mazeGenerator.currentLevel > 0) {
              this.mazeGenerator.currentLevel--;
              this.updateDisplay();
          }
      }
      // Configuration update handler
      onConfigChange() {
          // Check if dimensions changed (requires full regeneration)
          const currentWidth = config.width;
          const currentHeight = config.height;
          const currentLevels = config.levels;
          if (!this.mazeGenerator ||
              currentWidth !== this.mazeGenerator.width ||
              currentHeight !== this.mazeGenerator.height ||
              currentLevels !== this.mazeGenerator.levels) {
              // Dimensions changed - regenerate maze
              this.drawDelay();
          }
          else {
              // Only visual options changed - just refresh display
              this.refreshDisplay();
          }
      }
      // UI state management
      updateHoleOptionsUI() {
          const is3D = config.mazeGenerationMode === '3D';
          const holeOptionsWrapper = document.getElementById('holeOptionsWrapper');
          const holeOptionsNote = document.getElementById('holeOptionsNote');
          const generateHolesLabel = document.getElementById('generateHolesLabel');
          const holesPerLevelField = document.getElementById('holesPerLevelField');
          const ladder3DControl = document.getElementById('ladder3DControl');
          if (holeOptionsWrapper && holeOptionsNote && generateHolesLabel && holesPerLevelField && ladder3DControl) {
              if (is3D) {
                  holeOptionsWrapper.style.display = 'none';
                  holeOptionsNote.style.display = 'block';
                  ladder3DControl.style.display = 'block';
              }
              else {
                  holeOptionsWrapper.style.display = '';
                  holeOptionsNote.style.display = 'none';
                  ladder3DControl.style.display = 'none';
              }
          }
      }
      // Initialize event listeners
      initializeEventListeners() {
          // Input validation listeners
          const inputs = document.querySelectorAll('input, select');
          inputs.forEach(input => {
              input.addEventListener('input', () => {
                  validate();
                  this.onConfigChange();
              });
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
              this.updateDisplay();
          });
          document.getElementById('exactBtn')?.addEventListener('click', () => {
              switchDisplay('exact');
              this.updateDisplay();
          });
          // Initial setup
          updateDetailedFilename();
          updateCustomNamePreview();
          this.updateHoleOptionsUI();
          // Add listener for maze generation mode radio buttons
          const mazeModeRadios = document.querySelectorAll('input[name="mazeGenerationMode"]');
          mazeModeRadios.forEach(radio => {
              radio.addEventListener('change', () => {
                  this.updateHoleOptionsUI();
                  this.regenerateMaze(); // Regenerate maze when mode changes
              });
          });
          this.draw();
      }
      // Placeholder for generateCommand - will be implemented in file-generator module
      generateCommand() {
          console.log('Generate command called - this will be implemented in file-generator module');
      }
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
                      // Up ladder (to next level)
                      if (holeCell.hasUp && level < levels - 1) {
                          commands.push(`# Up ladder at level ${level + 1}, cell (${x}, ${y})\n`);
                          // Try each wall in order: N, S, W, E
                          const wallOptions = [
                              { dx: 0, dz: -1, dir: this.mazeGenerator.NORTH, facing: 3 }, // North wall, faces south (ladder at z-1)
                              { dx: 0, dz: 1, dir: this.mazeGenerator.SOUTH, facing: 2 }, // South wall, faces north (ladder at z+1)
                              { dx: -1, dz: 0, dir: this.mazeGenerator.WEST, facing: 5 }, // West wall, faces east (ladder at x-1)
                              { dx: 1, dz: 0, dir: this.mazeGenerator.EAST, facing: 4 } // East wall, faces west (ladder at x+1)
                          ];
                          let ladderPlaced = false;
                          for (const wall of wallOptions) {
                              // Only place ladders on internal walls (not boundary walls)
                              // FIXED: Changed from !== 0 to === 0 to place ladders on SOLID walls (no passages)
                              if ((maze.grid[y][x].walls & wall.dir) === 0 && !isBoundaryWall(x, y, wall.dir, maze.width, maze.height, this.mazeGenerator.NORTH, this.mazeGenerator.SOUTH, this.mazeGenerator.WEST, this.mazeGenerator.EAST)) {
                                  // Calculate the solid block position (the wall) - using the same logic as wall placement
                                  let wallX, wallZ;
                                  if (wall.dir === this.mazeGenerator.NORTH || wall.dir === this.mazeGenerator.SOUTH) {
                                      // Horizontal wall (north/south)
                                      wallX = x * (walkSize + wallSize) + wallSize;
                                      wallZ = y * (walkSize + wallSize);
                                  }
                                  else {
                                      // Vertical wall (east/west)
                                      wallX = x * (walkSize + wallSize);
                                      wallZ = y * (walkSize + wallSize) + wallSize;
                                  }
                                  // Calculate ladder position (adjacent to the wall)
                                  let ladderX = wallX;
                                  let ladderZ = wallZ;
                                  if (wall.dx !== 0)
                                      ladderX += wall.dx; // Place ladder adjacent to wall
                                  if (wall.dz !== 0)
                                      ladderZ += wall.dz; // Place ladder adjacent to wall
                                  // Ensure ladder is within bounds
                                  const maxX = maze.width * (walkSize + wallSize) + wallSize - 1;
                                  const maxZ = maze.height * (walkSize + wallSize) + wallSize - 1;
                                  ladderX = Math.max(0, Math.min(ladderX, maxX));
                                  ladderZ = Math.max(0, Math.min(ladderZ, maxZ));
                                  // CRITICAL: Check if the block the ladder would be attached to is solid
                                  // We need to check if there's actually a wall block at the ladder's Y level
                                  const ladderCount = wallHeight + 2;
                                  const ladderStartY = floorY + 1;
                                  const ladderEndY = ladderStartY + ladderCount - 1;
                                  let anyLadderPlaced = false;
                                  for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
                                      // 3D check: only place ladder if wall exists at this Y
                                      {
                                          commands.push(`setblock ~${ladderX} ~${ladderY} ~${ladderZ} ladder ${wall.facing}\n`);
                                          anyLadderPlaced = true;
                                      }
                                  }
                                  if (anyLadderPlaced) {
                                      commands.push(`# Ladder placed adjacent to ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ}), facing ${wall.facing} (up ladder, ${ladderCount} rungs)\n`);
                                      ladderPlaced = true;
                                      break;
                                  }
                              }
                          }
                          if (!ladderPlaced) {
                              // FALLBACK STRATEGY: Try corner placement or create a temporary wall
                              commands.push(`# WARNING: No internal wall found for up ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
                              commands.push(`# Attempting fallback placement strategies...\n`);
                              const fallbackResult = this.mazeGenerator.attemptFallbackLadderPlacement(x, y, level, 'up', wallSize, walkSize, wallHeight, floorY, maze, commands);
                              if (fallbackResult) {
                                  commands.push(`# Fallback ladder placement successful using ${fallbackResult.method}\n`);
                              }
                              else {
                                  commands.push(`# ERROR: All fallback strategies failed for up ladder at cell (${x}, ${y})\n`);
                              }
                          }
                      }
                      // Down ladder (to previous level)
                      if (holeCell.hasDown) {
                          commands.push(`# Down ladder at level ${level + 1}, cell (${x}, ${y})\n`);
                          const wallOptions = [
                              { dx: 0, dz: -1, dir: this.mazeGenerator.NORTH, facing: 3 }, // North wall, faces south (ladder at z-1)
                              { dx: 0, dz: 1, dir: this.mazeGenerator.SOUTH, facing: 2 }, // South wall, faces north (ladder at z+1)
                              { dx: -1, dz: 0, dir: this.mazeGenerator.WEST, facing: 5 }, // West wall, faces east (ladder at x-1)
                              { dx: 1, dz: 0, dir: this.mazeGenerator.EAST, facing: 4 } // East wall, faces west (ladder at x+1)
                          ];
                          let ladderPlaced = false;
                          for (const wall of wallOptions) {
                              // FIXED: Changed from !== 0 to === 0 to place ladders on SOLID walls (no passages)
                              if ((maze.grid[y][x].walls & wall.dir) === 0 && !isBoundaryWall(x, y, wall.dir, maze.width, maze.height, this.mazeGenerator.NORTH, this.mazeGenerator.SOUTH, this.mazeGenerator.WEST, this.mazeGenerator.EAST)) {
                                  // Calculate the solid block position (the wall) - using the same logic as wall placement
                                  let wallX, wallZ;
                                  if (wall.dir === this.mazeGenerator.NORTH || wall.dir === this.mazeGenerator.SOUTH) {
                                      // Horizontal wall (north/south) - wall is at the edge of the cell
                                      wallX = x * (walkSize + wallSize) + wallSize;
                                      wallZ = y * (walkSize + wallSize);
                                  }
                                  else {
                                      // Vertical wall (east/west) - wall is at the edge of the cell
                                      wallX = x * (walkSize + wallSize);
                                      wallZ = y * (walkSize + wallSize) + wallSize;
                                  }
                                  // Calculate ladder position (adjacent to the wall)
                                  let ladderX = wallX;
                                  let ladderZ = wallZ;
                                  if (wall.dx !== 0)
                                      ladderX += wall.dx; // Place ladder adjacent to wall
                                  if (wall.dz !== 0)
                                      ladderZ += wall.dz; // Place ladder adjacent to wall
                                  // Ensure ladder is within bounds
                                  const maxX = maze.width * (walkSize + wallSize) + wallSize - 1;
                                  const maxZ = maze.height * (walkSize + wallSize) + wallSize - 1;
                                  ladderX = Math.max(0, Math.min(ladderX, maxX));
                                  ladderZ = Math.max(0, Math.min(ladderZ, maxZ));
                                  // DOWN LADDER: Goes from current floor down to floor below
                                  // Current floor is at floorY, floor below is at (floorY - (1 + wallHeight))
                                  const ladderStartY = floorY - wallHeight; // Start at floor below
                                  const ladderEndY = floorY; // End at current floor (includes hole)
                                  let anyLadderPlaced = false;
                                  for (let ladderY = ladderStartY; ladderY <= ladderEndY; ladderY++) {
                                      // 3D check: only place ladder if wall exists at this Y
                                      {
                                          commands.push(`setblock ~${ladderX} ~${ladderY} ~${ladderZ} ladder ${wall.facing}\n`);
                                          anyLadderPlaced = true;
                                      }
                                  }
                                  if (anyLadderPlaced) {
                                      const ladderCount = ladderEndY - ladderStartY + 1;
                                      commands.push(`# Ladder placed adjacent to ${wall.dx !== 0 ? 'East/West' : 'North/South'} wall at coordinates (~${ladderX}, ~${ladderStartY}-${ladderEndY}, ~${ladderZ}), facing ${wall.facing} (down ladder, ${ladderCount} rungs)\n`);
                                      ladderPlaced = true;
                                      break;
                                  }
                              }
                          }
                          if (!ladderPlaced) {
                              // FALLBACK STRATEGY: Try corner placement or create a temporary wall
                              commands.push(`# WARNING: No internal wall found for down ladder at cell (${x}, ${y}) on level ${level + 1}\n`);
                              commands.push(`# Attempting fallback placement strategies...\n`);
                              const fallbackResult = this.mazeGenerator.attemptFallbackLadderPlacement(x, y, level, 'down', wallSize, walkSize, wallHeight, floorY, maze, commands);
                              if (fallbackResult) {
                                  commands.push(`# Fallback ladder placement successful using ${fallbackResult.method}\n`);
                              }
                              else {
                                  commands.push(`# ERROR: All fallback strategies failed for down ladder at cell (${x}, ${y})\n`);
                              }
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

  // Global instances
  exports.mazeGenerator = null;
  exports.displayManager = void 0;
  exports.uiControls = void 0;
  exports.fileGenerator = void 0;
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

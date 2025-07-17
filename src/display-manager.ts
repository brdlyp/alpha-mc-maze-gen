// Config is declared globally in the main bundle
declare const config: any;
import { MultiLevelMaze } from './maze-generator'

// Display mode type
export type DisplayMode = 'schematic' | 'exact';

// Current display mode
export let currentDisplayMode: DisplayMode = 'schematic';

// Display Manager - handles all rendering and visual display logic
export class DisplayManager {
  private mazeGenerator: MultiLevelMaze | null = null;

  setMazeGenerator(generator: MultiLevelMaze | null) {
    this.mazeGenerator = generator;
  }

  renderLevel(levelIndex: number): string {
    if (!this.mazeGenerator) return '';
    const maze = this.mazeGenerator.mazes[levelIndex];
    if (!maze) return '';
    
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
      } else {
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
              } else if (showUp && !generateLadders) {
                html += `<div class="maze-indicator horizontal" style="background: #ffaaaa;" title="Hole only (no ladder)"></div>`;
              } else {
                html += `<div class="maze-indicator horizontal"></div>`;
              }
              if (showDown && generateLadders) {
                html += `<div class="maze-indicator down ladder-corner" title="${this.getEnhancedTooltip('hole-down-ladder', x, y, levelIndex, downTooltipMethod)}"></div>`;
              } else if (showDown && !generateLadders) {
                html += `<div class="maze-indicator horizontal" style="background: #aaaaff;" title="Hole only (no ladder)"></div>`;
              } else {
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
            } else {
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
      } else {
        html += '<div class="maze-cell wall"></div>';
      }
    }
    html += '</div>';
    html += '</div>';
    return html;
  }
  
  // New method: Render exact one-to-one block representation
  renderExactBlockLayout(levelIndex: number): string {
    if (!this.mazeGenerator) return '';
    const maze = this.mazeGenerator.mazes[levelIndex];
    if (!maze) return '';
    
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
        let ladderMethod: string | undefined = undefined;
        let extraClass = '';
        if (blockType === 'hole-up-ladder') {
          ladderMethod = 'solid wall';
          extraClass = 'ladder-solid-wall';
        } else if (blockType === 'hole-down-ladder') {
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
  getBlockTypeAt(levelIndex: number, x: number, z: number, wallSize: number, walkSize: number, generateHoles: boolean, holesPerLevel: number, generateLadders: boolean): string {
    if (!this.mazeGenerator) return 'unknown';
    const maze = this.mazeGenerator.mazes[levelIndex];
    if (!maze) return 'unknown';
    
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
      } else {
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
          if (holeCell.hasUp && generateLadders) return 'hole-up-ladder';
          if (holeCell.hasUp && !generateLadders) return 'hole-up-only';
          if (holeCell.hasDown && generateLadders) return 'hole-down-ladder';
          if (holeCell.hasDown && !generateLadders) return 'hole-down-only';
        }
      }
    }
    
    return 'path';
  }
  
  // Helper method to get CSS class for block type
  getBlockClass(blockType: string): string {
    const classes: { [key: string]: string } = {
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
  getBlockTitle(blockType: string, x: number, z: number): string {
    const titles: { [key: string]: string } = {
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
  getEnhancedTooltip(blockType: string, x: number, z: number, levelIndex: number, ladderMethod?: string): string {
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
      if (!this.mazeGenerator) return tooltip;
      const maze = this.mazeGenerator.mazes[levelIndex];
      if (maze && maze.grid[cellY] && maze.grid[cellY][cellX]) {
        const cell = maze.grid[cellY][cellX];
        if (cell.hasUp) tooltip += '\nHas up passage';
        if (cell.hasDown) tooltip += '\nHas down passage';
      }
    }
    
    return tooltip;
  }
  
  renderTreeView(): string {
    if (!this.mazeGenerator) return '';
    let html = '';
    for (let i = 0; i < this.mazeGenerator.levels; i++) {
      const activeClass = i === this.mazeGenerator.currentLevel ? 'active' : '';
      html += `<div class="tree-item ${activeClass}" onclick="selectLevel(${i})">Level ${i + 1}</div>`;
    }
    return html;
  }

  renderBlockLegend(): string {
    const { showBlockLegend } = config;
    if (!showBlockLegend) return '';

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
    } else {
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
export function switchDisplay(mode: DisplayMode): void {
  currentDisplayMode = mode;
  
  // Update button states
  const schematicBtn = document.getElementById('schematicBtn') as HTMLButtonElement;
  const exactBtn = document.getElementById('exactBtn') as HTMLButtonElement;
  
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
  
  if (schematicLegend) schematicLegend.style.display = mode === 'schematic' ? 'flex' : 'none';
  if (exactLegend) exactLegend.style.display = mode === 'exact' ? 'flex' : 'none';
  if (legendNote) legendNote.style.display = mode === 'exact' ? 'block' : 'none';
}
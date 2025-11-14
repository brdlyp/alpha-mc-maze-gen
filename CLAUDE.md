# CLAUDE.md - AI Assistant Development Guide

This document provides comprehensive guidance for AI assistants working on the Minecraft Maze Generator codebase.

## Project Overview

**Project Name**: Minecraft Maze Generator
**Type**: Web-based maze generation tool for Minecraft Bedrock Edition
**Version**: 2.0.248
**Package Manager**: pnpm
**Build Tool**: Rollup + TypeScript
**Framework**: Vanilla TypeScript with Bootstrap 5 UI

### What This Project Does

Generates complex multi-level 3D mazes that can be imported into Minecraft Bedrock Edition as `.mcfunction` files. The tool provides a web interface where users can configure maze dimensions, wall properties, block types, and export options. The mazes use the Growing Tree algorithm with ladder placement for vertical connections between levels.

### Key Features

- Multi-level 3D maze generation (1-20 levels)
- Customizable dimensions (10-100 width/height)
- Configurable wall/path properties (width, height)
- Any Minecraft block type support
- Robust ladder placement with fallback strategies
- Visual indicators for vertical connections
- Interactive 2D visualization with schematic/exact views
- Chunk border overlay
- Level pagination system
- Automated test suite

## Architecture

### Module Structure

The codebase follows a modular TypeScript architecture with clear separation of concerns:

```
src/
├── index-new.ts          # Application entry point, initialization, global config
├── maze-generator.ts     # Core maze generation logic (Growing Tree algorithm)
├── display-manager.ts    # All rendering and visualization logic
├── ui-controls.ts        # User interaction and control handlers
├── file-generator.ts     # Minecraft .mcfunction file generation
└── utils.ts             # Shared utility functions
```

### Key Design Patterns

1. **Global Config Pattern**: A global `config` object (declared on `window`) stores all user settings and is accessed across modules
2. **Singleton-like Instances**: Main application classes are instantiated once in `index-new.ts` and passed around as dependencies
3. **Callback Pattern**: UI controls use callbacks to notify other components of state changes
4. **Separation of Concerns**: Clear boundaries between generation, display, UI, and file export

### Data Flow

```
User Input → UIControls → MultiLevelMaze.generate() → DisplayManager.render() → Canvas/HTML
                                    ↓
                            FileGenerator.generateCommand() → Download .mcfunction
```

## File Structure Detailed

### Core Application Files

#### `src/index-new.ts`
- **Purpose**: Application entry point and orchestration
- **Key Responsibilities**:
  - Initialize global `config` object with defaults
  - Create and wire together all major components
  - Set up DOM event listeners on DOMContentLoaded
  - Expose global functions for UI callbacks (`selectLevel`, `debugMaze`)
- **Important**: This is where the global state is initialized

#### `src/maze-generator.ts`
- **Purpose**: Core maze generation algorithm
- **Key Class**: `MultiLevelMaze`
- **Algorithm**: Growing Tree (modified depth-first search with randomization)
- **Key Methods**:
  - `generate()`: Main generation entry point
  - `generate2DLevel()`: Creates a single maze level using Growing Tree
  - `createLevelMazes()`: Converts raw grid data to structured maze objects
  - `getHoleCells()`: Returns cells with vertical connections
  - `attemptFallbackLadderPlacement()`: Handles ladder placement fallbacks
- **Data Structure**: Uses bit flags for walls (NORTH=1, SOUTH=2, EAST=4, WEST=8, UP=16, DOWN=32)
- **Important**: Deprecated fallback methods (corner, wall-creation, ceiling) are present but return null

#### `src/display-manager.ts`
- **Purpose**: All rendering and visualization logic
- **Key Methods**:
  - `renderLevel()`: Renders schematic view of a maze level
  - `renderExactBlockLayout()`: Renders exact block-by-block view
  - `renderLevelPagination()`: Creates level navigation controls
  - `getEnhancedTooltip()`: Generates tooltips for cells
- **Display Modes**:
  - `schematic`: Abstract view showing paths/walls as single cells
  - `exact`: Precise block layout matching Minecraft output
- **Visual Indicators**: Uses CSS classes to show ladder placement methods

#### `src/ui-controls.ts`
- **Purpose**: Handle all user interactions
- **Key Methods**:
  - `initializeEventListeners()`: Wire up all UI controls
  - `draw()`: Main function to generate new maze
  - `refreshDisplay()`: Update display without regenerating
  - `updateDisplay()`: Refresh visualization for current mode
  - `toggleLevelsVisibility()`: Show/hide level controls
- **Debouncing**: Uses debounce pattern for input changes (500ms)

#### `src/file-generator.ts`
- **Purpose**: Generate Minecraft command files
- **Key Method**: `generateCommand()`
- **Output Format**: `.mcfunction` file with fill commands
- **Coordinate System**: Relative coordinates using `~` notation
- **Block Placement Order**:
  1. Clear area with air
  2. Place floor
  3. Build walls (vertical, horizontal, pillars)
  4. Add entrance/exit openings
  5. Create holes in floors
  6. Place ladders

#### `src/utils.ts`
- **Purpose**: Shared utility functions
- **Key Functions**:
  - `isBoundaryWall()`: Check if position is on maze boundary
  - `isSolidBlock()`: Determine if a position should be solid

### Build and Configuration Files

#### `rollup.config.js`
- Bundles TypeScript into single `bundle.js`
- Custom plugin `injectVersion()` replaces `{{VERSION}}` in HTML template
- Output format: IIFE (immediately invoked function expression)
- Entry: `src/index-new.ts` → Output: `bundle.js`

#### `tsconfig.json`
- Target: ES2020
- Strict mode enabled
- Includes DOM types for browser APIs

#### `package.json`
- Build scripts:
  - `pnpm run build`: Patch version bump + build
  - `pnpm run build:minor`: Minor version bump + build
  - `pnpm run build:major`: Major version bump + build
  - `pnpm run version:*`: Version bump only (no build)

#### `scripts/version.js`
- Automatically increments version in `package.json`
- Updates version string in `index.html`
- Accepts: `major`, `minor`, or `patch`

### Test Files

#### `test-suite.js`
- Comprehensive test suite for ladder placement
- Tests: basic placement, fallback strategies, 3D mode, edge cases, UI, performance
- Run with: `node run-tests.js`

#### `run-tests.js`
- Test runner that executes test-suite.js

#### `test-ladder-placement.js` & `ladder-diagnostics.js`
- Additional diagnostic tools for debugging ladder placement

### Template Files

#### `index.template.html`
- HTML template with `{{VERSION}}` placeholder
- Bootstrap 5 UI components
- Build process generates `index.html` from this template

#### `index.html`
- Generated output (do not edit directly)
- Updated automatically on build

## Development Workflow

### Making Changes

1. **Edit TypeScript files** in `src/` directory
2. **Run build**: `pnpm run build` (increments patch version and compiles)
3. **Test in browser**: Open `index.html`
4. **Run tests**: `node run-tests.js` (if modifying core logic)

### Version Management

- **Patch** (2.0.248 → 2.0.249): Bug fixes, small tweaks
- **Minor** (2.0.248 → 2.1.0): New features, non-breaking changes
- **Major** (2.0.248 → 3.0.0): Breaking changes, major refactors

Use appropriate build command:
```bash
pnpm run build         # patch
pnpm run build:minor   # minor
pnpm run build:major   # major
```

### Git Workflow

Recent commits follow conventional commit style:
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates

### Testing

Always run tests when modifying:
- Maze generation logic (`maze-generator.ts`)
- Ladder placement algorithms
- Coordinate calculations

```bash
node run-tests.js
```

## Key Concepts

### Maze Generation Algorithm

**Growing Tree Algorithm**:
1. Start with a random cell, mark as visited
2. Add to stack
3. While stack not empty:
   - Pick a cell from stack
   - Find unvisited neighbors
   - If neighbors exist: carve passage, add neighbor to stack
   - If no neighbors: pop from stack
4. Result: Perfect maze (no loops, single solution)

**Multi-Level Extension**:
- Generate each level independently as 2D maze
- Create vertical connections (holes) between levels
- Add entrance/exit based on level count (single vs multi-level)

### Bit Flag Wall System

Walls are stored as bit flags in a single integer:
```typescript
NORTH = 1   // 0001
SOUTH = 2   // 0010
EAST  = 4   // 0100
WEST  = 8   // 1000
UP    = 16  // 10000
DOWN  = 32  // 100000
```

Check if cell has passage to the east:
```typescript
if (cell.walls & EAST) {
  // Has east passage
}
```

### Coordinate Systems

**Maze Coordinates** (cells):
- Origin: Top-left corner
- `x`: Cell column (0 to width-1)
- `y`: Cell row (0 to height-1)
- `z` or `level`: Vertical level (0 to levels-1)

**Block Coordinates** (Minecraft):
- Relative coordinates using `~` prefix
- Calculation: `blockX = x * (walkSize + wallSize) + wallSize`
- Y-axis: `levelY = level * (1 + wallHeight)`

### Ladder Placement System

**Primary Strategy**: Place ladder on solid internal wall adjacent to hole

**Fallback Strategy** (only one active):
- **Pillar Creation**: Create a stone pillar and attach ladder to it
- Deprecated strategies (corner, wall-creation, ceiling) return null but code remains

**Visual Indicators**:
- Yellow border: Solid wall placement
- Blue border: Corner fallback
- Green border: Wall-creation fallback
- Purple border: Ceiling fallback
- Red: Hole up (no ladder)
- Purple: Hole down (no ladder)

### Display Modes

**Schematic View**:
- Abstract representation
- Each cell shown as single grid square
- Shows logical structure
- Default view

**Exact View**:
- Block-by-block representation
- Shows actual Minecraft block layout
- Matches exported .mcfunction file
- Useful for debugging coordinate issues

## Important Conventions

### Code Style

1. **TypeScript Strict Mode**: All code uses strict type checking
2. **No Unused Variables**: Prefix with `_` if parameter is required but unused
3. **Global Config**: Always access config via global `config` object, never local copies
4. **Declare Global Types**: Use `declare const config: any;` at top of files that need it

### Naming Conventions

- **Classes**: PascalCase (`MultiLevelMaze`, `DisplayManager`)
- **Files**: kebab-case (`maze-generator.ts`, `ui-controls.ts`)
- **Methods**: camelCase (`generateCommand`, `renderLevel`)
- **Constants**: UPPER_SNAKE_CASE for direction flags (`NORTH`, `SOUTH`)
- **Private members**: Prefix with underscore when appropriate

### File Organization

- **One main class per file** (except utils.ts)
- **Related functionality grouped together**
- **Export only what's needed** by other modules
- **Keep utility functions separate** in utils.ts

### HTML/UI Conventions

- **Bootstrap 5 classes**: Use existing Bootstrap utilities
- **Custom classes**: Prefix with `maze-` for maze-specific styles
- **IDs**: Use camelCase (`mazeDisplay`, `levelPagination`)
- **Dynamic content**: Generate HTML strings in DisplayManager

## Common Tasks

### Adding a New Configuration Option

1. Add to global config in `src/index-new.ts`:
```typescript
window.config = {
  // existing options...
  newOption: defaultValue
};
```

2. Add UI control in `index.template.html`

3. Wire up event listener in `ui-controls.ts`:
```typescript
const newOptionInput = document.getElementById('newOption');
newOptionInput.addEventListener('change', (e) => {
  config.newOption = e.target.value;
  this.drawDelay(); // or refreshDisplay()
});
```

4. Use in relevant module (`maze-generator.ts`, `file-generator.ts`, etc.)

### Modifying Maze Generation

1. Edit `maze-generator.ts` → `generate()` or `generate2DLevel()`
2. Test with various dimensions: `node run-tests.js`
3. Verify in browser with different configurations
4. Check both schematic and exact views

### Changing Display/Rendering

1. Edit `display-manager.ts` → `renderLevel()` or `renderExactBlockLayout()`
2. Test with multiple levels and different wall/path sizes
3. Verify tooltips still work
4. Check both display modes

### Updating Minecraft Command Generation

1. Edit `file-generator.ts` → `generateCommand()`
2. Test export with various configurations
3. Import into Minecraft to verify correctness
4. Check coordinate calculations carefully (off-by-one errors common)

### Adding New Visual Indicators

1. Add CSS classes in `index.template.html` `<style>` section
2. Update `display-manager.ts` to use new classes
3. Update legend in UI if needed
4. Document in README.md

## Debugging Tips

### Common Issues

**Issue**: Maze doesn't generate properly
- Check console for errors
- Run `debugMaze()` in browser console
- Verify config values are correct
- Check bit flag operations

**Issue**: Walls in wrong places
- Compare schematic vs exact view
- Check coordinate calculations in file-generator.ts
- Verify wall size and path size are correct
- Look for off-by-one errors

**Issue**: Ladders not appearing
- Check `config.generateLadders` is true
- Verify vertical connections exist (config.generateHoles)
- Look at console warnings about fallback strategies
- Run ladder diagnostic: `node run-diagnostics.js`

**Issue**: Build fails
- Check TypeScript syntax errors
- Verify all imports are correct
- Run `pnpm install` to ensure dependencies
- Check tsconfig.json settings

### Debugging Functions

**In Browser Console**:
```javascript
// View current configuration
console.log(config)

// Debug maze structure for current level
debugMaze()

// Access maze generator directly
window.mazeGenerator

// Check current display mode
currentDisplayMode
```

**Diagnostic Scripts**:
```bash
# Run full test suite
node run-tests.js

# Run ladder diagnostics
node run-diagnostics.js
```

## Known Issues and Gotchas

1. **CLAUDE.md is in .gitignore**: This file is gitignored by default. Remove from .gitignore if you want to track it.

2. **Deprecated Fallback Methods**: `attemptCornerPlacement()`, `attemptWallCreation()`, and `attemptCeilingMounting()` exist but always return null. They remain in code for reference but are not active.

3. **Bundle.js is Committed**: The compiled `bundle.js` is tracked in git (required for GitHub Pages deployment).

4. **Index.html is Generated**: Never edit `index.html` directly - always edit `index.template.html` and rebuild.

5. **Global Config Mutation**: Config is a mutable global object. Changes anywhere affect everywhere immediately.

6. **Coordinate System Complexity**: Three coordinate systems in play (cell, block, Minecraft relative). Be careful with conversions.

7. **Bedrock Edition Only**: Currently targets Minecraft Bedrock Edition. Java Edition has different command syntax and block IDs.

8. **No TypeScript Types for Config**: Global config uses `any` type. Be careful with property names and types.

9. **Single Level Exit Handling**: Special logic exists for single-level mazes (west entrance, east exit) vs multi-level (north entrance, south exit).

10. **Hole Placement Randomization**: Holes between levels are placed randomly, which can occasionally result in suboptimal placements.

## Project History

- **v2.1.0+**: Ladder logic overhaul, multi-strategy fallback system, visual indicators, automated tests
- **v2.0.0**: Multi-level support, enhanced UI, Bootstrap 5, Bedrock Edition focus
- **v1.x**: Original version by Bibliofile with basic single-level maze generation

## References

- **Original Author**: Bibliofile - [MinecraftMazeGenerator](https://github.com/Bibliofile/MinecraftMazeGenerator)
- **Algorithm Inspiration**: Jamis Buck - [Growing Tree Algorithm](https://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm)
- **Minecraft Commands**: [Bedrock Edition Commands](https://learn.microsoft.com/en-us/minecraft/creator/commands)

## When to Ask for Clarification

As an AI assistant, you should ask the user for clarification when:

1. **Minecraft Version Ambiguity**: If a requested feature might differ between Bedrock and Java editions
2. **Breaking Changes**: If a change would break existing maze exports or user workflows
3. **Algorithm Changes**: If modifying the core maze generation algorithm
4. **Performance Trade-offs**: If a change might impact generation speed significantly
5. **UI/UX Decisions**: For subjective design choices about layout, colors, or interactions
6. **Build Configuration**: If changes to rollup, TypeScript, or build process are needed
7. **Version Bumping**: If unclear whether change is patch, minor, or major

## Quick Reference Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm run build        # Build with patch version bump
pnpm run build:minor  # Build with minor version bump
pnpm run build:major  # Build with major version bump

# Testing
node run-tests.js     # Run automated test suite
node run-diagnostics.js  # Run ladder diagnostics

# Version Only (no build)
pnpm run version:patch
pnpm run version:minor
pnpm run version:major

# Git
git status           # Check current branch and changes
git log --oneline    # View recent commits
```

## File Change Impact Matrix

| Change Type | Files to Check | Test Required | Rebuild Required |
|------------|----------------|---------------|------------------|
| Algorithm | maze-generator.ts | ✅ Yes | ✅ Yes |
| Display | display-manager.ts | Visual check | ✅ Yes |
| UI Controls | ui-controls.ts, index.template.html | Manual test | ✅ Yes |
| File Export | file-generator.ts | Minecraft test | ✅ Yes |
| Utilities | utils.ts | ✅ If used by generator | ✅ Yes |
| HTML Template | index.template.html | Visual check | ✅ Yes |
| Build Config | rollup.config.js, tsconfig.json | Build test | ✅ Yes |
| Documentation | README.md, CLAUDE.md | Review only | ❌ No |

---

**Last Updated**: 2025-11-14
**Project Version**: 2.0.248
**Document Version**: 1.0.0

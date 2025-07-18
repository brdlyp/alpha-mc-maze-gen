# Minecraft Maze Generator

A powerful web-based tool for generating multi-level mazes that can be imported into Minecraft Bedrock Edition worlds. This tool creates complex 3D mazes with customizable dimensions, wall properties, and block types, then exports them as Minecraft function files.

**Note**: This project is currently focused on Bedrock Edition compatibility. Java Edition support may be added in future versions.

## ⚠️ Disclaimer – Vibe Code Ahead

This project was built by a non-developer dad (that's me) using a healthy mix of vibes, curiosity, and help from AI tools like ChatGPT. I wanted to make something cool for my son — a way to quickly generate Minecraft mazes and have some fun together.

The code might not follow best practices, and there's probably a more "correct" way to do things — but hey, it works (mostly), and we had a blast making it.

Use at your own risk, tweak as you like, and most importantly: have fun with it.

## 🎮 Features

- **Multi-Level Maze Generation**: Create complex 3D mazes with multiple levels
- **Customizable Dimensions**: Adjust width, height, and number of levels
- **Flexible Wall Properties**: Configure wall width, height, and path width
- **Block Type Selection**: Choose any Minecraft block type for walls
- **Robust Ladder Placement**: Multi-strategy system (solid wall, corner, wall-creation, ceiling mount) with fallback for all edge cases
- **Visual Indicators**: See where ladders are placed and which fallback strategy was used
- **Tooltips**: Hover over cells to see coordinates, cell type, and ladder info
- **Automated Test Suite**: Validate ladder placement logic across many scenarios
- **Minecraft Function Export**: Generate `.mcfunction` files ready for import
- **Growing Tree Algorithm**: Uses an advanced maze generation algorithm for optimal path creation
- **Responsive Design**: Modern UI built with Bulma CSS framework

## 🚀 Live Demo

Try the maze generator online: [Minecraft Maze Generator](https://brdlyp.github.io/alpha-mc-maze-gen/)

## 📋 Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Minecraft Bedrock Edition (for importing generated mazes)
- Basic knowledge of Minecraft behavior packs (for installation)

## 🛠️ Installation & Usage

### For Users

1. **Generate a Maze**:
   - Visit the live demo or open `index.html` in your browser
   - Configure maze dimensions (width, height, levels)
   - Adjust wall properties (width, height, path width)
   - Choose your preferred block type
   - Use the 3D Maze controls to enable/disable ladders for all vertical passages
   - Click "Download function" to get your `.mcfunction` file

2. **Import into Minecraft**:
   - **Quick Start**: Use the [Microsoft Behavior Pack Sample](https://github.com/microsoft/minecraft-samples/tree/main/behavior_pack_sample) as a template
   - **Manual Setup**: Create a behavior pack in your Minecraft Bedrock world
   - Place the downloaded `.mcfunction` file in the `functions` folder
   - Use `/function [filename]` in-game to generate the maze

### For Developers

1. **Clone the repository**:
   ```bash
   git clone https://github.com/brdlyp/brdlyp.github.io.git
   cd brdlyp.github.io
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the project**:
   ```bash
   pnpm run build
   ```

4. **Open in browser**:
   - Open `index.html` in your web browser
   - Or serve the files using a local web server

## 🎯 How It Works

### Maze Generation Algorithm

The project uses the **Growing Tree algorithm** with a 50/50 split between random and newest cell selection. This creates mazes with a good balance of complexity and solvability.

### 3D Maze Structure

- **Levels**: Multiple horizontal layers connected by vertical passages
- **Walls**: Configurable thickness and height using any Minecraft block
- **Paths**: Walkable corridors with customizable width
- **Connections**: Ladders connect different levels using a robust multi-strategy system
- **Visualization**: 2D top-down view of each level with indicators for vertical connections and ladder placement method

### Ladder Placement Logic

Ladders are placed using a multi-strategy system:
- **Primary**: Place ladders on solid internal walls (no passage)
- **Fallback 1**: Place ladders on corners/pillars if no solid wall is available
- **Fallback 2**: Dynamically create a temporary wall for ladder placement if needed
- **Fallback 3**: Ceiling-mount ladders as a last resort
- **Smart Hole Placement**: (future) Optionally, prioritize hole placement in cells with more solid walls

The system ensures ladders are always placed, even in highly connected or edge-case mazes.

### File Generation

The tool generates Minecraft function files containing:
- Block placement commands for walls, paths, and ladders
- Proper coordinate calculations for 3D space
- Optimized command structure for efficient execution

## 📁 Project Structure

```
alpha-mc-maze-gen/
├── src/
│   ├── index.ts          # Main application logic
│   ├── config.ts         # Configuration management
│   └── exports.d.ts      # TypeScript declarations
├── test-suite.js         # Automated test suite for ladder logic
├── run-tests.js          # Test runner script
├── index.html           # Main web interface
├── index.template.html  # HTML template for builds
├── bundle.js            # Built JavaScript (generated)
├── package.json         # Dependencies and scripts
└── rollup.config.js     # Build configuration
```

## 🔧 Configuration Options

| Setting | Description | Default | Range |
|---------|-------------|---------|-------|
| Width | Maze width in paths | 20 | 10-100 |
| Height | Maze height in paths | 20 | 10-100 |
| Levels | Number of maze levels | 3 | 1-20 |
| Wall Width | Thickness of walls | 1 | 1-5 |
| Wall Height | Height of walls | 3 | 1-50 |
| Path Width | Width of walkable paths | 2 | 1-5 |
| Block Type | Minecraft block for walls | stone | Any valid block |
| 3D Ladder Toggle | Enable/disable ladders for all vertical passages in 3D mode | On | On/Off |

## 🎨 Customization & Visual Indicators

### File Naming Options

- **Simple**: `maze.mcfunction`
- **Detailed**: `20x20maze-ww2wh4pw2wbstone.mcfunction`
- **Custom**: User-defined filename

### Visual Indicators & Legend

- **Yellow (bordered)**: Ladder placed on solid wall (primary strategy)
- **Blue (bordered)**: Ladder placed using corner fallback
- **Green (bordered)**: Ladder placed using wall-creation fallback
- **Purple (bordered)**: Ladder placed using ceiling-mount fallback
- **Red**: Hole only (up, no ladder)
- **Purple**: Hole only (down, no ladder)
- **Gray**: Walls
- **White**: Paths
- **Tooltip**: Hover over any cell to see coordinates, cell type, and ladder method

### UI Controls

- **3D Maze Ladder Toggle**: Enable/disable ladders for all vertical passages in 3D mode
- **Holes Per Level**: Set number of holes per level (2D mode)
- **Show Block Legend**: Toggle legend display
- **Show Chunk Borders**: Toggle chunk border overlay
- **Schematic/Exact View**: Switch between schematic and exact block layout

## 🧪 Automated Testing

### Test Suite

- **Location**: `test-suite.js`, run with `run-tests.js`
- **How to Run**:
  ```bash
  node run-tests.js
  ```
- **What It Covers**:
  - Basic ladder placement
  - Fallback strategies (corner, wall-creation, ceiling)
  - 3D mode ladder logic
  - Edge cases (minimum/maximum size, wall height, etc.)
  - UI controls and tooltips
  - Performance (generation speed)
- **Interpreting Results**:
  - All tests should pass (100%) for a healthy build
  - Detailed output shows which strategies were used and any failures

## 🩺 Diagnostics & Logging

- **Diagnostics**: Scripts and logging are available for wall availability, ladder placement, and fallback usage
- **Troubleshooting**: If ladders are missing or floating, check the test suite and diagnostics for wall/fallback info

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

### Original Author
- **Bibliofile** - For the original codebase that this project is based on. Their work provided the foundation for the maze generation logic, TypeScript implementation, and the basic UI structure that has been enhanced and extended.
  - [Original Repository](https://github.com/Bibliofile/MinecraftMazeGenerator)

### Algorithm Inspiration
- **Jamis Buck** - For the maze generator examples and inspiration. His work on maze algorithms, particularly the Growing Tree algorithm, provided the theoretical foundation and implementation ideas that influenced the maze generation approach used in this project.
  - [Weblog](https://weblog.jamisbuck.org/)
  - [Minecraft Maze Generator](https://jamisbuck.org/mazes/minecraft.html)
  - [Growing Tree Algorithm](https://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm)

### Ladder Placement Logic & UI Enhancements
- **AI/ChatGPT** - For assistance in designing and implementing the robust ladder placement system, fallback strategies, diagnostics, and automated test suite.

### Technologies Used
- **TypeScript** - For type-safe JavaScript development
- **Rollup** - For module bundling and build process
- **Bulma CSS** - For modern, responsive UI components
- **HTML5 Canvas** - For maze visualization

## 📚 Additional Resources

### Minecraft Bedrock Development
- **[Behavior Packs Documentation](https://learn.microsoft.com/en-us/minecraft/creator/documents/behaviorpack?view=minecraft-bedrock-stable)** - Official Microsoft guide for creating behavior packs
- **[MCFunctions Documentation](https://wiki.bedrock.dev/commands/mcfunctions)** - Comprehensive guide to Minecraft functions
- **[Function (Bedrock Edition)](https://minecraft.fandom.com/wiki/Function_(Bedrock_Edition))** - Minecraft Wiki reference for functions

### Getting Started
- **[Microsoft Behavior Pack Sample](https://github.com/microsoft/minecraft-samples/tree/main/behavior_pack_sample)** - Official template to quickly set up a behavior pack

## 🔄 Version History

- **v2.1.0** - Ladder logic overhaul, multi-strategy fallback, visual indicators, tooltips, automated test suite, diagnostics, and UI polish
- **v2.0.0** - Enhanced UI and multi-level support (Bedrock Edition focused)
- **v1.x** - Original version by Bibliofile

## 🚧 Future Plans

- **Java Edition Support**: Plans to add compatibility with Minecraft Java Edition worlds
- **Enhanced Block Types**: Support for more Bedrock-specific blocks and features
- **Improved Performance**: Optimizations for larger maze generation

---

**Happy maze building! 🧱⚡**

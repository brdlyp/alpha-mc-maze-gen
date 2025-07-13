
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { readFileSync, writeFileSync } from 'fs'
import { resolve as pathResolve } from 'path'

// Custom plugin to inject version into HTML
function injectVersion() {
  return {
    name: 'inject-version',
    writeBundle() {
      // Read package.json to get version
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
      const version = packageJson.version
      
      // Read the template HTML file
      let html = readFileSync('index.template.html', 'utf8')
      
      // Replace the placeholder with the actual version
      html = html.replace('{{VERSION}}', version)
      
      // Also replace any existing version numbers in the format "Version: X.X.X"
      html = html.replace(/Version: \d+\.\d+\.\d+/g, `Version: ${version}`)
      
      // Write the updated HTML file to the output location
      writeFileSync('index.html', html)
    }
  }
}

export default {
  input: 'src/index.ts',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    injectVersion()
  ]
}

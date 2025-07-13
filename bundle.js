(function () {
  'use strict';

  function t(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),r.push.apply(r,n);}return r}function e(e){for(var n=1;n<arguments.length;n++){var o=null!=arguments[n]?arguments[n]:{};n%2?t(Object(o),true).forEach(function(t){r(e,t,o[t]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):t(Object(o)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(o,t));});}return e}function r(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:true,configurable:true,writable:true}):t[e]=r,t}function n(t){return t.slice(0,-1)}function o(t,e=0){return e?Array.from(Array(e-t).keys()).map(e=>e+t):Array.from(Array(t).keys())}function c(t){return [...new Set(t)]}function u(t,e){const r=c(t.map(t=>t.set)).filter(Boolean),n=(u=o(1,t.length+1),f=r,[u,f].reduce((t,e)=>t.filter(t=>!e.includes(t)))).sort(()=>.5-e());var u,f;t.filter(t=>!t.set).forEach((t,e)=>t.set=n[e]);}function f(t,e,r=.5){n(t).forEach((n,o)=>{const c=t[o+1],u=n.set!==c.set,f=e()<=r;u&&f&&(function(t,e,r){t.forEach(t=>{t.set===e&&(t.set=r);});}(t,c.set,n.set),n.right=false,c.left=false);});}function i(t=8,r=t,i=true,s=1){const l=function(t){return function(){let e=t+=1831565813;return e=Math.imul(e^e>>>15,1|e),e^=e+Math.imul(e^e>>>7,61|e),((e^e>>>14)>>>0)/4294967296}}(s),a=[],p=o(t);for(let e=0;e<r;e+=1){const n=p.map(n=>({x:n,y:e,top:i||e>0,left:i||n>0,bottom:i||e<r-1,right:i||n<t-1}));a.push(n);}n(a).forEach((t,r)=>{u(t,l),f(t,l),function(t,r,n){const o=Object.values(function(t,r){let n=c(t.map(t=>t.set)).reduce((t,r)=>e(e({},t),{},{[r]:[]}),{});return t.forEach(t=>n[t.set].push(t)),n}(t)),{ceil:u}=Math;o.forEach(t=>{(function(t,e,r){e=null==e?1:e;const n=null==t?0:t.length;if(!n||e<1)return [];e=e>n?n:e;let o=-1;const c=n-1,u=[...t];for(;++o<e;){const t=o+Math.floor(r()*(c-o+1)),e=u[t];u[t]=u[o],u[o]=e;}return u.slice(0,e)})(t,u(n()*t.length),n).forEach(t=>{if(t){const e=r[t.x];t.bottom=false,e.top=false,e.set=t.set;}});});}(t,a[r+1],l);});const h=(b=a)[b.length-1];var b;return u(h,l),f(h,l,1),a}

  let config = {
      wallSize: 1,
      wallHeight: 3,
      walkSize: 2,
      width: 15,
      height: 15,
      block: 'stone',
      includeSides: true
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

  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
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
  function draw() {
      let { width, height, wallSize, walkSize, includeSides } = config;
      const cellSize = wallSize * 2 + walkSize;
      const cellOffset = wallSize + walkSize;
      const maze = i(width, height, includeSides);
      canvas.width = (width * wallSize) + (width * walkSize) + wallSize;
      canvas.height = (height * wallSize) + (height * walkSize) + wallSize;
      document.querySelector('[data-show=dimensions]').innerHTML = `${canvas.width} &times; ${canvas.height}`;
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'black';
      maze.forEach(row => {
          row.forEach(cell => {
              // Top left
              const x = cell.x * cellOffset;
              const y = cell.y * cellOffset;
              if (cell.top) {
                  context.fillRect(x, y, cellSize, wallSize);
              }
              if (cell.left) {
                  context.fillRect(x, y, wallSize, cellSize);
              }
              if (cell.right) {
                  context.fillRect(x + wallSize + walkSize, y, wallSize, cellSize);
              }
              if (cell.bottom) {
                  context.fillRect(x, y + wallSize + walkSize, cellSize, wallSize);
              }
          });
      });
  }
  function generateCommand() {
      if (canvas.width * canvas.height > 2 ** 16 && confirm('Maze is probably too large, this may crash your browser. Continue?')) {
          return;
      }
      let { width, height, wallSize, wallHeight, walkSize, block } = config;
      // MineCraft... 0 wallSize = 1 block
      wallSize--;
      walkSize--;
      wallHeight--;
      const commands = [
          `# Clear maze blocks\n`
      ];
      const clearSize = Math.floor(Math.sqrt(32768 / (wallHeight + 1)));
      for (let y = 0; y < canvas.height; y += clearSize) {
          for (let x = 0; x < canvas.width; x += clearSize) {
              const xMax = Math.min(x + clearSize, canvas.width);
              const yMax = Math.min(y + clearSize, canvas.height);
              commands.push(`fill ~${x} ~ ~${y} ~${xMax - 1} ~${wallHeight} ~${yMax - 1} air\n`);
          }
      }
      commands.push(`# Fill maze blocks\n`);
      for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
              const { data } = context.getImageData(x, y, 1, 1);
              if (data[0])
                  continue;
              commands.push(`fill ~${x} ~ ~${y} ~${x} ~${wallHeight} ~${y} ${block}\n`);
          }
      }
      // Generate filename based on selected naming option
      let filename;
      const namingOption = document.querySelector('input[name="naming"]:checked')?.value;
      switch (namingOption) {
          case 'simple':
              filename = 'maze.mcfunction';
              break;
          case 'detailed':
              // Format: <width>x<height>maze-<ww#><wh#><pw#><wb"word">.mcfunction
              filename = `${width}x${height}maze-ww${wallSize + 1}wh${wallHeight + 1}pw${walkSize + 1}wb${block}.mcfunction`;
              break;
          case 'custom':
              const customName = document.querySelector('[data-for="customName"]')?.value?.trim();
              if (customName) {
                  filename = customName.endsWith('.mcfunction') ? customName : `${customName}.mcfunction`;
              }
              else {
                  // Fallback to simple if no custom name provided
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
  const drawDelay = debounce(draw, 500);
  function updateDetailedFilename() {
      let { width, height, wallSize, wallHeight, walkSize, block } = config;
      const filename = `${width}x${height}maze-ww${wallSize + 1}wh${wallHeight + 1}pw${walkSize + 1}wb${block}.mcfunction`;
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
      drawDelay();
  }
  document.addEventListener('change', validate);
  document.addEventListener('input', (event) => {
      const target = event.target;
      if (target.getAttribute('data-for') === 'customName') {
          updateCustomNamePreview();
      }
  });
  document.querySelector('button').addEventListener('click', generateCommand);
  draw();
  updateDetailedFilename();
  updateCustomNamePreview();

})();

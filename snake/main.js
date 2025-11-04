// === CANVAS & GRID ===========================================================

const canvas = document.getElementById("canvas");                 // get canvas element
const ctx = canvas.getContext("2d");                              // 2D drawing context
ctx.imageSmoothingEnabled = false;                                // crisp pixels (no blur)

const GRID = 20;                                                  // 20 x 20 grid
let cellSize = Math.floor(canvas.width / GRID);                   // integer cell size (px)
canvas.width  = cellSize * GRID;                                  // align width to grid
canvas.height = cellSize * GRID;                                  // align height to grid
canvas.style.width  = canvas.width + "px";                        // avoid CSS scaling blur
canvas.style.height = canvas.height + "px";                       // keep CSS = pixel size

// those five lines mean: Fits exactly inside the canvas, Has square, integer-sized cells, Looks perfectly sharp on screen.

// === UI ELEMENTS =============================================================

const scoreEl  = document.getElementById("score");                // score text node
const overlay  = document.getElementById("overlay");              // start overlay
const startBtn = document.getElementById("start");                // start button

// === GAME STATE (MINIMAL) ====================================================

let snake;                                                        // array of {x,y} cells
let dirX = 1, dirY = 0;                                           // movement direction
let food;                                                         // {x,y} of red square
let score = 0;                                                    // score counter
let alive = true;                                                 // alive flag
let paused = false;                                               // paused flag (kept)
let timerId = null;                                               // interval id
let gameSpeed = 200;                                              // ms per tick
let bgHue = 0;                                                    // background hue (for rotating colors)       
// === START OVERLAY HANDLER ===================================================

startBtn.addEventListener("click", () => {                        // on Start click…
  overlay.classList.add("hidden");                                // hide overlay
  resetGame();                                                    // reset and start loop
});

scoreEl.textContent = "Score: " + score;    
// === LOOP CONTROL ============================================================

function startLoop() {                                            // start game loop
  clearInterval(timerId);                                         // clear old loop
  timerId = setInterval(tick, gameSpeed);                         // call tick regularly
}

function stopLoop() {                                             // stop game loop
  clearInterval(timerId);                                         // clear interval
}

// === RESET GAME =============================================================

function resetGame() {                                            // fresh state
  stopLoop();                                                     // stop if running
  snake = [ {x:10,y:10}, {x:9,y:10}, {x:8,y:10} ];                // simple 3-cell snake
  dirX = 1; dirY = 0;                                             // move right initially
  score = 0; scoreEl.textContent = "Score: " + score;             // reset score UI
  alive = true; paused = false;                                   // reset flags
  bgHue = 0;                                                      // reset bg hue
  spawnFood();                                                    // place first food
  draw();                                                         // draw once
  startLoop();                                                    // start loop
}

// === CONTROLS (KEEP ARROWS / PAUSE / RESTART) ================================

document.addEventListener("keydown", (e) => {                     // on any key
  const k = e.key.toLowerCase();                                  // normalize key

  if (k === "p" || k === " ") {                                   // P or Space
    togglePause();                                                // toggle pause
    return;                                                       // stop further handling
  }

  if (e.key === "ArrowUp"    && dirY !==  1) { dirX = 0; dirY = -1; } // go up (no 180°)
  if (e.key === "ArrowDown"  && dirY !== -1) { dirX = 0; dirY =  1; } // go down
  if (e.key === "ArrowLeft"  && dirX !==  1) { dirX = -1; dirY =  0; } // go left
  if (e.key === "ArrowRight" && dirX !== -1) { dirX =  1; dirY =  0; } // go right

  if (k === "r") resetGame();                                     // R = restart
});

function togglePause() {                                          // pause/unpause
  if (!alive) return;                                             // ignore if dead
  paused = !paused;                                               // flip state
  if (paused) stopLoop(); else startLoop();                       // stop/start loop
  draw();                                                         // redraw overlays
}

// === DRAW HELPERS (MINIMAL) ================================================

function drawCell(gx, gy, color) {                                // draw one grid cell
  const x = (gx * cellSize) | 0;                                  // pixel x (floored)
  const y = (gy * cellSize) | 0;                                  // pixel y (floored)
  ctx.fillStyle = color;                                          // set fill color
  ctx.fillRect(x, y, cellSize, cellSize);                         // draw square
}

function drawBackground() {                                       // rotating near-black bg
  const hue = bgHue;                                              // current hue value
  ctx.fillStyle = `hsl(${hue}, 60%, 6%)`;                         // dark color with hue
  ctx.fillRect(0, 0, canvas.width, canvas.height);                // fill whole canvas
}

// === RENDER ONE FRAME =======================================================

function draw() {                                                 // draw everything
  drawBackground();                                               // plain bg (animated hue)
  if (food) drawCell(food.x, food.y, "#ff2e2e");                  // red square food
  for (let i = 0; i < snake.length; i++) {                        
  const color = (i === 0) ? "#59c75d" : "#43a748";              // head lighter green
  drawCell(snake[i].x, snake[i].y, color);                      
    }

  ctx.strokeStyle = "#0400ff";                                    // blue border color
  ctx.lineWidth = 6;                                              // border thickness
  ctx.strokeRect(0, 0, canvas.width, canvas.height);              // draw border

  if (!alive) {                                                   // game-over overlay text
    ctx.fillStyle = "rgba(0,0,0,0.5)";                            // darken background
    ctx.fillRect(0, 0, canvas.width, canvas.height);              // full overlay
    drawCenteredText("GAME OVER! — Press R", 28, "#ff4d4d");      // simple message
  }

  if (paused) {                                                   // pause overlay text
    ctx.fillStyle = "rgba(0,0,0,0.35)";                           // slight dim
    ctx.fillRect(0, 0, canvas.width, canvas.height);              // full overlay
    drawCenteredText("PAUSED — P / Space", 24, "#ffd54a");        // pause message
  }
}

function drawCenteredText(text, size = 24, glow = "#4f8cff") {    // simple centered canvas text
  ctx.font = `${size}px 'Jersey 10', sans-serif`;                 // font & size
  ctx.textAlign = "center";                                       // center horizontally
  ctx.textBaseline = "middle";                                    // center vertically
  ctx.fillStyle = "#fff";                                         // white text
  ctx.shadowColor = glow;                                         // glow color
  ctx.shadowBlur = 10;                                            // glow strength
  ctx.fillText(text, canvas.width/2, canvas.height/2);            // draw at canvas center
  ctx.shadowBlur = 0;                                             // reset glow
}

// === GAME TICK ===============================================================

function tick() {                                                 // one update step
  if (!alive || paused) return;                                   // do nothing if dead/paused

  bgHue = (bgHue + 2) % 360;                                      // slowly rotate background hue

  const head = snake[0];                                          // current head segment
  const newHead = { x: head.x + dirX, y: head.y + dirY };         // move one cell in direction

  if (newHead.x < 0 || newHead.x >= GRID ||                       // border collision X
      newHead.y < 0 || newHead.y >= GRID) {                       // border collision Y
    alive = false;                                                // mark dead
    stopLoop();                                                   // stop updates
    draw();                                                       // show overlay
    return;                                                       // stop tick
  }

  const hitSelf = snake.some(seg => seg.x === newHead.x && seg.y === newHead.y); // self collision?
  if (hitSelf) {                                                  // if head hits body
    alive = false;                                                // dead
    stopLoop();                                                   // stop updates
    draw();                                                       // show overlay
    return;                                                       // stop tick
  }

  const ate = (food && newHead.x === food.x && newHead.y === food.y); // did we eat food?

  snake.unshift(newHead);                                         // add new head to front

  if (ate) {                                                      // if eaten
    score += 1;                                                   // increment score
    scoreEl.textContent = "Score: " + score;                      // update UI
    spawnFood();                                                  // place new food
    // no tail removal → snake grows
  } else {
    snake.pop();                                                  // normal move: remove tail
  }

  draw();                                                         // render the frame
}

// === FOOD SPAWN ==============================================================

function spawnFood() {                                            // pick random empty cell
  while (true) {                                                  // loop until free spot found
    const fx = Math.floor(Math.random() * GRID);                  // random x (0..GRID-1)
    const fy = Math.floor(Math.random() * GRID);                  // random y (0..GRID-1)
    const onSnake = snake.some(seg => seg.x === fx && seg.y === fy); // skip if on snake
    if (!onSnake) { food = { x: fx, y: fy }; break; }             // set food and exit
  }
}

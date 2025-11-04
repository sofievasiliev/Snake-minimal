// === SETUP ==================================================================

const canvas = document.getElementById("canvas");              // get the canvas element from HTML
const ctx = canvas.getContext("2d");                           // 2D drawing context for drawing shapes
ctx.imageSmoothingEnabled = false;                             // keep sharp pixels (no blur)

const GRID = 20;                                               // number of cells in each row/column
let cellSize = Math.floor(canvas.width / GRID);                // size of each grid cell in pixels (rounded)

canvas.width  = cellSize * GRID;                               // make sure width fits grid perfectly
canvas.height = cellSize * GRID;                               // make sure height fits grid perfectly
canvas.style.width  = canvas.width + "px";                     // prevent CSS scaling blur
canvas.style.height = canvas.height + "px";                    // same for height

const scoreEl  = document.getElementById("score");             // score text element
const overlay  = document.getElementById("overlay");           // overlay that shows before game starts
const startBtn = document.getElementById("start");             // start button inside overlay
const stage    = document.getElementById("stage");             // wrapper div (used for screen shake)

// === GAME STATE =============================================================

let snake;                                                     // array of snake segments (each {x,y})
let dirX = 1, dirY = 0;                                        // current direction (1=right)
let food;                                                      // coordinates of current apple
let score = 0;                                                 // current score
let alive = true;                                              // is the player still alive
let paused = false;                                            // is the game paused
let timerId = null;                                            // holds the setInterval ID
let gameSpeed = 200;                                           // milliseconds per tick (lower = faster)

scoreEl.textContent = "Score: " + score;                       // display initial score

// === START BUTTON HANDLER ===================================================

startBtn.addEventListener("click", () => {                     // when player clicks Start...
  overlay.classList.add("hidden");                             // hide the overlay entirely
  resetGame();                                                 // set everything up fresh
  flashMessage("Game started!", 900, "#4f8cff", 32);           // show glowing “Game started!” text briefly
});

// === START SCREEN ===========================================================

function drawStartScreen() {
  ctx.fillStyle = "#101010";                                   // dark background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);              // fill the entire canvas

  drawGlowingText(                                              // draw glowing info text
    "Use Arrow Keys • P/Space = Pause • R = Restart",           // instructions
    canvas.height / 1.8 + 30,                                   // Y position (roughly near center)
    "#4f8cff",                                                  // glow color
    18                                                          // font size
  );
}

document.fonts.load("32px 'Jersey 10'").then(() => drawStartScreen()); // wait for font, then draw once

// === GAME LOOP CONTROL ======================================================

function startLoop() {                                          // start game updates
  clearInterval(timerId);                                       // clear any previous interval
  timerId = setInterval(tick, gameSpeed);                       // call tick() repeatedly every X ms
}

function stopLoop() {                                           // stop the game updates
  clearInterval(timerId);                                       // stops the running interval
}

// === RESET GAME =============================================================

function resetGame() {
  stopLoop();                                                   // stop any running loops

  snake = [                                                     // create a short 3-block snake
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 }
  ];

  dirX = 1; dirY = 0;                                           // start moving right
  score = 0;                                                    // reset score
  scoreEl.textContent = "Score: " + score;                      // update display
  alive = true; paused = false;                                 // reset states

  spawnFood();                                                  // place first apple
  draw();                                                       // draw everything once
  startLoop();                                                  // start ticking again
}


// === CONTROLS ===============================================================

document.addEventListener("keydown", (e) => {                // listen for any key press
  const k = e.key.toLowerCase();                             // normalize to lowercase for comparisons

  if (k === "p" || k === " ") {                              // P or Space toggles pause
    togglePause();                                           // flip paused/running
    return;                                                  // stop processing arrows on same event
  }

  if (e.key === "ArrowUp"    && dirY !==  1) { dirX = 0; dirY = -1; } // go up  (not if moving down)
  if (e.key === "ArrowDown"  && dirY !== -1) { dirX = 0; dirY =  1; } // go down(not if moving up)
  if (e.key === "ArrowLeft"  && dirX !==  1) { dirX = -1; dirY =  0; } // go left(not if moving right)
  if (e.key === "ArrowRight" && dirX !== -1) { dirX =  1; dirY =  0; } // go right(not if moving left)

  if (k === "r") resetGame();                                 // R restarts the game
});

function togglePause() {                                      // pause/unpause the game
  if (!alive) return;                                         // ignore pause when dead
  paused = !paused;                                           // flip the paused state
  if (paused) stopLoop(); else startLoop();                   // stop or start the interval loop
  draw();                                                     // redraw so overlay text appears immediately
}

// === DRAW HELPERS ===========================================================

function drawGlowingText(text, y, color = "#4f8cff", size = 32) { // draw centered text with glow
  ctx.font = `${size}px 'Jersey 10', sans-serif`;             // choose font and size
  ctx.textAlign = "center";                                   // center horizontally
  ctx.textBaseline = "middle";                                // center vertically around y
  ctx.fillStyle = "#fff";                                     // white text fill
  ctx.shadowColor = color;                                    // glow color
  ctx.shadowBlur = 10;                                        // glow intensity
  ctx.fillText(text, canvas.width / 2, y);                    // draw at center x, given y
  ctx.shadowBlur = 0;                                         // reset glow so it doesn’t affect other draws
}

function drawCell(gx, gy, color) {                            // draw one filled grid cell
  const x = (gx * cellSize) | 0;                              // convert grid→pixel (snap to int)
  const y = (gy * cellSize) | 0;                              // convert grid→pixel (snap to int)
  ctx.fillStyle = color;                                      // choose color
  ctx.fillRect(x, y, cellSize, cellSize);                     // paint the square
}

function drawGrassBackground() {                              // pixel grass made of cell-sized tiles
  const shades = ["#0a1735ff", "#172f12", "#142d14", "#193819", "#1c3f1c"]; // dark green tones
  const tile = cellSize;                                      // one grass tile per snake cell
  for (let y = 0; y < canvas.height; y += tile) {             // loop rows by tile size
    for (let x = 0; x < canvas.width; x += tile) {            // loop cols by tile size
      ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)]; // pick random shade
      ctx.fillRect(x, y, tile, tile);                         // fill that tile
    }
  }
}

function drawHeadWithEyes(gx, gy, dx, dy, openMouth = false) { // draw the head with eyes & optional mouth
  const x = (gx * cellSize) | 0;                              // pixel x of head // | 0 means drop decimals
  const y = (gy * cellSize) | 0;                              // pixel y of head

  ctx.save();                                                 // save drawing state

  ctx.fillStyle = "#59c75d";                                  // head green
  ctx.fillRect(x, y, cellSize, cellSize);                     // head square

  if (openMouth) {                                            // if mouth should be open this frame
    const w = (cellSize / 3) | 0;                             // mouth width along edge
    const d = (cellSize / 4) | 0;                             // mouth depth into the head
    ctx.fillStyle = "#ff7aa2";                                // pink mouth/tongue
    if (dx === 1) {                                           // facing right
      const my = y + ((cellSize - w) >> 1);                   // center vertically
      ctx.fillRect(x + cellSize - d, my, d, w);               // notch on right edge
    } else if (dx === -1) {                                   // facing left
      const my = y + ((cellSize - w) >> 1);                   // center vertically
      ctx.fillRect(x, my, d, w);                              // notch on left edge
    } else if (dy === -1) {                                   // facing up
      const mx = x + ((cellSize - w) >> 1);                   // center horizontally
      ctx.fillRect(mx, y, w, d);                              // notch on top edge
    } else {                                                  // facing down
      const mx = x + ((cellSize - w) >> 1);                   // center horizontally
      ctx.fillRect(mx, y + cellSize - d, w, d);               // notch on bottom edge
    }
  }

  const e   = Math.max(2, (cellSize / 6) | 0);                // eye size in pixels
  const pad = Math.max(1, (cellSize / 6) | 0);                // padding from edges
  let ex1, ey1, ex2, ey2;                                     // eye positions

  if (dx === 1) {                                             // eyes when facing right
    ex1 = x + cellSize - pad - e; ey1 = y + pad;              // top-right eye
    ex2 = x + cellSize - pad - e; ey2 = y + cellSize - pad - e; // bottom-right eye
  } else if (dx === -1) {                                     // eyes when facing left
    ex1 = x + pad;                ey1 = y + pad;              // top-left eye
    ex2 = x + pad;                ey2 = y + cellSize - pad - e; // bottom-left eye
  } else if (dy === -1) {                                     // eyes when facing up
    ex1 = x + pad;                ey1 = y + pad;              // top-left eye
    ex2 = x + cellSize - pad - e; ey2 = y + pad;              // top-right eye
  } else {                                                    // eyes when facing down
    ex1 = x + pad;                ey1 = y + cellSize - pad - e; // bottom-left eye
    ex2 = x + cellSize - pad - e; ey2 = y + cellSize - pad - e; // bottom-right eye
  }

  ctx.fillStyle = "#0b2b10";                                  // dark eye color
  ctx.fillRect(ex1 | 0, ey1 | 0, e, e);                       // draw first eye
  ctx.fillRect(ex2 | 0, ey2 | 0, e, e);                       // draw second eye

  ctx.restore();                                              // restore drawing state
}

function drawTailTip(gx, gy, prev, bodyColor) {               // draw tapered/darker tail end
  const x  = (gx * cellSize) | 0;                             // pixel x of tail
  const y  = (gy * cellSize) | 0;                             // pixel y of tail
  const dx = gx - prev.x;                                     // direction from previous to tail x
  const dy = gy - prev.y;                                     // direction from previous to tail y

  const s    = (cellSize * 0.8) | 0;                          // size of the tip square (80% of cell)
  const inner= (cellSize - s) | 0;                            // body part that touches previous
  const off  = ((cellSize - s) >> 1);                         // center offset for tip

  ctx.fillStyle = bodyColor;                                  // base body color to avoid gaps
  if (dx === 1)      ctx.fillRect(x,      y,      inner,  cellSize); // previous is left → fill left part
  else if (dx === -1)ctx.fillRect(x + s,  y,      inner,  cellSize); // previous is right→ fill right part
  else if (dy === 1) ctx.fillRect(x,      y,      cellSize, inner);  // previous is up   → fill top part
  else               ctx.fillRect(x,      y + s,  cellSize, inner);  // previous is down → fill bottom part

  ctx.fillStyle = "#2f8734";                                  // darker tip color
  if (dx === 1)      ctx.fillRect((x + inner), (y + off), s, s);     // tip at right side
  else if (dx === -1)ctx.fillRect(x,            (y + off), s, s);    // tip at left side
  else if (dy === 1) ctx.fillRect((x + off),    (y + inner), s, s);  // tip at bottom
  else               ctx.fillRect((x + off),    y,           s, s);  // tip at top
}

function drawPixelApple(gx, gy) {                              // draw an 8x8 pixel apple inside one cell
  const sprite = [                                             // '.' = transparent, 'R' = red pixel
    "........",
    "..RRRR..",
    ".RRRRRR.",
    ".RRRRRR.",
    ".RRRRRR.",
    "..RRRR..",
    "...RR...",
    "........",
  ];
  const colors = { R: "#ff2e2e" };                             // map letter → color

  const baseX = gx * cellSize;                                 // top-left pixel of the grid cell
  const baseY = gy * cellSize;                                 // top-left pixel of the grid cell
  const px = Math.floor(cellSize / 8);                         // size of one sprite pixel
  const off = Math.floor((cellSize - px * 8) / 2);             // center the 8x8 sprite

  for (let y = 0; y < 8; y++) {                                // each sprite row
    for (let x = 0; x < 8; x++) {                              // each sprite column
      const ch = sprite[y][x];                                 // character at (x,y)
      if (ch !== ".") {                                        // skip transparent pixels
        ctx.fillStyle = colors[ch];                            // choose color for this pixel
        ctx.fillRect(baseX + off + x * px,                     // draw the pixel square
                     baseY + off + y * px,
                     px, px);
      }
    }
  }

  const stemW = px;                                            // stem width
  const stemH = Math.max(px, Math.floor(px * 1.5));            // stem height
  const stemX = Math.floor(baseX + cellSize / 2 - stemW / 2);  // center stem horizontally
  const stemY = Math.floor(baseY + px * 0.3);                  // position stem near top
  ctx.fillStyle = "#5d3b1a";                                   // brown
  ctx.fillRect(stemX, stemY, stemW, stemH);                    // draw stem

  ctx.fillStyle = "#4caf50";                                   // green leaf
  ctx.fillRect(stemX + px, stemY, px, px);                     // tiny square leaf beside stem
}

// === FLASH MESSAGE STATE ====================================================

let flashUntil = 0, flashText = "", flashColor = "#4f8cff", flashSize = 32; // flash config

function flashMessage(text, ms = 900, color = "#4f8cff", size = 32) { // show temporary text
  flashText = text;                                           // what to show
  flashColor = color;                                         // glow color
  flashSize = size;                                           // font size
  flashUntil = performance.now() + ms;                        // timestamp when it should disappear
  draw();                                                     // render immediately
}

// === RENDER ONE FRAME =======================================================

function draw() {                                             // draw background, food, snake, border, overlays
  drawGrassBackground();                                      // pixel grass background

  if (food) drawPixelApple(food.x, food.y);                   // draw apple if exists

  const head = snake[0];                                      // first segment is the head
  let openMouth = false;                                      // default: closed mouth
  if (food) {                                                 // compute mouth open if food exists
    const dx = food.x - head.x;                               // horizontal distance in cells
    const dy = food.y - head.y;                               // vertical distance in cells
    const manhattan = Math.abs(dx) + Math.abs(dy);            // distance 1 = adjacent
    const facing = (Math.sign(dx) === dirX) && (Math.sign(dy) === dirY); // facing towards it?
    openMouth = (manhattan === 1) && facing;                  // open only if adjacent + facing
  }

  for (let i = 0; i < snake.length; i++) {                    // draw every snake segment
    const seg = snake[i];                                     // current segment
    if (i === 0) {                                            // head
      drawHeadWithEyes(seg.x, seg.y, dirX, dirY, openMouth);  // head with eyes + optional mouth
    } else if (i === snake.length - 1 && snake.length > 1) {  // tail (last segment) if length > 1
      const bodyColor = (i % 2 === 0) ? "#3fa043" : "#2f8734"; // alternate body color pattern
      drawTailTip(seg.x, seg.y, snake[i - 1], bodyColor);     // tapered tail that touches previous
    } else {                                                  // body segment
      drawCell(seg.x, seg.y, (i % 2 === 0) ? "#3fa043" : "#2f8734"); // alternating body squares
    }
  }

  ctx.strokeStyle = "#0400ff";                                // blue border color
  ctx.lineWidth = 6;                                          // border thickness
  ctx.strokeRect(0, 0, canvas.width, canvas.height);          // draw border around playfield

  if (!alive) {                                               // game-over overlay
    ctx.fillStyle = "rgba(0,0,0,0.5)";                        // semi-transparent black
    ctx.fillRect(0, 0, canvas.width, canvas.height);          // cover the playfield
    drawGlowingText("GAME OVER!", canvas.height / 2 - 10, "#ff0000", 30); // big title
    drawGlowingText("Press R to Restart", canvas.height / 2 + 24, "#ff0000", 20); // hint
  }

  if (paused) {                                               // paused overlay
    ctx.fillStyle = "rgba(0,0,0,0.35)";                       // light dim
    ctx.fillRect(0, 0, canvas.width, canvas.height);          // cover the playfield
    drawGlowingText("PAUSED — press P/Space", canvas.height / 2, "#ffcc00", 26); // pause text
  }

  if (performance.now() < flashUntil) {                       // temporary “flash” message (e.g., start)
    drawGlowingText(flashText, canvas.height / 2 - 80, flashColor, flashSize); // draw it near top
  }
}

// === GAME TICK (UPDATE) =====================================================

function tick() {                                             // one step of game logic
  if (!alive || paused) return;                               // skip if dead or paused

  const newHead = { x: snake[0].x + dirX, y: snake[0].y + dirY }; // move head by current direction

  if (newHead.x < 0 || newHead.x >= GRID ||                   // border collision X
      newHead.y < 0 || newHead.y >= GRID) {                   // border collision Y
    alive = false;                                            // player is dead
    stopLoop();                                               // stop updates
    draw();                                                   // show game-over overlay
    return;                                                   // stop this tick
  }

  const hitSelf = snake.some(seg => seg.x === newHead.x && seg.y === newHead.y); // head into body?
  if (hitSelf) {                                              // if yes, game over
    alive = false;                                            // dead
    stopLoop();                                               // stop updates
    draw();                                                   // show overlay
    return;                                                   // stop this tick
  }

  const ateFood = (newHead.x === food.x && newHead.y === food.y); // check apple eaten this step

  snake.unshift(newHead);                                     // add new head at front (movement)

  if (ateFood) {                                              // if apple eaten
    shake();                                                  // tiny screen shake
    score += 1;                                               // increment score
    scoreEl.textContent = "Score: " + score;                  // update score UI
    scoreEl.classList.remove("pop"); void scoreEl.offsetWidth; scoreEl.classList.add("pop"); // retrigger CSS pop
    spawnFood();                                              // place new apple
    // no tail removal → snake grows by one
  } else {
    snake.pop();                                              // normal move: remove last tail segment
  }

  draw();                                                     // redraw frame
}

// === FOOD PLACEMENT =========================================================

function spawnFood() {                                        // choose random empty cell for apple
  while (true) {                                              // try until we find a free cell
    const fx = Math.floor(Math.random() * GRID);              // random x in [0,GRID)
    const fy = Math.floor(Math.random() * GRID);              // random y in [0,GRID)
    const onSnake = snake.some(seg => seg.x === fx && seg.y === fy); // check collision with snake
    if (!onSnake) { food = { x: fx, y: fy }; break; }         // if free, set food and exit
  }
}

// === SCREEN SHAKE (CSS class on #stage) =====================================

function shake(ms = 180) {                                    // short shake animation
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // respect accessibility
  stage.classList.remove("shake");                            // remove class to reset animation
  void stage.offsetWidth;                                     // force reflow (restart animation)
  stage.classList.add("shake");                               // add class to start shake
  setTimeout(() => stage.classList.remove("shake"), ms);      // remove class after ms
}

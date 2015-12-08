var buttons = {};

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
ctx.lineWidth = 1;

// 2D array, holding all cells
var cells = [];

// game layout
var cellsize = 7;
var grid = true;

// number of cells in each direction that are tracked off screen
var offscreen = 10;

// calculating FPS
var fps = 20;
var gameInterval;
var actualfps = fps;
var lastTick = Date.now();
var fpsHistory = [];

/**
 * A Cell object
 * @param {Number} x - The x-coordinate of this cell
 * @param {Number} y - The y-coordinate of this cell
 */
var Cell = function(x, y) {
  this.x = x;
  this.y = y;
  this.active = false; // Dead or Alive
};

/**
 * Calculate Moore Neighborhood of this cell
 * @returns {Number} count
 */
Cell.prototype.countNeighbours = function() {
  var count = 0;
  for (var x = -1; x <= 1; x++) {
    for (var y = -1; y <= 1; y++) {
      var cx = x + this.x;
      var cy = y + this.y;
      if (cx >= 0 && cx < cells.length && cy >= 0 && cy < cells[0].length) {
        var cell = cells[cx][cy];
        count += cell !== this && cell.active;
      }
    }
  }
  return count;
};

/**
 * Toggle the 'active' state of this cell
 */
Cell.prototype.toggle = function() {
  ctx.fillStyle = this.active ? "#fff" : "#000";
  var x = grid + (this.x - offscreen) * cellsize;
  var y = grid + (this.y - offscreen) * cellsize;
  var width = cellsize - grid;
  var height = cellsize - grid;
  ctx.fillRect(x, y, width, height);
  this.active = !this.active;
};

/**
 * Apply the game rules to check whether this cell will toggle in the next generation
 * @returns {boolean} - will toggle
 */
Cell.prototype.willToggle = function() {
  var neighbours = this.countNeighbours();
  if (this.active) {
    // live cell with too few or too many neighbours
    return neighbours < 2 || neighbours > 3;
  } else {
    // dead cell becomes live cell
    return neighbours === 3;
  }
};

/**
 * get the underlying Cell by canvas coordinates
 * @param  {Number} x - The pixel x-coordinate on the canvas
 * @param  {Number} y - The pixel y-coordinate on the canvas
 * @returns {Cell} - The underlying Cell
 */
function pointToCell(x, y) {
  var cx = Math.floor((x - canvas.offsetLeft) / cellsize);
  var cy = Math.floor((y - canvas.offsetTop) / cellsize);
  return cells[cx + offscreen][cy + offscreen];
}

/**
 * Draws the grid (i.e. cell borders) onto the canvas
 */
function drawGrid() {
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  for (var lx = 0; lx < canvas.width / cellsize; lx++) {
    ctx.moveTo(lx * cellsize + 0.5, 0);
    ctx.lineTo(lx * cellsize + 0.5, canvas.height);
  }
  for (var ly = 0; ly < canvas.height / cellsize; ly++) {
    ctx.moveTo(0, ly * cellsize + 0.5);
    ctx.lineTo(canvas.width, ly * cellsize + 0.5);
  }
  ctx.stroke();
}

/**
 * Create all the cells, according to the canvas size
 */
function createGame() {
  for (var ix = 0; ix < canvas.width / cellsize + 2 * offscreen; ix++) {
    for (var iy = 0; iy < canvas.height / cellsize + 2 * offscreen; iy++) {
      cells[ix] = cells[ix] || [];
      cells[ix][iy] = new Cell(ix, iy);
    }
  }
}

/**
 * Calculate the current FPS
 * uses the average duration of the last 10 frames
 */
function calcFPS() {
  fpsHistory.push(Date.now() - lastTick);
  // limit history to 10 entries
  if (fpsHistory.length > 10) {
    fpsHistory.shift();
  }

  var sum = 0;
  fpsHistory.forEach(function(f) {
    sum += f;
  });

  // calculate average
  actualfps = Math.round(1000 / (sum / fpsHistory.length));
  lastTick = Date.now();
}

/**
 * Proceed on to the next generation
 */
function tick() {
  var toggles = [];

  // get list of cells that will toggle in the next generation
  for (var cx = 0; cx < cells.length; cx++) {
    for (var cy = 0; cy < cells[cx].length; cy++) {
      var cell = cells[cx][cy];
      if (cell.willToggle()) {
        toggles.push(cell);
      }
    }
  }

  // toggle the cells we stored above
  toggles.forEach(function(tcell) {
    tcell.toggle();
  });

  // calculate FPS
  calcFPS();
}


/**
 * Start the game
 */
function play() {
  // if the game is not running, create a new Interval that calls `tick()`
  // the interval time is our target FPS
  if (!gameInterval) {
    gameInterval = setInterval(tick, 1000 / fps);
  }
  // update button text
  buttons.play.textContent = "HALT";
}

/**
 * Pauses the currently running game
 */
function pause() {
  // clears the running interval, so `tick()` will no longer be called automatically
  clearInterval(gameInterval);
  gameInterval = null;
  // update button text
  buttons.play.textContent = "PLAY";
}

/**
 * Toggle play state between `play()` and `pause()`
 */
function playpause() {
  if (gameInterval) {
    pause();
  } else {
    play();
  }
}

/**
 * set the new target FPS
 */
function setFPS(newfps) {
  fps = newfps;
  // clear FPS history
  fpsHistory = [];

  // restart game with new interval
  if (gameInterval) {
    pause();
    play();
  }
}

document.addEventListener("DOMContentLoaded", function(event) {
  buttons.play = document.querySelector("#playpause");
  buttons.next = document.querySelector("#next");
  buttons.targetfps = document.querySelector("#targetfps");
  buttons.actualfps = document.querySelector("#actualfps");

  buttons.play.onclick = playpause;
  buttons.next.onclick = tick;
  buttons.targetfps.onchange = function(e) {
    setFPS(e.target.value);
  };

  var content = document.querySelector("#content");
  content.appendChild(canvas);

  canvas.width = content.clientWidth;
  canvas.height = content.clientHeight;

  createGame();
  if (grid) {
    drawGrid();
  }

  // update the actual FPS display
  setInterval(function() {
    buttons.actualfps.value = actualfps;
  }, 500);

  canvas.addEventListener("click", function(evt) {
    var cell = pointToCell(evt.layerX, evt.layerY);
    cell.toggle();
    console.log(cell);
  }, false);
});
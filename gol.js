var buttons = {};

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
ctx.lineWidth = 1;

var cells = [];
var cellsize = 15;
var grid = true;
var gameInterval;

// number of cells in each direction that are tracked off screen
var offscreen = 10;

var fps = 20;
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
  this.active = false;
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
  ctx.strokeStyle = "#888";
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

function createGame() {
  for (var ix = 0; ix < canvas.width / cellsize + 2 * offscreen; ix++) {
    for (var iy = 0; iy < canvas.height / cellsize + 2 * offscreen; iy++) {
      cells[ix] = cells[ix] || [];
      cells[ix][iy] = new Cell(ix, iy);
    }
  }
}

function calcFPS() {
  fpsHistory.push(Date.now() - lastTick);
  if (fpsHistory.length > 10) {
    fpsHistory.shift();
  }
  var sum = 0;
  fpsHistory.forEach(function(f) {
    sum += f;
  });
  actualfps = Math.round(1000 / (sum / fpsHistory.length));
  lastTick = Date.now();
}

function tick() {
  var toggles = [];
  for (var cx = 0; cx < cells.length; cx++) {
    for (var cy = 0; cy < cells[cx].length; cy++) {
      var cell = cells[cx][cy];
      var neighbours = cell.countNeighbours();
      if (cell.active) {
        if (neighbours < 2 || neighbours > 3) {
          // live cell with too few or too many neighbours
          toggles.push(cell);
        }
      } else if (neighbours === 3) {
        // dead cell becomes live cell
        toggles.push(cell);
      }
    }
  }
  toggles.forEach(function(tcell) {
    tcell.toggle();
  });

  calcFPS();
}

function drawFPS() {
  buttons.actualfps.value = actualfps;
}

function play() {
  if (!gameInterval) {
    gameInterval = setInterval(tick, 1000 / fps);
  }
  buttons.play.textContent = "HALT";
}

function pause() {
  clearInterval(gameInterval);
  gameInterval = null;
  buttons.play.textContent = "PLAY";
}

function playpause() {
  if (gameInterval) {
    pause();
  } else {
    play();
  }
}

function setFPS(newfps) {
  fps = newfps;
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

  setInterval(drawFPS, 500);

  canvas.addEventListener("click", function(evt) {
    var cell = pointToCell(evt.clientX, evt.clientY);
    cell.toggle();
    console.log(cell);
  }, false);
});
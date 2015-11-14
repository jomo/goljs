var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
ctx.lineWidth = 1;

var cells = [];
var cellsize = 10;
var gameInterval;

var fps = 20;
var actualfps;
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
  ctx.fillRect(1 + this.x * cellsize, 1 + this.y * cellsize, 9, 9);
  this.active = !this.active;
};

/**
 * get the underlying Cell by canvas coordinates
 * @param  {Number} x - The pixel x-coordinate on the canvas
 * @param  {Number} y - The pixel y-coordinate on the canvas
 * @returns {Cell} - The underlying Cell
 */
function pointToCell(x, y) {
  var cx = Math.floor(x / cellsize);
  var cy = Math.floor(y / cellsize);
  return cells[cx][cy];
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
  for (var ix = 0; ix < canvas.width / cellsize; ix++) {
    for (var iy = 0; iy < canvas.height / cellsize; iy++) {
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
  ctx.font = "48px Sans-Serif";
  ctx.fillStyle = "#000";
  ctx.fillRect(canvas.width - 110, 10, 100, 50);
  ctx.fillStyle = "#0f0";
  ctx.fillText(actualfps, canvas.width - 100, 50);
}

function play() {
  if (!gameInterval) {
    gameInterval = setInterval(tick, 1000 / fps);
  }
}

function pause() {
  clearInterval(gameInterval);
  gameInterval = null;
}

function setFPS(newfps) {
  fps = newfps;
  fpsHistory = [];
  pause();
  play();
}

document.addEventListener("DOMContentLoaded", function(event) {
  document.body.appendChild(canvas);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  createGame();
  drawGrid();

  setInterval(drawFPS, 500);

  play();

  canvas.addEventListener("click", function(evt) {
    var cell = pointToCell(evt.clientX, evt.clientY);
    cell.toggle();
    console.log(cell);
  }, false);
});
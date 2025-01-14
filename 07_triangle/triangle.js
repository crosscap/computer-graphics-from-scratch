// ======================================================================
//  Low-level canvas access.
// ======================================================================

var canvas = document.getElementById("canvas");
var canvas_context = canvas.getContext("2d");
var canvas_buffer = canvas_context.getImageData(0, 0, canvas.width, canvas.height);
var canvas_pitch = canvas_buffer.width * 4;


// The PutPixel() function.
var PutPixel = function(x, y, color) {
  x = canvas.width/2 + Math.floor(x);
  y = canvas.height/2 - Math.floor(y) - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return;
  }

  var offset = 4*x + canvas_pitch*y;
  canvas_buffer.data[offset++] = color[0];
  canvas_buffer.data[offset++] = color[1];
  canvas_buffer.data[offset++] = color[2];
  canvas_buffer.data[offset++] = 255; // Alpha = 255 (full opacity)
}


// Displays the contents of the offscreen buffer into the canvas.
var UpdateCanvas = function() {
  canvas_context.putImageData(canvas_buffer, 0, 0);
}


// ======================================================================
//  Rasterization code.
// ======================================================================

// A Point.
var Pt = function(x, y) {
  if (!(this instanceof Pt)) { return new Pt(x, y); }

  this.x = x;
  this.y = y;
}


var Interpolate = function(i0, d0, i1, d1) {
  if (i0 == i1) {
    return [d0];
  }

  var values = [];
  var a = (d1 - d0) / (i1 - i0);
  var d = d0;
  for (var i = i0; i <= i1; i++) {
    values.push(d);
    d += a;
  }

  return values;
}


var DrawLine = function(p0, p1, color) {
  var dx = p1.x - p0.x, dy = p1.y - p0.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    // The line is horizontal-ish. Make sure it's left to right.
    if (dx < 0) { var swap = p0; p0 = p1; p1 = swap; }

    // Compute the Y values and draw.
    var ys = Interpolate(p0.x, p0.y, p1.x, p1.y);
    for (var x = p0.x; x <= p1.x; x++) {
      PutPixel(x, ys[(x - p0.x) | 0], color);
    }
  } else {
    // The line is verical-ish. Make sure it's bottom to top.
    if (dy < 0) { var swap = p0; p0 = p1; p1 = swap; }

    // Compute the X values and draw.
    var xs = Interpolate(p0.y, p0.x, p1.y, p1.x);
    for (var y = p0.y; y <= p1.y; y++) {
      PutPixel(xs[(y - p0.y) | 0], y, color);
    }
  }
}


var DrawWireframeTriangle = function(p0, p1, p2, color) {
  DrawLine(p0, p1, color);
  DrawLine(p1, p2, color);
  DrawLine(p0, p2, color);
}


var DrawFilledTriangle = function(p0, p1, p2, color) {
  // Sort the points from bottom to top.
  if (p1.y < p0.y) { var swap = p0; p0 = p1; p1 = swap; }
  if (p2.y < p0.y) { var swap = p0; p0 = p2; p2 = swap; }
  if (p2.y < p1.y) { var swap = p1; p1 = p2; p2 = swap; }

  // Compute X coordinates of the edges.
  var x01 = Interpolate(p0.y, p0.x, p1.y, p1.x);
  var x12 = Interpolate(p1.y, p1.x, p2.y, p2.x);
  var x02 = Interpolate(p0.y, p0.x, p2.y, p2.x);

  // Merge the two short sides.
  x01.pop();
  var x012 = x01.concat(x12);

  // Determine which is left and which is right.
  var x_left, x_right;
  var m = (x02.length/2) | 0;
  if (x02[m] < x012[m]) {
    x_left = x02;
    x_right = x012;
  } else {
    x_left = x012;
    x_right = x02;
  }

  // Draw horizontal segments.
  for (var y = p0.y; y <= p2.y; y++) {
    for (var x = x_left[y - p0.y]; x <= x_right[y - p0.y]; x++) {
      PutPixel(x, y, color);
    }
  }
}

var p0 = Pt(-200, -250);
var p1 = Pt(200, 50);
var p2 = Pt(20, 250);

DrawFilledTriangle(p0, p1, p2, [0, 255, 0]);
DrawWireframeTriangle(p0, p1, p2, [0, 0, 0]);

UpdateCanvas();

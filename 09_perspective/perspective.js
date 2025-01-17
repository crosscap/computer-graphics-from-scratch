// ======================================================================
//  Low-level canvas access.
// ======================================================================

var canvas = document.getElementById("perspective");
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
//  Linear algebra and helpers.
// ======================================================================

// Computes k * vec.
var Multiply = function(k, vec) {
  return [k*vec[0], k*vec[1], k*vec[2]];
}


// ======================================================================
//  Rasterization code.
// ======================================================================

// Scene setup.
var viewport_size = 1;
var projection_plane_z = 1;


// A Point.
var Pt = function(x, y, h) {
  if (!(this instanceof Pt)) { return new Pt(x, y, h); }

  this.x = x;
  this.y = y;
  this.h = h;
}


// A 3D vertex.
var Vertex = function(x, y, z) {
  if (!(this instanceof Vertex)) { return new Vertex(x, y, z); }

  this.x = x;
  this.y = y;
  this.z = z;
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


// Converts 2D viewport coordinates to 2D canvas coordinates.
var ViewportToCanvas = function(p2d) {
  return Pt(p2d.x * canvas.width / viewport_size,
	    p2d.y * canvas.height / viewport_size);
}


var ProjectVertex = function(v) {
  return ViewportToCanvas(Pt(v.x * projection_plane_z / v.z,
			     v.y * projection_plane_z / v.z));
}


var vA = Vertex(-2, -0.5, 5);
var vB = Vertex(-2, 0.5, 5);
var vC = Vertex(-1, 0.5, 5);
var vD = Vertex(-1, -0.5, 5);

var vAb = Vertex(-2, -0.5, 6);
var vBb = Vertex(-2, 0.5, 6);
var vCb = Vertex(-1, 0.5, 6);
var vDb = Vertex(-1, -0.5, 6);

var RED = [255, 0, 0];
var GREEN = [0, 255, 0];
var BLUE = [0, 0, 255];

DrawLine(ProjectVertex(vA), ProjectVertex(vB), BLUE);
DrawLine(ProjectVertex(vB), ProjectVertex(vC), BLUE);
DrawLine(ProjectVertex(vC), ProjectVertex(vD), BLUE);
DrawLine(ProjectVertex(vD), ProjectVertex(vA), BLUE);

DrawLine(ProjectVertex(vAb), ProjectVertex(vBb), RED);
DrawLine(ProjectVertex(vBb), ProjectVertex(vCb), RED);
DrawLine(ProjectVertex(vCb), ProjectVertex(vDb), RED);
DrawLine(ProjectVertex(vDb), ProjectVertex(vAb), RED);

DrawLine(ProjectVertex(vA), ProjectVertex(vAb), GREEN);
DrawLine(ProjectVertex(vB), ProjectVertex(vBb), GREEN);
DrawLine(ProjectVertex(vC), ProjectVertex(vCb), GREEN);
DrawLine(ProjectVertex(vD), ProjectVertex(vDb), GREEN);

UpdateCanvas();

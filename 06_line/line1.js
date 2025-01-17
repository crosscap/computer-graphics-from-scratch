// ======================================================================
//  Low-level canvas access.
// ======================================================================

var canvas = document.getElementById("line1");
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
var DrawLineBroken = function(x0, y0, x1, y1, color) {
  var a = (y1 - y0) / (x1 - x0);
  var y = y0;
  for (var x = x0; x <= x1; x++) {
    PutPixel(x, y, color);
    y += a;
  }
}

DrawLineBroken(-200, -100, 240, 120, [0, 0, 0]);
DrawLineBroken(-50, -200, 60, 240, [0, 0, 0]);


UpdateCanvas();

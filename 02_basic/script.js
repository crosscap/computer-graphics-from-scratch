// ======================================================================
//  Low-level canvas access.
// ======================================================================

var canvas = document.getElementById("canvas");
var canvas_context = canvas.getContext("2d");
var canvas_buffer = canvas_context.getImageData(0, 0, canvas.width, canvas.height);
var canvas_pitch = canvas_buffer.width * 4;

// The PutPixel() function.
var PutPixel = function (x, y, color) {
  x = canvas.width / 2 + x;
  y = canvas.height / 2 - y - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return;
  }

  var offset = 4 * x + canvas_pitch * y;
  canvas_buffer.data[offset++] = color[0];
  canvas_buffer.data[offset++] = color[1];
  canvas_buffer.data[offset++] = color[2];
  canvas_buffer.data[offset++] = 255; // Alpha = 255 (full opacity)
};

// Displays the contents of the offscreen buffer into the canvas.
var UpdateCanvas = function () {
  canvas_context.putImageData(canvas_buffer, 0, 0);
};

// ======================================================================
//  Linear algebra and helpers.
// ======================================================================

// Dot product of two 3D vectors.
var DotProduct = function (v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
};

// Computes v1 - v2.
var Subtract = function (v1, v2) {
  return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
};

// ======================================================================
//  A very basic raytracer.
// ======================================================================

// A Sphere.
var Sphere = function (center, radius, color) {
  this.center = center;
  this.radius = radius;
  this.color = color;
};

// Scene setup.
var viewport_size = 1;
var projection_plane_z = 1;
var camera_position = [0, 0, 0];
var background_color = [255, 255, 255];
var spheres = [
  new Sphere([0, -1, 3], 1, [255, 0, 0]),
  new Sphere([2, 0, 4], 1, [0, 0, 255]),
  new Sphere([-2, 0, 4], 1, [0, 255, 0]),
];

// Converts 2D canvas coordinates to 3D viewport coordinates.
var CanvasToViewport = function (p2d) {
  return [
    (p2d[0] * viewport_size) / canvas.width,
    (p2d[1] * viewport_size) / canvas.height,
    projection_plane_z,
  ];
};

// Computes the intersection of a ray and a sphere. Returns the values
// of t for the intersections.
var IntersectRaySphere = function (origin, direction, sphere) {
  var oc = Subtract(origin, sphere.center);

  var k1 = DotProduct(direction, direction);
  var k2 = 2 * DotProduct(oc, direction);
  var k3 = DotProduct(oc, oc) - sphere.radius * sphere.radius;

  var discriminant = k2 * k2 - 4 * k1 * k3;
  if (discriminant < 0) {
    return [Infinity, Infinity];
  }

  var t1 = (-k2 + Math.sqrt(discriminant)) / (2 * k1);
  var t2 = (-k2 - Math.sqrt(discriminant)) / (2 * k1);
  return [t1, t2];
};

// Traces a ray against the set of spheres in the scene.
var TraceRay = function (origin, direction, min_t, max_t) {
  var closest_t = Infinity;
  var closest_sphere = null;

  for (var i = 0; i < spheres.length; i++) {
    var ts = IntersectRaySphere(origin, direction, spheres[i]);
    if (ts[0] < closest_t && min_t < ts[0] && ts[0] < max_t) {
      closest_t = ts[0];
      closest_sphere = spheres[i];
    }
    if (ts[1] < closest_t && min_t < ts[1] && ts[1] < max_t) {
      closest_t = ts[1];
      closest_sphere = spheres[i];
    }
  }

  if (closest_sphere == null) {
    return background_color;
  }

  return closest_sphere.color;
};

//
// Main loop.
//
for (var x = -canvas.width / 2; x < canvas.width / 2; x++) {
  for (var y = -canvas.height / 2; y < canvas.height / 2; y++) {
    var direction = CanvasToViewport([x, y]);
    var color = TraceRay(camera_position, direction, 1, Infinity);
    PutPixel(x, y, color);
  }
}

UpdateCanvas();

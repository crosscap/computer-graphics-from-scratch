// ======================================================================
//  Low-level canvas access.
// ======================================================================

var canvas = document.getElementById("transform");
var canvas_context = canvas.getContext("2d");
var canvas_buffer = canvas_context.getImageData(0, 0, canvas.width, canvas.height);
var canvas_pitch = canvas_buffer.width * 4;

// The PutPixel() function.
var PutPixel = function (x, y, color) {
  x = canvas.width / 2 + (x | 0);
  y = canvas.height / 2 - (y | 0) - 1;

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
//  Data model.
// ======================================================================

// A Point.
var Pt = function (x, y, h) {
  if (!(this instanceof Pt)) {
    return new Pt(x, y, h);
  }

  this.x = x;
  this.y = y;
  this.h = h;
};

// A 3D vertex.
var Vertex = function (x, y, z) {
  if (!(this instanceof Vertex)) {
    return new Vertex(x, y, z);
  }

  this.x = x;
  this.y = y;
  this.z = z;
};

// A 4D vertex (a 3D vertex in homogeneous coordinates).
var Vertex4 = function (x, y, z, w) {
  if (!(this instanceof Vertex4)) {
    return new Vertex4(x, y, z, w);
  }

  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
};

// A 4x4 matrix.
var Mat4x4 = function (data) {
  if (!(this instanceof Mat4x4)) {
    return new Mat4x4(data);
  }

  this.data = data;
};

var Identity4x4 = Mat4x4([
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]);

// A Triangle.
var Triangle = function (v0, v1, v2, color) {
  if (!(this instanceof Triangle)) {
    return new Triangle(v0, v1, v2, color);
  }

  this.v0 = v0;
  this.v1 = v1;
  this.v2 = v2;
  this.color = color;
};

// A Model.
var Model = function (vertexes, triangles) {
  if (!(this instanceof Model)) {
    return new Model(vertexes, triangles);
  }

  this.vertexes = vertexes;
  this.triangles = triangles;
};

// An Instance.
var Instance = function (model, position, orientation, scale) {
  if (!(this instanceof Instance)) {
    return new Instance(model, position, orientation, scale);
  }

  this.model = model;
  this.position = position;
  this.orientation = orientation || Identity4x4;
  this.scale = scale || 1.0;

  this.transform = MultiplyMM4(
    MakeTranslationMatrix(this.position),
    MultiplyMM4(this.orientation, MakeScalingMatrix(this.scale))
  );
};

// The Camera.
var Camera = function (position, orientation) {
  if (!(this instanceof Camera)) {
    return new Camera(position, orientation);
  }

  this.position = position;
  this.orientation = orientation;
};

// ======================================================================
//  Linear algebra and helpers.
// ======================================================================

// Computes k * vec.
var Multiply = function (k, vec) {
  return Vertex(k * vec.x, k * vec.y, k * vec.z);
};

// Computes v1 + v2.
var Add = function (v1, v2) {
  return Vertex(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
};

// Makes a transform matrix for a rotation around the OY axis.
var MakeOYRotationMatrix = function (degrees) {
  var cos = Math.cos((degrees * Math.PI) / 180.0);
  var sin = Math.sin((degrees * Math.PI) / 180.0);

  return Mat4x4([
    [cos, 0, -sin, 0],
    [0, 1, 0, 0],
    [sin, 0, cos, 0],
    [0, 0, 0, 1],
  ]);
};

// Makes a transform matrix for a translation.
var MakeTranslationMatrix = function (translation) {
  return Mat4x4([
    [1, 0, 0, translation.x],
    [0, 1, 0, translation.y],
    [0, 0, 1, translation.z],
    [0, 0, 0, 1],
  ]);
};

// Makes a transform matrix for a scaling.
var MakeScalingMatrix = function (scale) {
  return Mat4x4([
    [scale, 0, 0, 0],
    [0, scale, 0, 0],
    [0, 0, scale, 0],
    [0, 0, 0, 1],
  ]);
};

// Multiplies a 4x4 matrix and a 4D vector.
var MultiplyMV = function (mat4x4, vec4) {
  var result = [0, 0, 0, 0];
  var vec = [vec4.x, vec4.y, vec4.z, vec4.w];

  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      result[i] += mat4x4.data[i][j] * vec[j];
    }
  }

  return Vertex4(result[0], result[1], result[2], result[3]);
};

// Multiplies two 4x4 matrices.
var MultiplyMM4 = function (matA, matB) {
  var result = Mat4x4([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);

  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      for (var k = 0; k < 4; k++) {
        result.data[i][j] += matA.data[i][k] * matB.data[k][j];
      }
    }
  }

  return result;
};

// Transposes a 4x4 matrix.
var Transposed = function (mat) {
  var result = Mat4x4([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      result.data[i][j] = mat.data[j][i];
    }
  }
  return result;
};

// ======================================================================
//  Rasterization code.
// ======================================================================

// Scene setup.
var viewport_size = 1;
var projection_plane_z = 1;

var Interpolate = function (i0, d0, i1, d1) {
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
};

var DrawLine = function (p0, p1, color) {
  var dx = p1.x - p0.x,
    dy = p1.y - p0.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    // The line is horizontal-ish. Make sure it's left to right.
    if (dx < 0) {
      var swap = p0;
      p0 = p1;
      p1 = swap;
    }

    // Compute the Y values and draw.
    var ys = Interpolate(p0.x, p0.y, p1.x, p1.y);
    for (var x = p0.x; x <= p1.x; x++) {
      PutPixel(x, ys[(x - p0.x) | 0], color);
    }
  } else {
    // The line is verical-ish. Make sure it's bottom to top.
    if (dy < 0) {
      var swap = p0;
      p0 = p1;
      p1 = swap;
    }

    // Compute the X values and draw.
    var xs = Interpolate(p0.y, p0.x, p1.y, p1.x);
    for (var y = p0.y; y <= p1.y; y++) {
      PutPixel(xs[(y - p0.y) | 0], y, color);
    }
  }
};

var DrawWireframeTriangle = function (p0, p1, p2, color) {
  DrawLine(p0, p1, color);
  DrawLine(p1, p2, color);
  DrawLine(p0, p2, color);
};

// Converts 2D viewport coordinates to 2D canvas coordinates.
var ViewportToCanvas = function (p2d) {
  return Pt(
    ((p2d.x * canvas.width) / viewport_size) | 0,
    ((p2d.y * canvas.height) / viewport_size) | 0
  );
};

var ProjectVertex = function (v) {
  return ViewportToCanvas(Pt((v.x * projection_plane_z) / v.z, (v.y * projection_plane_z) / v.z));
};

var RenderTriangle = function (triangle, projected) {
  DrawWireframeTriangle(
    projected[triangle.v0],
    projected[triangle.v1],
    projected[triangle.v2],
    triangle.color
  );
};

var RenderModel = function (model, transform) {
  var projected = [];
  for (var i = 0; i < model.vertexes.length; i++) {
    var vertex = model.vertexes[i];
    var vertexH = Vertex4(vertex.x, vertex.y, vertex.z, 1);
    projected.push(ProjectVertex(MultiplyMV(transform, vertexH)));
  }
  for (var i = 0; i < model.triangles.length; i++) {
    RenderTriangle(model.triangles[i], projected);
  }
};

var RenderScene = function (camera, instances) {
  var cameraMatrix = MultiplyMM4(
    Transposed(camera.orientation),
    MakeTranslationMatrix(Multiply(-1, camera.position))
  );

  for (var i = 0; i < instances.length; i++) {
    var transform = MultiplyMM4(cameraMatrix, instances[i].transform);
    RenderModel(instances[i].model, transform);
  }
};

var vertexes = [
  Vertex(1, 1, 1),
  Vertex(-1, 1, 1),
  Vertex(-1, -1, 1),
  Vertex(1, -1, 1),
  Vertex(1, 1, -1),
  Vertex(-1, 1, -1),
  Vertex(-1, -1, -1),
  Vertex(1, -1, -1),
];

var RED = [255, 0, 0];
var GREEN = [0, 255, 0];
var BLUE = [0, 0, 255];
var YELLOW = [255, 255, 0];
var PURPLE = [255, 0, 255];
var CYAN = [0, 255, 255];

var triangles = [
  Triangle(0, 1, 2, RED),
  Triangle(0, 2, 3, RED),
  Triangle(4, 0, 3, GREEN),
  Triangle(4, 3, 7, GREEN),
  Triangle(5, 4, 7, BLUE),
  Triangle(5, 7, 6, BLUE),
  Triangle(1, 5, 6, YELLOW),
  Triangle(1, 6, 2, YELLOW),
  Triangle(4, 5, 1, PURPLE),
  Triangle(4, 1, 0, PURPLE),
  Triangle(2, 6, 7, CYAN),
  Triangle(2, 7, 3, CYAN),
];

var cube = Model(vertexes, triangles);

var instances = [
  Instance(cube, Vertex(-1.5, 0, 7), Identity4x4, 0.75),
  Instance(cube, Vertex(1.25, 2.5, 7.5), MakeOYRotationMatrix(195)),
];

var camera = Camera(Vertex(-3, 1, 2), MakeOYRotationMatrix(-30));

RenderScene(camera, instances);

UpdateCanvas();

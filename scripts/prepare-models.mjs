// Turns the source download in models-raw/ into the Hero Timepiece model the
// site ships: public/models/hero-timepiece.glb and a lighter phone variant.
//
//   npm run models
//
// It runs offline, on a developer's machine. Its outputs are committed, so
// neither the browser nor the Vercel build ever runs it.
//
// What scene code may rely on in the prepared model is written down in
// src/components/three/hero-model.ts, and checked by the test beside it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Document, Logger, NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  KHRMaterialsSpecular,
  KHRMaterialsTransmission,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import { reorder, simplify, weld } from "@gltf-transform/functions";
import { unzipSync } from "fflate";
import {
  MeshoptDecoder,
  MeshoptEncoder,
  MeshoptSimplifier,
} from "meshoptimizer";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The only download this script opens. models-raw/ also holds a "Luxury
// Wristwatch" that copies a real brand's watch; it must never be listed here.
const SOURCE = {
  archive: "models-raw/stainless_steel_wristwatch_analog_watch.zip",
  title: "Stainless Steel Wristwatch Analog Watch",
  page: "https://sketchfab.com/3d-models/stainless-steel-wristwatch-analog-watch-029a0b692d474e55ac29292fc30fb153",
};

const OUTPUT = {
  main: "public/models/hero-timepiece.glb",
  phone: "public/models/hero-timepiece-phone.glb",
};

const KB = 1024;
const BUDGET = { main: 1500 * KB, phone: 700 * KB };

// The phone variant keeps this share of each part's triangles, as long as
// the surface moves by no more than PHONE_ERROR of the part's size.
const PHONE_RATIO = 0.4;
const PHONE_ERROR = 0.002;

// The seven parts, front to back along the watch's axis. Keep in step with
// src/components/three/hero-model.ts; its test fails if the two drift apart.
const PARTS = [
  "crystal",
  "hands",
  "dial",
  "dial-base",
  "case",
  "crown-and-pushers",
  "bracelet",
];

// Every mesh in the source file, by the name its author gave it, and the one
// part it belongs to. The author's names are loose: "WatchDial" is the bezel
// and "Watch_Crown2" is the post the hands turn on.
const SOURCE_MESHES = {
  Glass1_blinn1_0: "crystal",
  pPlane8_lambert3_0: "hands", // all three hands and their cap, fused
  Watch_Crown2_lambert3_0: "hands", // the centre post
  group2_pCube27_lambert3_0: "dial", // hour markers and minute track
  WatchDialBase_lambert4_0: "dial-base",
  pPlane18_lambert3_0: "case", // case body and lugs
  WatchDial_lambert3_0: "case", // bezel
  Watch_Crown_lambert3_0: "crown-and-pushers",
  pCylinder4_lambert3_0: "crown-and-pushers",
  Watch_Crown1_lambert3_0: "crown-and-pushers",
  Cube_44_lambert3_0: "bracelet",
};

// The two source meshes behind the hands part, which is rebuilt, not merged.
const FUSED_HANDS = "pPlane8_lambert3_0";
const HAND_POST = "Watch_Crown2_lambert3_0";
const HAND_NAMES = ["hour-hand", "minute-hand", "second-hand"];
const HAND_CAP = "hand-cap";

// Positions are snapped to this grid (about 2 microns on a 40 mm watch) and
// texture coordinates to a coarser one. Rounded numbers compress far better,
// and nothing visible is lost.
const GRID = 1 / 16384;
const UV_GRID = 1 / 4096;

// ---------------------------------------------------------------------------
// Geometry: plain arrays of positions, normals, texture coordinates and
// triangle indices, with the small operations the preparation needs.
// ---------------------------------------------------------------------------

/** Reads one source mesh with its node's placement applied. */
function readGeometry(node) {
  const primitives = node.getMesh().listPrimitives();
  if (primitives.length !== 1) {
    throw new Error(`${node.getName()} has ${primitives.length} primitives`);
  }
  const [primitive] = primitives;
  const position = primitive.getAttribute("POSITION").getArray();
  const normal = primitive.getAttribute("NORMAL").getArray();
  const uv = primitive.getAttribute("TEXCOORD_0").getArray();
  const index = Uint32Array.from(primitive.getIndices().getArray());

  const m = node.getWorldMatrix();
  // Normals turn with the cofactors of the matrix, so that an uneven scale
  // does not tilt them off the surface.
  const c = [
    m[5] * m[10] - m[6] * m[9],
    m[6] * m[8] - m[4] * m[10],
    m[4] * m[9] - m[5] * m[8],
    m[2] * m[9] - m[1] * m[10],
    m[0] * m[10] - m[2] * m[8],
    m[1] * m[8] - m[0] * m[9],
    m[1] * m[6] - m[2] * m[5],
    m[2] * m[4] - m[0] * m[6],
    m[0] * m[5] - m[1] * m[4],
  ];
  const determinant = m[0] * c[0] + m[1] * c[1] + m[2] * c[2];
  if (determinant <= 0) {
    throw new Error(`${node.getName()} is mirrored or flattened`);
  }

  const geometry = {
    position: new Float32Array(position.length),
    normal: new Float32Array(normal.length),
    uv: Float32Array.from(uv),
    index,
  };
  for (let i = 0; i < position.length; i += 3) {
    const [x, y, z] = [position[i], position[i + 1], position[i + 2]];
    geometry.position[i] = m[0] * x + m[4] * y + m[8] * z + m[12];
    geometry.position[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    geometry.position[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    const [nx, ny, nz] = [normal[i], normal[i + 1], normal[i + 2]];
    geometry.normal[i] = c[0] * nx + c[3] * ny + c[6] * nz;
    geometry.normal[i + 1] = c[1] * nx + c[4] * ny + c[7] * nz;
    geometry.normal[i + 2] = c[2] * nx + c[5] * ny + c[8] * nz;
  }
  return geometry;
}

/** Moves every vertex with `move([x, y, z])` and every normal with `turn`. */
function transformed(geometry, move, turn) {
  const position = new Float32Array(geometry.position.length);
  const normal = new Float32Array(geometry.normal.length);
  for (let i = 0; i < position.length; i += 3) {
    position.set(move(geometry.position.subarray(i, i + 3)), i);
    const [x, y, z] = turn(geometry.normal.subarray(i, i + 3));
    const length = Math.hypot(x, y, z) || 1;
    normal.set([x / length, y / length, z / length], i);
  }
  return { ...geometry, position, normal };
}

function merged(geometries) {
  const count = (key) => geometries.reduce((sum, g) => sum + g[key].length, 0);
  const all = {
    position: new Float32Array(count("position")),
    normal: new Float32Array(count("normal")),
    uv: new Float32Array(count("uv")),
    index: new Uint32Array(count("index")),
  };
  let vertex = 0;
  let corner = 0;
  for (const geometry of geometries) {
    all.position.set(geometry.position, vertex * 3);
    all.normal.set(geometry.normal, vertex * 3);
    all.uv.set(geometry.uv, vertex * 2);
    all.index.set(
      geometry.index.map((i) => i + vertex),
      corner,
    );
    vertex += geometry.position.length / 3;
    corner += geometry.index.length;
  }
  return all;
}

/** Splits a geometry into the pieces that share no vertex position. */
function separated(geometry) {
  const { position, normal, uv, index } = geometry;
  const vertexCount = position.length / 3;

  // Vertices at the same position count as one, whatever their normals.
  const group = new Uint32Array(vertexCount);
  const firstAt = new Map();
  for (let v = 0; v < vertexCount; v++) {
    const key = `${position[v * 3]},${position[v * 3 + 1]},${position[v * 3 + 2]}`;
    if (!firstAt.has(key)) firstAt.set(key, v);
    group[v] = firstAt.get(key);
  }
  const rootOf = (v) => {
    while (group[v] !== v) v = group[v] = group[group[v]];
    return v;
  };
  for (let t = 0; t < index.length; t += 3) {
    const root = rootOf(index[t]);
    group[rootOf(index[t + 1])] = root;
    group[rootOf(index[t + 2])] = root;
  }

  const pieces = new Map();
  for (let t = 0; t < index.length; t += 3) {
    const root = rootOf(index[t]);
    if (!pieces.has(root)) pieces.set(root, []);
    pieces.get(root).push(index[t], index[t + 1], index[t + 2]);
  }
  return [...pieces.values()].map((corners) => {
    const renumbered = new Map();
    for (const v of corners) {
      if (!renumbered.has(v)) renumbered.set(v, renumbered.size);
    }
    const piece = {
      position: new Float32Array(renumbered.size * 3),
      normal: new Float32Array(renumbered.size * 3),
      uv: new Float32Array(renumbered.size * 2),
      index: Uint32Array.from(corners, (v) => renumbered.get(v)),
    };
    for (const [from, to] of renumbered) {
      piece.position.set(position.subarray(from * 3, from * 3 + 3), to * 3);
      piece.normal.set(normal.subarray(from * 3, from * 3 + 3), to * 3);
      piece.uv.set(uv.subarray(from * 2, from * 2 + 2), to * 2);
    }
    return piece;
  });
}

function bounds(geometry) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < geometry.position.length; i++) {
    min[i % 3] = Math.min(min[i % 3], geometry.position[i]);
    max[i % 3] = Math.max(max[i % 3], geometry.position[i]);
  }
  return { min, max };
}

// ---------------------------------------------------------------------------
// The hands
// ---------------------------------------------------------------------------

/** How far a piece reaches from the axis, seen from the front. */
function reach({ position }) {
  let far = 0;
  for (let i = 0; i < position.length; i += 3) {
    far = Math.max(far, Math.hypot(position[i], position[i + 1]));
  }
  return far;
}

/** Turns a hand about the axis until it points at twelve. */
function pointedAtTwelve(hand) {
  // A hand is symmetrical about its own length, so the middle of its
  // surface lies along the direction it points.
  const { position, index } = hand;
  let [sumX, sumY] = [0, 0];
  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [index[t] * 3, index[t + 1] * 3, index[t + 2] * 3];
    const area = Math.abs(
      (position[b] - position[a]) * (position[c + 1] - position[a + 1]) -
        (position[c] - position[a]) * (position[b + 1] - position[a + 1]),
    );
    sumX += area * (position[a] + position[b] + position[c]);
    sumY += area * (position[a + 1] + position[b + 1] + position[c + 1]);
  }
  const angle = Math.PI / 2 - Math.atan2(sumY, sumX);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const spin = ([x, y, z]) => [x * cos - y * sin, x * sin + y * cos, z];
  return transformed(hand, spin, spin);
}

/** The widest a hand pointing at twelve gets. */
function width(hand) {
  const { min, max } = bounds(hand);
  return max[0] - min[0];
}

/**
 * Splits the fused hands mesh into hour, minute and second hands and their
 * cap, points each hand at twelve, and stacks them hour, minute, second so
 * they can cross without passing through one another.
 */
function splitHands(fused, post) {
  const pieces = separated(fused).sort((a, b) => reach(a) - reach(b));
  if (pieces.length !== 4 || reach(pieces[0]) > reach(pieces[1]) / 2) {
    throw new Error(
      `The hands did not split cleanly: expected a cap and three hands, found ${pieces.length} pieces.`,
    );
  }
  const [cap, hour, ...longer] = pieces.map((piece, i) =>
    i === 0 ? piece : pointedAtTwelve(piece),
  );
  // The minute and second hands are the same length; the second is the needle.
  const [second, minute] = longer.sort((a, b) => width(a) - width(b));

  const lifted = (hand, by) =>
    transformed(
      hand,
      ([x, y, z]) => [x, y, z + by],
      (n) => n,
    );
  const low = (hand) => bounds(hand).min[2];
  const high = (hand) => bounds(hand).max[2];
  // Leave one hand's thickness of air between each hand and the next.
  const step = high(hour) - low(hour);
  const minuteUp = lifted(minute, high(hour) + step - low(minute));
  const secondUp = lifted(second, high(minuteUp) + step - low(second));

  // The cap grows upward from where it sits until it covers the stack.
  const stretch = (high(secondUp) + step - low(cap)) / (high(cap) - low(cap));
  const tallCap = transformed(
    cap,
    ([x, y, z]) => [x, y, low(cap) + (z - low(cap)) * stretch],
    ([x, y, z]) => [x, y, z / stretch],
  );

  return {
    "hour-hand": hour,
    "minute-hand": minuteUp,
    "second-hand": secondUp,
    [HAND_CAP]: merged([post, tallCap]),
  };
}

// ---------------------------------------------------------------------------
// Source to prepared model
// ---------------------------------------------------------------------------

async function readSource(io) {
  const archive = path.join(repo, SOURCE.archive);
  if (!existsSync(archive)) {
    throw new Error(
      `${SOURCE.archive} is missing. Download "${SOURCE.title}" in glTF format from ${SOURCE.page} and save the zip there.`,
    );
  }
  const files = unzipSync(readFileSync(archive));
  const text = (name) => new TextDecoder().decode(files[name]);

  const licence = text("license.txt");
  const credit = licence
    .split(/\r?\n/)
    .find((line) => line.startsWith("This work is based on"));
  if (!licence.includes(`title:\t${SOURCE.title}`) || !credit) {
    throw new Error(`${SOURCE.archive} is not "${SOURCE.title}"`);
  }
  if (!licence.includes("CC-BY-4.0")) {
    throw new Error(`${SOURCE.archive} is not licensed CC-BY-4.0`);
  }

  const source = await io.readJSON({
    json: JSON.parse(text("scene.gltf")),
    resources: { "scene.bin": files["scene.bin"] },
  });
  return { source, credit: credit.trim() };
}

/** Reads every source mesh, insisting each one belongs to exactly one part. */
function readMeshes(source) {
  const meshes = new Map();
  for (const node of source.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    if (!(node.getName() in SOURCE_MESHES)) {
      throw new Error(`Source mesh ${node.getName()} is assigned to no part`);
    }
    if (meshes.has(node.getName())) {
      throw new Error(`Source mesh ${node.getName()} appears twice`);
    }
    meshes.set(node.getName(), readGeometry(node));
  }
  for (const name of Object.keys(SOURCE_MESHES)) {
    if (!meshes.has(name)) throw new Error(`Source mesh ${name} is missing`);
  }
  return meshes;
}

/** Every source mesh assigned to `part`, as one geometry. */
function partGeometry(meshes, part) {
  return merged(
    [...meshes]
      .filter(([name]) => SOURCE_MESHES[name] === part)
      .map(([, geometry]) => geometry),
  );
}

/**
 * The move from the source's placement (dial facing up, off centre, 3.4 cm
 * across) to the prepared one: facing +Z with twelve o'clock up, the origin
 * at the centre of the dial, and the case 2 units across.
 */
function standardFrame(meshes) {
  const dialBase = bounds(partGeometry(meshes, "dial-base"));
  const caseBody = bounds(partGeometry(meshes, "case"));
  const centreX = (dialBase.min[0] + dialBase.max[0]) / 2;
  const centreZ = (dialBase.min[2] + dialBase.max[2]) / 2;
  const dialHeight = dialBase.max[1];
  const scale = 2 / (caseBody.max[0] - caseBody.min[0]);
  return (geometry) =>
    transformed(
      geometry,
      ([x, y, z]) => [
        (x - centreX) * scale,
        -(z - centreZ) * scale,
        (y - dialHeight) * scale,
      ],
      ([x, y, z]) => [x, -z, y],
    );
}

function snappedToGrid(geometry) {
  const snap = (grid) => (value) => Math.round(value / grid) * grid;
  return {
    ...geometry,
    position: geometry.position.map(snap(GRID)),
    uv: geometry.uv.map(snap(UV_GRID)),
  };
}

/** Builds the prepared model: a root, the seven parts, the hands inside. */
function buildModel(parts, hands, credit, sourceAsset) {
  const model = new Document().setLogger(new Logger(Logger.Verbosity.WARN));
  const buffer = model.createBuffer();
  const asset = model.getRoot().getAsset();
  asset.copyright = credit;
  asset.extras = { ...sourceAsset.extras };

  const meshNode = (name, geometry) => {
    const { position, normal, uv, index } = snappedToGrid(geometry);
    const accessor = (type, array) =>
      model.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    const primitive = model
      .createPrimitive()
      .setAttribute("POSITION", accessor("VEC3", position))
      .setAttribute("NORMAL", accessor("VEC3", normal))
      .setAttribute("TEXCOORD_0", accessor("VEC2", uv))
      .setIndices(accessor("SCALAR", index));
    return model
      .createNode(name)
      .setMesh(model.createMesh(name).addPrimitive(primitive));
  };

  const root = model.createNode("hero-timepiece");
  model.createScene("Hero Timepiece").addChild(root);
  model.getRoot().setDefaultScene(model.getRoot().listScenes()[0]);
  for (const part of PARTS) {
    if (part !== "hands") {
      root.addChild(meshNode(part, parts[part]));
      continue;
    }
    const group = model.createNode("hands");
    for (const name of [...HAND_NAMES, HAND_CAP]) {
      group.addChild(meshNode(name, hands[name]));
    }
    root.addChild(group);
  }
  return model;
}

/** Stores normals as 16-bit numbers: half the bytes, no visible banding. */
function packNormals(model) {
  model.createExtension(KHRMeshQuantization).setRequired(true);
  for (const mesh of model.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const normal = primitive.getAttribute("NORMAL");
      const packed = Int16Array.from(normal.getArray(), (n) =>
        Math.round(n * 32767),
      );
      normal.setArray(packed).setNormalized(true);
    }
  }
}

function trianglesByPart(model) {
  const [root] = model.getRoot().getDefaultScene().listChildren();
  return Object.fromEntries(
    root.listChildren().map((part) => {
      let triangles = 0;
      part.traverse((node) => {
        const [primitive] = node.getMesh()?.listPrimitives() ?? [];
        if (primitive) triangles += primitive.getIndices().getCount() / 3;
      });
      return [part.getName(), triangles];
    }),
  );
}

async function main() {
  await Promise.all([
    MeshoptEncoder.ready,
    MeshoptDecoder.ready,
    MeshoptSimplifier.ready,
  ]);
  const io = new NodeIO()
    .registerExtensions([
      EXTMeshoptCompression,
      KHRMeshQuantization,
      KHRMaterialsSpecular,
      KHRMaterialsTransmission,
    ])
    .registerDependencies({
      "meshopt.encoder": MeshoptEncoder,
      "meshopt.decoder": MeshoptDecoder,
    });

  const { source, credit } = await readSource(io);
  const meshes = readMeshes(source);
  const toStandardFrame = standardFrame(meshes);

  const parts = {};
  for (const part of PARTS.filter((name) => name !== "hands")) {
    parts[part] = toStandardFrame(partGeometry(meshes, part));
  }
  const hands = splitHands(
    toStandardFrame(meshes.get(FUSED_HANDS)),
    toStandardFrame(meshes.get(HAND_POST)),
  );
  const capTop = bounds(hands[HAND_CAP]).max[2];
  if (capTop >= bounds(parts.crystal).min[2]) {
    throw new Error("The stacked hands no longer fit under the crystal");
  }

  const report = {};
  for (const variant of ["main", "phone"]) {
    const model = buildModel(parts, hands, credit, source.getRoot().getAsset());
    await model.transform(
      weld(),
      ...(variant === "phone"
        ? [
            simplify({
              simplifier: MeshoptSimplifier,
              ratio: PHONE_RATIO,
              error: PHONE_ERROR,
            }),
          ]
        : []),
      reorder({ encoder: MeshoptEncoder }),
    );
    packNormals(model);
    model.createExtension(EXTMeshoptCompression).setRequired(true);

    const file = await io.writeBinary(model);
    mkdirSync(path.dirname(path.join(repo, OUTPUT[variant])), {
      recursive: true,
    });
    writeFileSync(path.join(repo, OUTPUT[variant]), file);
    report[variant] = { bytes: file.byteLength, parts: trianglesByPart(model) };
  }

  printReport(meshes, report, credit);

  const over = Object.keys(report).filter(
    (variant) => report[variant].bytes > BUDGET[variant],
  );
  if (over.length > 0) {
    throw new Error(`Over the download budget: ${over.join(", ")}`);
  }
}

function printReport(meshes, report, credit) {
  const kb = (bytes) => `${(bytes / KB).toFixed(0)} KB`;
  const total = (parts) => Object.values(parts).reduce((a, b) => a + b, 0);
  const row = (cells) =>
    cells
      .map((cell, i) =>
        i === 0 ? String(cell).padEnd(28) : String(cell).padStart(10),
      )
      .join("");

  console.log(`\nSource: ${SOURCE.title}\n        ${SOURCE.archive}\n`);
  console.log(row(["Source mesh", "Triangles", "  Part"]));
  for (const [name, geometry] of meshes) {
    console.log(
      row([name, geometry.index.length / 3, `  ${SOURCE_MESHES[name]}`]),
    );
  }

  console.log(`\n${row(["Part", "Main", "Phone"])}`);
  for (const part of PARTS) {
    console.log(row([part, report.main.parts[part], report.phone.parts[part]]));
  }
  console.log(
    row(["Triangles", total(report.main.parts), total(report.phone.parts)]),
  );
  console.log(row(["File size", kb(report.main.bytes), kb(report.phone.bytes)]));
  console.log(row(["Budget", kb(BUDGET.main), kb(BUDGET.phone)]));
  console.log(`\nWrote ${OUTPUT.main}\n      ${OUTPUT.phone}`);
  console.log(`\nCredit line, for the credits page and the README:\n${credit}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

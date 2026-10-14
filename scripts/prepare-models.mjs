// Turns the source downloads in models-raw/ into the models the site ships:
// the Hero Timepiece, public/models/hero-timepiece.glb and a lighter one for
// phones, and the escapement the craftsmanship section shows, prepared by
// prepare-escapement.mjs.
//
//   npm run models
//
// It runs offline, on a developer's machine. Its outputs are committed, so
// neither the browser nor the Vercel build ever runs it.
//
// The part names, the file locations and what scene code may rely on in the
// prepared Hero Timepiece live in src/components/three/hero-model.ts, which
// this script imports. Node 22.18 or later runs that TypeScript file as it
// is.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Document, Logger, NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  KHRMaterialsSpecular,
  KHRMaterialsTransmission,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import { reorder, simplify, weld } from "@gltf-transform/functions";
import {
  MeshoptDecoder,
  MeshoptEncoder,
  MeshoptSimplifier,
} from "meshoptimizer";

import {
  ESCAPEMENT_MODEL,
  ESCAPEMENT_MODEL_BUDGET,
} from "../src/components/three/escapement-model.ts";
import {
  HAND_CAP,
  HANDS,
  HERO_MODEL,
  HERO_MODEL_BUDGET,
  PARTS,
} from "../src/components/three/hero-model.ts";
import { creditLine, heroModelCredit } from "../src/lib/credits.ts";
import {
  packNormals,
  readLicensedSource,
  repo,
  trianglesByChild,
} from "./model-files.mjs";
import {
  prepareEscapement,
  SOURCE as ESCAPEMENT_SOURCE,
} from "./prepare-escapement.mjs";

// The Hero Timepiece's download, and the credit its licence asks for. The
// escapement's is named in prepare-escapement.mjs; no other is ever opened.
// models-raw/ also holds a "Luxury Wristwatch" that copies a real brand's
// watch; it must never be named here.
const SOURCE = {
  archive: "models-raw/stainless_steel_wristwatch_analog_watch.zip",
  credit: heroModelCredit,
};

const outputFile = (version) => `public${HERO_MODEL[version]}`;

// The phone model aims for this share of each part's triangles, but never
// moves a surface by more than PHONE_ERROR of the part's size. Parts made
// of small hard-edged shells, the bracelet and the dial's markers, have
// almost nothing to give within that limit and stay close to full detail.
const PHONE_RATIO = 0.4;
const PHONE_ERROR = 0.002;

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

/** Splits a geometry into its shells: the surfaces that touch nowhere. */
function separated(geometry) {
  const { position, normal, uv, index } = geometry;
  const vertexCount = position.length / 3;

  // Vertices at the same position count as one, whatever their normals.
  // `parent` links each vertex towards the first vertex of its shell.
  const parent = new Uint32Array(vertexCount);
  const firstAt = new Map();
  for (let v = 0; v < vertexCount; v++) {
    const key = `${position[v * 3]},${position[v * 3 + 1]},${position[v * 3 + 2]}`;
    if (!firstAt.has(key)) firstAt.set(key, v);
    parent[v] = firstAt.get(key);
  }
  const rootOf = (v) => {
    while (parent[v] !== v) v = parent[v] = parent[parent[v]];
    return v;
  };
  for (let t = 0; t < index.length; t += 3) {
    const root = rootOf(index[t]);
    parent[rootOf(index[t + 1])] = root;
    parent[rootOf(index[t + 2])] = root;
  }

  const shells = new Map();
  for (let t = 0; t < index.length; t += 3) {
    const root = rootOf(index[t]);
    if (!shells.has(root)) shells.set(root, []);
    shells.get(root).push(index[t], index[t + 1], index[t + 2]);
  }
  return [...shells.values()].map((corners) => {
    const renumbered = new Map();
    for (const v of corners) {
      if (!renumbered.has(v)) renumbered.set(v, renumbered.size);
    }
    const shell = {
      position: new Float32Array(renumbered.size * 3),
      normal: new Float32Array(renumbered.size * 3),
      uv: new Float32Array(renumbered.size * 2),
      index: Uint32Array.from(corners, (v) => renumbered.get(v)),
    };
    for (const [from, to] of renumbered) {
      shell.position.set(position.subarray(from * 3, from * 3 + 3), to * 3);
      shell.normal.set(normal.subarray(from * 3, from * 3 + 3), to * 3);
      shell.uv.set(uv.subarray(from * 2, from * 2 + 2), to * 2);
    }
    return shell;
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

/** How far a shell reaches from the axis, seen from the front. */
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
  const shells = separated(fused).sort((a, b) => reach(a) - reach(b));
  if (shells.length !== 4 || reach(shells[0]) > reach(shells[1]) / 2) {
    throw new Error(
      `The hands did not split cleanly: expected a cap and three hands, found ${shells.length} shells.`,
    );
  }
  const [cap, hour, ...longer] = shells.map((shell, i) =>
    i === 0 ? shell : pointedAtTwelve(shell),
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

  const [hourHand, minuteHand, secondHand] = HANDS;
  return {
    [hourHand]: hour,
    [minuteHand]: minuteUp,
    [secondHand]: secondUp,
    [HAND_CAP]: merged([post, tallCap]),
  };
}

// ---------------------------------------------------------------------------
// Source to prepared model
// ---------------------------------------------------------------------------

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
function buildModel(parts, hands, sourceAsset) {
  const model = new Document().setLogger(new Logger(Logger.Verbosity.WARN));
  const buffer = model.createBuffer();
  const asset = model.getRoot().getAsset();
  asset.copyright = creditLine(SOURCE.credit);
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
    for (const name of [...HANDS, HAND_CAP]) {
      group.addChild(meshNode(name, hands[name]));
    }
    root.addChild(group);
  }
  return model;
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

  const source = await readLicensedSource(io, SOURCE);
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
  for (const version of ["main", "phone"]) {
    const model = buildModel(parts, hands, source.getRoot().getAsset());
    await model.transform(
      weld(),
      ...(version === "phone"
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
    report[version] = {
      file: await io.writeBinary(model),
      parts: trianglesByChild(model),
    };
  }

  const escapementModel = await prepareEscapement(io);
  const escapement = {
    file: await io.writeBinary(escapementModel),
    parts: trianglesByChild(escapementModel),
  };

  printReport(meshes, report);
  printEscapementReport(escapement);

  // Nothing is written unless every model fits, so a run that goes over
  // budget leaves the committed files as they were.
  const files = [
    ...Object.keys(report).map((version) => ({
      name: outputFile(version),
      bytes: report[version].file,
      budget: HERO_MODEL_BUDGET[version],
    })),
    {
      name: `public${ESCAPEMENT_MODEL}`,
      bytes: escapement.file,
      budget: ESCAPEMENT_MODEL_BUDGET,
    },
  ];
  const over = files.filter(({ bytes, budget }) => bytes.byteLength > budget);
  if (over.length > 0) {
    throw new Error(
      `Over the download budget, nothing written: ${over.map(({ name }) => name)}`,
    );
  }
  for (const { name, bytes } of files) {
    const file = path.join(repo, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, bytes);
  }
  console.log(`Wrote ${files.map(({ name }) => name).join("\n      ")}\n`);
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

/** One line of a report's table: a name, then figures lined up on the right. */
const row = (cells) =>
  cells
    .map((cell, i) =>
      i === 0 ? String(cell).padEnd(28) : String(cell).padStart(10),
    )
    .join("");

function printReport(meshes, report) {
  const total = (parts) => Object.values(parts).reduce((a, b) => a + b, 0);
  const { main, phone } = report;

  console.log(`\nSource: ${SOURCE.credit.title}\n        ${SOURCE.archive}\n`);
  console.log(row(["Source mesh", "Triangles", "  Part"]));
  for (const [name, geometry] of meshes) {
    console.log(
      row([name, geometry.index.length / 3, `  ${SOURCE_MESHES[name]}`]),
    );
  }

  console.log(`\n${row(["Part", "Main", "Phone"])}`);
  for (const part of PARTS) {
    console.log(row([part, main.parts[part], phone.parts[part]]));
  }
  console.log(row(["Triangles", total(main.parts), total(phone.parts)]));
  console.log(
    row(["File size", kb(main.file.byteLength), kb(phone.file.byteLength)]),
  );
  console.log(
    row(["Budget", kb(HERO_MODEL_BUDGET.main), kb(HERO_MODEL_BUDGET.phone)]),
  );
  console.log(
    `\nCredit line, for the credits page and the README:\n${creditLine(SOURCE.credit)}\n`,
  );
}

function printEscapementReport({ file, parts }) {
  const { credit, archive } = ESCAPEMENT_SOURCE;

  console.log(`Source: ${credit.title}\n        ${archive}\n`);
  console.log(row(["Part", "Triangles"]));
  for (const [part, triangles] of Object.entries(parts)) {
    console.log(row([part, triangles]));
  }
  console.log(
    row(["Triangles", Object.values(parts).reduce((a, b) => a + b, 0)]),
  );
  console.log(row(["File size", kb(file.byteLength)]));
  console.log(row(["Phone budget", kb(ESCAPEMENT_MODEL_BUDGET)]));
  console.log(
    `\nCredit line, for the credits page and the README:\n${creditLine(credit)}\n`,
  );
}

await main();

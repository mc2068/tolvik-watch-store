// What every model `npm run models` prepares goes through: reading its
// download, with the licence checked against the credit the site records,
// packing its normals for the file, and counting its triangles.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { KHRMeshQuantization } from "@gltf-transform/extensions";
import { unzipSync } from "fflate";

import { creditLine } from "../src/lib/credits.ts";

export const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/**
 * Reads the glTF download at `archive`, a zip in models-raw/, once its
 * licence file is shown to name the model and to spell out the very credit
 * that src/lib/credits.ts records for the credits page.
 */
export async function readLicensedSource(io, { archive, credit }) {
  if (!existsSync(path.join(repo, archive))) {
    throw new Error(
      `${archive} is missing. Download "${credit.title}" in glTF format from ${credit.source} and save the zip there.`,
    );
  }
  const files = unzipSync(readFileSync(path.join(repo, archive)));
  const text = (name) => new TextDecoder().decode(files[name]);

  const licence = text("license.txt");
  if (!licence.includes(`title:\t${credit.title}`)) {
    throw new Error(`${archive} is not "${credit.title}"`);
  }
  if (!licence.includes(creditLine(credit))) {
    throw new Error(
      `The credit line in ${archive} differs from the one in src/lib/credits.ts`,
    );
  }

  // The glTF's buffers and images, by the paths it refers to them by.
  const resources = Object.fromEntries(
    Object.entries(files).filter(([name]) => !name.endsWith(".gltf")),
  );
  return io.readJSON({ json: JSON.parse(text("scene.gltf")), resources });
}

/** Stores normals as 16-bit numbers: half the bytes, no visible banding. */
export function packNormals(model) {
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

/**
 * The triangles under each child of a prepared model's root, by the
 * child's name, for the report `npm run models` prints.
 */
export function trianglesByChild(model) {
  const [root] = model.getRoot().getDefaultScene().listChildren();
  return Object.fromEntries(
    root.listChildren().map((child) => {
      let triangles = 0;
      child.traverse((node) => {
        for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
          triangles += primitive.getIndices().getCount() / 3;
        }
      });
      return [child.getName(), triangles];
    }),
  );
}

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const storageDirectory = path.resolve(
  process.env.PRIVATE_UPLOAD_DIR ||
    path.join(moduleDirectory, "..", "private-uploads")
);

const signatures = [
  {
    extension: "jpg",
    mimeType: "image/jpeg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    extension: "png",
    mimeType: "image/png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
  },
  {
    extension: "webp",
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
];

export const getSupportedImage = (buffer) =>
  signatures.find(({ matches }) => matches(buffer)) || null;

export const savePrivateImage = async (buffer, imageType) => {
  if (!buffer?.length || buffer.length > 5 * 1024 * 1024) {
    const error = new Error("Image must be no larger than 5 MB");
    error.status = 400;
    throw error;
  }
  const signature = getSupportedImage(buffer);
  if (!signature || (imageType && signature.mimeType !== imageType)) {
    const error = new Error("Upload a valid JPG, PNG, or WEBP image");
    error.status = 400;
    throw error;
  }

  await mkdir(storageDirectory, { recursive: true, mode: 0o700 });
  const storageKey = `${randomUUID()}.${signature.extension}`;
  await writeFile(path.join(storageDirectory, storageKey), buffer, {
    flag: "wx",
    mode: 0o600,
  });
  return { storageKey, mimeType: signature.mimeType };
};

export const getPrivateImagePath = (storageKey) => {
  if (
    typeof storageKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(
      storageKey
    )
  ) {
    return null;
  }
  return path.join(storageDirectory, storageKey);
};

export const deletePrivateImage = async (storageKey) => {
  const imagePath = getPrivateImagePath(storageKey);
  if (imagePath) await unlink(imagePath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
};

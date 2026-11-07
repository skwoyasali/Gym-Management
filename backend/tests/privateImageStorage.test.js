import test from "node:test";
import assert from "node:assert/strict";
import { getSupportedImage } from "../utils/privateImageStorage.js";

test("recognizes JPG, PNG and WEBP signatures", () => {
  assert.equal(
    getSupportedImage(Buffer.from([0xff, 0xd8, 0xff, 0x00])).mimeType,
    "image/jpeg"
  );
  assert.equal(
    getSupportedImage(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    ).mimeType,
    "image/png"
  );
  assert.equal(
    getSupportedImage(Buffer.from("RIFFxxxxWEBP", "ascii")).mimeType,
    "image/webp"
  );
});

test("rejects unsupported and malformed image signatures", () => {
  assert.equal(getSupportedImage(Buffer.from("<svg></svg>")), null);
  assert.equal(getSupportedImage(Buffer.from([0xff, 0xd8])), null);
});

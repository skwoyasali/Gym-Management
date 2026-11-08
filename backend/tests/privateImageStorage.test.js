import test from "node:test";
import assert from "node:assert/strict";
import { getSupportedImage } from "../utils/privateImageStorage.js";
import {
  getMemberPhotoFilter,
  serializeMemberPhoto,
} from "../utils/memberPhoto.js";

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

test("member photo serialization exposes only the authenticated photo route", () => {
  const member = serializeMemberPhoto({
    _id: "member-123",
    name: "Alex",
    photoStorageKey: "private-image-key",
  });

  assert.equal(member.photoUrl, "/members/member-123/photo");
  assert.equal("photoStorageKey" in member, false);
  assert.equal(serializeMemberPhoto({ _id: "member-456" }).photoUrl, null);
});

test("member photo access is limited to the member or their gym admin", () => {
  assert.equal(
    getMemberPhotoFilter(
      { role: "member", id: "user-1", tenantId: "gym-1", memberId: "member-1" },
      "member-2"
    ),
    null
  );
  assert.deepEqual(
    getMemberPhotoFilter(
      { role: "member", id: "user-1", tenantId: "gym-1", memberId: "member-1" },
      "member-1"
    ),
    { _id: "member-1", createdBy: "gym-1", userId: "user-1" }
  );
  assert.deepEqual(
    getMemberPhotoFilter({ role: "admin", id: "gym-1" }, "member-2"),
    { _id: "member-2", createdBy: "gym-1" }
  );
});

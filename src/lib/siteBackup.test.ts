import { isValidEncryptedBackupEnvelope, isValidSiteBackupPayload } from "@/lib/siteBackup";

describe("siteBackup payload validator", () => {
  it("accepts valid payload shape", () => {
    const valid = {
      signature: "memory-maker-site-backup",
      version: 1,
      createdAt: new Date().toISOString(),
      scope: {
        userId: "u1",
        familyId: "f1",
        deviceIds: ["d1"],
        currentDeviceId: "d1",
      },
      cloud: {},
      localStorage: {},
    };

    expect(isValidSiteBackupPayload(valid)).toBe(true);
  });

  it("rejects invalid payload shape", () => {
    expect(isValidSiteBackupPayload({})).toBe(false);
    expect(isValidSiteBackupPayload({ signature: "wrong", version: 1, cloud: {} })).toBe(false);
  });

  it("validates encrypted backup envelope shape", () => {
    const validEncrypted = {
      signature: "memory-maker-site-backup-encrypted",
      version: 1,
      createdAt: new Date().toISOString(),
      algorithm: "AES-GCM",
      iterations: 150000,
      saltBase64: "QQ==",
      ivBase64: "QQ==",
      payloadBase64: "QQ==",
    };

    expect(isValidEncryptedBackupEnvelope(validEncrypted)).toBe(true);
    expect(isValidEncryptedBackupEnvelope({ signature: "x" })).toBe(false);
  });
});

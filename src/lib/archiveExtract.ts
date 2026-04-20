import JSZip from "jszip";

const MEDIA_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg",
  "mp4", "mov", "avi", "webm", "mkv", "m4v", "3gp",
]);

function getExt(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

function isMediaFile(name: string): boolean {
  return MEDIA_EXTENSIONS.has(getExt(name));
}

function getMimeType(name: string): string {
  const ext = getExt(name);
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
    mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
    webm: "video/webm", mkv: "video/x-matroska", m4v: "video/mp4", "3gp": "video/3gpp",
  };
  return map[ext] || "application/octet-stream";
}

export function isArchiveFile(file: File): boolean {
  const ext = getExt(file.name);
  return ext === "zip" || ext === "rar";
}

/**
 * Extract media files (images + videos) from a ZIP archive.
 * Returns an array of File objects ready for upload.
 */
export async function extractMediaFromZip(file: File): Promise<File[]> {
  console.log("[archiveExtract] Loading ZIP, size:", file.size, "name:", file.name);
  const zip = await JSZip.loadAsync(file);
  const allNames = Object.keys(zip.files);
  console.log("[archiveExtract] ZIP entries:", allNames.length, allNames.slice(0, 5));
  const results: File[] = [];

  const entries = Object.entries(zip.files).filter(
    ([name, entry]) => !entry.dir && isMediaFile(name) && !name.startsWith("__MACOSX")
  );
  console.log("[archiveExtract] Media entries after filter:", entries.length);

  for (const [name, entry] of entries) {
    const blob = await entry.async("blob");
    const fileName = name.split("/").pop() || name;
    const mediaFile = new File([blob], fileName, { type: getMimeType(fileName) });
    results.push(mediaFile);
  }

  return results;
}

/**
 * Extract media from an archive file. Currently supports ZIP.
 * RAR is not supported client-side — returns null with a message.
 */
export async function extractMediaFromArchive(
  file: File
): Promise<{ files: File[]; error?: string }> {
  const ext = getExt(file.name);

  if (ext === "zip") {
    try {
      const files = await extractMediaFromZip(file);
      if (files.length === 0) {
        console.warn("[archiveExtract] ZIP opened but no media files found");
      }
      return { files };
    } catch (e) {
      console.error("[archiveExtract] ZIP extraction error:", e);
      return { files: [], error: "שגיאה בפתיחת קובץ ZIP" };
    }
  }

  if (ext === "rar") {
    return {
      files: [],
      error: "קבצי RAR אינם נתמכים כרגע. אנא המר ל-ZIP והעלה שוב.",
    };
  }

  return { files: [], error: "פורמט ארכיון לא נתמך" };
}

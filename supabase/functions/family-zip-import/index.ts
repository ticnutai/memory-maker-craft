import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import JSZip from "npm:jszip@3.10.1";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const StartSchema = z.object({
  action: z.literal("start"),
  collageId: z.string().uuid(),
  deviceId: z.string().min(1).max(255),
  sourcePath: z.string().min(1).max(2048),
  sourceFileName: z.string().min(1).max(255),
});

const StatusSchema = z.object({
  action: z.literal("status"),
  jobId: z.string().uuid(),
  deviceId: z.string().min(1).max(255),
});

const MEDIA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "mp4", "mov", "avi", "webm", "mkv", "m4v", "3gp"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);

function getExt(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

function getMimeType(name: string): string {
  const ext = getExt(name);
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
    mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo", webm: "video/webm", mkv: "video/x-matroska", m4v: "video/mp4", "3gp": "video/3gpp",
  };
  return map[ext] || "application/octet-stream";
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\p{L}\p{N}._()-]+/gu, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || `file-${Date.now()}`;
}

async function updateJob(jobId: string, patch: Record<string, unknown>) {
  const { error } = await admin.from("family_zip_import_jobs").update(patch).eq("id", jobId);
  if (error) throw error;
}

async function getStartingSortOrder(collageId: string) {
  const { data, error } = await admin
    .from("family_photos")
    .select("sort_order")
    .eq("collage_id", collageId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}

async function cleanupSourceZip(sourcePath: string) {
  const { error } = await admin.storage.from("family-zip-imports").remove([sourcePath]);
  if (error) console.warn("family-zip-import cleanup failed:", error.message);
}

async function processZipJob(jobId: string, collageId: string, deviceId: string, sourcePath: string) {
  try {
    await updateJob(jobId, { status: "processing", progress: 5, started_at: new Date().toISOString() });

    const { data: zipBlob, error: downloadError } = await admin.storage.from("family-zip-imports").download(sourcePath);
    if (downloadError || !zipBlob) throw new Error("נכשל בהורדת קובץ ה-ZIP");

    await updateJob(jobId, { progress: 15 });

    const zipArrayBuffer = await zipBlob.arrayBuffer();
    const zip = await JSZip.loadAsync(zipArrayBuffer);
    const fileEntries = Object.entries(zip.files).filter(([path, entry]) => {
      if (entry.dir) return false;
      if (path.startsWith("__MACOSX/")) return false;
      return MEDIA_EXTENSIONS.has(getExt(path));
    });

    await updateJob(jobId, { progress: 30, extracted_count: fileEntries.length });

    if (fileEntries.length === 0) {
      throw new Error("לא נמצאו תמונות או סרטונים בתוך ה-ZIP");
    }

    const sortStart = await getStartingSortOrder(collageId);
    let uploadedCount = 0;

    for (let index = 0; index < fileEntries.length; index++) {
      const [path, entry] = fileEntries[index];
      const ext = getExt(path);
      const baseName = sanitizeFileName(path.split("/").pop() || `media-${index + 1}.${ext}`);
      const targetPath = `${deviceId}/${collageId}/${Date.now()}-${index}-${baseName}`;
      const contentBlob = await entry.async("blob");

      const { error: uploadError } = await admin.storage.from("family-photos").upload(targetPath, contentBlob, {
        contentType: getMimeType(baseName),
        upsert: false,
      });
      if (uploadError) throw new Error(`נכשל בהעלאת ${baseName}`);

      const publicUrl = admin.storage.from("family-photos").getPublicUrl(targetPath).data.publicUrl;
      const mediaType = IMAGE_EXTENSIONS.has(ext) ? "image" : "video";

      const { error: insertError } = await admin.from("family_photos").insert({
        collage_id: collageId,
        device_id: deviceId,
        image_url: publicUrl,
        sort_order: sortStart + index,
        media_type: mediaType,
        thumbnail_url: null,
        duration_ms: null,
      });
      if (insertError) throw new Error(`נכשל בשמירת ${baseName} בקולאז׳`);

      uploadedCount += 1;
      const progress = Math.min(95, 30 + Math.round(((index + 1) / fileEntries.length) * 65));
      await updateJob(jobId, { progress, uploaded_count: uploadedCount });
    }

    await cleanupSourceZip(sourcePath);
    await updateJob(jobId, {
      status: "completed",
      progress: 100,
      uploaded_count: uploadedCount,
      completed_at: new Date().toISOString(),
      error_message: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה לא ידועה";
    console.error("family-zip-import failed:", message);
    await cleanupSourceZip(sourcePath);
    await updateJob(jobId, {
      status: "failed",
      progress: 100,
      error_message: message,
      completed_at: new Date().toISOString(),
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    if (body?.action === "status") {
      const parsed = StatusSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { jobId, deviceId } = parsed.data;
      const { data, error } = await admin
        .from("family_zip_import_jobs")
        .select("id, status, progress, extracted_count, uploaded_count, error_message, completed_at")
        .eq("id", jobId)
        .eq("device_id", deviceId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { collageId, deviceId, sourcePath, sourceFileName } = parsed.data;

    const { data: job, error: insertError } = await admin
      .from("family_zip_import_jobs")
      .insert({
        collage_id: collageId,
        device_id: deviceId,
        source_storage_path: sourcePath,
        source_file_name: sourceFileName,
        status: "queued",
        progress: 0,
      })
      .select("id, status, progress")
      .single();

    if (insertError) throw insertError;

    EdgeRuntime.waitUntil(processZipJob(job.id, collageId, deviceId, sourcePath));

    return new Response(JSON.stringify({ jobId: job.id, status: job.status, progress: job.progress }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

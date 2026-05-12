import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = "post-media";

export type UploadedMediaAsset = {
  bucket: string;
  path: string;
  url: string;
};

export async function uploadPostImage({
  supabase,
  userId,
  pieceId,
  bytes,
  contentType,
  extension = "png",
}: {
  supabase: SupabaseClient;
  userId: string;
  pieceId: string;
  bytes: Buffer;
  contentType: string;
  extension?: string;
}): Promise<UploadedMediaAsset> {
  const bucket = process.env.SUPABASE_POST_MEDIA_BUCKET ?? DEFAULT_BUCKET;
  await ensurePublicBucket(supabase, bucket);

  const path = `${userId}/${pieceId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: true,
  });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Image uploaded, but no public URL was returned.");

  return {
    bucket,
    path,
    url: data.publicUrl,
  };
}

async function ensurePublicBucket(supabase: SupabaseClient, bucket: string) {
  const { data } = await supabase.storage.getBucket(bucket);
  if (data) return;

  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });

  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Could not create media bucket: ${error.message}`);
  }
}

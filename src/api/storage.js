// Supabase Storage helpers. Currently: profile photo uploads (registration
// stage 2) into the public `profile-media` bucket (migration 0021).
import { supabase } from './supabaseClient';

// Uploads an image and returns its public URL, or null when there's no session
// / the upload fails — the caller then falls back to the legacy UploadFile mock.
export async function uploadProfileImage(file) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
    const path = `${session.user.id}/profile-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('profile-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined,
      });
    if (error) throw error;

    const { data } = supabase.storage.from('profile-media').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    console.warn('[storage] uploadProfileImage failed:', e?.message || e);
    return null;
  }
}

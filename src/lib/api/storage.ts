import { supabase } from '@/lib/supabase'

export const INVENTORY_STORAGE_BUCKET = 'inventory-images'
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

/**
 * Uploads an inventory photo file directly to Supabase Storage.
 * Returns the public CDN URL of the uploaded image.
 */
export async function uploadInventoryPhoto(file: File, assetCode?: string): Promise<string> {
  // Validate file size
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error('Ukuran berkas gambar melebihi batas maksimal 5MB.')
  }

  // Validate MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Format berkas tidak didukung. Harap gunakan format JPG, PNG, atau WEBP.')
  }

  // Generate safe and unique filename
  const cleanExt = file.name.split('.').pop()?.toLowerCase() || 'png'
  const cleanCode = (assetCode || 'asset')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 20)
    .toLowerCase()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const fileName = `${cleanCode}-${Date.now()}-${randomSuffix}.${cleanExt}`

  // Upload to Supabase Storage bucket
  const { data, error } = await supabase.storage
    .from(INVENTORY_STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading photo to Supabase Storage:', error)
    throw new Error(`Gagal mengunggah foto ke penyimpanan: ${error.message}`)
  }

  // Get public CDN URL
  const { data: publicUrlData } = supabase.storage
    .from(INVENTORY_STORAGE_BUCKET)
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}

/**
 * Deletes an inventory photo from Supabase Storage if it belongs to our bucket.
 */
export async function deleteInventoryPhoto(photoUrl?: string | null): Promise<void> {
  if (!photoUrl) return

  try {
    // Check if the URL points to our Supabase Storage bucket
    if (photoUrl.includes(`/${INVENTORY_STORAGE_BUCKET}/`)) {
      const parts = photoUrl.split(`/${INVENTORY_STORAGE_BUCKET}/`)
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1].split('?')[0])
        const { error } = await supabase.storage
          .from(INVENTORY_STORAGE_BUCKET)
          .remove([filePath])

        if (error) {
          console.warn('Could not delete old photo from storage:', error.message)
        }
      }
    }
  } catch (err) {
    console.warn('Error attempting to remove old photo from storage:', err)
  }
}

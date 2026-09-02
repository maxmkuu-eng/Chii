/**
 * MKUU AI - Universal Image Utility for Web & APK Mobile
 * Handles image downloading, sharing, zooming, and blob conversions
 */

export async function urlToBlob(imageUrl: string): Promise<Blob> {
  if (imageUrl.startsWith('data:')) {
    const parts = imageUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const response = await fetch(imageUrl, { mode: 'cors' });
  return await response.blob();
}

/**
 * Universally downloads an image file to the user's phone / device storage.
 * Works seamlessly in Chrome, Safari, Android WebView, and APK packaging.
 */
export async function downloadImageFile(
  imageUrl: string,
  filename = `mkuu-picha-${Date.now()}.png`
): Promise<boolean> {
  try {
    const blob = await urlToBlob(imageUrl);
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 200);

    return true;
  } catch (err) {
    console.warn('[MKUU AI] Blob download failed, falling back to direct link:', err);
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = imageUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 200);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Shares or saves an image directly to Android Gallery / WhatsApp / System apps
 */
export async function shareImageFile(
  imageUrl: string,
  title = 'MKUU AI Image',
  filename = `mkuu-picha-${Date.now()}.png`
): Promise<boolean> {
  try {
    const blob = await urlToBlob(imageUrl);
    const file = new File([blob], filename, { type: blob.type || 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text: 'Picha iliyotengenezwa na MKUU AI Studio',
        files: [file],
      });
      return true;
    }

    if (navigator.share) {
      await navigator.share({
        title,
        text: 'Picha ya MKUU AI',
        url: imageUrl.startsWith('data:') ? undefined : imageUrl,
      });
      return true;
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return true;
    console.warn('[MKUU AI] Share failed, falling back to download:', err);
  }

  // Fallback to direct download
  return await downloadImageFile(imageUrl, filename);
}

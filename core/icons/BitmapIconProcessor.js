export const MIN_BITMAP_ICON_SIZE = 256;

export function validateBitmapDimensions(width, height) {
  if (width < MIN_BITMAP_ICON_SIZE || height < MIN_BITMAP_ICON_SIZE) {
    return {
      ok: false,
      reason: `图标尺寸太小（${width}×${height}），请使用至少 ${MIN_BITMAP_ICON_SIZE}×${MIN_BITMAP_ICON_SIZE} 的高清图标`
    };
  }

  return { ok: true };
}

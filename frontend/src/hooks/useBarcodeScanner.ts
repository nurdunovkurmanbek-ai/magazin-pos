import { useCallback, useEffect, useRef } from 'react';

/**
 * USB/Bluetooth keyboard-wedge сканерлер үчүн.
 * Сканер тез символдорду + Enter жиберет.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  options?: { enabled?: boolean; minLength?: number }
) {
  const enabled = options?.enabled ?? true;
  const minLength = options?.minLength ?? 3;
  const bufferRef = useRef('');
  const lastKeyAt = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const code = bufferRef.current.replace(/[\r\n\t]/g, '').trim();
    bufferRef.current = '';
    if (code.length >= minLength) onScan(code);
  }, [minLength, onScan]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingField =
        tag === 'input' || tag === 'textarea' || target?.isContentEditable;

      // Атайын сканер талаасында иштегенде бул hook кереги жок
      if (isTypingField && target?.dataset?.barcodeScanner !== 'true') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyAt.current > 80) {
        bufferRef.current = '';
      }
      lastKeyAt.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          flush();
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        bufferRef.current += e.key;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          // Сканер Enter жибербесе да, тынчтыктан кийин flush
          if (bufferRef.current.length >= 8) flush();
        }, 120);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, flush, minLength]);
}

export function triggerTactileFeedback(
  type: 'next' | 'prev' | 'secondary',
  options: { haptic: boolean }
) {
  if (options.haptic && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(type === 'next' ? 14 : type === 'prev' ? [10, 25, 10] : 8);
    } catch {
      // Vibration blocked
    }
  }
}


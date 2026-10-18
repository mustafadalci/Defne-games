// Registers the offline cache (sw.js). Silently does nothing where service workers are unavailable.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

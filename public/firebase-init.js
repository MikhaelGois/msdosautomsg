// Firebase integration removed — file left as no-op to avoid runtime errors.
// To fully remove traces, delete this file.
initModule().then((ok) => { window.cloudModuleReady = !!ok; }).catch((e) => { console.warn('firebase-init: error', e); window.cloudModuleReady = false; });

// ═══════════════════════════════════════════════════════
//  Luna Worker — IA Offline via Transformers.js
//  Tourne dans un Web Worker séparé (ne bloque pas l'UI)
// ═══════════════════════════════════════════════════════
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Utiliser le cache navigateur (OPFS/IndexedDB) → offline après 1ère fois
env.useBrowserCache  = true;
env.allowLocalModels = false;

let pipe = null;

async function loadModel() {
  try {
    self.postMessage({ type: 'STATUS', text: 'Initialisation…' });

    pipe = await pipeline(
      'text2text-generation',
      'Xenova/LaMini-Flan-T5-248M',
      {
        progress_callback: (info) => {
          self.postMessage({ type: 'PROGRESS', data: info });
        }
      }
    );

    self.postMessage({ type: 'READY' });
  } catch (e) {
    self.postMessage({ type: 'ERROR', text: e.message });
  }
}

async function generate(prompt) {
  if (!pipe) {
    self.postMessage({ type: 'ERROR', text: 'Modèle non chargé' });
    return;
  }
  try {
    const output = await pipe(prompt, {
      max_new_tokens:      180,
      temperature:         0.75,
      do_sample:           true,
      repetition_penalty:  1.3,
      no_repeat_ngram_size: 3,
    });
    self.postMessage({ type: 'RESULT', text: output[0].generated_text });
  } catch (e) {
    self.postMessage({ type: 'ERROR', text: e.message });
  }
}

self.addEventListener('message', ({ data }) => {
  if (data.type === 'LOAD')     loadModel();
  if (data.type === 'GENERATE') generate(data.prompt);
});

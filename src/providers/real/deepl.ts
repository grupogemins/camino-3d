/** Provedor REAL de tradução de texto: DeepL API. Requer DEEPL_API_KEY (servidor). */
import { findPhrase } from '@/data/demo/phrases';
import { ProviderNotConfiguredError, type TranslationProvider } from '../types';

export function createDeepLProvider(apiKey = process.env.DEEPL_API_KEY): TranslationProvider {
  return {
    id: 'deepl',
    async translate({ text, from, to }) {
      // Frases revisadas têm prioridade (funcionam offline e evitam custo).
      const phrase = findPhrase(text, from)?.text[to];
      if (phrase) return { text: phrase, from, to, method: 'phrasebook' };
      if (!apiKey) throw new ProviderNotConfiguredError('DeepL', 'DEEPL_API_KEY');
      const host = apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
      const target = to === 'pt' ? 'PT-PT' : to === 'en' ? 'EN-GB' : to.toUpperCase();
      const res = await fetch(`${host}/v2/translate`, {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: [text], source_lang: from.toUpperCase(), target_lang: target }),
      });
      if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`);
      const j = (await res.json()) as { translations: { text: string }[] };
      return { text: j.translations[0]?.text ?? '', from, to, method: 'machine' };
    },
  };
}

/** Frases essenciais para uso offline. Traduções revisadas manualmente; ainda assim, demonstração. */
export type PhraseCategory = 'hospedagem' | 'restaurante' | 'farmacia' | 'emergencia' | 'transporte' | 'direcoes' | 'alergias' | 'saude' | 'conversa';

export const PHRASE_CATEGORIES: { id: PhraseCategory; label: string }[] = [
  { id: 'emergencia', label: 'Emergência' },
  { id: 'saude', label: 'Saúde' },
  { id: 'alergias', label: 'Alergias' },
  { id: 'farmacia', label: 'Farmácia' },
  { id: 'hospedagem', label: 'Hospedagem' },
  { id: 'restaurante', label: 'Restaurante' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'direcoes', label: 'Direções' },
  { id: 'conversa', label: 'Conversa' },
];

export type LangCode = 'pt' | 'es' | 'en' | 'fr' | 'de' | 'it';

export const LANGUAGES: { code: LangCode; label: string; bcp47: string }[] = [
  { code: 'pt', label: 'Português', bcp47: 'pt-PT' },
  { code: 'es', label: 'Español', bcp47: 'es-ES' },
  { code: 'en', label: 'English', bcp47: 'en-GB' },
  { code: 'fr', label: 'Français', bcp47: 'fr-FR' },
  { code: 'de', label: 'Deutsch', bcp47: 'de-DE' },
  { code: 'it', label: 'Italiano', bcp47: 'it-IT' },
];

export interface Phrase {
  id: string;
  category: PhraseCategory;
  text: Partial<Record<LangCode, string>> & { pt: string; es: string; en: string };
}

export const PHRASES: Phrase[] = [
  { id: 'em1', category: 'emergencia', text: { pt: 'Preciso de ajuda, por favor.', es: 'Necesito ayuda, por favor.', en: 'I need help, please.', fr: "J'ai besoin d'aide, s'il vous plaît.", de: 'Ich brauche bitte Hilfe.', it: 'Ho bisogno di aiuto, per favore.' } },
  { id: 'em2', category: 'emergencia', text: { pt: 'Chame uma ambulância.', es: 'Llame a una ambulancia.', en: 'Call an ambulance.', fr: 'Appelez une ambulance.', de: 'Rufen Sie einen Krankenwagen.', it: "Chiami un'ambulanza." } },
  { id: 'em3', category: 'emergencia', text: { pt: 'Estou perdido no Caminho.', es: 'Me he perdido en el Camino.', en: 'I am lost on the Camino.', fr: 'Je suis perdu sur le Chemin.', de: 'Ich habe mich auf dem Jakobsweg verlaufen.', it: 'Mi sono perso sul Cammino.' } },
  { id: 'sa1', category: 'saude', text: { pt: 'Tenho bolhas nos pés.', es: 'Tengo ampollas en los pies.', en: 'I have blisters on my feet.', fr: "J'ai des ampoules aux pieds.", de: 'Ich habe Blasen an den Füßen.', it: 'Ho delle vesciche ai piedi.' } },
  { id: 'sa2', category: 'saude', text: { pt: 'Torci o tornozelo.', es: 'Me he torcido el tobillo.', en: 'I twisted my ankle.', fr: "Je me suis tordu la cheville.", de: 'Ich habe mir den Knöchel verstaucht.', it: 'Mi sono slogato la caviglia.' } },
  { id: 'sa3', category: 'saude', text: { pt: 'Onde fica o centro de saúde?', es: '¿Dónde está el centro de salud?', en: 'Where is the health centre?', fr: 'Où est le centre de santé ?', de: 'Wo ist das Gesundheitszentrum?', it: "Dov'è il centro medico?" } },
  { id: 'al1', category: 'alergias', text: { pt: 'Sou alérgico a penicilina.', es: 'Soy alérgico a la penicilina.', en: 'I am allergic to penicillin.', fr: 'Je suis allergique à la pénicilline.', de: 'Ich bin allergisch gegen Penicillin.', it: 'Sono allergico alla penicillina.' } },
  { id: 'al2', category: 'alergias', text: { pt: 'Sou celíaco. Não posso comer glúten.', es: 'Soy celíaco. No puedo comer gluten.', en: 'I am coeliac. I cannot eat gluten.', fr: 'Je suis cœliaque. Je ne peux pas manger de gluten.', de: 'Ich habe Zöliakie. Ich darf kein Gluten essen.', it: 'Sono celiaco. Non posso mangiare glutine.' } },
  { id: 'al3', category: 'alergias', text: { pt: 'Tenho alergia a frutos secos.', es: 'Tengo alergia a los frutos secos.', en: 'I am allergic to nuts.', fr: 'Je suis allergique aux fruits à coque.', de: 'Ich bin allergisch gegen Nüsse.', it: 'Sono allergico alla frutta secca.' } },
  { id: 'fa1', category: 'farmacia', text: { pt: 'Tem algo para dor muscular?', es: '¿Tiene algo para el dolor muscular?', en: 'Do you have something for muscle pain?', fr: 'Avez-vous quelque chose pour les douleurs musculaires ?', de: 'Haben Sie etwas gegen Muskelschmerzen?', it: 'Ha qualcosa per il dolore muscolare?' } },
  { id: 'fa2', category: 'farmacia', text: { pt: 'Preciso de pensos para bolhas.', es: 'Necesito apósitos para ampollas.', en: 'I need blister plasters.', fr: "J'ai besoin de pansements pour ampoules.", de: 'Ich brauche Blasenpflaster.', it: 'Ho bisogno di cerotti per vesciche.' } },
  { id: 'ho1', category: 'hospedagem', text: { pt: 'Há camas livres para hoje?', es: '¿Hay camas libres para hoy?', en: 'Are there any free beds tonight?', fr: 'Y a-t-il des lits libres ce soir ?', de: 'Gibt es heute noch freie Betten?', it: 'Ci sono letti liberi per stanotte?' } },
  { id: 'ho2', category: 'hospedagem', text: { pt: 'A que horas fecha a porta?', es: '¿A qué hora cierran la puerta?', en: 'What time do you lock the door?', fr: 'À quelle heure fermez-vous la porte ?', de: 'Wann wird die Tür abgeschlossen?', it: 'A che ora chiudete la porta?' } },
  { id: 'ho3', category: 'hospedagem', text: { pt: 'Posso lavar roupa aqui?', es: '¿Puedo lavar ropa aquí?', en: 'Can I do laundry here?', fr: 'Puis-je faire une lessive ici ?', de: 'Kann ich hier Wäsche waschen?', it: 'Posso fare il bucato qui?' } },
  { id: 're1', category: 'restaurante', text: { pt: 'Tem menu do peregrino?', es: '¿Tienen menú del peregrino?', en: 'Do you have a pilgrim menu?', fr: 'Avez-vous un menu du pèlerin ?', de: 'Haben Sie ein Pilgermenü?', it: 'Avete un menù del pellegrino?' } },
  { id: 're2', category: 'restaurante', text: { pt: 'Posso encher a minha garrafa de água?', es: '¿Puedo llenar mi botella de agua?', en: 'Can I fill my water bottle?', fr: "Puis-je remplir ma gourde ?", de: 'Kann ich meine Wasserflasche auffüllen?', it: 'Posso riempire la mia borraccia?' } },
  { id: 're3', category: 'restaurante', text: { pt: 'A conta, por favor.', es: 'La cuenta, por favor.', en: 'The bill, please.', fr: "L'addition, s'il vous plaît.", de: 'Die Rechnung, bitte.', it: 'Il conto, per favore.' } },
  { id: 'tr1', category: 'transporte', text: { pt: 'Onde fica a paragem de autocarro?', es: '¿Dónde está la parada de autobús?', en: 'Where is the bus stop?', fr: "Où est l'arrêt de bus ?", de: 'Wo ist die Bushaltestelle?', it: "Dov'è la fermata dell'autobus?" } },
  { id: 'tr2', category: 'transporte', text: { pt: 'Preciso de um táxi até a próxima vila.', es: 'Necesito un taxi hasta el próximo pueblo.', en: 'I need a taxi to the next village.', fr: "J'ai besoin d'un taxi jusqu'au prochain village.", de: 'Ich brauche ein Taxi zum nächsten Dorf.', it: 'Ho bisogno di un taxi fino al prossimo paese.' } },
  { id: 'di1', category: 'direcoes', text: { pt: 'Por onde segue o Caminho?', es: '¿Por dónde sigue el Camino?', en: 'Which way does the Camino go?', fr: 'Par où continue le Chemin ?', de: 'Wo geht der Jakobsweg weiter?', it: 'Da che parte prosegue il Cammino?' } },
  { id: 'di2', category: 'direcoes', text: { pt: 'Quantos quilômetros faltam para Santiago?', es: '¿Cuántos kilómetros faltan para Santiago?', en: 'How many kilometres to Santiago?', fr: 'Combien de kilomètres jusqu’à Santiago ?', de: 'Wie viele Kilometer sind es noch bis Santiago?', it: 'Quanti chilometri mancano per Santiago?' } },
  { id: 'co1', category: 'conversa', text: { pt: 'Bom Caminho!', es: '¡Buen Camino!', en: 'Buen Camino!', fr: 'Buen Camino !', de: 'Buen Camino!', it: 'Buen Camino!' } },
  { id: 'co2', category: 'conversa', text: { pt: 'De onde você é?', es: '¿De dónde eres?', en: 'Where are you from?', fr: "D'où viens-tu ?", de: 'Woher kommst du?', it: 'Di dove sei?' } },
  { id: 'co3', category: 'conversa', text: { pt: 'Obrigado pela ajuda.', es: 'Gracias por la ayuda.', en: 'Thank you for your help.', fr: "Merci pour l'aide.", de: 'Danke für die Hilfe.', it: "Grazie per l'aiuto." } },
];

/** Busca frase equivalente (comparação sem acentos/pontuação) para tradução offline. */
export function findPhrase(text: string, from: LangCode): Phrase | undefined {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
  const q = norm(text);
  if (!q) return undefined;
  return PHRASES.find((p) => {
    const t = p.text[from];
    return t ? norm(t) === q : false;
  });
}

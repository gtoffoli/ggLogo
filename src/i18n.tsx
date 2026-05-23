// i18n.tsx (Versione con Caricamento Statico)

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import HttpBackend from 'i18next-http-backend'; // Per caricare i file JSON dal server

// 1. Importa i dati (Assicurati che il percorso sia corretto rispetto a i18n.tsx)
import translationEN from '../public/locales/en/translation.json'; 
import translationIT from '../public/locales/it/translation.json';
import translationFR from '../public/locales/fr/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  it: {
    translation: translationIT,
  },
  fr: {
    translation: translationFR,
  },
};

i18n
//  .use(HttpBackend) // Carica i file di traduzione
  .use(initReactI18next) // Passa l'istanza di i18n a react-i18next
  .init({
    resources, // Aggiunto il blocco di risorse statiche
    fallbackLng: 'en', // Lingua di riserva
    lng: 'it', // Lingua iniziale
    debug: true,
    interpolation: {
      escapeValue: false, // React fa già l'escape
    },
 //   backend: {
 //     // Dove trovare i file di traduzione
 //     loadPath: '/locales/{{lng}}/translation.json', 
 //   },
  });

export default i18n;

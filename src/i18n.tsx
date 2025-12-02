import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend'; // Per caricare i file JSON dal server

i18n
  .use(HttpBackend) // Carica i file di traduzione
  .use(initReactI18next) // Passa l'istanza di i18n a react-i18next
  .init({
    fallbackLng: 'en', // Lingua di riserva
    lng: 'it', // Lingua iniziale
    debug: true,
    interpolation: {
      escapeValue: false, // React fa già l'escape
    },
    backend: {
      // Dove trovare i file di traduzione
      loadPath: '/locales/{{lng}}/translation.json', 
    },
  });

export default i18n;

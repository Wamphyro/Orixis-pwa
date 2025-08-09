/* ========================================
   UTILS/INDEX.JS - Point d'entrée central des utilitaires
   Chemin: src/utils/index.js
   
   DESCRIPTION:
   Centralise tous les exports des utils pour simplifier les imports.
   Permet d'importer depuis '@/utils' au lieu de chemins spécifiques.
   Offre deux modes d'import : direct ou groupé.
   
   UTILISATION:
   
   // Import direct (recommandé pour la plupart des cas)
   import { formatMontant, validerNSS, $, cache } from '@/utils';
   
   // Import groupé (utile pour éviter les conflits de noms)
   import { formatters, validators } from '@/utils';
   formatters.formatMontant(150);
   validators.validerNSS(nss);
   
   // Import mixte
   import { cache, formatters, $ } from '@/utils';
   
   STRUCTURE:
   - PARTIE 1 : Ré-exports directs (tous les exports disponibles)
   - PARTIE 2 : Exports groupés par module (namespace)
   - PARTIE 3 : Alias pratiques pour les plus utilisés
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale avec 7 modules utils
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

// ========================================
// PARTIE 1 : RÉ-EXPORTS DIRECTS
// Permet : import { formatMontant, validerNSS } from '@/utils';
// ========================================

// Auth - Authentification Firebase
export * from './auth/auth.utils.js';

// Core - Formatters
export * from './core/formatters.utils.js';

// Core - Dates
export * from './core/dates.utils.js';

// Core - Validators
export * from './core/validators.utils.js';

// UI - Export
export * from './ui/export.utils.js';

// UI - DOM
export * from './ui/dom.utils.js';

// Data - Cache (export par défaut)
export { default as cache } from './data/cache.utils.js';

// ========================================
// PARTIE 2 : EXPORTS GROUPÉS PAR MODULE
// Permet : import { formatters, validators } from '@/utils';
// Utile pour éviter les conflits de noms ou organiser le code
// ========================================

// Auth namespace
export * as auth from './auth/auth.utils.js';
export * as authUtils from './auth/auth.utils.js'; // Alias

// Core namespaces
export * as formatters from './core/formatters.utils.js';
export * as dates from './core/dates.utils.js';
export * as validators from './core/validators.utils.js';

// UI namespaces
export * as dom from './ui/dom.utils.js';
export * as exports from './ui/export.utils.js';
export * as exportUtils from './ui/export.utils.js'; // Alias car 'exports' peut être réservé

// Data namespace (déjà exporté comme default)
// Le cache est déjà accessible via : import { cache } from '@/utils';

// ========================================
// PARTIE 3 : ALIAS ET HELPERS PRATIQUES
// Crée des raccourcis pour les fonctions les plus utilisées
// ========================================

// Alias pour les fonctions DOM les plus courantes
import { $ as querySelector, $$ as querySelectorAll } from './ui/dom.utils.js';
export { querySelector, querySelectorAll };

// Groupement thématique pour validation de formulaires
import { 
    validerNSS, 
    validerEmail, 
    validerTelephone,
    validerIBAN,
    validerMontant,
    validerSIRET 
} from './core/validators.utils.js';

import {
    nettoyerNSS,
    nettoyerTelephone,
    nettoyerEmail,
    nettoyerIBAN,
    nettoyerSIRET
} from './core/validators.utils.js';

export const validation = {
    nss: validerNSS,
    email: validerEmail,
    telephone: validerTelephone,
    iban: validerIBAN,
    montant: validerMontant,
    siret: validerSIRET
};

export const nettoyage = {
    nss: nettoyerNSS,
    telephone: nettoyerTelephone,
    email: nettoyerEmail,
    iban: nettoyerIBAN,
    siret: nettoyerSIRET
};

// Groupement pour les formats les plus utilisés
import {
    formatMontant,
    formatNSS,
    formatTelephone,
    formatDate,
    formatDateTime,
    formatPourcentage
} from './core/formatters.utils.js';

export const format = {
    montant: formatMontant,
    nss: formatNSS,
    telephone: formatTelephone,
    date: formatDate,
    dateTime: formatDateTime,
    pourcentage: formatPourcentage
};

// ========================================
// EXPORTS COMPOSÉS POUR CAS D'USAGE COURANTS
// Bundles pré-configurés pour différents besoins
// ========================================

/**
 * Bundle pour les formulaires
 * Contient tout le nécessaire pour valider et formater un formulaire
 */
export const formUtils = {
    // Validation
    validerNSS,
    validerEmail,
    validerTelephone,
    validerMontant,
    validerIBAN,
    
    // Nettoyage
    nettoyerNSS,
    nettoyerEmail,
    nettoyerTelephone,
    
    // Formatage
    formatNSS,
    formatTelephone,
    formatMontant,
    
    // DOM
    $: querySelector,
    $$: querySelectorAll,
    setHTML: dom.setHTML,
    on: dom.on
};

/**
 * Bundle pour l'affichage de données
 * Tout pour formater et afficher proprement
 */
export const displayUtils = {
    // Formatage
    formatMontant,
    formatDate,
    formatNSS,
    formatTelephone,
    formatPourcentage,
    formatFileSize: formatters.formatFileSize,
    
    // DOM
    createElement: dom.createElement,
    setHTML: dom.setHTML,
    addClass: dom.addClass,
    show: dom.show,
    hide: dom.hide
};

/**
 * Bundle pour les exports de données
 * Tout pour exporter en différents formats
 */
export const exportBundle = {
    csv: exports.exportCSV,
    excel: exports.exportExcel,
    pdf: exports.exportPDF,
    json: exports.exportJSON,
    html: exports.exportHTML
};

// ========================================
// HELPERS DE COMPATIBILITÉ
// Pour ceux qui ont l'habitude d'autres conventions
// ========================================

// jQuery-like
export { $ } from './ui/dom.utils.js';
export { $$ } from './ui/dom.utils.js';

// Lodash-like (pour les dates)
import * as dateUtils from './core/dates.utils.js';
export const _ = {
    parseDate: dateUtils.parseDate,
    formatDate: dateUtils.formatDate,
    addDays: dateUtils.addDays,
    diffDays: dateUtils.diffDays
};

// ========================================
// DEFAULT EXPORT
// Export par défaut avec TOUT organisé
// ========================================

export default {
    // Modules complets
    auth,
    formatters,
    dates,
    validators,
    dom,
    exports,
    cache,
    
    // Bundles thématiques
    formUtils,
    displayUtils,
    exportBundle,
    
    // Helpers
    validation,
    nettoyage,
    format,
    
    // Alias jQuery-like
    $: querySelector,
    $$: querySelectorAll,
    
    // Meta info
    version: '1.0.0',
    modules: [
        'auth',
        'formatters',
        'dates', 
        'validators',
        'dom',
        'exports',
        'cache'
    ]
};

/* ========================================
   GUIDE D'UTILISATION RAPIDE
   ========================================
   
   1. IMPORT SIMPLE (Recommandé)
   ------------------------------
   import { formatMontant, validerNSS, $, cache } from '@/utils';
   
   const montant = formatMontant(150.50);  // "150,50 €"
   const isValid = validerNSS(nss);        // true/false
   const element = $('.ma-classe');        // Element ou null
   const data = await cache.get('key');    // Cached data
   
   
   2. IMPORT GROUPÉ (Pour éviter conflits)
   ----------------------------------------
   import { formatters, validators } from '@/utils';
   
   const montant = formatters.formatMontant(150.50);
   const isValid = validators.validerNSS(nss);
   
   
   3. IMPORT BUNDLE (Pour cas d'usage spécifique)
   -----------------------------------------------
   import { formUtils } from '@/utils';
   
   // Tout pour gérer un formulaire
   const isValid = formUtils.validerEmail(email);
   const formatted = formUtils.formatTelephone(tel);
   formUtils.$('#submit').addEventListener('click', ...);
   
   
   4. IMPORT DEFAULT (Tout accessible)
   ------------------------------------
   import utils from '@/utils';
   
   utils.formatters.formatMontant(150);
   utils.validators.validerNSS(nss);
   utils.cache.get('key');
   
   
   5. DESTRUCTURING AVANCÉ
   ------------------------
   import { 
     formatters: { formatMontant, formatDate },
     validators: { validerNSS },
     cache,
     $
   } from '@/utils';
   
   
   NOTES:
   - Privilégier l'import direct (option 1) pour la simplicité
   - Utiliser l'import groupé si conflits de noms
   - Les bundles sont pratiques pour des tâches spécifiques
   - Le default export contient TOUT si besoin
   
   ======================================== */

/* ========================================
   FIN DU FICHIER
   ======================================== */
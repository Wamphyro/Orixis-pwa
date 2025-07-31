// ========================================
// INTERVENTION.UTILS.JS - Fonctions utilitaires partagées
// Chemin: src/js/pages/intervention/intervention.utils.js
//
// DESCRIPTION:
// Fonctions utilitaires pour le module intervention
// Basé sur commandes.utils.js mais adapté au contexte
// ========================================

import { 
    formatDate as sharedFormatDate,
    isValidPhone,
    debounce as sharedDebounce,
    generateId
} from '../../shared/index.js';

// ========================================
// FORMATAGE DES DATES
// ========================================

export function formatDate(timestamp, format = 'complet') {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    switch (format) {
        case 'jour':
            return sharedFormatDate(date, 'DD/MM/YYYY');
            
        case 'heure':
            return sharedFormatDate(date, 'HH:mm');
            
        case 'complet':
        default:
            return sharedFormatDate(date, 'DD/MM/YYYY HH:mm');
    }
}

// ========================================
// VALIDATION
// ========================================

export const validerTelephone = isValidPhone;

// ========================================
// FORMATAGE DES DONNÉES D'INTERVENTION
// ========================================

/**
 * Formater un problème avec son icône
 */
export function formatProbleme(probleme, config) {
    const configItem = Object.entries(config.PROBLEMES)
        .find(([key, val]) => val.label === probleme || key === probleme);
    
    if (configItem) {
        return `${configItem[1].icon} ${configItem[1].label}`;
    }
    return probleme;
}

/**
 * Formater une action avec son icône
 */
export function formatAction(action, config) {
    const configItem = Object.entries(config.ACTIONS)
        .find(([key, val]) => val.label === action || key === action);
    
    if (configItem) {
        return `${configItem[1].icon} ${configItem[1].label}`;
    }
    return action;
}

/**
 * Formater le type d'appareil
 */
export function formatTypeAppareil(type, config) {
    const typeConfig = config.TYPES_APPAREILS[type];
    return typeConfig ? `${typeConfig.icon} ${typeConfig.label}` : type;
}

/**
 * Formater le résultat
 */
export function formatResultat(resultat, config) {
    const resultatConfig = config.RESULTATS[resultat];
    return resultatConfig ? `${resultatConfig.icon} ${resultatConfig.label}` : resultat;
}

// ========================================
// HELPERS POUR LES STATUTS
// ========================================

export function getProchainStatut(statutActuel, config) {
    return config.STATUTS[statutActuel]?.suivant || null;
}

export function peutEtreModifiee(statut) {
    return ['nouvelle', 'en_cours'].includes(statut);
}

// ========================================
// GESTION DES ERREURS
// ========================================

export function logError(context, error) {
    console.error(`[${context}]`, error);
    
    // Ici on pourrait envoyer l'erreur à un service de monitoring
}

// ========================================
// DEBOUNCE
// ========================================

export const debounce = sharedDebounce;

// ========================================
// HELPERS DOM
// ========================================

export function toggleLoading(elementId, show = true) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (show) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// ========================================
// EXPORT DES DONNÉES POUR IMPRESSION
// ========================================

export function preparerDonneesImpression(intervention, config) {
    return {
        numeroIntervention: intervention.numeroIntervention,
        date: formatDate(intervention.dates.intervention, 'complet'),
        
        client: {
            nom: `${intervention.client.prenom} ${intervention.client.nom}`,
            telephone: intervention.client.telephone || '-',
            email: intervention.client.email || '-',
            magasin: intervention.client.magasinReference || '-'
        },
        
        appareil: {
            type: formatTypeAppareil(intervention.appareil.type, config),
            marque: intervention.appareil.marque,
            modele: intervention.appareil.modele || '-',
            numeroSerie: intervention.appareil.numeroSerie || '-'
        },
        
        diagnostic: {
            problemes: intervention.problemes.map(p => formatProbleme(p, config)),
            actions: intervention.actions.map(a => formatAction(a, config))
        },
        
        resultat: formatResultat(intervention.resultat, config),
        observations: intervention.observations || '-',
        
        intervenant: intervention.intervenant ? 
            `${intervention.intervenant.prenom} ${intervention.intervenant.nom}` : '-',
        
        signatures: intervention.signatures || {}
    };
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    formatDate,
    validerTelephone,
    formatProbleme,
    formatAction,
    formatTypeAppareil,
    formatResultat,
    getProchainStatut,
    peutEtreModifiee,
    logError,
    debounce,
    toggleLoading,
    preparerDonneesImpression
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [02/02/2025] - Création du fichier
   - Fonctions utilitaires adaptées aux interventions
   - Formatage spécifique pour problèmes/actions
   - Préparation des données pour impression
   
   NOTES POUR REPRISES FUTURES:
   - Utilise les fonctions shared quand possible
   - Formatage adapté au contexte intervention
   - Peut être étendu selon les besoins
   ======================================== */
// ========================================
// DECOMPTE-MUTUELLE.DATA.JS - Données métier UNIQUEMENT
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.data.js
//
// DESCRIPTION:
// Contient UNIQUEMENT les constantes et données de référence métier
// PAS de configuration UI, PAS de fonctions de génération pour l'UI
// Données pures du domaine métier des décomptes mutuelles
//
// STRUCTURE:
// - Constantes métier (statuts, mutuelles, prestataires)
// - Validations métier (NSS, montants)
// - Fonctions helpers métier pures
// - Messages et textes métier
// ========================================

export const DECOMPTES_CONFIG = {
    // Configuration générale
    ITEMS_PAR_PAGE: 20,
    DELAI_RECHERCHE: 300, // ms pour debounce
    
    // ========================================
    // STATUTS DE DÉCOMPTE (données métier)
    // ========================================
    STATUTS: {
        nouveau: {
            label: 'Nouveau',
            icon: '📋',
            couleur: '#e9ecef',
            suivant: 'traitement_ia',
            description: 'Décompte créé, en attente de traitement'
        },
        traitement_ia: {
            label: 'Traitement IA',
            icon: '🤖',
            couleur: '#cfe2ff',
            suivant: 'traitement_effectue',
            description: 'En cours de traitement par intelligence artificielle'
        },
        traitement_effectue: {
            label: 'Traité',
            icon: '✅',
            couleur: '#d1e7dd',
            suivant: 'rapprochement_bancaire',
            description: 'Traitement terminé, en attente de rapprochement'
        },
        traitement_manuel: {
            label: 'Traitement manuel',
            icon: '✏️',
            couleur: '#fff3cd',
            suivant: 'rapprochement_bancaire',
            description: 'Nécessite une intervention manuelle'
        },
        rapprochement_bancaire: {
            label: 'Rapproché',
            icon: '🔗',
            couleur: '#e7f1ff',
            suivant: null,
            description: 'Rapprochement bancaire effectué'
        },
        supprime: {
            label: 'Supprimé',
            icon: '🗑️',
            couleur: '#f8d7da',
            suivant: null,
            description: 'Décompte supprimé'
        }
    },
    
    // ========================================
    // MUTUELLES RÉFÉRENCÉES (données métier)
    // ========================================
    MUTUELLES: {
        harmonie: {
            nom: 'Harmonie Mutuelle',
            code: 'HARM',
            delaiTraitement: 5
        },
        mgen: {
            nom: 'MGEN',
            code: 'MGEN',
            delaiTraitement: 7
        },
        malakoff: {
            nom: 'Malakoff Humanis',
            code: 'MALA',
            delaiTraitement: 5
        },
        ag2r: {
            nom: 'AG2R La Mondiale',
            code: 'AG2R',
            delaiTraitement: 6
        },
        allianz: {
            nom: 'Allianz',
            code: 'ALLI',
            delaiTraitement: 4
        },
        swisslife: {
            nom: 'SwissLife',
            code: 'SWIS',
            delaiTraitement: 5
        },
        generali: {
            nom: 'Generali',
            code: 'GENE',
            delaiTraitement: 6
        },
        april: {
            nom: 'April',
            code: 'APRI',
            delaiTraitement: 3
        }
    },
    
    // ========================================
    // PRESTATAIRES TIERS PAYANT (données métier)
    // ========================================
    PRESTATAIRES_TP: {
        viamedis: {
            nom: 'Viamedis',
            code: 'VIA',
            formatId: /^VIA[0-9]{10}$/
        },
        almerys: {
            nom: 'Almerys',
            code: 'ALM',
            formatId: /^ALM[0-9]{10}$/
        },
        sp_sante: {
            nom: 'SP Santé',
            code: 'SPS',
            formatId: /^SPS[0-9]{10}$/
        },
        istya: {
            nom: 'IstYa',
            code: 'IST',
            formatId: /^IST[0-9]{10}$/
        },
        tessi: {
            nom: 'Tessi',
            code: 'TES',
            formatId: /^TES[0-9]{10}$/
        }
    },
    
    // ========================================
    // TYPES DE DÉCOMPTE (données métier)
    // ========================================
    TYPES_DECOMPTE: {
        individuel: {
            label: 'Individuel',
            icon: '👤',
            description: 'Décompte pour un seul client'
        },
        groupe: {
            label: 'Groupé',
            icon: '👥',
            description: 'Décompte pour plusieurs clients'
        }
    },
    
    // ========================================
    // MESSAGES ET TEXTES
    // ========================================
    MESSAGES: {
        AUCUN_DECOMPTE: 'Aucun décompte mutuelle pour le moment',
        CHARGEMENT: 'Chargement des décomptes...',
        ERREUR_CHARGEMENT: 'Erreur lors du chargement des décomptes',
        DECOMPTE_CREE: 'Décompte créé avec succès',
        DECOMPTE_MIS_A_JOUR: 'Décompte mis à jour',
        DECOMPTE_SUPPRIME: 'Décompte supprimé avec succès',
        
        // Confirmations
        CONFIRMER_SUPPRESSION: 'Êtes-vous sûr de vouloir supprimer ce décompte ?',
        CONFIRMER_TRANSMISSION: 'Confirmer la transmission à l\'IA pour traitement ?',
        CONFIRMER_VALIDATION: 'Confirmer la validation du traitement ?',
        CONFIRMER_RAPPROCHEMENT: 'Confirmer le rapprochement bancaire ?',
        
        // Erreurs
        ERREUR_NSS_INVALIDE: 'Numéro de sécurité sociale invalide',
        ERREUR_MONTANT_INVALIDE: 'Montant invalide',
        ERREUR_DROITS: 'Vous n\'avez pas les droits pour cette action'
    },
    
    // ========================================
    // VALIDATIONS (regex métier)
    // ========================================
    VALIDATIONS: {
        NSS: /^[12][0-9]{2}(0[1-9]|1[0-2])[0-9]{2}[0-9]{3}[0-9]{3}[0-9]{2}$/,
        MONTANT: /^\d+(\.\d{1,2})?$/,
        VIREMENT_ID: /^VIR-\d{4}-\d{2}-\d{3}$/,
        NUMERO_DECOMPTE: /^DEC-\d{8}-\d{4}$/
    },
    
    // ========================================
    // FORMATS D'AFFICHAGE (données métier)
    // ========================================
    FORMATS: {
        DATE: {
            jour: 'DD/MM/YYYY',
            mois: 'MM/YYYY',
            complet: 'DD/MM/YYYY à HH:mm'
        },
        NUMERO_DECOMPTE: 'DEC-{YYYYMMDD}-{XXXX}', // XXXX = numéro séquentiel
        VIREMENT_ID: 'VIR-{YYYY}-{MM}-{XXX}', // XXX = numéro de virement
        MONTANT: {
            devise: '€',
            decimales: 2
        }
    }
};

// ========================================
// FONCTIONS HELPERS MÉTIER (pas UI)
// ========================================

// Fonction helper pour générer un numéro de décompte
export function genererNumeroDecompte() {
    const date = new Date();
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `DEC-${annee}${mois}${jour}-${sequence}`;
}

// Fonction helper pour générer un ID de virement
export function genererVirementId(date = new Date()) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `VIR-${annee}-${mois}-${numero}`;
}

// Fonction helper pour formater un NSS
export function formaterNSS(nss) {
    if (!nss) return '-';
    
    // Retirer tous les espaces existants
    const nssClean = nss.replace(/\s/g, '');
    
    // Formater : 1 85 05 78 006 048 22
    if (nssClean.length === 13) {
        return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)} ${nssClean.slice(13)}`;
    }
    
    return nss; // Retourner tel quel si format incorrect
}

// Fonction helper pour valider un NSS
export function validerNSS(nss) {
    if (!nss) return false;
    
    // Retirer les espaces pour la validation
    const nssClean = nss.replace(/\s/g, '');
    
    // Vérifier le format de base
    if (!DECOMPTES_CONFIG.VALIDATIONS.NSS.test(nssClean)) {
        return false;
    }
    
    // Vérifier la clé de contrôle (97 - (numéro % 97))
    const numero = nssClean.slice(0, 13);
    const cle = parseInt(nssClean.slice(13));
    const cleCalculee = 97 - (parseInt(numero) % 97);
    
    return cle === cleCalculee;
}

// Fonction helper pour formater un montant
export function formaterMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

// Fonction helper pour formater une date
export function formaterDate(timestamp, format = 'complet') {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    switch (format) {
        case 'jour':
            return date.toLocaleDateString('fr-FR');
        case 'mois':
            return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        case 'complet':
        default:
            return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
}

// Fonction helper pour obtenir le prochain statut
export function getProchainStatut(statutActuel) {
    return DECOMPTES_CONFIG.STATUTS[statutActuel]?.suivant || null;
}

// Fonction helper pour vérifier si un décompte peut être supprimé
export function peutEtreSupprime(statut) {
    return statut !== 'supprime' && statut !== 'rapprochement_bancaire';
}

// Fonction helper pour calculer le délai de traitement
export function calculerDelaiTraitement(mutuelle) {
    const config = Object.values(DECOMPTES_CONFIG.MUTUELLES).find(m => m.nom === mutuelle);
    return config?.delaiTraitement || 5; // 5 jours par défaut
}

// Fonction helper pour obtenir la liste des mutuelles
export function getListeMutuelles() {
    // Si on a des mutuelles dynamiques, on les utilise
    if (mutuellesDynamiques.size > 0) {
        return Array.from(mutuellesDynamiques).sort();
    }
    
    // Sinon, on retourne la liste fixe comme fallback
    return Object.values(DECOMPTES_CONFIG.MUTUELLES).map(m => m.nom);
}

// Fonction helper pour obtenir la liste des prestataires
export function getListePrestataires() {
    return Object.values(DECOMPTES_CONFIG.PRESTATAIRES_TP).map(p => p.nom);
}

// ========================================
// DONNÉES DYNAMIQUES (mises à jour depuis Firestore)
// ========================================

// Stockage des mutuelles extraites des décomptes réels
let mutuellesDynamiques = new Set();

// Fonction pour mettre à jour les mutuelles depuis les décomptes
export function mettreAJourMutuelles(decomptes) {
    mutuellesDynamiques.clear();
    
    decomptes.forEach(decompte => {
        if (decompte.mutuelle && decompte.mutuelle !== '') {
            mutuellesDynamiques.add(decompte.mutuelle);
        }
    });
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [02/02/2025] - Création initiale
   - Données métier pures uniquement
   - Aucune configuration UI
   - Fonctions helpers métier
   - Validations métier (NSS avec clé de contrôle)
   
   NOTES POUR REPRISES FUTURES:
   - Ce fichier contient UNIQUEMENT les données métier
   - Toute config UI est dans les orchestrateurs
   - Les fonctions de génération UI sont dans les orchestrateurs
   ======================================== */
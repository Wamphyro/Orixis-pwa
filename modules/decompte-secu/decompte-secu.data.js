// ========================================
// DECOMPTE-SECU.DATA.JS - Données métier UNIQUEMENT
// Chemin: modules/decompte-secu/decompte-secu.data.js
//
// DESCRIPTION:
// Contient UNIQUEMENT les constantes et données de référence métier
// PAS de configuration UI, PAS de fonctions de génération pour l'UI
// Données pures du domaine métier des décomptes sécurité sociale
//
// STRUCTURE:
// - Constantes métier (statuts, régimes, taux, types d'actes)
// - Validations métier (NSS, montants)
// - Fonctions helpers métier pures
// - Messages et textes métier
// ========================================

export const DECOMPTES_SECU_CONFIG = {
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
            label: 'Analyse IA',
            icon: '🤖',
            couleur: '#cfe2ff',
            suivant: 'controle_taux',
            description: 'En cours d\'analyse par intelligence artificielle'
        },
        controle_taux: {
            label: 'Contrôle taux',
            icon: '🧮',
            couleur: '#fff3cd',
            suivant: 'traitement_effectue',
            description: 'Vérification des taux et calculs'
        },
        traitement_effectue: {
            label: 'Traité',
            icon: '✅',
            couleur: '#d1e7dd',
            suivant: 'paiement_effectue',
            description: 'Traitement terminé, en attente de paiement'
        },
        paiement_effectue: {
            label: 'Payé',
            icon: '💰',
            couleur: '#e7f1ff',
            suivant: null,
            description: 'Paiement effectué au bénéficiaire'
        },
        rejet: {
            label: 'Rejeté',
            icon: '❌',
            couleur: '#f8d7da',
            suivant: null,
            description: 'Décompte rejeté, vérifier les informations'
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
    // RÉGIMES SÉCURITÉ SOCIALE (données métier)
    // ========================================
    REGIMES: {
        general: {
            label: 'Régime Général',
            code: '01',
            icon: '🏥',
            description: 'Régime général de la Sécurité Sociale'
        },
        rsi: {
            label: 'RSI',
            code: '02',
            icon: '🏪',
            description: 'Régime Social des Indépendants'
        },
        msa: {
            label: 'MSA',
            code: '03',
            icon: '🌾',
            description: 'Mutualité Sociale Agricole'
        },
        special: {
            label: 'Régime Spécial',
            code: '04',
            icon: '⭐',
            description: 'Régimes spéciaux (SNCF, RATP, etc.)'
        }
    },

    // ========================================
    // TAUX DE REMBOURSEMENT STANDARDS
    // ========================================
    TAUX_REMBOURSEMENT: {
        // Consultations
        generaliste_secteur1: 70,
        specialiste_secteur1: 70,
        generaliste_secteur2: 70, // Sur base conventionnée
        
        // Pharmacie
        medicament_service_majeur: 65,
        medicament_service_modere: 30,
        medicament_service_faible: 15,
        medicament_comfort: 0,
        
        // Analyses
        analyses_laboratoire: 60,
        
        // Radiologie
        radiologie: 70,
        
        // Hospitalisation
        hospitalisation: 80,
        
        // ALD (Affection Longue Durée)
        ald: 100,
        
        // Maternité
        maternite: 100
    },

    // ========================================
    // TYPES D'ACTES MÉDICAUX
    // ========================================
    TYPES_ACTES: {
        consultation: {
            label: 'Consultation',
            icon: '👨‍⚕️',
            categorie: 'soins_courants'
        },
        pharmacie: {
            label: 'Pharmacie',
            icon: '💊',
            categorie: 'medicaments'
        },
        analyses: {
            label: 'Analyses',
            icon: '🔬',
            categorie: 'examens'
        },
        radiologie: {
            label: 'Radiologie',
            icon: '📷',
            categorie: 'examens'
        },
        hospitalisation: {
            label: 'Hospitalisation',
            icon: '🏥',
            categorie: 'hospitalier'
        },
        transport: {
            label: 'Transport',
            icon: '🚑',
            categorie: 'transport_medical'
        },
        optique: {
            label: 'Optique',
            icon: '👓',
            categorie: 'appareillage'
        },
        dentaire: {
            label: 'Dentaire',
            icon: '🦷',
            categorie: 'dentaire'
        },
        auxiliaires: {
            label: 'Auxiliaires médicaux',
            icon: '💉',
            categorie: 'soins_auxiliaires'
        }
    },

    // ========================================
    // PARTICIPATIONS ET FRANCHISES
    // ========================================
    PARTICIPATIONS: {
        FORFAITAIRE: 1, // 1€ par consultation/acte
        HOSPITALIERE: 20, // 20€ par jour d'hospitalisation
        FRANCHISE_MEDICAMENT: 0.50, // 0,50€ par boîte
        FRANCHISE_ACTE_PARAMEDICAL: 0.50, // 0,50€ par acte
        FRANCHISE_TRANSPORT: 2, // 2€ par transport
        
        // Plafonds annuels
        PLAFOND_FRANCHISE_ANNUEL: 50,
        PLAFOND_FRANCHISE_TRANSPORT: 50,
        PLAFOND_PARTICIPATION_HOSPITALIERE: null // Pas de plafond
    },
    
    // ========================================
    // CAISSES PRINCIPALES
    // ========================================
    CAISSES_PRINCIPALES: [
        'CPAM PARIS',
        'CPAM MARSEILLE',
        'CPAM LYON',
        'CPAM TOULOUSE',
        'CPAM NICE',
        'CPAM NANTES',
        'CPAM STRASBOURG',
        'CPAM MONTPELLIER',
        'CPAM BORDEAUX',
        'CPAM LILLE'
    ],
    
    // ========================================
    // MESSAGES ET TEXTES
    // ========================================
    MESSAGES: {
        AUCUN_DECOMPTE: 'Aucun décompte sécurité sociale pour le moment',
        CHARGEMENT: 'Chargement des décomptes...',
        ERREUR_CHARGEMENT: 'Erreur lors du chargement des décomptes',
        DECOMPTE_CREE: 'Décompte créé avec succès',
        DECOMPTE_MIS_A_JOUR: 'Décompte mis à jour',
        DECOMPTE_SUPPRIME: 'Décompte supprimé avec succès',
        
        // Confirmations
        CONFIRMER_SUPPRESSION: 'Êtes-vous sûr de vouloir supprimer ce décompte ?',
        CONFIRMER_TRANSMISSION: 'Confirmer la transmission à l\'IA pour analyse ?',
        CONFIRMER_VALIDATION_TAUX: 'Les taux de remboursement sont-ils corrects ?',
        CONFIRMER_PAIEMENT: 'Confirmer le paiement effectué ?',
        
        // Erreurs
        ERREUR_NSS_INVALIDE: 'Numéro de sécurité sociale invalide',
        ERREUR_MONTANT_INVALIDE: 'Montant invalide',
        ERREUR_TAUX_INVALIDE: 'Taux de remboursement invalide',
        ERREUR_BASE_REMBOURSEMENT: 'La base de remboursement ne peut pas dépasser le montant facturé',
        ERREUR_DROITS: 'Vous n\'avez pas les droits pour cette action'
    },
    
    // ========================================
    // VALIDATIONS (regex métier)
    // ========================================
    VALIDATIONS: {
        NSS: /^[12][0-9]{2}(0[1-9]|1[0-2])[0-9]{2}[0-9]{3}[0-9]{3}[0-9]{2}$/,
        MONTANT: /^\d+(\.\d{1,2})?$/,
        TAUX: /^(100|[1-9]?[0-9])$/,
        CODE_CCAM: /^[A-Z]{4}[0-9]{3}$/,
        NUMERO_FEUILLE_SOINS: /^[0-9]{10,15}$/,
        NUMERO_DECOMPTE: /^SECU-\d{8}-\d{4}$/
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
        NUMERO_DECOMPTE: 'SECU-{YYYYMMDD}-{XXXX}', // XXXX = numéro séquentiel
        NUMERO_PAIEMENT: 'PAY-{YYYY}-{MM}-{XXX}', // XXX = numéro de paiement
        MONTANT: {
            devise: '€',
            decimales: 2
        }
    }
};

// ========================================
// DONNÉES DYNAMIQUES (mises à jour depuis Firestore)
// ========================================

// Stockage des caisses extraites des décomptes réels
let caissesDynamiques = new Set();

// Fonction pour mettre à jour les caisses depuis les décomptes
export function mettreAJourCaisses(decomptes) {
    caissesDynamiques.clear();
    
    console.log('🔍 DEBUG - mettreAJourCaisses appelé avec', decomptes.length, 'décomptes');
    
    decomptes.forEach(decompte => {
        if (decompte.caissePrimaire && decompte.caissePrimaire !== '') {
            console.log('🔍 DEBUG - Ajout caisse:', decompte.caissePrimaire);
            caissesDynamiques.add(decompte.caissePrimaire);
        }
    });
    
    console.log('🔍 DEBUG - Caisses finales:', Array.from(caissesDynamiques));
}

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
    
    return `SECU-${annee}${mois}${jour}-${sequence}`;
}

// Fonction helper pour générer un ID de paiement
export function genererPaiementId(date = new Date()) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `PAY-${annee}-${mois}-${numero}`;
}

// Fonction helper pour formater un NSS
export function formaterNSS(nss) {
    if (!nss) return '-';
    
    // Retirer tous les espaces existants
    const nssClean = nss.replace(/\s/g, '');
    
    // Formater : 1 85 05 78 006 048 22
    if (nssClean.length === 13) {
        return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)}`;
    } else if (nssClean.length === 15) {
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
    if (!DECOMPTES_SECU_CONFIG.VALIDATIONS.NSS.test(nssClean)) {
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

// Fonction helper pour calculer le montant remboursé
export function calculerMontantRembourse(montantFacture, baseRemboursement, tauxRemboursement) {
    // La base ne peut pas dépasser le montant facturé
    const baseEffective = Math.min(montantFacture, baseRemboursement);
    
    // Calcul du remboursement
    const montantRembourse = (baseEffective * tauxRemboursement) / 100;
    
    return {
        baseEffective,
        montantRembourse: Math.round(montantRembourse * 100) / 100 // Arrondi à 2 décimales
    };
}

// Fonction helper pour calculer les participations
export function calculerParticipations(typeActe, montantRembourse) {
    const participations = {
        forfaitaire: 0,
        franchise: 0,
        total: 0
    };
    
    // Participation forfaitaire de 1€ pour consultations
    if (['consultation'].includes(typeActe)) {
        participations.forfaitaire = DECOMPTES_SECU_CONFIG.PARTICIPATIONS.FORFAITAIRE;
    }
    
    // Franchises selon le type
    switch (typeActe) {
        case 'pharmacie':
            participations.franchise = DECOMPTES_SECU_CONFIG.PARTICIPATIONS.FRANCHISE_MEDICAMENT;
            break;
        case 'auxiliaires':
            participations.franchise = DECOMPTES_SECU_CONFIG.PARTICIPATIONS.FRANCHISE_ACTE_PARAMEDICAL;
            break;
        case 'transport':
            participations.franchise = DECOMPTES_SECU_CONFIG.PARTICIPATIONS.FRANCHISE_TRANSPORT;
            break;
    }
    
    participations.total = participations.forfaitaire + participations.franchise;
    
    // Le remboursement final ne peut pas être négatif
    const remboursementFinal = Math.max(0, montantRembourse - participations.total);
    
    return {
        participations,
        remboursementFinal
    };
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
    return DECOMPTES_SECU_CONFIG.STATUTS[statutActuel]?.suivant || null;
}

// Fonction helper pour vérifier si un décompte peut être supprimé
export function peutEtreSupprime(statut) {
    return statut !== 'supprime' && statut !== 'paiement_effectue';
}

// Fonction helper pour déterminer le taux selon le contexte
export function determinerTauxRemboursement(typeActe, contexteMedical = {}) {
    // Si ALD, remboursement à 100%
    if (contexteMedical.ald) {
        return 100;
    }
    
    // Si maternité, remboursement à 100%
    if (contexteMedical.maternite) {
        return 100;
    }
    
    // Sinon, taux standard selon le type d'acte
    const tauxStandard = {
        consultation: DECOMPTES_SECU_CONFIG.TAUX_REMBOURSEMENT.generaliste_secteur1,
        pharmacie: DECOMPTES_SECU_CONFIG.TAUX_REMBOURSEMENT.medicament_service_majeur,
        analyses: DECOMPTES_SECU_CONFIG.TAUX_REMBOURSEMENT.analyses_laboratoire,
        radiologie: DECOMPTES_SECU_CONFIG.TAUX_REMBOURSEMENT.radiologie,
        hospitalisation: DECOMPTES_SECU_CONFIG.TAUX_REMBOURSEMENT.hospitalisation,
        transport: 65,
        optique: 60,
        dentaire: 70,
        auxiliaires: 60
    };
    
    return tauxStandard[typeActe] || 70;
}

// Fonction helper pour obtenir la liste des caisses
export function getListeCaisses() {
    // Combiner les caisses principales et celles extraites des décomptes
    const toutesLesCaisses = new Set([
        ...DECOMPTES_SECU_CONFIG.CAISSES_PRINCIPALES,
        ...Array.from(caissesDynamiques)
    ]);
    
    return Array.from(toutesLesCaisses).sort();
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création initiale
   - Données métier spécifiques sécurité sociale
   - Gestion des taux, participations et franchises
   - Calculs de remboursement avec participations
   - Validations métier (NSS avec clé de contrôle)
   
   NOTES POUR REPRISES FUTURES:
   - Ce fichier contient UNIQUEMENT les données métier
   - Toute config UI est dans les orchestrateurs
   - Les calculs respectent les règles CPAM
   - Les participations suivent la législation en vigueur
   ======================================== */
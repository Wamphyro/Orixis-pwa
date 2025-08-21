// ========================================
// TEMPLATE FIRESTORE - PARAMÈTRES COMPTABLES
// Collection: parametresComptables
// ========================================

export const PARAMETRES_COMPTABLES_TEMPLATE = {
    // Société
    societe: {
        id: null,                   // String - Référence vers societes/xxx
        code: null                  // String - Ex: "AUDIO-PARIS"
    },
    
    // Comptes par défaut
    comptesDefaut: {
        vente: {
            appareils: '701000',    // String - Compte vente appareils
            prestations: '706000'   // String - Compte vente prestations
        },
        achat: {
            marchandises: '607000', // String - Compte achat marchandises
            services: '611000'      // String - Compte achat services
        },
        tiers: {
            clients: '411',         // String - Compte clients
            fournisseurs: '401'     // String - Compte fournisseurs
        },
        banques: {
            principal: '512100'     // String - Compte banque principal
        }
    },
    
    // Journaux
    journaux: {
        VE: {
            code: 'VE',
            libelle: 'Ventes',
            type: 'vente'
        },
        AC: {
            code: 'AC',
            libelle: 'Achats',
            type: 'achat'
        },
        BQ: {
            code: 'BQ',
            libelle: 'Banque',
            type: 'banque'
        },
        OD: {
            code: 'OD',
            libelle: 'Opérations diverses',
            type: 'od'
        }
    },
    
    // Taux de TVA
    tauxTVA: {
        normal: {
            code: '20',
            taux: 20,               // number - 20%
            compte: '445710'
        },
        reduit: {
            code: '55',
            taux: 5.5,              // number - 5.5%
            compte: '445712'
        },
        medical: {
            appareillage: {
                code: 'MED',
                taux: 5.5,          // number - 5.5%
                compte: '445712'
            }
        }
    },
    
    // Numérotation
    numerotation: {
        facturesClients: {
            format: 'FC-{YYYY}-{0000}',
            prefixe: 'FC',
            compteur: 1,            // number
            reinitAnnuelle: true    // boolean
        },
        facturesFournisseurs: {
            format: 'FF-{YYYY}-{0000}',
            prefixe: 'FF',
            compteur: 1             // number
        }
    },
    
    // Métadonnées
    metadata: {
        version: '1.0',
        dateCreation: null,         // Timestamp
        derniereModification: null  // Timestamp
    }
};

export const PARAMETRES_COMPTABLES_RULES = {
    required: ['societe', 'comptesDefaut', 'journaux', 'tauxTVA', 'numerotation'],
    singleton: true,  // Un seul document par société
    enum: {
        'journaux.VE.type': ['vente'],
        'journaux.AC.type': ['achat'],
        'journaux.BQ.type': ['banque'],
        'journaux.OD.type': ['od']
    }
};
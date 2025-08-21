// ========================================
// TEMPLATE FIRESTORE - FACTURES
// Collection: factures
// ========================================

export const FACTURE_TEMPLATE = {
    // Identification
    numeroFacture: null,            // String - Format: FC-AAAA-XXXX
    typePiece: 'facture',           // String - facture|avoir
    typeFacture: 'client',          // String - client|fournisseur
    niveauFacturation: 'magasin',   // String - magasin|societe
    
    // Entités
    magasin: {
        code: null,                 // String
        nom: null                   // String
    },
    
    societe: {
        id: null,                   // String
        code: null,                 // String
        raisonSociale: null         // String
    },
    
    // Tiers
    tiers: {
        nom: null,                  // String
        typeCollection: 'clients',  // String - clients|fournisseurs
        numeroTVA: null             // String ou null
    },
    
    // Dates
    dates: {
        emission: null,             // Timestamp
        echeance: null,             // Timestamp
        saisie: null                // Timestamp
    },
    
    // Montants
    montants: {
        ht: 0,                      // number
        ttc: 0,                     // number
        tva: {
            total: 0,               // number
            taux_55: {              // TVA 5.5%
                base: 0,            // number
                montant: 0          // number
            },
            taux_20: {              // TVA 20%
                base: 0,            // number
                montant: 0          // number
            }
        }
    },
    
    // Statut
    statut: {
        workflow: 'brouillon',      // String
        paiement: 'attente'         // String
    },
    
    // Métadonnées
    metadata: {
        source: 'saisie_manuelle',  // String
        creation: {
            date: null              // Timestamp
        }
    }
};

export const FACTURE_RULES = {
    required: ['numeroFacture', 'typePiece', 'typeFacture', 'tiers', 'dates', 'montants'],
    unique: ['numeroFacture'],
    enum: {
        typePiece: ['facture', 'avoir'],
        typeFacture: ['client', 'fournisseur'],
        'statut.workflow': ['brouillon', 'validee', 'comptabilisee', 'payee', 'annulee'],
        'statut.paiement': ['attente', 'partiel', 'paye']
    }
};
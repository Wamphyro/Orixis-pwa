// ========================================
// TEMPLATE FIRESTORE - DÉCOMPTES SÉCURITÉ SOCIALE
// Collection: decomptes_secu
// ========================================

export const DECOMPTE_SECU_TEMPLATE = {
    // Identification
    numeroDecompte: null,           // String - Format: SECU-AAAAMMJJ-XXXX
    numeroFeuilleSoins: null,       // String ou null - Numéro de la feuille de soins
    
    // Organisation
    societe: 'ORIXIS SAS',          // String - Nom complet de la société
    codeMagasin: null,              // String - Magasin où l'achat a été fait
    magasinUploadeur: null,         // String - Qui a uploadé
    
    // Bénéficiaire
    beneficiaire: {
        id: null,                   // String ou null
        nom: null,                  // String ou null
        prenom: null,               // String ou null
        numeroSecuriteSociale: null,// String ou null - 13 ou 15 chiffres
        numeroAffiliation: null     // String ou null
    },
    
    // Caisse et régime
    caissePrimaire: null,           // String ou null - Ex: "CPAM PARIS"
    regime: 'general',              // String - general|rsi|msa|special
    
    // Actes médicaux
    actesMedicaux: [],              // Array<ActeMedical> - Détail des actes
    typeActePrincipal: null,        // String ou null - Type d'acte majoritaire
    
    // Montants calculés
    montantTotalFacture: 0,         // number - Total facturé
    montantTotalBase: 0,            // number - Total base de remboursement
    montantTotalRembourse: 0,       // number - Total remboursé brut
    montantTotalParticipations: 0,  // number - Total participations et franchises
    montantTotalRembourseFinal: 0,  // number - Total remboursé net
    tauxMoyenRemboursement: 0,      // number - Taux moyen en %
    
    // Contexte médical
    contexteMedical: {
        ald: false,                 // boolean - Affection Longue Durée
        maternite: false,           // boolean - Maternité
        accidentTravail: false,     // boolean - Accident du travail
        invalidite: false           // boolean - Invalidité
    },
    
    // Dates
    dates: {
        creation: null,             // Timestamp
        transmissionIA: null,       // Timestamp ou null
        controleTaux: null,         // Timestamp ou null
        traitementEffectue: null,   // Timestamp ou null
        paiementEffectue: null,     // Timestamp ou null
        rejet: null                 // Timestamp ou null
    },
    
    // Dates des soins
    datesSoins: [],                 // Array<Timestamp> - Dates des actes
    datePaiement: null,             // Timestamp ou null - Date du paiement
    
    // Intervenants
    intervenants: {
        creePar: {
            id: null,               // String
            nom: null,              // String
            prenom: null,           // String
            role: null              // String
        },
        traitePar: null,            // Object ou null
        payePar: null               // Object ou null
    },
    
    // Documents uploadés
    documents: [],                  // Array<DocumentSecu>
    
    // Références
    paiementId: null,               // String ou null - Format: PAY-AAAA-MM-XXX
    
    // Workflow
    statut: 'nouveau',              // String - nouveau|traitement_ia|controle_taux|traitement_effectue|paiement_effectue|rejet|supprime
    motifRejet: null,               // String ou null - Si statut = 'rejet'
    
    // Suppression
    suppression: null,              // Object ou null - {date, par, motif}
    
    // Historique
    historique: [],                 // Array<HistoriqueEntrySecu>
    
    // Métadonnées IA
    extractionIA: null              // Object ou null - {timestamp, modele, societeDetectee, periode}
};

// Structure d'un acte médical
export const ACTE_MEDICAL_SECU_TEMPLATE = {
    typeActe: null,                 // String - consultation|pharmacie|analyses|radiologie|hospitalisation|transport|auxiliaires|optique|dentaire
    code: null,                     // String ou null - Code CCAM ou autre
    libelle: null,                  // String ou null - Description
    professionnel: null,            // String ou null - Nom du professionnel
    dateActe: null,                 // Timestamp ou null
    montantFacture: 0,              // number - Montant facturé
    baseRemboursement: 0,           // number - Base de remboursement
    tauxRemboursement: 70,          // number - Taux en %
    montantRembourse: 0,            // number - Montant remboursé brut
    participationForfaitaire: 0,    // number - 1€ pour consultations
    franchise: 0                    // number - 0.50€ médicaments, 2€ transports
};

// Structure d'une entrée historique
export const HISTORIQUE_ENTRY_SECU_TEMPLATE = {
    date: null,                     // Timestamp
    action: null,                   // String - creation|extraction_ia|changement_statut|controle_taux|validation|paiement|rejet|suppression
    details: null,                  // String
    timestamp: null,                // number (milliseconds)
    utilisateur: {                  // Object
        id: null,                   // String
        nom: null,                  // String
        prenom: null,               // String
        role: null                  // String
    },
    donnees: null                   // Object ou null - Données additionnelles selon l'action
};

// Structure d'un document uploadé
export const DOCUMENT_SECU_TEMPLATE = {
    nom: null,                      // String - Nom du fichier dans Storage
    nomOriginal: null,              // String - Nom original du fichier
    chemin: null,                   // String - Chemin dans Storage
    url: null,                      // String - URL de téléchargement
    taille: 0,                      // number - Taille en octets
    type: null,                     // String - Type MIME
    hash: null,                     // String - Hash SHA-256
    dateUpload: null                // Timestamp
};

// Règles de validation
export const DECOMPTE_SECU_RULES = {
    required: ['numeroDecompte', 'societe', 'codeMagasin', 'statut'],
    enum: {
        regime: ['general', 'rsi', 'msa', 'special'],
        statut: ['nouveau', 'traitement_ia', 'controle_taux', 'traitement_effectue', 'paiement_effectue', 'rejet', 'supprime'],
        typeActe: ['consultation', 'pharmacie', 'analyses', 'radiologie', 'hospitalisation', 'transport', 'auxiliaires', 'optique', 'dentaire']
    },
    validations: {
        numeroSecuriteSociale: /^[12][0-9]{12}([0-9]{2})?$/,
        tauxRemboursement: (value) => value >= 0 && value <= 100,
        montants: (value) => value >= 0
    }
};

// Taux de remboursement standards
export const TAUX_STANDARDS_SECU = {
    consultation: {
        generaliste_secteur1: 70,
        specialiste_secteur1: 70,
        generaliste_secteur2: 70  // Sur base conventionnée
    },
    pharmacie: {
        service_majeur: 65,
        service_modere: 30,
        service_faible: 15,
        comfort: 0
    },
    analyses: 60,
    radiologie: 70,
    hospitalisation: 80,
    ald: 100,
    maternite: 100
};

// Participations et franchises
export const PARTICIPATIONS_SECU = {
    forfaitaire: 1,                 // 1€ par consultation
    franchise_medicament: 0.50,     // 0.50€ par boîte
    franchise_acte_paramedical: 0.50, // 0.50€ par acte
    franchise_transport: 2,         // 2€ par transport
    hospitaliere: 20                // 20€ par jour
};

// Export par défaut
export default {
    DECOMPTE_SECU_TEMPLATE,
    ACTE_MEDICAL_SECU_TEMPLATE,
    HISTORIQUE_ENTRY_SECU_TEMPLATE,
    DOCUMENT_SECU_TEMPLATE,
    DECOMPTE_SECU_RULES,
    TAUX_STANDARDS_SECU,
    PARTICIPATIONS_SECU
};
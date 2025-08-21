// ========================================
// TEMPLATE FIRESTORE - MAGASINS (Version 2.0)
// Collection: magasins
// Mise à jour : Ajout structure identification
// ========================================

export const MAGASIN_TEMPLATE = {
    // Identification de base
    code: null,                     // String - Format: 9XXX (ex: "9DIJ")
    nom: null,                      // String - Nom du magasin
    
    // Identification légale et administrative (NOUVEAU)
    identification: {
        siret: null,                // String - 14 chiffres (ex: "81824757900027")
        siren: null,                // String - 9 chiffres (ex: "818247579")
        nic: null,                  // String - 5 chiffres NIC du SIRET
        numeroFINESS: null,         // String - Numéro FINESS pour l'audio
        numeroCompteACM: null       // String - Compte ACM pour la comptabilité
    },
    
    // Société de rattachement
    societe: {
        id: null,                   // String - Référence: societes/xxx
        code: null,                 // String - Ex: "BA"
        raisonSociale: null,        // String - "BROKER AUDIOLOGIE"
        siren: null                 // String - SIREN de la société mère
    },
    
    // Coordonnées
    adresse: {
        rue: '',                    // String - Ex: "5 rue Mably"
        codePostal: '',             // String - Ex: "21000"
        ville: ''                   // String - Ex: "Dijon"
    },
    
    contact: {
        email: null,                // String - Ex: "9dij@afflelou.net"
        telephone: null             // String - Ex: "03 80 27 45 72"
    },
    
    // Données bancaires
    compteBancaire: {
        iban: null,                 // String
        bic: null,                  // String
        banque: null,               // String
        libelle: null,              // String
        actif: true                 // boolean
    },
    
    // Comptabilité
    comptabilite: {
        compteVente: null,          // String - Ex: "701DIJ"
        journalVente: null,         // String - Ex: "VE-DIJ"
        centreProfit: null,         // String - Ex: "MAGASIN_9DIJ"
        codeAnalytique: null        // String - Ex: "DIJ"
    },
    
    // Statut et métadonnées
    actif: true,                    // boolean
    dateCreation: null,             // Timestamp
    
    metadata: {                     
        derniereModification: null  // Timestamp
    }
};

// ========================================
// RÈGLES DE VALIDATION
// ========================================
export const MAGASIN_RULES = {
    required: [
        'code', 
        'nom', 
        'societe', 
        'societe.code', 
        'societe.raisonSociale', 
        'actif'
    ],
    unique: ['code', 'identification.siret'],
    pattern: {
        code: /^9[A-Z]{3}$/,           // Format: 9XXX
        siret: /^\d{14}$/,              // 14 chiffres
        siren: /^\d{9}$/,               // 9 chiffres
        nic: /^\d{5}$/,                 // 5 chiffres
        codePostal: /^\d{5}$/,          // 5 chiffres
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/  // Format email
    }
};

// ========================================
// EXEMPLE DE DOCUMENT
// ========================================
export const MAGASIN_EXAMPLE = {
    code: "9DIJ",
    nom: "9DIJ",
    
    identification: {
        siret: "81824757900027",
        siren: "818247579",
        nic: "00027",
        numeroFINESS: "212699045",
        numeroCompteACM: "21376505"
    },
    
    societe: {
        id: "societes/ba-broker-audiologie",
        code: "BA",
        raisonSociale: "BROKER AUDIOLOGIE",
        siren: "818247579"
    },
    
    adresse: {
        rue: "5 rue Mably",
        codePostal: "21000",
        ville: "Dijon"
    },
    
    contact: {
        email: "9dij@afflelou.net",
        telephone: "03 80 27 45 72"
    },
    
    compteBancaire: {
        iban: "FR7630004000031234567890DIJ",
        bic: "BNPAFRPPXXX",
        banque: "BNP Paribas",
        libelle: "Compte Magasin 9DIJ",
        actif: true
    },
    
    comptabilite: {
        compteVente: "7019DIJ",
        journalVente: "VE-DIJ",
        centreProfit: "MAGASIN_9DIJ",
        codeAnalytique: "DIJ"
    },
    
    actif: true,
    dateCreation: new Date("2016-02-15"),
    
    metadata: {
        derniereModification: new Date()
    }
};

// ========================================
// FONCTION HELPER - Extraction SIREN/NIC
// ========================================
export function extractSiretComponents(siret) {
    if (!siret || siret.length !== 14) {
        return { siren: null, nic: null };
    }
    
    return {
        siren: siret.substring(0, 9),
        nic: siret.substring(9, 14)
    };
}

// ========================================
// FONCTION HELPER - Validation
// ========================================
export function validateMagasin(magasin) {
    const errors = [];
    
    // Vérifier les champs requis
    MAGASIN_RULES.required.forEach(field => {
        const value = field.includes('.') 
            ? field.split('.').reduce((obj, key) => obj?.[key], magasin)
            : magasin[field];
            
        if (value === null || value === undefined || value === '') {
            errors.push(`Champ requis manquant: ${field}`);
        }
    });
    
    // Vérifier les patterns
    Object.entries(MAGASIN_RULES.pattern).forEach(([field, pattern]) => {
        let value;
        if (field === 'siret' || field === 'siren' || field === 'nic') {
            value = magasin.identification?.[field];
        } else if (field === 'codePostal') {
            value = magasin.adresse?.[field];
        } else if (field === 'email') {
            value = magasin.contact?.[field];
        } else {
            value = magasin[field];
        }
        
        if (value && !pattern.test(value)) {
            errors.push(`Format invalide pour ${field}: ${value}`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
// auth-config.js - Configuration des magasins avec codes à 4 chiffres
// CODES D'ACCÈS POUR CHAQUE MAGASIN

const MAGASINS = {
    "9AVA": {
        code: "0234"
    },
    "9BEA": {
        code: "5678"
    },
    "9BOM": {
        code: "9012"
    },
    "9CHE": {
        code: "3456"
    },
    "9DIJ": {
        code: "7890"
    },
    "9DIT": {
        code: "2345"
    },
    "9DOL": {
        code: "6789"
    },
    "9KBO": {
        code: "0123"
    },
    "9KNE": {
        code: "4567"
    },
    "9KOV": {
        code: "8901"
    },
    "9MAR": {
        code: "1357"
    },
    "9QUE": {
        code: "2468"
    }
};

// Fonction pour vérifier si un magasin existe
function magasinExists(code) {
    return MAGASINS.hasOwnProperty(code);
}

// Fonction pour obtenir les infos d'un magasin
function getMagasinInfo(code) {
    return MAGASINS[code] || null;
}

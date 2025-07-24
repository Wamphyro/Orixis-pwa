// Liste des marques d'appareils auditifs
export const BRANDS = [
    { value: 'Phonak', label: 'Phonak' },
    { value: 'Oticon', label: 'Oticon' },
    { value: 'Signia', label: 'Signia/Siemens' },
    { value: 'Widex', label: 'Widex' },
    { value: 'Starkey', label: 'Starkey' },
    { value: 'Autre', label: 'Autre' }
];

// Informations spécifiques par marque
export const BRAND_SPECIFICS = {
    'Phonak': {
        filters: {
            name: 'CeruShield',
            colors: ['gris', 'blanc'],
            tool: 'Pointe/disque'
        },
        connection: 'Connexion cliquet'
    },
    'Oticon': {
        filters: {
            name: 'ProWax miniFit',
            tool: 'Tige double fonction'
        },
        domes: 'Grip-tip double couche'
    },
    'Signia': {
        filters: {
            name: 'CeruSTOP',
            colors: ['rouge', 'bleu'],
            tool: 'Outil spécifique'
        },
        tubes: 'ThinTube 3.0',
        connection: 'Quart de tour'
    },
    'Widex': {
        filters: {
            name: 'Nanocare',
            tool: 'Outil Widex'
        },
        receiver: 'Code couleur puissance',
        domes: 'Système easywear'
    },
    'Starkey': {
        filters: {
            name: 'Hear Clear',
            tool: 'Outil Starkey'
        },
        system: 'Snap-fit',
        protection: 'Cérumen active'
    }
};

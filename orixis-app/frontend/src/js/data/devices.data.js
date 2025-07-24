// src/js/data/devices.data.js
export const DEVICE_TYPES = [
    {
        id: 'BTE',
        name: 'BTE Classique',
        icon: '🔵',
        description: 'Contour d\'oreille classique',
        color: '#3498db'
    },
    {
        id: 'RIC',
        name: 'RIC/RITE',
        icon: '🔴',
        description: 'Contour écouteur déporté',
        color: '#e74c3c'
    },
    {
        id: 'ITE',
        name: 'Intra (ITE/CIC)',
        icon: '🟢',
        description: 'Intra-auriculaire',
        color: '#27ae60'
    }
];

// src/js/data/problems.data.js
export const PROBLEMS = [
    { id: 'pb1', value: 'Pas de son', icon: '🔇', label: 'Pas de son / Muet' },
    { id: 'pb2', value: 'Son faible', icon: '🔉', label: 'Son faible' },
    { id: 'pb3', value: 'Sifflement', icon: '📢', label: 'Sifflement (Larsen)' },
    { id: 'pb4', value: 'Son intermittent', icon: '〰️', label: 'Son intermittent' },
    { id: 'pb5', value: 'Grésille', icon: '📡', label: 'Grésille / Parasite' },
    { id: 'pb6', value: 'Humidité', icon: '💧', label: 'Humidité / Condensation' },
    { id: 'pb7', value: 'Inconfort', icon: '😣', label: 'Inconfort / Douleur' },
    { id: 'pb8', value: 'Contrôle routine', icon: '🔧', label: 'Contrôle routine' }
];

// src/js/data/actions.data.js
export const ACTIONS = [
    { id: 'act1', value: 'Pile changée', icon: '🔋', label: 'Pile testée / changée' },
    { id: 'act2', value: 'Nettoyage complet', icon: '🧹', label: 'Nettoyage complet' },
    { id: 'act3', value: 'Filtre changé', icon: '🔄', label: 'Filtre pare-cérumen changé' },
    { id: 'act4', value: 'Dôme remplacé', icon: '🔵', label: 'Dôme remplacé' },
    { id: 'act5', value: 'Tube changé', icon: '📏', label: 'Tube changé' },
    { id: 'act6', value: 'Séchage', icon: '☀️', label: 'Séchage effectué' }
];

// src/js/data/brands.data.js
export const BRANDS = [
    { id: 'phonak', name: 'Phonak', filters: ['CeruShield'], tools: ['Pointe/disque'] },
    { id: 'oticon', name: 'Oticon', filters: ['ProWax miniFit'], tools: ['Tige double fonction'] },
    { id: 'signia', name: 'Signia/Siemens', filters: ['CeruSTOP'], tools: ['ThinTube 3.0'] },
    { id: 'widex', name: 'Widex', filters: ['Nanocare'], tools: ['easywear'] },
    { id: 'starkey', name: 'Starkey', filters: ['Hear Clear'], tools: ['Snap-fit'] },
    { id: 'autre', name: 'Autre', filters: [], tools: [] }
];

// src/js/data/results.data.js
export const INTERVENTION_RESULTS = [
    { value: 'Résolu', icon: '✅', label: 'Problème résolu', color: '#27ae60' },
    { value: 'Partiel', icon: '⚠️', label: 'Amélioration partielle', color: '#f39c12' },
    { value: 'SAV', icon: '❌', label: 'Sans effet - Escalade SAV', color: '#e74c3c' },
    { value: 'OK', icon: '🔧', label: 'Contrôle OK', color: '#3498db' }
];
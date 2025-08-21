// Liste des actions possibles
export const ACTIONS = [
    {
        id: 'battery-changed',
        value: 'Pile changée',
        label: '🔋 Pile testée / changée',
        icon: '🔋',
        description: 'Test et/ou remplacement de la pile'
    },
    {
        id: 'full-cleaning',
        value: 'Nettoyage complet',
        label: '🧹 Nettoyage complet',
        icon: '🧹',
        description: 'Nettoyage intégral de l\'appareil'
    },
    {
        id: 'filter-changed',
        value: 'Filtre changé',
        label: '🔄 Filtre pare-cérumen changé',
        icon: '🔄',
        description: 'Remplacement du filtre pare-cérumen'
    },
    {
        id: 'dome-replaced',
        value: 'Dôme remplacé',
        label: '🔵 Dôme remplacé',
        icon: '🔵',
        description: 'Changement du dôme'
    },
    {
        id: 'tube-changed',
        value: 'Tube changé',
        label: '📏 Tube changé',
        icon: '📏',
        description: 'Remplacement du tube'
    },
    {
        id: 'drying',
        value: 'Séchage',
        label: '☀️ Séchage effectué',
        icon: '☀️',
        description: 'Séchage de l\'appareil'
    }
];

// Matériel nécessaire par action
export const ACTION_MATERIALS = {
    'battery-changed': [
        'Piles de rechange (10, 13, 312, 675)',
        'Testeur de pile',
        'Aimant'
    ],
    'full-cleaning': [
        'Lingettes désinfectantes',
        'Brosses douces',
        'Spray nettoyant',
        'Soufflette'
    ],
    'filter-changed': [
        'Filtres de rechange',
        'Outil de changement',
        'Loupe'
    ],
    'dome-replaced': [
        'Dômes de différentes tailles',
        'Outil de retrait'
    ],
    'tube-changed': [
        'Tubes de rechange',
        'Ciseaux',
        'Outil de mesure'
    ],
    'drying': [
        'Boîte de séchage',
        'Pastilles déshydratantes',
        'Papier absorbant'
    ]
};

// Résultats possibles après intervention
export const INTERVENTION_RESULTS = [
    {
        value: 'Résolu',
        label: '✅ Problème résolu',
        icon: '✅',
        requiresSAV: false
    },
    {
        value: 'Partiel',
        label: '⚠️ Amélioration partielle',
        icon: '⚠️',
        requiresSAV: false
    },
    {
        value: 'SAV',
        label: '❌ Sans effet - Escalade SAV',
        icon: '❌',
        requiresSAV: true
    },
    {
        value: 'OK',
        label: '🔧 Contrôle OK',
        icon: '🔧',
        requiresSAV: false
    }
];

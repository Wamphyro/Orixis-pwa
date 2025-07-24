// Liste des problèmes possibles
export const PROBLEMS = [
    {
        id: 'no-sound',
        value: 'Pas de son',
        label: '🔇 Pas de son / Muet',
        icon: '🔇',
        description: 'Aucun son ne sort de l\'appareil'
    },
    {
        id: 'low-sound',
        value: 'Son faible',
        label: '🔉 Son faible',
        icon: '🔉',
        description: 'Le volume est anormalement bas'
    },
    {
        id: 'feedback',
        value: 'Sifflement',
        label: '📢 Sifflement (Larsen)',
        icon: '📢',
        description: 'Sifflement ou effet Larsen'
    },
    {
        id: 'intermittent',
        value: 'Son intermittent',
        label: '〰️ Son intermittent',
        icon: '〰️',
        description: 'Le son coupe par moments'
    },
    {
        id: 'static',
        value: 'Grésille',
        label: '📡 Grésille / Parasite',
        icon: '📡',
        description: 'Présence de parasites ou grésillements'
    },
    {
        id: 'humidity',
        value: 'Humidité',
        label: '💧 Humidité / Condensation',
        icon: '💧',
        description: 'Problème d\'humidité ou condensation'
    },
    {
        id: 'discomfort',
        value: 'Inconfort',
        label: '😣 Inconfort / Douleur',
        icon: '😣',
        description: 'L\'appareil cause de l\'inconfort'
    },
    {
        id: 'routine',
        value: 'Contrôle routine',
        label: '🔧 Contrôle routine',
        icon: '🔧',
        description: 'Contrôle de maintenance préventive'
    }
];

// Solutions recommandées par problème
export const PROBLEM_SOLUTIONS = {
    'no-sound': [
        'Vérifier la pile',
        'Vérifier le tube/écouteur',
        'Nettoyer le filtre pare-cérumen',
        'Vérifier les microphones'
    ],
    'low-sound': [
        'Changer la pile',
        'Nettoyer l\'appareil',
        'Vérifier le filtre',
        'Contrôler le tube'
    ],
    'feedback': [
        'Vérifier l\'insertion',
        'Contrôler le tube',
        'Vérifier le dôme/embout',
        'Nettoyer l\'oreille'
    ],
    'intermittent': [
        'Changer la pile',
        'Vérifier les connexions',
        'Sécher l\'appareil',
        'Nettoyer les contacts'
    ],
    'static': [
        'Nettoyer les microphones',
        'Changer le filtre',
        'Vérifier l\'humidité',
        'Contrôler les connexions'
    ],
    'humidity': [
        'Retirer la pile',
        'Sécher l\'appareil',
        'Utiliser pastille déshydratante',
        'Boîte de séchage 4h minimum'
    ],
    'discomfort': [
        'Vérifier l\'insertion',
        'Contrôler le dôme/embout',
        'Ajuster la position',
        'Vérifier la taille'
    ],
    'routine': [
        'Nettoyage complet',
        'Vérification pile',
        'Contrôle filtre',
        'Test de fonctionnement'
    ]
};

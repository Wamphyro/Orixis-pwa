// ========================================
// SUBVENTIONS.DATA.JS - Données métier
// Chemin: modules/subventions/subventions.data.js
//
// DESCRIPTION:
// Contient toutes les données métier du module :
// - Statuts et workflows
// - Délais par département
// - Types de documents
// - Cas particuliers
// ========================================

export const subventionsData = {

    // ========================================
    // CONFIGURATION DES STATISTIQUES
    // ========================================
    
    statsCards: {
        nouveau: {
            label: 'Nouveaux',
            icon: '📄',
            color: 'primary',
            description: 'Dossiers créés récemment'
        },
        en_cours: {
            label: 'En cours',
            icon: '⏳',
            color: 'warning',
            description: 'Dossiers en traitement'
        },
        en_retard: {
            label: 'En retard',
            icon: '⚠️',
            color: 'danger',
            description: 'Délais dépassés'
        },
        termine: {
            label: 'Terminés',
            icon: '✅',
            color: 'success',
            description: 'Dossiers finalisés'
        },
        bloque: {
            label: 'Bloqués',
            icon: '🔴',
            color: 'error',
            description: 'Action requise'
        },
        montant_total: {
            label: 'Montant total',
            icon: '💰',
            color: 'info',
            special: true,
            description: 'Somme totale des subventions'
        }
    },

    // ========================================
    // WORKFLOW MDPH
    // ========================================
    
    workflowMDPH: {
        etapes: [
            {
                id: 'nouveau',
                label: 'Nouveau',
                icon: '📝',
                progression: 0,
                description: 'Dossier créé, rien de fait',
                documentsRequis: [],
                actionsDisponibles: ['ajouter_documents', 'annuler']
            },
            {
                id: 'documents',
                label: 'Documents',
                icon: '📄',
                progression: 20,
                description: 'Collecte des documents en cours',
                documentsRequis: [
                    'carte_identite',
                    'justificatif_domicile',
                    'certificat_medical',
                    'devis_normalise',
                    'ordonnance_orl',
                    'audiogramme'
                ],
                actionsDisponibles: ['valider_documents', 'relancer_patient']
            },
            {
                id: 'formulaire',
                label: 'Formulaire',
                icon: '✍️',
                progression: 40,
                description: 'Formulaire MDPH à remplir et signer',
                documentsRequis: ['formulaire_mdph_signe'],
                actionsDisponibles: ['envoyer_formulaire', 'signer_electronique']
            },
            {
                id: 'depot',
                label: 'Déposé',
                icon: '📮',
                progression: 60,
                description: 'Dossier déposé à la MDPH',
                documentsRequis: ['accuse_depot'],
                actionsDisponibles: ['suivre_dossier', 'relancer_mdph']
            },
            {
                id: 'recepisse',
                label: 'Récépissé',
                icon: '📋',
                progression: 80,
                description: 'Récépissé RQTH/PCH reçu',
                documentsRequis: ['recepisse_mdph'],
                actionsDisponibles: ['notifier_agefiph', 'archiver']
            },
            {
                id: 'accord',
                label: 'Accord',
                icon: '✅',
                progression: 100,
                description: 'Accord MDPH définitif',
                documentsRequis: ['decision_mdph'],
                actionsDisponibles: ['cloturer', 'archiver']
            }
        ],
        
        // Transitions possibles
        transitions: {
            'nouveau': ['documents', 'annule'],
            'documents': ['formulaire', 'nouveau'],
            'formulaire': ['depot', 'documents'],
            'depot': ['recepisse', 'formulaire'],
            'recepisse': ['accord', 'depot'],
            'accord': []
        }
    },
    
    // ========================================
    // WORKFLOW AGEFIPH
    // ========================================
    
    workflowAGEFIPH: {
        etapes: [
            {
                id: 'attente',
                label: 'En attente',
                icon: '⏸️',
                progression: 0,
                description: 'Pas encore commencé',
                bloquePar: null
            },
            {
                id: 'documents',
                label: 'Documents de base',
                icon: '📄',
                progression: 20,
                description: 'Documents de base (sans attestation)',
                documentsRequis: [
                    'mandat_agefiph',
                    'procuration_versement',
                    'justificatif_identite',
                    'rib_professionnel',
                    'devis_simplifie',
                    'justificatifs_cofinancements'
                ],
                bloquePar: null
            },
            {
                id: 'formulaire',
                label: 'Formulaire',
                icon: '✍️',
                progression: 40,
                description: 'Formulaire AGEFIPH rempli',
                documentsRequis: ['formulaire_agefiph_signe'],
                bloquePar: null
            },
            {
                id: 'attente_recepisse',
                label: 'Attente récépissé',
                icon: '⏳',
                progression: 50,
                description: 'En attente du récépissé MDPH',
                bloquePar: 'mdph.recepisse'
            },
            {
                id: 'finalisation',
                label: 'Finalisation',
                icon: '📋',
                progression: 70,
                description: 'Ajout récépissé + attestation employeur',
                documentsRequis: ['recepisse_mdph', 'attestation_employeur'],
                bloquePar: null
            },
            {
                id: 'soumis',
                label: 'Soumis',
                icon: '📮',
                progression: 85,
                description: 'Dossier envoyé à l\'AGEFIPH',
                documentsRequis: ['accuse_envoi_agefiph'],
                bloquePar: null
            },
            {
                id: 'decision',
                label: 'Décision',
                icon: '✅',
                progression: 100,
                description: 'Décision AGEFIPH reçue',
                documentsRequis: ['decision_agefiph'],
                bloquePar: null
            }
        ]
    },
    
    // ========================================
    // TYPES DE DOCUMENTS
    // ========================================
    
    documents: {
        // Documents MDPH
        carte_identite: {
            label: 'Carte d\'identité',
            obligatoire: true,
            multiple: true,
            formats: ['.pdf', '.jpg', '.jpeg', '.png'],
            peremption: null
        },
        justificatif_domicile: {
            label: 'Justificatif de domicile',
            obligatoire: true,
            multiple: false,
            formats: ['.pdf', '.jpg', '.jpeg', '.png'],
            peremption: 90 // jours
        },
        certificat_medical: {
            label: 'Certificat médical ORL + volet audiologique',
            obligatoire: true,
            multiple: true,
            formats: ['.pdf'],
            peremption: 365
        },
        devis_normalise: {
            label: 'Devis normalisé',
            obligatoire: true,
            multiple: false,
            formats: ['.pdf'],
            peremption: null
        },
        ordonnance_orl: {
            label: 'Ordonnance ORL',
            obligatoire: true,
            multiple: false,
            formats: ['.pdf', '.jpg', '.jpeg', '.png'],
            peremption: 365
        },
        audiogramme: {
            label: 'Audiogramme',
            obligatoire: true,
            multiple: true,
            formats: ['.pdf', '.jpg', '.jpeg', '.png'],
            peremption: null
        },
        
        // Documents AGEFIPH
        attestation_employeur: {
            label: 'Attestation employeur',
            obligatoire: 'conditionnel', // selon situation
            multiple: false,
            formats: ['.pdf'],
            peremption: 30,
            conditions: {
                situation: ['salarie']
            }
        },
        kbis: {
            label: 'Extrait KBIS',
            obligatoire: 'conditionnel',
            multiple: false,
            formats: ['.pdf'],
            peremption: 90,
            conditions: {
                situation: ['independant']
            }
        },
        attestation_pole_emploi: {
            label: 'Attestation Pôle Emploi',
            obligatoire: 'conditionnel',
            multiple: false,
            formats: ['.pdf'],
            peremption: 30,
            conditions: {
                situation: ['demandeur_emploi']
            }
        }
    },
    
    // ========================================
    // DÉLAIS MDPH PAR DÉPARTEMENT
    // ========================================
    
    delaisMDPH: {
        // Île-de-France
        "75": { nom: "Paris", delai: 60, alerte: 45 },
        "77": { nom: "Seine-et-Marne", delai: 90, alerte: 75 },
        "78": { nom: "Yvelines", delai: 80, alerte: 65 },
        "91": { nom: "Essonne", delai: 85, alerte: 70 },
        "92": { nom: "Hauts-de-Seine", delai: 75, alerte: 60 },
        "93": { nom: "Seine-Saint-Denis", delai: 150, alerte: 120 },
        "94": { nom: "Val-de-Marne", delai: 90, alerte: 75 },
        "95": { nom: "Val-d'Oise", delai: 95, alerte: 80 },
        
        // Grandes métropoles
        "13": { nom: "Bouches-du-Rhône", delai: 100, alerte: 85 },
        "31": { nom: "Haute-Garonne", delai: 85, alerte: 70 },
        "33": { nom: "Gironde", delai: 90, alerte: 75 },
        "34": { nom: "Hérault", delai: 95, alerte: 80 },
        "35": { nom: "Ille-et-Vilaine", delai: 80, alerte: 65 },
        "38": { nom: "Isère", delai: 85, alerte: 70 },
        "44": { nom: "Loire-Atlantique", delai: 80, alerte: 65 },
        "59": { nom: "Nord", delai: 120, alerte: 100 },
        "67": { nom: "Bas-Rhin", delai: 75, alerte: 60 },
        "69": { nom: "Rhône", delai: 90, alerte: 75 },
        "76": { nom: "Seine-Maritime", delai: 95, alerte: 80 },
        
        // Défaut
        "default": { nom: "Autre département", delai: 90, alerte: 75 }
    },
    
    // ========================================
    // CAS PARTICULIERS ET ELIGIBILITÉ
    // ========================================
    
    casParticuliers: {
        salarie: {
            label: 'Salarié',
            eligible: true,
            documentsSpecifiques: ['attestation_employeur'],
            conditions: [
                'Contrat de travail en cours',
                'SIRET entreprise obligatoire',
                'Attestation < 30 jours'
            ],
            alerteSpeciale: 'Demander attestation APRÈS récépissé MDPH'
        },
        
        independant: {
            label: 'Indépendant / Profession libérale',
            eligible: true,
            documentsSpecifiques: ['kbis', 'attestation_urssaf'],
            conditions: [
                'KBIS < 3 mois ou attestation URSSAF',
                'Justificatif de revenus'
            ],
            avantage: 'Pas d\'attestation employeur à attendre'
        },
        
        demandeur_emploi: {
            label: 'Demandeur d\'emploi',
            eligible: 'conditionnel',
            documentsSpecifiques: ['attestation_pole_emploi'],
            conditions: [
                'Inscription < 2 ans',
                'Historique derniers 12 mois'
            ]
        },
        
        retraite: {
            label: 'Retraité',
            eligible: 'conditionnel',
            documentsSpecifiques: ['attestation_retraite'],
            conditions: [
                'Activité professionnelle < 2 ans',
                'Justificatif de pension'
            ]
        },
        
        fonctionnaire: {
            label: 'Fonctionnaire',
            eligible: false,
            raison: 'Non éligible AGEFIPH (sauf contractuels)',
            alternative: 'Voir avec employeur public'
        },
        
        etudiant: {
            label: 'Étudiant',
            eligible: 'conditionnel',
            documentsSpecifiques: ['contrat_alternance'],
            conditions: [
                'Uniquement si alternance',
                'Traité comme salarié'
            ]
        }
    },
    
    // ========================================
    // MESSAGES ET TEMPLATES
    // ========================================
    
    messages: {
        etapes: {
            mdph: {
                nouveau: 'Créez le dossier et collectez les documents',
                documents: 'Rassemblez tous les documents médicaux et administratifs',
                formulaire: 'Faites remplir et signer le formulaire MDPH',
                depot: 'Déposez le dossier complet à la MDPH',
                recepisse: 'Attendez le récépissé RQTH/PCH',
                accord: 'Dossier finalisé côté MDPH'
            },
            agefiph: {
                attente: 'En attente de démarrage',
                documents: 'Préparez les documents de base (sans attestation)',
                formulaire: 'Faites remplir le formulaire AGEFIPH',
                attente_recepisse: 'Attendez le récépissé MDPH',
                finalisation: 'Ajoutez récépissé + attestation employeur',
                soumis: 'Dossier envoyé, en cours d\'instruction',
                decision: 'Décision reçue'
            }
        }
    },
    
    // ========================================
    // RÈGLES MÉTIER
    // ========================================
    
    regles: {
        // L'attestation employeur ne peut être demandée qu'après le récépissé
        attestationEmployeur: {
            quand: 'apres_recepisse_mdph',
            validite: 30, // jours
            alerte: 5 // jours avant expiration
        },
        
        // Un dossier peut être préparé jusqu'à 50% sans récépissé
        preparationAgefiph: {
            maxSansRecepisse: 50, // pourcentage
            etapesAutorisees: ['documents', 'formulaire', 'attente_recepisse']
        },
        
        // Délais d'abandon
        abandon: {
            sansActivite: 30, // jours
            apresRelance: 15 // jours
        }
    }
};

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsData;
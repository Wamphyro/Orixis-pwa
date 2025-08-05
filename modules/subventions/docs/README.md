📋 RÉCAP COMPLET - Module Subventions MDPH/AGEFIPH
🎯 Contexte & Objectifs
Besoin : Module de gestion des dossiers de subvention pour appareils auditifs avec :

Back-office pour les techniciens (gestion complète)
Portail client pour les patients (upload documents, formulaires, signatures)
Workflow spécifique : MDPH d'abord → Récépissé → AGEFIPH ensuite

Spécificité critique : L'AGEFIPH peut être préparée en parallèle MAIS l'attestation employeur doit être demandée UNIQUEMENT après réception du récépissé MDPH (validité < 1 mois).
📁 ARBORESCENCE COMPLÈTE
/modules/subventions/
│
├── 📄 Core Files
│   ├── subventions.config.js          → Configuration UI locale (factories)
│   ├── subventions.data.js            → Données métier (statuts, délais, cas)
│   ├── subventions.service.js         → Logique métier (règles workflow)
│   ├── subventions.firestore.js       → Accès base de données
│   ├── subventions.upload.service.js  → Upload documents Firebase Storage
│   └── subventions.openai.service.js  → Analyse IA documents (lecture décisions)
│
├── 🎯 Orchestrateurs Back-Office
│   ├── subventions.main.js            → Point d'entrée, auth, header
│   ├── subventions.list.js            → Liste dossiers (tableau, filtres, stats)
│   ├── subventions.create.js          → Création nouveau dossier
│   ├── subventions.detail.js          → Détail avec timeline complète
│   ├── subventions.documents.js       → Gestion documents (ajout, validation)
│   ├── subventions.workflow.js        → Gestion workflow MDPH/AGEFIPH
│   └── subventions.alerts.js          → Dashboard alertes et rappels
│
├── 🌐 Portail Client
│   ├── portal/
│   │   ├── portal.auth.js             → Login avec code unique
│   │   ├── portal.dashboard.js        → Vue client du dossier
│   │   ├── portal.documents.js        → Upload documents client
│   │   ├── portal.forms.js            → Formulaires MDPH/AGEFIPH
│   │   ├── portal.signature.js        → Signature électronique
│   │   └── portal.css                 → Styles spécifiques portail
│   │
│   └── portal.html                    → Page HTML portail client
│
├── 📊 Templates & Ressources
│   ├── templates/
│   │   ├── formulaire-mdph.json       → Structure formulaire MDPH
│   │   ├── formulaire-agefiph.json    → Structure formulaire AGEFIPH
│   │   ├── mandat-agefiph.pdf         → Template PDF mandat
│   │   └── procuration.pdf            → Template PDF procuration
│   │
│   └── data/
│       ├── delais-mdph.json           → Délais par département
│       └── organismes.json            → Contacts MDPH/AGEFIPH
│
├── 🎨 Fichiers UI
│   ├── subventions.html               → Page principale back-office
│   ├── subventions.css                → Styles module
│   └── subventions-print.css          → Styles impression dossiers
│
└── 📖 Documentation
    └── README.md                      → Documentation du module
🔄 WORKFLOW DÉTAILLÉ
🔵 Étapes MDPH (6 étapes)

📝 Nouveau (0%)

Dossier créé, rien de fait


📄 Documents (20%)

Carte d'identité
Justificatif domicile (< 3 mois)
Certificat médical ORL + volet 1 audiologique
Devis normalisé (fourni par nous)
Ordonnance ORL
Audiogramme ORL


✍️ Formulaire (40%)

Formulaire MDPH rempli par le client
Signature électronique


📮 Déposé (60%)

Dossier envoyé/déposé à la MDPH
Délais variables selon département


📋 Récépissé (80%)

Récépissé RQTH/PCH reçu
Débloque finalisation AGEFIPH


✅ Accord définitif (100%)

Non bloquant pour AGEFIPH
Accord RQTH/PCH ou refus



🟠 Étapes AGEFIPH (7 étapes)

⏸️ En attente (0%)

Pas encore commencé


📄 Documents de base (20%)

Mandat AGEFIPH (signature électronique)
Procuration versement (signature électronique)
Justificatif identité
RIB professionnel (selon magasin)
Devis simplifié
Justificatifs co-financements


✍️ Formulaire (40%)

Formulaire AGEFIPH rempli
SANS attestation employeur


⏳ Attente récépissé (50%)

Dossier prêt sauf récépissé et attestation


📋 Finalisation (70%)

Récépissé MDPH ajouté
Demande attestation employeur ICI
Ou KBIS/URSSAF si indépendant


📮 Soumis (85%)

Dossier complet envoyé
En instruction


✅ Décision (100%)

Accepté ou Refusé
Lecture IA pour numéro dossier


💰 Paiement (bonus)

Pointage compte bancaire
Rapprochement avec IA



📊 STRUCTURE FIRESTORE COMPLÈTE
javascript// Collection: dossiersSubvention
{
    // Identification
    id: "auto-generated",
    numeroDossier: "SUB-2025-0001",
    type: "mdph_agefiph", // mdph_seul, mdph_pch, mdph_agefiph
    
    // Patient
    patient: {
        id: "patient_123",
        nom: "DUPONT",
        prenom: "Jean",
        dateNaissance: "1985-03-15",
        telephone: "0612345678",
        email: "jean.dupont@email.fr",
        adresse: {
            rue: "10 rue de la Paix",
            codePostal: "75002",
            ville: "Paris",
            departement: "75"
        }
    },
    
    // Workflow
    workflow: {
        mdph: {
            statut: "depot",
            progression: 60,
            dates: {
                creation: timestamp,
                documents: timestamp,
                formulaire: timestamp,
                depot: timestamp,
                recepisse: null,
                accord: null
            }
        },
        agefiph: {
            statut: "documents",
            progression: 20,
            bloque: false,
            dates: {
                debut: timestamp,
                documents: timestamp,
                formulaire: null,
                finalisation: null,
                soumission: null,
                decision: null
            }
        }
    },
    
    // Documents détaillés
    documents: {
        mdph: {
            carte_identite: { 
                statut: "valide", 
                fichiers: [{
                    nom: "ci_recto.jpg",
                    url: "firebase_url",
                    dateAjout: timestamp,
                    ajoutePar: "Marie Martin"
                }],
                dateValidation: timestamp
            },
            // ... autres documents
        },
        agefiph: {
            // ... structure similaire
        }
    },
    
    // Montants
    montants: {
        appareil: 35000,
        accordeMDPH: 0,
        accordeAGEFIPH: 0,
        mutuelle: 5000,
        resteACharge: 30000
    },
    
    // Accès client
    acces: {
        code: "DUPONT-2025-X7B3",
        actif: true,
        derniereConnexion: null,
        documentsManquants: 3,
        actionsRequises: ["certificat_medical", "formulaire_mdph"]
    },
    
    // Organisation
    organisation: {
        technicien: { id: "tech_123", nom: "Marie Martin" },
        magasin: "9PAR",
        societe: "BA"
    },
    
    // Historique complet
    historique: [{
        date: timestamp,
        action: "creation",
        utilisateur: "Marie Martin",
        details: "Création du dossier"
    }],
    
    // Alertes
    alertes: {
        prochaine: "2025-03-15",
        type: "relance_mdph",
        niveau: "warning"
    }
}
🎨 INTERFACES DÉCIDÉES
📊 PAGE LISTE - STRUCTURE COMPLÈTE
┌─── 📋 Dossiers de Subvention ──────────────────────────────────┐
│                                                                 │
│ ┌─── ALERTES DU JOUR ────────────────────────────────────────┐ │
│ │ 🔴 URGENT (2)                                              │ │
│ │ • MARTIN : Attestation employeur expire dans 5 jours      │ │
│ │ • DURAND : Récépissé reçu → Demander attestation NOW      │ │
│ │                                                            │ │
│ │ 🟡 À VENIR (3)                                            │ │
│ │ • BERNARD : Préparer attestation dans 10 jours            │ │
│ │ • PETIT : Relance MDPH recommandée (J+55)                │ │
│ │ • MOREAU : Vérifier co-financements                      │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─── TIMELINE CETTE SEMAINE ─────────────────────────────────┐ │
│ │ Lun | Mar | Mer | Jeu | Ven | Sam | Dim                   │ │
│ │  2  |  3  | [4] |  5  |  6  |  7  |  8                    │ │
│ │     |  📧  |TODAY|  ⚠️  |  📮  |     |                     │ │
│ │     |Martin|     |Durand|Envoi|     |                     │ │
│ └────────────────────────────────────────────────────────────┘ │
2. Détail Dossier (avec composants créés)
┌─── BERNARD - SUIVI COMPLET ────────────────────────────┐
│                                                         │
│ 📊 PROGRESSION GLOBALE                                 │
│ ✅──✅──✅──🔴──⏳──⏳──⏳──⏳ (ProgressTimeline)      │
│                                                         │
│ 🎯 VUE D'ENSEMBLE                                      │
│ MDPH    : ████████░░ 75% (EN RETARD)                  │
│ AGEFIPH : ████░░░░░░ 35% (EN ATTENTE)                 │ 
│ GLOBAL  : ██████░░░░ 55% (BLOQUÉ)   (ProgressOverview)│
│                                                         │
│ 🚨 FOCUS : RÉCÉPISSÉ EN RETARD                        │
│ ──[■]═══════════════[!]═══🚨 (DelayTracker)          │
│ 25/01              10/04                               │
│ └─── 75 JOURS ÉCOULÉS ───┘                           │
└─────────────────────────────────────────────────────────┘
📋 CAS PARTICULIERS DÉTAILLÉS
👔 Salarié

Attestation employeur < 1 mois (CRITIQUE)
SIRET entreprise obligatoire
Dates début/fin contrat
Type contrat (CDI/CDD)
⚠️ Demander attestation APRÈS récépissé

💼 Indépendant

KBIS < 3 mois OU Attestation URSSAF
Attestation sur l'honneur
Avis d'imposition
✅ Pas d'attestation employeur

🔍 Demandeur d'emploi

Attestation Pôle Emploi récente
Historique 12 derniers mois
📌 Éligible si < 2 ans

👴 Retraité

Attestation retraite + pension
⚠️ Avoir travaillé < 2 ans

❌ Non éligibles

Fonctionnaires (sauf contractuels)
Retraités > 2 ans
Sans activité > 2 ans

⏰ SYSTÈME D'ALERTES
javascript// Délais MDPH par département
DELAIS_MDPH = {
    "75": { nom: "Paris", delai: 60, alerte: 45 },
    "92": { nom: "Hauts-de-Seine", delai: 75, alerte: 60 },
    "69": { nom: "Rhône", delai: 90, alerte: 75 },
    "93": { nom: "Seine-Saint-Denis", delai: 150, alerte: 120 },
    "default": { delai: 90, alerte: 75 }
}

// Timeline des alertes
ALERTES = {
    documents_manquants: {
        J7: "Email rappel",
        J14: "Appel téléphonique",
        J21: "Alerte rouge"
    },
    apres_depot_mdph: {
        J_delai_moins_15: "Récépissé bientôt",
        J_delai: "Relance possible",
        J_delai_plus_30: "Escalade nécessaire"
    },
    attestation_employeur: {
        recepisse_recu: "Demander MAINTENANT",
        J3: "Rappel urgent",
        J20: "Attention péremption"
    }
}
🧩 COMPOSANTS UI CRÉÉS

ProgressTimeline (/src/components/ui/progress-timeline/)

Timeline horizontale avec étapes
Statuts : completed, current, blocked, pending
Animation optionnelle


ProgressOverview (/src/components/ui/progress-overview/)

Barres de progression multiples
Pourcentages et statuts
Couleurs dynamiques


DelayTracker (/src/components/ui/delay-tracker/)

Visualisation temps écoulé
Zones de criticité
Alertes visuelles


SignatureModal (/src/components/ui/signature-modal/)

Modal pour signature électronique
Canvas tactile/souris
Timestamp automatique
Boutons neutres pour injection



🔧 PRINCIPES ARCHITECTURAUX

Indépendance totale des composants
Pas d'imports directs entre composants UI
Factories locales par module
CSS minimal dans les composants (style injecté)
Callbacks pour toute communication

🚀 PROCHAINES ÉTAPES

Créer les templates Firestore
Implémenter le back-office ou le portail client
Configurer les délais par département
Créer les composants manquants (FormBuilder, AlertsWidget)
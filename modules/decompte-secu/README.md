📚 README - Module Décomptes Sécurité Sociale Audioprothèse
📋 Table des Matières

Vue d'ensemble
Architecture
Services
Widgets
Workflow
Structures de Données
Fonctionnalités Clés
Installation et Configuration
API et Méthodes

🎯 Vue d'ensemble
Module complet de gestion des décomptes CPAM pour l'audioprothèse avec :

Multi-virements : Gestion de plusieurs virements par décompte
Analyse IA : Extraction automatique des données (PDF/CSV)
Détection de doublons : Par hash et comparaison intelligente
Rapprochement bancaire : Par virement individuel
Workflow complet : De la création au rapprochement

🏗️ Architecture
modules/decompte-secu/
├── 📄 decompte-secu.html                 # Point d'entrée HTML
├── 🎯 decompte-secu.orchestrator.js      # Contrôleur principal
├── 🗄️ decompte-secu.firestore.service.js # CRUD Firestore
├── 🤖 decompte-secu.openai.service.js    # Analyse IA
├── 📁 decompte-secu.upload.service.js    # Upload Storage
└── 📋 decompte-secu.template.js          # Modèle de données

widgets/                                   # Composants réutilisables
├── header/                                # En-tête
├── stats-cards/                           # Cartes statistiques
├── search-filters/                        # Filtres de recherche
├── data-grid/                             # Tableau de données
├── pdf-uploader/                          # Upload de fichiers
├── detail-viewer/                         # Vue détaillée
└── toast/                                 # Notifications
Flux de Données
mermaidgraph TD
    A[HTML] --> B[Orchestrator]
    B --> C[Firestore Service]
    B --> D[Upload Service]
    B --> E[OpenAI Service]
    B --> F[Widgets]
    
    C --> G[(Firestore DB)]
    D --> H[(Firebase Storage)]
    E --> I[Cloud Function]
    
    F --> J[Header]
    F --> K[Stats Cards]
    F --> L[Search Filters]
    F --> M[Data Grid]
    F --> N[PDF Uploader]
    F --> O[Detail Viewer]
🔧 Services
1. Orchestrator (decompte-secu.orchestrator.js)
Rôle : Contrôleur principal qui coordonne tous les services et widgets
javascriptclass DecompteSecuOrchestrator {
    // Initialisation
    async init()                          // Point d'entrée principal
    checkAuth()                           // Vérification authentification
    
    // Widgets
    createWidgets()                       // Création de tous les widgets
    createHeader()                        // En-tête avec navigation
    createStatsCards()                    // Cartes de statistiques
    createFilters()                       // Filtres de recherche
    createDataGrid()                      // Tableau principal
    addActionButtons()                    // Boutons d'action
    
    // Données
    async loadData()                      // Chargement initial
    updateDynamicLists()                  // MAJ listes (caisses)
    applyFilters()                        // Application des filtres
    updateStats()                         // MAJ statistiques
    updateFilterOptions()                 // MAJ options de filtres
    
    // Actions
    openCreateModal()                     // Modal création
    async handleCreateDecompte(data)      // Traitement création
    openDetailModal(row)                  // Vue détaillée décompte
    openVirementDetailModal(virementRow)  // Vue détaillée virement
    async rapprocher(row)                 // Rapprochement rapide
    
    // Formatters
    formatFileSize(bytes)                 // Format taille fichier
    formaterMontant(montant)             // Format monétaire
    formaterNSS(nss)                     // Format NSS
    formaterDate(date)                   // Format date
    
    // UI
    showLoader() / hideLoader()           // Gestion loader
    showMessage(message, type)           // Notifications
    showError() / showSuccess() / showWarning()
}
2. Firestore Service (decompte-secu.firestore.service.js)
Rôle : Gestion complète de la base de données Firestore
javascriptclass DecompteSecuFirestoreService {
    // CRÉATION
    async creerDecompte(data)             // Créer nouveau décompte
    async genererNumeroDecompte()         // Format: SECU-YYYYMMDD-XXXX
    
    // LECTURE
    async getDecomptes(filtres)           // Récupérer avec filtres
    async getDecompteById(id)             // Récupérer par ID
    async getStatistiques()               // Calcul des stats
    
    // MISE À JOUR
    async ajouterDonneesExtraites(id, donnees)  // Ajout données IA
    async marquerRapproche(id, donnees)         // Rapprochement global
    async rapprocherVirement(decompteId, virementId, donnees)  // Rapprochement individuel
    
    // SUPPRESSION
    async supprimerDecompte(id, options)  // Suppression (soft/hard)
    
    // DOUBLONS
    async verifierHashExiste(hash)        // Vérif hash SHA-256
    async rechercherDoublonsProbables(criteres)  // Recherche intelligente
    
    // RÉFÉRENTIEL
    async chargerMagasins()               // Liste des magasins
}
3. OpenAI Service (decompte-secu.openai.service.js)
Rôle : Analyse IA des documents (PDF, CSV, images)
javascriptclass DecompteSecuOpenAIService {
    // ANALYSE PRINCIPALE
    async analyserAvecFichier(file, magasins)  // Point d'entrée
    
    // CONVERSION
    async convertPDFToImages(file)        // PDF → Images (PDF.js)
    async readCSV(file)                   // Lecture CSV (Papa Parse)
    async convertImageToBase64(file)      // Image → Base64
    
    // IA
    async callOpenAI(contenu, magasins, fileType)  // Appel Cloud Function
    generatePrompt(magasins, fileType)    // Génération du prompt
    formatIAResponse(data)                // Formatage réponse
    
    // HELPERS
    formatBeneficiaires(beneficiaires)    // Format bénéficiaires
    formatAppareils(appareils)           // Format appareils
    cleanNSS(nss)                         // Nettoyage NSS
    capitalizeFirstLetter(str)           // Capitalisation
}
4. Upload Service (decompte-secu.upload.service.js)
Rôle : Gestion des uploads vers Firebase Storage
javascriptclass DecompteSecuUploadService {
    // UPLOAD
    async uploadDocuments(files)          // Upload multiple
    async uploadDocument(file)            // Upload unique
    
    // GESTION
    generateStoragePath(file)             // Chemin: decomptes-secu/SOCIETE/inbox/YYYY/MM/DD/
    validateFile(file)                    // Validation (taille, type)
    getFileExtension(filename)            // Extension fichier
    async calculateFileHash(file)         // Hash SHA-256
    
    // OPÉRATIONS
    async deleteDocument(chemin)          // Suppression
    async getDocumentUrl(chemin)          // Récupération URL
    async fileExists(chemin)              // Vérification existence
}
🎨 Widgets Utilisés
1. HeaderWidget
javascriptnew HeaderWidget({
    title: 'Décomptes Sécurité Sociale',
    icon: '🏥',
    subtitle: 'Gestion des remboursements régime obligatoire',
    showBack: true,        // Bouton retour
    showUser: true,        // Affichage utilisateur
    showLogout: true       // Bouton déconnexion
})
2. StatsCardsWidget
javascriptnew StatsCardsWidget({
    container: '.stats-container',
    showWrapper: true,
    wrapperStyle: 'card',
    size: 'md',
    selectionMode: 'multiple',    // Sélection multiple pour filtrage
    animated: true,
    cards: [
        { id: 'nouveau', label: 'Nouveau', icon: '📋', value: 0, color: 'secondary' },
        { id: 'traitement_ia', label: 'Analyse IA', icon: '🤖', value: 0, color: 'info' },
        // ...
    ],
    onSelect: (selectedIds) => {  // Callback de sélection
        // Filtrage par statuts
    }
})
3. SearchFiltersWidget
javascriptnew SearchFiltersWidget({
    container: '.filters-container',
    filters: [
        { type: 'search', key: 'search', placeholder: 'Rechercher...' },
        { type: 'select', key: 'caisse', label: 'Caisse CPAM', options: [], searchable: true },
        { type: 'select', key: 'magasin', label: 'Magasin', options: [] },
        { type: 'select', key: 'periode', label: 'Période', options: [] }
    ],
    onFilter: (values) => { /* Appliquer filtres */ },
    onReset: () => { /* Réinitialiser */ }
})
4. DataGridWidget
javascriptnew DataGridWidget({
    container: '.table-container',
    columns: [
        { key: 'numeroDecompte', label: 'N° Décompte', sortable: true },
        { key: 'montantVirement', label: 'Montant', formatter: (v) => formatMontant(v) },
        { type: 'actions', label: 'Actions', actions: [
            { type: 'view', onClick: (row) => openDetail(row) }
        ]}
    ],
    data: [],
    features: {
        sort: true,
        export: true,      // Export CSV/Excel
        pagination: true
    },
    pagination: {
        itemsPerPage: 10,
        pageSizeOptions: [10, 20, 50, 100]
    }
})
5. PdfUploaderWidget
javascriptnew PdfUploaderWidget({
    title: 'Nouveau Décompte',
    theme: 'blue',
    mode: 'simple',
    maxFiles: 100,
    acceptedTypes: ['application/pdf', 'text/csv', 'image/jpeg'],
    checkDuplicate: async (file, hash) => {
        // Vérification doublon par hash
        return await firestoreService.verifierHashExiste(hash);
    },
    onSave: async (data) => {
        // Traitement des fichiers
    }
})
6. DetailViewerWidget
javascriptnew DetailViewerWidget({
    title: 'Détail Décompte',
    data: decompteData,
    timeline: {                   // Timeline visuelle
        enabled: true,
        items: [
            { label: 'Nouveau', status: 'completed', icon: '📋' },
            { label: 'Analyse IA', status: 'active', icon: '🤖' }
        ]
    },
    sections: [                   // Sections d'information
        {
            title: 'Informations générales',
            fields: [
                { label: 'N° Décompte', value: data.numeroDecompte },
                { label: 'Montant', value: formatMontant(data.montant), bold: true }
            ]
        }
    ],
    actions: [                    // Boutons d'action
        {
            label: '✅ Rapprocher',
            class: 'btn btn-glass-green',
            onClick: async (data) => { /* Action */ }
        }
    ]
})
🔄 Workflow
États du Décompte
mermaidstateDiagram-v2
    [*] --> nouveau: Création
    nouveau --> traitement_ia: Analyse IA
    traitement_ia --> traitement_effectue: Extraction réussie
    traitement_effectue --> rapprochement_bancaire: Rapprochement
    rapprochement_bancaire --> [*]: Terminé
    
    nouveau --> supprime: Suppression
    traitement_effectue --> supprime: Suppression
Processus de Création

Upload → Fichiers (PDF/CSV) uploadés vers Storage
Hash → Calcul SHA-256 pour détection doublons
Création → Document Firestore créé avec statut nouveau
Analyse IA → Extraction automatique des données
Détection doublons → Comparaison intelligente (score 0-100%)
Validation → Confirmation ou suppression si doublon
Stockage → Données extraites sauvegardées

📊 Structures de Données
Structure Décompte (Firestore)
javascript{
    // IDENTIFICATION
    numeroDecompte: "SECU-20250108-0001",
    typeDecompte: "multi-virements",
    
    // ORGANISATION
    societe: "BROKER AUDIOLOGIE",
    codeMagasin: "9CHE",
    numeroFINESS: "690043742",
    
    // CAISSE
    caissePrimaire: "CAMIEG",
    periodeTraitement: "2024-12",
    
    // VIREMENTS (Array)
    virements: [
        {
            id: "vir-001",
            dateVirement: "2024-12-15",
            numeroVirement: "REF123456",
            montantVirement: 1920.00,
            nombreBeneficiaires: 4,
            
            // RAPPROCHEMENT INDIVIDUEL
            rapprochement: {
                statut: "en_attente",     // ou "rapproche", "ecart"
                dateRapprochement: null,
                montantBancaire: null,
                ecart: null,
                rapprochePar: null,
                commentaire: null
            },
            
            // BÉNÉFICIAIRES
            beneficiaires: [
                {
                    nom: "DUPONT",
                    prenom: "Marie",
                    numeroSecuriteSociale: "2850478006048",
                    montantRemboursement: 480.00,
                    nombreAppareils: 2,
                    appareils: [
                        {
                            oreille: "droite",
                            codeActe: "P1D",
                            montantRembourse: 240.00
                        },
                        {
                            oreille: "gauche",
                            codeActe: "P1G",
                            montantRembourse: 240.00
                        }
                    ]
                }
            ]
        }
    ],
    
    // TOTAUX
    totaux: {
        nombreTotalVirements: 3,
        montantTotalVirements: 5760.00,
        nombreTotalBeneficiaires: 12,
        nombreTotalAppareils: 20
    },
    
    // DATES
    dates: {
        creation: Timestamp,
        transmissionIA: Timestamp,
        traitementEffectue: Timestamp,
        rapprochementBancaire: null
    },
    
    // DOCUMENTS
    documents: [
        {
            nom: "DS_1754679116964_n0s6gx.csv",
            nomOriginal: "2024-12-09 - CAMIEG.csv",
            chemin: "decomptes-secu/ORIXIS/inbox/2025/01/08/...",
            url: "https://storage.googleapis.com/...",
            taille: 3952,
            type: "text/csv",
            hash: "d55d52f3a8c4b9e..."
        }
    ],
    
    // WORKFLOW
    statut: "traitement_effectue",
    
    // HISTORIQUE
    historique: [
        {
            date: Date,
            action: "creation",
            details: "3 document(s) uploadé(s)",
            utilisateur: { nom: "MARTIN", prenom: "Paul" }
        }
    ]
}
🚀 Fonctionnalités Clés
1. Détection de Doublons Intelligente
javascript// Double système de détection :

// 1. Par HASH (exactitude 100%)
const doublon = await firestoreService.verifierHashExiste(hash);

// 2. Par CONTENU (score de probabilité)
const doublons = await firestoreService.rechercherDoublonsProbables({
    virements: [...],      // Compare les virements
    caissePrimaire: "..."  // Compare la caisse
});
// Retourne un score 0-100% de certitude
2. Analyse IA Multi-Format
javascript// Support de 3 formats :
- PDF → Conversion en images via PDF.js
- CSV → Parsing direct avec Papa Parse  
- Images → Conversion base64

// Extraction automatique :
- Informations générales (caisse, FINESS, période)
- Virements multiples (date, référence, montant)
- Bénéficiaires (nom, NSS, montant)
- Appareils (oreille, code acte, montant)
3. Vue Multi-Virements
javascript// Transformation des données pour affichage :
// 1 décompte avec 3 virements → 3 lignes dans le tableau

decomptesAplatis = [];
decompte.virements.forEach((virement, index) => {
    decomptesAplatis.push({
        id: `${decompte.id}_vir_${index}`,
        decompteId: decompte.id,
        ...virement,
        _decompteComplet: decompte
    });
});
4. Rapprochement Individuel
javascript// Chaque virement peut être rapproché individuellement
await firestoreService.rapprocherVirement(
    decompteId,
    virementId,
    {
        montant: 1920.00,
        commentaire: "RAS"
    }
);

// Statut global "rapprochement_complet" quand TOUS sont rapprochés
🔌 Dépendances
Externes (CDN)
javascript// PDF.js - Conversion PDF
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>

// Papa Parse - Parsing CSV
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>

// Firebase - BDD et Storage
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
Internes (Widgets)
javascriptimport { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { PdfUploaderWidget } from '../../widgets/pdf-uploader/pdf-uploader.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import toast from '../../widgets/toast/toast.widget.js';
⚙️ Configuration
Firebase
javascript// firebase.service.js
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "orixis-pwa",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};

export const db = getFirestore(app);
export const storage = getStorage(app);
Cloud Function
javascript// Pour l'analyse IA
const CONFIG = {
    cloudFunctionUrl: 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument',
    maxPagesPerRequest: 10,
    imageQuality: 0.8
};
Limites
javascriptconst LIMITS = {
    maxFileSize: 10 * 1024 * 1024,     // 10MB
    maxFiles: 100,                      // Par upload
    batchSize: 500,                     // Firestore batch
    maxVirements: 50,                   // Par décompte
    maxBeneficiaires: 100,              // Par virement
    cacheTimeout: 5 * 60 * 1000        // 5 minutes
};
🎯 Points d'Extension
Pour Adapter à d'Autres Contextes

Changer le Type de Document

Modifier decompte-secu.template.js pour la structure
Adapter le prompt IA dans generatePrompt()
Ajuster les colonnes du DataGrid


Ajouter des États

Mettre à jour CONFIG.STATUTS dans l'orchestrator
Ajouter les transitions dans le workflow
Adapter la timeline dans DetailViewer


Personnaliser l'Extraction IA

Modifier le prompt dans decompte-secu.openai.service.js
Adapter formatIAResponse() pour le nouveau format
Ajuster la validation des données extraites


Intégrer d'Autres Sources

Ajouter des parsers dans OpenAI service
Implémenter de nouvelles méthodes de conversion
Adapter la détection de doublons



📝 Notes d'Implémentation
Performance

Cache : Magasins cachés 5 minutes
Pagination : DataGrid limité à 10-100 items
Lazy Loading : Widgets chargés à la demande
Batch : Opérations Firestore par lots de 500

Sécurité

Auth : Vérification via localStorage
Hash : SHA-256 pour intégrité
Validation : Types et tailles de fichiers
Sanitization : NSS et données sensibles

UX

Feedback : Toast notifications
Loading : États de chargement visuels
Confirmation : Dialogues pour actions critiques
Timeline : Visualisation du workflow

🚨 Points d'Attention

Index Firestore : Créer les index composites nécessaires
Quotas API : Limiter les appels OpenAI
Storage : Nettoyer les fichiers orphelins
Mémoire : Pagination pour gros volumes
Concurrence : Gestion des modifications simultanées
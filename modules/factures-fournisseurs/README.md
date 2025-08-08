# 📑 Module Factures Fournisseurs

## 📝 Description

Module complet de gestion des factures fournisseurs avec extraction automatique des données par IA (GPT-4.1-mini). Le module permet l'upload, l'analyse, le suivi et la gestion comptable des factures.

## 🎯 Fonctionnalités principales

### 1. Upload et création
- **Upload multiple** de factures (PDF, JPG, PNG)
- **Détection de doublons** par hash SHA-256
- **Classement automatique** : À payer / Déjà payée
- **Stockage structuré** dans Firebase Storage

### 2. Extraction IA automatique
- **Analyse GPT-4.1-mini** de chaque facture uploadée
- **Extraction complète** :
  - Identifiants (n° facture, SIRET, TVA intra...)
  - Fournisseur (nom, catégorie, coordonnées...)
  - Montants (HT, TVA, TTC, ventilation...)
  - TVA détaillée (régime, exonération, taux...)
  - **Comptabilité intelligente** (compte PCG, justification)
  - Dates et échéances
  - Mode de paiement

### 3. Gestion des statuts
```
Nouvelle → À payer → Payée → Pointée
         ↘ Déjà payée ↗
```

### 4. Tableaux de bord
- **Stats en temps réel** par cartes cliquables
- **Sélection multiple** dans le tableau ✅ NOUVEAU
- **Filtres multiples** : statut, fournisseur, catégorie, magasin, période
- **Recherche globale** : n° facture, fournisseur, référence
- **Export** : CSV, Excel, **Export comptable** ✅ NOUVEAU

### 5. Export comptable avancé ✅ NOUVEAU
- **Export individuel** : Depuis le détail d'une facture
- **Export multiple** : Sélection de plusieurs factures dans le tableau
- **Format FEC** compatible avec tous les logiciels comptables
- **Écritures détaillées** avec ventilation TVA et lignes de détail
- **Résumé** par fournisseur et compte comptable

### 6. Vue détaillée enrichie
- **Timeline visuelle** du workflow
- **12 sections d'informations** structurées
- **Actions contextuelles** selon le statut
- **Export comptable individuel**
- **Boutons avec icônes prédéfinies** ✅ NOUVEAU

## 🏗️ Architecture

```
modules/factures-fournisseurs/
├── factures-fournisseurs.html              # Page principale
├── factures-fournisseurs.orchestrator.js   # 🎯 Chef d'orchestre
├── factures-fournisseurs.service.js        # Logique métier
├── factures-fournisseurs.firestore.service.js  # Base de données
├── factures-fournisseurs.openai.service.js # Extraction IA
├── factures-fournisseurs.upload.service.js # Stockage fichiers
└── factures-fournisseurs.template.js       # Structure données

src/utils/
└── widget-styles-loader.js    # ✅ NOUVEAU : Chargeur de styles centralisé

widgets/
├── data-grid/                 # Tableau avec sélection multiple
├── pdf-uploader/              # Upload de documents
├── detail-viewer/             # Vue détaillée
└── ...                        # Autres widgets
```

## 🎨 Système de design centralisé ✅ NOUVEAU

### Chargement automatique des styles
Tous les widgets chargent automatiquement les styles communs via `widget-styles-loader.js` :
- `buttons.css` : Tous les styles de boutons
- `badges.css` : Tous les styles de badges
- `modal-base.css` : Styles de base des modals

### Classes CSS disponibles

#### Boutons icônes
```html
<button class="btn btn-view-icon"></button>     <!-- Œil vert -->
<button class="btn btn-delete-icon"></button>   <!-- Poubelle rouge -->
<button class="btn btn-edit-icon"></button>     <!-- Crayon bleu -->
```

#### Boutons glass
```html
<button class="btn btn-glass-blue btn-lg">Valider</button>
<button class="btn btn-glass-red">Annuler</button>
<button class="btn btn-glass-orange">En attente</button>
<button class="btn btn-glass-purple">Export</button>
```

#### Badges
```html
<span class="badge badge-success">Payée</span>
<span class="badge badge-warning">À payer</span>
<span class="badge badge-danger">En retard</span>
```

## 🔄 Workflow complet

```mermaid
graph LR
    A[Upload PDF] --> B[Hash + Storage]
    B --> C[Création Firestore]
    C --> D[Analyse GPT-4.1-mini]
    D --> E[Extraction données]
    E --> F[Enrichissement]
    F --> G[Affichage]
    G --> H[Sélection]
    H --> I[Export comptable]
```

## 💾 Structure de données (Firestore)

### Document principal
```javascript
{
  // IDENTIFICATION
  numeroInterne: "FF-20250209-0001",
  numeroFacture: "F-2025-1234",
  
  // IDENTIFIANTS COMPLETS
  identifiants: {
    numeroFacture, numeroCommande, numeroClient,
    numeroTVAIntra, siret, siren, naf
  },
  
  // FOURNISSEUR ENRICHI
  fournisseur: {
    nom, categorie, siren, numeroTVA,
    adresse, telephone, email,
    paysDomiciliation, compteFournisseur,
    banque: { nom, iban, bic }
  },
  
  // TVA DÉTAILLÉE
  tva: {
    regime: "NATIONAL|INTRACOMMUNAUTAIRE|EXPORT",
    exoneration: boolean,
    motifExoneration: string,
    autoliquidation: boolean,
    tauxApplique: number,
    ventilationTVA: []
  },
  
  // COMPTABILITÉ INTELLIGENTE
  comptabilite: {
    categorieDetectee: string,
    compteComptable: "6xxx",      // Compte PCG
    libelleCompte: string,
    justification: string,         // Explication IA
    motsClesDetectes: [],
    fiabilite: 0-100,
    journalComptable: "HA",
    codeAnalytique: string
  },
  
  // PAIEMENT
  paiement: {
    modePaiement, conditionsPaiement,
    iban, bic, referenceMandat,
    escompte: { taux, dateLimit, montant }
  },
  
  // DOCUMENTS LIÉS
  documentsLies: {
    bonCommande, bonLivraison, avoir,
    facturePrecedente, contrat, devis
  },
  
  // LIGNES DÉTAIL
  lignesDetail: [{
    reference, designation, quantite,
    prixUnitaireHT, montantHT, tauxTVA
  }],
  
  // WORKFLOW
  statut: "nouvelle|a_payer|payee|pointee",
  dates: { creation, analyse, paiement... },
  historique: []
}
```

## 📊 Export comptable multiple ✅ NOUVEAU

### Activation de la sélection
Le tableau permet maintenant la **sélection multiple** avec cases à cocher :
- Cliquer sur les cases pour sélectionner
- Le bouton "Export comptable" affiche le nombre sélectionné
- Export de toutes les factures sélectionnées en un seul fichier

### Format du fichier exporté
```csv
EXPORT COMPTABLE - 09/02/2025 14:30:00
Nombre de factures;5
Total HT;2500,00
Total TVA;500,00
Total TTC;3000,00

RESUME PAR FOURNISSEUR
Fournisseur;Nombre;Montant TTC
Free;2;240,00
EDF;1;1500,00

RESUME PAR COMPTE COMPTABLE
Compte;Libellé;Montant HT
6262;Télécommunications;1250,00
6061;Fournitures non stockables;1250,00

ECRITURES COMPTABLES DETAILLEES
Journal;Date;N°Écriture;Compte;Débit;Crédit;...
HA;09/02/2025;HA202500001;6262;100,00;0,00;...
```

### Utilisation
1. **Sélectionner** les factures dans le tableau (cases à cocher)
2. **Cliquer** sur "📊 Export comptable (X)"
3. **Téléchargement** automatique du CSV

## 🤖 Extraction IA - Données récupérées

### Catégories détectées automatiquement
- **6061** : Eau, gaz, électricité
- **6064** : Fournitures administratives  
- **6183/2183** : Informatique (>500€ = immobilisation)
- **6262** : Télécommunications
- **6265** : Logiciels et abonnements
- **6221** : Carburants
- **6156** : Maintenance
- **6226** : Honoraires
- **627** : Services bancaires

### Régimes TVA identifiés
- **National** : TVA française standard
- **Intracommunautaire** : Exonération + autoliquidation
- **Export** : TVA 0%

## 🚀 Installation

### 1. Prérequis
- Firebase (Firestore + Storage + Auth)
- Clé API OpenAI (Cloud Function)
- PDF.js pour conversion

### 2. Configuration Firebase
```javascript
// src/services/firebase.service.js
const firebaseConfig = {
  projectId: "orixis-pwa",
  storageBucket: "orixis-pwa.appspot.com"
  // ...
};
```

### 3. Cloud Function OpenAI
```javascript
// Déployée sur : 
// https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument
```

### 4. Créer le widget-styles-loader ✅ NOUVEAU
Créer `/src/utils/widget-styles-loader.js` avec le code fourni pour centraliser le chargement des styles.

## 📊 Widgets utilisés

- **HeaderWidget** : En-tête avec navigation
- **StatsCardsWidget** : Cartes statistiques cliquables
- **SearchFiltersWidget** : Filtres avancés
- **DataGridWidget** : Tableau avec tri/export/sélection ✅ AMÉLIORÉ
- **PdfUploaderWidget** : Upload avec sélection statut
- **DetailViewerWidget** : Vue détaillée complète

## 🔍 Points d'attention

### Sécurité
- ✅ Hash SHA-256 anti-doublons
- ✅ Validation types fichiers
- ✅ Limite taille 10MB
- ✅ Authentification requise

### Performance
- ⚡ Conversion PDF côté client
- ⚡ Limité à 5 pages par PDF
- ⚡ Cache des données fournisseurs
- ⚡ Pagination 20 items
- ⚡ Chargement CSS centralisé ✅ NOUVEAU

### Conformité
- 📋 Mentions obligatoires vérifiées
- 📋 Conservation données comptables
- 📋 Export FEC compatible
- 📋 Écritures équilibrées (débit = crédit)

## 🐛 Debug

### Console navigateur
```javascript
window.orchestrator  // Accès orchestrateur

// Vérifier le chargement des styles
document.getElementById('buttons-css')  // Doit exister
document.getElementById('badges-css')   // Doit exister
document.getElementById('modal-base-css') // Doit exister
```

### Logs structurés
- 🚀 Initialisation
- 📊 Chargement données
- 🤖 Analyse IA
- ✅ Succès
- ❌ Erreurs
- 📊 Export comptable

## 🆕 Nouveautés v2.0

### Février 2025
- ✅ **Sélection multiple** dans le tableau
- ✅ **Export comptable groupé** pour plusieurs factures
- ✅ **Système de design centralisé** avec `widget-styles-loader.js`
- ✅ **Boutons avec icônes prédéfinies** (view, delete, edit)
- ✅ **Synchronisation complète** des données GPT-4.1-mini vers Firestore
- ✅ **Format CSV enrichi** avec résumés et ventilations

## 📈 Évolutions prévues

- [ ] Import par email
- [ ] OCR avancé pour manuscrits
- [ ] Rapprochement automatique bancaire
- [ ] Workflows personnalisés
- [ ] API REST pour intégration
- [ ] Dashboard analytique
- [ ] Alertes échéances
- [ ] Export direct vers logiciels comptables (API)

## 👥 Auteur

Module développé dans l'architecture **decompte-mutuelle** adaptée pour la gestion des factures fournisseurs.

---

**Version** : 2.0  
**Dernière MAJ** : 09/02/2025  
**Statut** : Production

## 📋 Changelog

### v2.0 (09/02/2025)
- Ajout sélection multiple dans DataGrid
- Export comptable groupé
- Système de styles centralisé
- Boutons avec icônes CSS prédéfinies
- Correction synchronisation données IA

### v1.0 (08/02/2025)
- Version initiale
- Upload et analyse IA
- Vue détaillée avec timeline
- Export CSV/Excel simple
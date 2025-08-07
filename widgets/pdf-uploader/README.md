# 📄 PdfUploaderWidget - Documentation

Widget modal autonome pour l'upload de documents PDF et images avec workflow configurable et analyse IA intégrée.

## 🚀 Installation

```javascript
import { PdfUploaderWidget } from '/widgets/pdf-uploader/pdf-uploader.widget.js';
```

## 📝 Utilisation basique

```javascript
// Mode simple (upload direct)
const uploader = new PdfUploaderWidget({
    title: 'Nouveau document',
    onSave: async (data) => {
        console.log('Fichiers:', data.files);
        // Traiter les fichiers...
    }
});

// Mode sélection (avec options)
const uploader = new PdfUploaderWidget({
    title: 'Nouvelles factures',
    mode: 'selection',
    selectionOptions: [
        { value: 'a_payer', label: '💳 À payer' },
        { value: 'deja_payee', label: '✅ Déjà payée' }
    ],
    onSave: async (data) => {
        console.log('Fichiers:', data.files);
        console.log('Sélections:', data.selections);
    }
});
```

## ⚙️ Configuration complète

### Options principales

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `title` | string | 'Importer vos documents' | Titre du modal |
| `theme` | string | 'purple' | Thème de couleur ('purple', 'red', 'blue') |
| `size` | string | 'large' | Taille du modal ('small', 'medium', 'large') |
| `mode` | string | 'simple' | Mode de workflow ('simple', 'selection') |
| `selectionOptions` | array | [] | Options pour mode selection |
| `saveButtonText` | string | '💾 Enregistrer et analyser' | Texte du bouton |

### Zone de description (personnalisable)

```javascript
description: {
    icon: '✨',                    // Icône/emoji
    title: 'Intelligence artificielle intégrée',
    text: 'Notre IA analyse automatiquement vos documents et extrait toutes les informations nécessaires.'
}
```

### Configuration Dropzone

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `maxFiles` | number | 10 | Nombre max de fichiers |
| `maxFileSize` | number | 10485760 | Taille max en octets (10MB) |
| `acceptedTypes` | array | ['application/pdf', 'image/jpeg', 'image/png'] | Types MIME acceptés |

### Options de sélection (mode selection)

```javascript
selectionOptions: [
    {
        value: 'a_payer',        // Valeur interne
        label: '💳 À payer'      // Label affiché
    },
    {
        value: 'deja_payee',
        label: '✅ Déjà payée'
    },
    {
        value: 'en_attente',
        label: '⏳ En attente'
    }
]
```

### Gestion des fichiers

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `allowRemoveFiles` | boolean | true | Permettre suppression |
| `confirmBeforeRemove` | boolean | false | Confirmer avant suppression |

### Comportement modal

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `closeOnOverlay` | boolean | true | Fermer au clic sur overlay |
| `closeOnEscape` | boolean | true | Fermer avec Escape |
| `confirmBeforeClose` | boolean | false | Confirmer si fichiers non sauvés |

### Callbacks

```javascript
{
    onSave: async (data) => {
        // data.files : array des fichiers
        // data.selections : array des sélections (si mode selection)
        console.log('Sauvegarde:', data);
    },
    
    onClose: () => {
        console.log('Modal fermé');
    },
    
    onError: (error) => {
        console.error('Erreur:', error);
    }
}
```

## 📌 API Publique

### Méthodes

```javascript
// Contrôle du modal
uploader.open();                    // Ouvrir le modal
uploader.close();                   // Fermer le modal

// Récupération des données
const files = uploader.getFiles();  // Obtenir les fichiers uploadés

// Gestion des fichiers
uploader.removeFile(index);         // Supprimer un fichier
uploader.handleFilesDrop(files);    // Ajouter des fichiers
uploader.updateSelection(index, value); // MAJ sélection (mode selection)

// Nettoyage
uploader.destroy();                 // Destruction complète
```

### Propriétés

```javascript
uploader.id           // ID unique du widget
uploader.state        // État interne
uploader.config       // Configuration
uploader.elements     // Références DOM
```

### Structure de l'état

```javascript
uploader.state = {
    isOpen: false,        // Modal ouvert/fermé
    step: 'upload',       // 'upload' | 'selection' | 'processing'
    files: [],           // Fichiers uploadés
    selections: [],      // Sélections (mode selection)
    processing: false,   // En cours de traitement
    loaded: false        // Chargé et prêt
}
```

## 🎨 Zones du widget

Le widget est composé de 4 zones distinctes :

### 1. Zone Description
- Icône animée avec effet pulse
- Titre et texte personnalisables
- Gradient de fond et effet de lueur

### 2. Zone Dropzone
- Drag & drop de fichiers
- Click pour parcourir
- Animation au survol/drop
- Badges des formats acceptés

### 3. Zone Sélection (mode selection uniquement)
- Liste des fichiers uploadés
- Options de sélection par fichier
- Radio buttons stylisés

### 4. Zone Résumé
- Compteur de fichiers
- Statistiques par type (mode selection)
- Liste scrollable des fichiers
- Boutons de suppression optionnels

## 💡 Exemples complets

### Upload simple de décomptes

```javascript
const decompteUploader = new PdfUploaderWidget({
    title: 'Nouveau Décompte Mutuelle',
    theme: 'purple',
    mode: 'simple',
    
    description: {
        icon: '🏥',
        title: 'Analyse automatique',
        text: 'Les montants et dates seront extraits automatiquement.'
    },
    
    maxFiles: 5,
    acceptedTypes: ['application/pdf'],
    
    saveButtonText: '📤 Envoyer le décompte',
    
    onSave: async (data) => {
        // Upload vers Firebase
        for (const file of data.files) {
            await uploadToFirebase(file);
        }
        
        // Analyse IA
        await analyzeWithAI(data.files);
        
        showSuccess('Décompte uploadé avec succès !');
    }
});
```

### Upload de factures avec statut

```javascript
const factureUploader = new PdfUploaderWidget({
    title: 'Nouvelles Factures Fournisseurs',
    theme: 'red',
    mode: 'selection',
    size: 'large',
    
    description: {
        icon: '📑',
        title: 'Classification automatique',
        text: 'Indiquez le statut de paiement pour chaque facture.'
    },
    
    selectionOptions: [
        { value: 'a_payer', label: '💳 À payer' },
        { value: 'deja_payee', label: '✅ Déjà payée' },
        { value: 'en_attente', label: '⏳ En attente' }
    ],
    
    maxFiles: 20,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    
    allowRemoveFiles: true,
    confirmBeforeRemove: true,
    confirmBeforeClose: true,
    
    saveButtonText: '💾 Enregistrer les factures',
    
    onSave: async (data) => {
        // Créer une facture pour chaque fichier
        for (let i = 0; i < data.files.length; i++) {
            const file = data.files[i];
            const statut = data.selections[i];
            
            await createFacture({
                file: file,
                statut: statut,
                // ...
            });
        }
    },
    
    onError: (error) => {
        if (error.type === 'size') {
            alert('Fichier trop volumineux !');
        }
    }
});
```

### Upload avec validation custom

```javascript
const documentUploader = new PdfUploaderWidget({
    title: 'Documents administratifs',
    theme: 'blue',
    
    // Validation avant sauvegarde
    onSave: async (data) => {
        // Vérifier qu'il y a au moins 2 fichiers
        if (data.files.length < 2) {
            throw new Error('Minimum 2 documents requis');
        }
        
        // Vérifier les noms de fichiers
        for (const file of data.files) {
            if (!file.name.includes('2025')) {
                throw new Error(`Le fichier "${file.name}" doit être de 2025`);
            }
        }
        
        // Si tout est OK, sauvegarder
        await saveDocuments(data);
    }
});
```

## 🎨 Thèmes disponibles

### Purple (défaut)
```javascript
theme: 'purple'  // Violet moderne, idéal pour IA/Tech
```

### Red
```javascript
theme: 'red'     // Rouge énergique, pour actions importantes
```

### Blue
```javascript
theme: 'blue'    // Bleu professionnel, pour documents officiels
```

## 📱 Responsive

Le widget s'adapte automatiquement :

- **Desktop** : Modal centré avec taille configurée
- **Tablet** : Modal pleine largeur avec marges
- **Mobile** : Modal plein écran, sections empilées

## 🔄 Workflow complet

### Mode Simple
```
Ouverture → Upload fichiers → Résumé → Sauvegarde
```

### Mode Selection
```
Ouverture → Upload fichiers → Sélection statuts → Résumé → Sauvegarde
```

## ⚠️ Notes importantes

- **DropZone externe** : Utilise le composant `/src/components/ui/dropzone/dropzone.component.js`
- **Destruction** : Toujours appeler `destroy()` pour éviter les fuites mémoire
- **Références globales** : Widget enregistré dans `window.pdfUploaderWidgets` pour callbacks
- **Validation fichiers** : Types MIME et taille vérifiés automatiquement
- **Anti-FOUC** : Délai de 100ms avant affichage pour éviter le flash

## 🔄 Cycle de vie

```
new PdfUploaderWidget()
    ↓
loadCSS()
    ↓
init()
    ├── render()
    ├── initDropzone() [100ms delay]
    ├── attachEvents()
    └── showWithDelay()
    ↓
open() [automatique]
    ↓
[Upload fichiers]
    ↓
[Selection si mode='selection']
    ↓
[Résumé mis à jour]
    ↓
save() → onSave callback
    ↓
close()
    ↓
destroy() [optionnel ou auto si destroyOnClose]
```

## 📦 Structure des fichiers

```
/widgets/pdf-uploader/
├── pdf-uploader.widget.js   # Logique du widget
├── pdf-uploader.widget.css  # Styles (auto-chargé)
└── README.md                # Cette documentation
```

## 🔧 Dépendances

- **DropZone Component** : `/src/components/ui/dropzone/dropzone.component.js`
- **Styles boutons** : Classes CSS externes via projet principal

---

**Version** : 1.0.0  
**Auteur** : Assistant Claude  
**Date** : 08/02/2025
# 📊 DetailViewerWidget - Documentation

Widget modal autonome pour afficher le détail d'un élément avec timeline intégrée et sections configurables.

## 🚀 Installation

```javascript
import { DetailViewerWidget } from '/widgets/detail-viewer/detail-viewer.widget.js';
```

## 📝 Utilisation basique

```javascript
const viewer = new DetailViewerWidget({
    title: 'Facture #123',
    data: factureData,
    sections: [
        {
            id: 'info',
            title: '📋 Informations',
            fields: [
                { label: 'Numéro', key: 'numero' },
                { label: 'Date', key: 'date', formatter: 'date' }
            ]
        }
    ]
});
```

## ⚙️ Configuration complète

### Options principales

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `title` | string | 'Détail' | Titre du modal |
| `subtitle` | string | null | Sous-titre optionnel |
| `data` | object | {} | Données à afficher |
| `theme` | string | 'default' | Thème visuel ('default', 'minimal', 'dark') |
| `size` | string | 'large' | Taille ('small', 'medium', 'large', 'xlarge') |
| `autoOpen` | boolean | true | Ouvrir automatiquement |
| `destroyOnClose` | boolean | false | Détruire après fermeture |
| `closeOnOverlay` | boolean | true | Fermer au clic sur overlay |
| `closeOnEscape` | boolean | true | Fermer avec Escape |

### Timeline (optionnelle)

```javascript
timeline: {
    enabled: true,              // Activer/désactiver
    items: [                    // Étapes de la timeline
        {
            label: 'Créée',
            icon: '📝',         // Emoji ou texte
            status: 'completed', // completed|active|pending|error|warning
            date: '01/02/2025',
            description: 'Facture créée'  // Texte optionnel sous la date
        },
        {
            label: 'En cours',
            icon: '⏳',
            status: 'active',
            date: '03/02/2025',
            description: 'En attente de paiement'
        }
    ],
    theme: 'colorful',          // default|minimal|colorful
    size: 'medium',             // small|medium|large
    orientation: 'horizontal',  // horizontal|vertical
    animated: true,             // Animations
    showDates: true,           // Afficher les dates
    showLabels: true,          // Afficher les labels
    pulse: true                // Animation pulse sur l'actif
}
```

### Sections configurables

```javascript
sections: [
    {
        id: 'fournisseur',           // ID unique
        title: '🏢 Fournisseur',     // Titre avec icône
        enabled: true,               // Visible ou non
        collapsible: false,          // Peut être replié
        collapsed: false,            // État initial si collapsible
        layout: 'grid',              // grid|list|table
        className: 'custom-class',   // Classes CSS additionnelles
        
        fields: [
            {
                label: 'Nom',        // Label affiché
                key: 'fournisseur.nom', // Chemin dans data (notation pointée)
                value: 'Valeur fixe',   // OU valeur directe
                
                // Formatage
                formatter: 'currency',  // Voir types ci-dessous
                formatterOptions: {     // Options du formatter
                    currency: 'EUR'
                },
                
                // Style
                bold: false,            // Texte en gras
                className: '',          // Classes CSS
                fullWidth: false,       // Prend toute la largeur
                
                // Autres
                defaultValue: '-',      // Si valeur vide
                html: false,           // Si true, ne pas échapper HTML
                visible: true          // Afficher ou non
            }
        ],
        
        // OU contenu HTML personnalisé
        customContent: '<div>Mon HTML</div>'
    }
]
```

### Types de formatters

| Formatter | Description | Options | Exemple |
|-----------|-------------|---------|---------|
| `currency` | Montant monétaire | `currency: 'EUR'` | 1234.56 → 1 234,56 € |
| `number` | Nombre formaté | Options Intl.NumberFormat | 1234.56 → 1 234,56 |
| `percent` | Pourcentage | `decimals: 2` | 0.15 → 15% |
| `date` | Date | Options toLocaleDateString | 2025-02-09 → 09/02/2025 |
| `datetime` | Date et heure | Options toLocaleString | → 09/02/2025 14:30 |
| `boolean` | Oui/Non | `trueText`, `falseText` | true → Oui |
| `badge` | Badge coloré | `class`, `icon` | → `<span class="badge">...</span>` |
| `function` | Fonction custom | `(value, options) => string` | Personnalisé |

### Actions (boutons footer)

```javascript
actions: [
    {
        label: 'Valider',
        icon: '✅',              // Icône optionnelle
        style: 'primary',        // Utilise buttonClasses[style]
        class: 'btn btn-glass-blue btn-lg',  // OU classe directe
        disabled: false,         // État désactivé
        closeOnClick: true,      // Fermer après clic
        data: { id: 123 },       // Data attributes
        show: (data) => data.statut === 'nouveau',  // Condition d'affichage
        onClick: (data, widget) => {
            console.log('Validé!', data);
            // return true pour fermer, false pour garder ouvert
        }
    }
]
```

## 🎨 Système de styles centralisé ✅ NOUVEAU

### Chargement automatique
Le widget charge automatiquement via `loadWidgetStyles()` :
- `buttons.css` - Tous les styles de boutons
- `badges.css` - Tous les styles de badges  
- `modal-base.css` - Styles de base des modals

### Classes disponibles pour les actions

```javascript
// Boutons avec icônes prédéfinies
'btn btn-view-icon'      // Œil vert (voir)
'btn btn-delete-icon'    // Poubelle rouge (supprimer)
'btn btn-edit-icon'      // Crayon bleu (modifier)

// Boutons glass (fond clair)
'btn btn-glass-blue'     // Bleu transparent
'btn btn-glass-red'      // Rouge transparent
'btn btn-glass-green'    // Vert transparent
'btn btn-glass-orange'   // Orange transparent
'btn btn-glass-purple'   // Violet transparent

// Boutons solid (plus opaques)
'btn btn-glass-solid-blue'   // Bleu opaque
'btn btn-glass-solid-red'    // Rouge opaque
'btn btn-glass-solid-green'  // Vert opaque

// Combinaisons avec tailles
'btn btn-glass-blue btn-lg'  // Grand bouton bleu
'btn btn-glass-red btn-sm'   // Petit bouton rouge
```

### Exemple d'utilisation des classes

```javascript
actions: [
    {
        label: 'Voir le document',
        class: 'btn btn-view-icon btn-lg',  // Gros bouton œil
        onClick: (data) => window.open(data.url)
    },
    {
        label: 'Valider',
        class: 'btn btn-glass-solid-blue btn-lg',  // Gros bouton bleu solid
        onClick: async (data) => { ... }
    },
    {
        label: 'Supprimer',
        class: 'btn btn-glass-red',  // Bouton rouge transparent
        onClick: (data) => { ... }
    }
]
```

## 📌 API Publique

### Méthodes

```javascript
// Contrôle du modal
viewer.open();                      // Ouvrir le modal
viewer.close();                     // Fermer le modal

// Mise à jour des données
viewer.update({ nouveauChamp: 'valeur' });  // MAJ partielle des données
viewer.refresh();                           // Rafraîchir tout l'affichage

// Sections
viewer.toggleSection('sectionId');          // Replier/déplier une section

// Actions
viewer.handleAction(index);                 // Déclencher une action par index

// Nettoyage
viewer.destroy();                           // Destruction complète du widget
```

### Propriétés

```javascript
viewer.id           // ID unique du widget
viewer.state        // État interne {isOpen, loaded, currentData}
viewer.config       // Configuration complète
viewer.elements     // Références DOM {overlay, modal, body, ...}
```

## 💡 Exemples complets

### Facture détaillée avec timeline et actions

```javascript
const factureViewer = new DetailViewerWidget({
    title: `Facture ${facture.numero}`,
    subtitle: `${facture.fournisseur} - ${facture.montantTTC}€`,
    data: facture,
    
    timeline: {
        enabled: true,
        items: [
            { 
                label: 'Créée', 
                status: 'completed', 
                date: '01/02/2025',
                description: 'Facture uploadée',
                icon: '📄'
            },
            { 
                label: 'Analysée', 
                status: 'completed', 
                date: '01/02/2025',
                description: 'Extraction IA réussie',
                icon: '🤖'
            },
            { 
                label: 'À payer', 
                status: 'active', 
                date: '02/02/2025',
                description: 'En attente de paiement',
                icon: '💳'
            },
            { 
                label: 'Payée', 
                status: 'pending',
                icon: '💰'
            },
            { 
                label: 'Pointée', 
                status: 'pending',
                icon: '✓✓'
            }
        ],
        theme: 'colorful',
        orientation: 'horizontal'
    },
    
    sections: [
        {
            id: 'identifiants',
            title: '🔢 Identifiants',
            layout: 'grid',
            fields: [
                { label: 'N° Facture', key: 'numeroFacture', bold: true },
                { label: 'N° Interne', key: 'numeroInterne', bold: true },
                { label: 'SIRET', key: 'identifiants.siret' },
                { label: 'TVA Intra', key: 'identifiants.numeroTVAIntra' }
            ]
        },
        {
            id: 'montants',
            title: '💰 Montants',
            layout: 'table',
            fields: [
                { label: 'Montant HT', key: 'montantHT', formatter: 'currency' },
                { label: 'TVA 20%', key: 'montantTVA', formatter: 'currency' },
                { 
                    label: 'Montant TTC', 
                    key: 'montantTTC', 
                    formatter: 'currency',
                    bold: true,
                    formatter: (v) => `<strong style="color: var(--primary);">${v}</strong>`,
                    html: true
                }
            ]
        },
        {
            id: 'dates',
            title: '📅 Dates importantes',
            collapsible: true,
            fields: [
                { label: 'Date facture', key: 'dateFacture', formatter: 'date' },
                { 
                    label: 'Échéance', 
                    key: 'dateEcheance', 
                    formatter: (v, data) => {
                        const date = new Date(v);
                        const aujourd = new Date();
                        if (date < aujourd && data.statut === 'a_payer') {
                            return `<span style="color: red;">${date.toLocaleDateString('fr-FR')} (En retard)</span>`;
                        }
                        return date.toLocaleDateString('fr-FR');
                    },
                    html: true
                }
            ]
        }
    ],
    
    actions: [
        {
            label: 'Marquer payée',
            class: 'btn btn-glass-solid-green btn-lg',
            icon: '💰',
            show: (data) => data.statut === 'a_payer',
            onClick: async (data, widget) => {
                await marquerPayee(data.id);
                widget.close();
                return true;
            }
        },
        {
            label: 'Export comptable',
            class: 'btn btn-glass-purple btn-lg',
            icon: '📊',
            onClick: (data) => {
                exportComptable(data);
                return false; // Ne pas fermer
            }
        },
        {
            label: 'Supprimer',
            class: 'btn btn-glass-red',
            icon: '🗑️',
            closeOnClick: false,
            onClick: async (data, widget) => {
                if (confirm('Supprimer cette facture ?')) {
                    await supprimerFacture(data.id);
                    widget.close();
                    return true;
                }
                return false;
            }
        }
    ]
});
```

### Visualisation simple sans timeline

```javascript
const simpleViewer = new DetailViewerWidget({
    title: 'Détails commande',
    data: commande,
    timeline: { enabled: false },  // Pas de timeline
    sections: [
        {
            id: 'client',
            title: '👤 Client',
            fields: [
                { label: 'Nom', key: 'client.nom' },
                { label: 'Email', key: 'client.email' },
                { label: 'Téléphone', key: 'client.telephone' }
            ]
        },
        {
            id: 'commande',
            title: '📦 Commande',
            fields: [
                { label: 'Référence', key: 'reference', bold: true },
                { label: 'Date', key: 'date', formatter: 'date' },
                { label: 'Total', key: 'total', formatter: 'currency' },
                { 
                    label: 'Statut', 
                    value: 'En cours',
                    formatter: 'badge',
                    formatterOptions: { class: 'badge-warning' }
                }
            ]
        }
    ],
    actions: []  // Pas de boutons d'action
});
```

### Avec formatter personnalisé et HTML

```javascript
sections: [{
    id: 'documents',
    title: '📄 Documents',
    fields: [
        {
            label: 'Fichiers uploadés',
            key: 'documents',
            formatter: (docs) => {
                if (!docs || docs.length === 0) return 'Aucun document';
                return docs.map(d => `
                    <div style="margin: 8px 0;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>📎 ${d.nom}</span>
                            <a href="${d.url}" target="_blank" class="btn btn-view-icon btn-sm"></a>
                        </div>
                    </div>
                `).join('');
            },
            html: true
        }
    ]
}]
```

## 🎨 Personnalisation CSS

Le widget utilise des variables CSS pour la personnalisation :

```css
/* Override dans votre CSS */
:root {
    --dv-primary: #8b5cf6;        /* Couleur principale */
    --dv-primary-light: #a78bfa;  /* Variante claire */
    --dv-border: #e5e7eb;          /* Bordures */
    --dv-shadow-xl: 0 20px 40px -10px rgb(0 0 0 / 0.2);
}
```

## 📦 Structure des fichiers

```
/widgets/detail-viewer/
├── detail-viewer.widget.js   # Logique du widget
├── detail-viewer.widget.css  # Styles spécifiques (auto-chargé)
└── README.md                 # Cette documentation

/src/
├── utils/
│   └── widget-styles-loader.js  # ✅ Chargeur de styles centralisé
├── css/
│   └── components/
│       ├── buttons.css          # Styles des boutons (chargé auto)
│       ├── badges.css           # Styles des badges (chargé auto)
│       └── modal-base.css       # Styles modals (chargé auto)
```

## ⚠️ Notes importantes

- **Timeline intégrée** : Design identique au composant Timeline original
- **Styles centralisés** : Charge automatiquement buttons.css, badges.css, modal-base.css
- **Destruction** : Toujours appeler `destroy()` pour éviter les fuites mémoire
- **Données imbriquées** : Utiliser la notation pointée (`user.address.city`)
- **Responsive** : S'adapte automatiquement mobile/desktop
- **Classes prédéfinies** : Utiliser les classes CSS des boutons pour cohérence

## 🔄 Cycle de vie

```
new DetailViewerWidget()
    ↓
loadCSS()
    ├── loadWidgetStyles()  // ✅ Charge styles communs
    └── Charge CSS spécifique
    ↓
init()
    ├── render()
    ├── attachEvents()
    └── showWithDelay()
    ↓
open() [auto ou manuel]
    ↓
[Interactions utilisateur]
    ├── update()
    ├── refresh()
    └── toggleSection()
    ↓
close()
    ↓
destroy() [optionnel ou auto si destroyOnClose]
```

## 📊 Changelog

### v1.0.1 (09/02/2025)
- ✅ Intégration du système de styles centralisé
- ✅ Utilisation de `loadWidgetStyles()`
- ✅ Documentation des classes de boutons disponibles

### v1.0.0 (08/02/2025)
- Version initiale
- Timeline intégrée
- Sections configurables
- Actions dynamiques

---

**Version** : 1.0.1  
**Auteur** : Assistant Claude  
**Date** : 09/02/2025  
**Mise à jour** : Ajout système de styles centralisé
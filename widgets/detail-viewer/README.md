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
            date: '01/02/2025'
        },
        {
            label: 'En cours',
            icon: '⏳',
            status: 'active',
            date: '03/02/2025'
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
                key: 'fournisseur.nom', // Chemin dans data
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

| Formatter | Description | Options |
|-----------|-------------|---------|
| `currency` | Montant monétaire | `currency: 'EUR'` |
| `number` | Nombre formaté | Options Intl.NumberFormat |
| `percent` | Pourcentage | `decimals: 2` |
| `date` | Date | Options toLocaleDateString |
| `datetime` | Date et heure | Options toLocaleString |
| `boolean` | Oui/Non | `trueText`, `falseText` |
| `badge` | Badge coloré | `class`, `icon` |
| `function` | Fonction custom | `(value, options) => string` |

### Actions (boutons footer)

```javascript
actions: [
    {
        label: 'Valider',
        icon: '✅',              // Icône optionnelle
        style: 'primary',        // Utilise buttonClasses[style]
        class: 'btn-custom',     // OU classe directe
        disabled: false,         // État désactivé
        closeOnClick: true,      // Fermer après clic
        data: { id: 123 },       // Data attributes
        onClick: (data, widget) => {
            console.log('Validé!', data);
        }
    }
]
```

### Classes CSS externes (boutons)

```javascript
buttonClasses: {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    success: 'btn btn-success',
    danger: 'btn btn-danger',
    warning: 'btn btn-warning',
    info: 'btn btn-info',
    close: 'btn-close'
}
```

### Callbacks

```javascript
{
    onOpen: (data, widget) => console.log('Ouvert'),
    onClose: (data, widget) => console.log('Fermé'),
    onAction: (action, data, widget) => console.log('Action:', action)
}
```

## 📌 API Publique

### Méthodes

```javascript
// Ouvrir/fermer
viewer.open();
viewer.close();

// Mettre à jour
viewer.update({ nouveauChamp: 'valeur' });  // MAJ partielle
viewer.refresh();                           // Rafraîchir affichage

// Sections
viewer.toggleSection('sectionId');          // Replier/déplier

// Actions
viewer.handleAction(index);                 // Déclencher action

// Nettoyage
viewer.destroy();                           // Destruction complète
```

### Propriétés

```javascript
viewer.id           // ID unique du widget
viewer.state        // État interne
viewer.config       // Configuration
viewer.elements     // Références DOM
```

## 💡 Exemples complets

### Facture détaillée avec timeline

```javascript
const factureViewer = new DetailViewerWidget({
    title: `Facture ${facture.numero}`,
    subtitle: `${facture.fournisseur} - ${facture.montantTTC}€`,
    data: facture,
    
    timeline: {
        enabled: true,
        items: [
            { label: 'Créée', status: 'completed', date: '01/02' },
            { label: 'Validée', status: 'completed', date: '02/02' },
            { label: 'À payer', status: 'active', icon: '💳' },
            { label: 'Payée', status: 'pending' }
        ],
        theme: 'colorful'
    },
    
    sections: [
        {
            id: 'montants',
            title: '💰 Montants',
            layout: 'table',
            fields: [
                { label: 'HT', key: 'montantHT', formatter: 'currency' },
                { label: 'TVA', key: 'montantTVA', formatter: 'currency' },
                { label: 'TTC', key: 'montantTTC', formatter: 'currency', bold: true }
            ]
        },
        {
            id: 'dates',
            title: '📅 Dates',
            collapsible: true,
            fields: [
                { label: 'Facture', key: 'dateFacture', formatter: 'date' },
                { label: 'Échéance', key: 'dateEcheance', formatter: 'date' },
                { 
                    label: 'Statut', 
                    key: 'statut', 
                    formatter: 'badge',
                    formatterOptions: { 
                        class: 'badge-warning', 
                        icon: '⏳' 
                    }
                }
            ]
        }
    ],
    
    actions: [
        {
            label: 'Marquer payée',
            style: 'success',
            onClick: async (data) => {
                await payerFacture(data.id);
                viewer.close();
            }
        },
        {
            label: 'Annuler',
            style: 'danger',
            closeOnClick: false,
            onClick: () => {
                if (confirm('Annuler ?')) viewer.close();
            }
        }
    ]
});
```

### Simple visualisation

```javascript
const simpleViewer = new DetailViewerWidget({
    title: 'Détails commande',
    data: commande,
    timeline: { enabled: false },  // Pas de timeline
    sections: [
        {
            id: 'info',
            fields: [
                { label: 'Client', key: 'client.nom' },
                { label: 'Total', key: 'total', formatter: 'currency' }
            ]
        }
    ],
    actions: []  // Pas de boutons
});
```

### Avec formatter personnalisé

```javascript
sections: [{
    fields: [
        {
            label: 'Priorité',
            key: 'priority',
            formatter: (value) => {
                const icons = { high: '🔴', medium: '🟡', low: '🟢' };
                return `${icons[value]} ${value.toUpperCase()}`;
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
├── detail-viewer.widget.css  # Styles (auto-chargé)
└── README.md                 # Cette documentation
```

## ⚠️ Notes importantes

- **Timeline intégrée** : Design identique au composant Timeline original
- **CSS autonome** : Tout est inclus, sauf les classes des boutons
- **Destruction** : Toujours appeler `destroy()` pour éviter les fuites mémoire
- **Données imbriquées** : Utiliser la notation pointée (`user.address.city`)
- **Responsive** : S'adapte automatiquement mobile/desktop

## 🔄 Cycle de vie

```
new DetailViewerWidget()
    ↓
loadCSS()
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
destroy() [optionnel]
```

---

**Version** : 1.0.0  
**Auteur** : Assistant Claude  
**Date** : 08/02/2025
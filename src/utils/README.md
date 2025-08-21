# 🎨 Widget Styles Loader

## 📝 Description

Système centralisé de chargement des styles CSS communs pour tous les widgets. Évite la duplication de code et garantit que tous les widgets ont accès aux mêmes styles (boutons, badges, modals).

## 🚀 Installation

### 1. Créer le fichier
Créer `/src/utils/widget-styles-loader.js` avec le code fourni.

### 2. Importer dans vos widgets
```javascript
import { loadWidgetStyles } from '/src/utils/widget-styles-loader.js';
```

### 3. Appeler dans loadCSS()
```javascript
loadCSS() {
    // Charger les styles communs
    loadWidgetStyles();
    
    // Charger le CSS spécifique du widget
    const cssId = 'mon-widget-css';
    // ...
}
```

## 📦 Styles chargés automatiquement

### 1. `buttons.css`
Tous les styles de boutons de l'application :
- Boutons icônes (view, delete, edit)
- Boutons glass (fond clair et fond sombre)
- Tailles (xs, sm, md, lg, xl)
- États (loading, success, error)

### 2. `badges.css`
Tous les styles de badges :
- Badges colorés (success, warning, danger, info)
- Tailles (sm, md, lg)
- Variantes (pill, outline)

### 3. `modal-base.css`
Styles de base pour les modals :
- Overlay avec backdrop blur
- Container avec animations
- Header, body, footer
- Tailles prédéfinies

## 🎯 Utilisation

### Import simple
```javascript
import { loadWidgetStyles } from '/src/utils/widget-styles-loader.js';

export class MonWidget {
    loadCSS() {
        // Une ligne suffit pour charger tous les styles communs
        loadWidgetStyles();
        
        // Puis charger le CSS spécifique si nécessaire
        // ...
    }
}
```

### Utiliser les classes de référence
```javascript
import { WIDGET_STYLES } from '/src/utils/widget-styles-loader.js';

// Dans votre code
const bouton = `<button class="${WIDGET_STYLES.buttons.view}"></button>`;
// Génère : <button class="btn btn-view-icon"></button>
```

### Utiliser les helpers
```javascript
import { createButton, createBadge } from '/src/utils/widget-styles-loader.js';

// Créer un bouton
const viewBtn = createButton('view', '', 'btn-sm');
// Génère : <button class="btn btn-view-icon btn-sm"></button>

// Créer un badge
const badge = createBadge('success', '5');
// Génère : <span class="badge badge-success">5</span>
```

## 📋 Référence des classes disponibles

### Boutons icônes
```javascript
WIDGET_STYLES.buttons.view       // 'btn btn-view-icon'      → 👁️ Vert
WIDGET_STYLES.buttons.delete     // 'btn btn-delete-icon'    → 🗑️ Rouge
WIDGET_STYLES.buttons.edit       // 'btn btn-edit-icon'      → ✏️ Bleu
```

### Boutons glass (fond clair)
```javascript
WIDGET_STYLES.buttons.glassBlue    // 'btn btn-glass-blue'
WIDGET_STYLES.buttons.glassRed     // 'btn btn-glass-red'
WIDGET_STYLES.buttons.glassGreen   // 'btn btn-glass-green'
WIDGET_STYLES.buttons.glassOrange  // 'btn btn-glass-orange'
WIDGET_STYLES.buttons.glassPurple  // 'btn btn-glass-purple'
```

### Boutons solid (plus opaque)
```javascript
WIDGET_STYLES.buttons.solidBlue    // 'btn btn-glass-solid-blue'
WIDGET_STYLES.buttons.solidRed     // 'btn btn-glass-solid-red'
WIDGET_STYLES.buttons.solidGreen   // 'btn btn-glass-solid-green'
```

### Combinaisons courantes
```javascript
WIDGET_STYLES.buttons.saveButton     // 'btn btn-glass-blue btn-lg'
WIDGET_STYLES.buttons.cancelButton   // 'btn btn-glass-red'
WIDGET_STYLES.buttons.primaryButton  // 'btn btn-glass-solid-blue btn-lg'
WIDGET_STYLES.buttons.dangerButton   // 'btn btn-glass-solid-red'
WIDGET_STYLES.buttons.logoutButton   // 'btn btn-logout-user'
```

### Badges
```javascript
WIDGET_STYLES.badges.success    // 'badge badge-success'    → Vert
WIDGET_STYLES.badges.danger     // 'badge badge-danger'     → Rouge
WIDGET_STYLES.badges.warning    // 'badge badge-warning'    → Orange
WIDGET_STYLES.badges.info       // 'badge badge-info'       → Bleu
WIDGET_STYLES.badges.primary    // 'badge badge-primary'    → Violet
WIDGET_STYLES.badges.secondary  // 'badge badge-secondary'  → Gris
```

### Modals
```javascript
WIDGET_STYLES.modals.overlay        // 'modal-overlay'
WIDGET_STYLES.modals.overlayActive  // 'modal-overlay active'
WIDGET_STYLES.modals.container      // 'modal-container'
WIDGET_STYLES.modals.small          // 'modal-small'
WIDGET_STYLES.modals.large          // 'modal-large'
```

## 💡 Exemples concrets

### Dans un widget DataGrid
```javascript
import { loadWidgetStyles, WIDGET_STYLES } from '/src/utils/widget-styles-loader.js';

export class DataGridWidget {
    loadCSS() {
        loadWidgetStyles(); // Charge buttons.css, badges.css, modal-base.css
    }
    
    renderActions(row) {
        return `
            <button class="${WIDGET_STYLES.buttons.view}" title="Voir"></button>
            <button class="${WIDGET_STYLES.buttons.edit}" title="Modifier"></button>
            <button class="${WIDGET_STYLES.buttons.delete}" title="Supprimer"></button>
        `;
    }
}
```

### Dans un orchestrateur
```javascript
// L'orchestrateur peut utiliser les classes après qu'un widget les ait chargées
openDetailModal(row) {
    // ...
    actions: [
        {
            label: 'Valider',
            class: 'btn btn-glass-blue btn-lg',  // Classe disponible
            onClick: () => { ... }
        },
        {
            label: 'Supprimer',
            class: 'btn btn-glass-red',  // Classe disponible
            onClick: () => { ... }
        }
    ]
}
```

### Créer des boutons programmatiquement
```javascript
import { createButton } from '/src/utils/widget-styles-loader.js';

// Simple
const viewBtn = createButton('view');
// → <button class="btn btn-view-icon"></button>

// Avec texte
const saveBtn = createButton('saveButton', 'Enregistrer');
// → <button class="btn btn-glass-blue btn-lg">Enregistrer</button>

// Avec classes supplémentaires
const smallDelete = createButton('delete', '', 'btn-sm');
// → <button class="btn btn-delete-icon btn-sm"></button>
```

## 🔄 Migration des widgets existants

### Avant (ancien code)
```javascript
loadCSS() {
    // Chargement manuel répété dans chaque widget
    if (!document.getElementById('buttons-css')) {
        const link = document.createElement('link');
        link.id = 'buttons-css';
        link.rel = 'stylesheet';
        link.href = '/src/css/components/buttons.css';
        document.head.appendChild(link);
    }
    // Répété pour badges.css, modal-base.css...
}
```

### Après (nouveau code)
```javascript
import { loadWidgetStyles } from '/src/utils/widget-styles-loader.js';

loadCSS() {
    loadWidgetStyles(); // Une ligne remplace tout !
    // ...
}
```

## ✅ Avantages

1. **DRY (Don't Repeat Yourself)** : Plus de duplication du code de chargement CSS
2. **Cohérence** : Tous les widgets utilisent les mêmes styles
3. **Performance** : Les styles ne sont chargés qu'une fois
4. **Maintenance** : Un seul endroit pour ajouter de nouveaux styles communs
5. **Documentation** : `WIDGET_STYLES` liste toutes les classes disponibles
6. **Helpers** : Fonctions pour créer facilement boutons et badges

## 📁 Structure

```
/src/
├── utils/
│   └── widget-styles-loader.js    # Ce module
├── css/
│   └── components/
│       ├── buttons.css            # Styles des boutons
│       ├── badges.css             # Styles des badges
│       └── modal-base.css         # Styles de base des modals
```

## 🔧 Ajouter un nouveau style commun

Pour ajouter un nouveau fichier CSS commun :

1. Ouvrir `/src/utils/widget-styles-loader.js`
2. Ajouter dans le tableau `styles` :
```javascript
{ 
    id: 'mon-style-css', 
    href: '/src/css/components/mon-style.css',
    description: 'Description de mon style'
}
```
3. Tous les widgets qui appellent `loadWidgetStyles()` auront accès au nouveau style

## 🚨 Important

- **Toujours appeler** `loadWidgetStyles()` au début de `loadCSS()`
- **Ne pas dupliquer** le chargement manuel des styles communs
- **Utiliser les constantes** `WIDGET_STYLES` pour connaître les classes disponibles
- **Cache-buster** : Les styles sont chargés avec `?v=${Date.now()}` pour éviter le cache

## 📊 Widgets déjà migrés

- ✅ DetailViewerWidget
- ✅ PdfUploaderWidget
- ⏳ HeaderWidget
- ⏳ StatsCardsWidget
- ⏳ SearchFiltersWidget
- ⏳ DataGridWidget

---

**Version** : 1.0.0  
**Auteur** : Assistant Claude  
**Date** : 09/02/2025  
**Fichier** : `/src/utils/widget-styles-loader.js`
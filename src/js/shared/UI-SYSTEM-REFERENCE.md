# 📖 UI SYSTEM - GUIDE DE RÉFÉRENCE RAPIDE

## 🎯 À PROPOS

Système UI moderne et complet avec effet glassmorphism, conçu pour être modulaire et réutilisable.

- **Version**: 1.0.0
- **Style principal**: Glassmorphism (effet verre dépoli)
- **Architecture**: Composants autonomes avec lazy loading
- **Import unique**: `import { UI } from '/src/js/shared/ui'`

## 📦 COMPOSANTS DISPONIBLES

### 🎯 CORE - Composants de base
```javascript
UI.Button({ text: 'Cliquer', type: 'primary', style: 'glassmorphism' })
UI.Card({ title: 'Ma carte', elevated: true })
UI.FAB({ icon: 'plus', position: 'bottom-right' })
```

### 💬 FEEDBACK - Retours utilisateur
```javascript
UI.Modal({ title: 'Titre', size: 'lg', closable: true })
UI.Dialog.confirm({ title: 'Confirmer?', danger: true })
UI.notify('Message', { type: 'success', duration: 5000 })
UI.Toast({ message: 'Sauvegardé!', position: 'bottom' })
UI.Alert({ type: 'warning', message: 'Attention!' })
UI.Snackbar({ message: 'Action annulée', action: 'Refaire' })
UI.Progress({ value: 75, showLabel: true })
UI.Tour({ steps: [...], startOnMount: true })
```

### 📊 DATA DISPLAY - Affichage de données
```javascript
UI.Table({
    columns: [...],
    data: [...],
    features: { sort: true, search: true, export: true }
})
UI.Timeline({ orientation: 'horizontal', theme: 'colorful' })
UI.StatsCard({ value: 156, label: 'Commandes', trend: '+12%' })
UI.Calendar({ view: 'month', events: [...] })
UI.Kanban({ columns: [...], onDragEnd: () => {} })
```

### 📝 DATA ENTRY - Formulaires
```javascript
UI.Form({
    fields: [
        { type: 'text', name: 'nom', label: 'Nom', validation: 'required' },
        { type: 'email', name: 'email', validation: 'email' }
    ],
    onSubmit: async (data) => { }
})
UI.FormField('text', { name: 'nom', label: 'Nom', icon: '👤' })
UI.DatePicker({ range: true, locale: 'fr' })
UI.Select({ options: [...], multiple: true, searchable: true })
```

### 🎨 ELEMENTS - Éléments visuels
```javascript
UI.Icon('edit', { style: 'frosted', size: 'medium' })
UI.Badge('status', 'livree') // ou UI.Badge('success', 'Validé')
UI.Chip({ text: 'Tag', removable: true })
UI.Avatar({ name: 'Jean Dupont', image: 'url' })
UI.Rating({ value: 4.5, max: 5, readonly: false })
UI.Tooltip({ content: 'Info', position: 'top' })
```

### 🏗️ LAYOUT - Mise en page
```javascript
UI.PageTemplate({
    layout: 'sidebar',
    sections: {
        header: { title: 'Dashboard', actions: [...] },
        sidebar: { items: [...], collapsible: true },
        content: { ... }
    }
})
UI.Tabs({ tabs: [...], defaultActive: 0 })
UI.Accordion({ items: [...], multiple: false })
UI.Drawer({ position: 'left', mode: 'overlay' })
```

### 🧭 NAVIGATION
```javascript
UI.Menu({ items: [...], orientation: 'horizontal' })
UI.Dropdown({ trigger: 'click', items: [...] })
UI.Pagination({ total: 100, pageSize: 10, current: 1 })
UI.Breadcrumb({ items: [...], separator: '>' })
UI.CommandPalette({ trigger: 'cmd+k', commands: [...] })
```

### 🔍 FILTRES
```javascript
UI.FilterPanel({
    filters: [
        { type: 'search', placeholder: 'Rechercher...' },
        { type: 'select', key: 'status', options: [...] },
        { type: 'daterange', key: 'period' }
    ],
    onFilter: (values) => { }
})
```

### 📈 GRAPHIQUES
```javascript
UI.Chart('line', { data: [...], options: {...} })
UI.BarChart({ data: [...], stacked: true })
UI.PieChart({ data: [...], donut: true })
UI.Sparkline({ data: [...], height: 40 })
```

## 🎨 OPTIONS GLOBALES

### Styles disponibles
- `glassmorphism` - Effet verre dépoli (défaut)
- `neumorphism` - Relief 3D doux
- `material` - Material Design
- `minimal` - Design épuré
- `dark` - Mode sombre

### Niveaux d'animation
- `none` - Aucune animation
- `subtle` - Animations basiques
- `smooth` - Transitions fluides (défaut)
- `rich` - Animations complexes
- `playful` - Animations ludiques

### Tailles communes
- `xs`, `sm`, `md`, `lg`, `xl`, `full`

## 💻 EXEMPLES D'UTILISATION

### Page simple avec table
```javascript
import { UI } from '/src/js/shared/ui';

// Créer une table
const table = await UI.Table({
    style: 'glassmorphism',
    columns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Nom', searchable: true },
        { key: 'status', label: 'Statut', render: (val) => UI.Badge('status', val) }
    ],
    data: await fetchData(),
    features: {
        sort: true,
        search: true,
        pagination: true,
        export: { excel: true }
    }
});
```

### Formulaire complet
```javascript
const form = await UI.Form({
    style: 'glassmorphism',
    animation: 'smooth',
    fields: [
        {
            type: 'text',
            name: 'nom',
            label: 'Nom complet',
            icon: '👤',
            validation: 'required|min:2',
            animation: 'rich'
        },
        {
            type: 'email',
            name: 'email',
            label: 'Email',
            icon: '✉️',
            validation: 'required|email',
            autocomplete: { source: 'contacts' }
        },
        {
            type: 'select',
            name: 'role',
            label: 'Rôle',
            options: ['Admin', 'User', 'Guest'],
            searchable: true
        }
    ],
    buttons: [
        { text: 'Annuler', type: 'secondary' },
        { text: 'Sauvegarder', type: 'primary', loading: true }
    ],
    onSubmit: async (data) => {
        await saveData(data);
        UI.notify('Enregistré avec succès!', { type: 'success' });
    }
});
```

### Page template complète
```javascript
const page = await UI.PageTemplate({
    title: 'Gestion des commandes',
    style: 'glassmorphism',
    layout: 'sidebar',
    sections: {
        stats: {
            cards: [
                { label: 'Total', value: 156, icon: 'package', trend: '+12%' },
                { label: 'En cours', value: 23, icon: 'clock', color: 'warning' },
                { label: 'Livrées', value: 133, icon: 'check', color: 'success' }
            ]
        },
        filters: {
            fields: ['search', 'status', 'daterange'],
            position: 'top'
        },
        content: {
            component: 'table',
            config: {
                columns: [...],
                features: { sort: true, search: true }
            }
        }
    }
});
```

## 🔧 CONFIGURATION

### Configuration globale
```javascript
UI.config({
    theme: 'glassmorphism',
    animation: 'smooth',
    locale: 'fr-FR',
    density: 'comfortable'
});
```

### Préchargement
```javascript
// Précharger des composants pour améliorer les performances
await UI.preload('Table', 'Form', 'Modal');
```

### Thème personnalisé
```javascript
UI.applyTheme('dark');
```

## 📚 NOTES IMPORTANTES

1. **Lazy Loading**: Les composants sont chargés uniquement quand nécessaire
2. **Async/Await**: Toujours utiliser `await` avec les composants UI
3. **Options**: Passer uniquement les options nécessaires, les valeurs par défaut sont appliquées
4. **Style cohérent**: Utiliser `glassmorphism` pour rester cohérent
5. **Responsive**: Tous les composants s'adaptent automatiquement

## 🤝 POUR CLAUDE/ASSISTANT

Quand je mentionne "utiliser le système UI", cela signifie :
- Import : `import { UI } from '/src/js/shared/ui'`
- Tous les composants sont disponibles via `UI.ComponentName()`
- Style par défaut : glassmorphism
- Animation par défaut : smooth
- Pas besoin de me redemander le code des composants
- Les composants gèrent automatiquement le responsive et l'accessibilité

### Prompt type pour nouvelle page
```
Créer une page [NOM] avec le système UI.
Besoins : [liste des fonctionnalités]
Utiliser : Table avec tri/recherche, formulaire de filtres, cards de stats
Style : glassmorphism (défaut)
```
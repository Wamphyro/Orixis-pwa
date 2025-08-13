# 🎯 HEADERWIDGET v3.0.0 - MANIFEST TECHNIQUE COMPLET

**Document de référence définitif pour utilisation future**  
*Ce document remplace la nécessité de présenter le code source*

---

## 📊 MÉTADONNÉES

| Propriété | Valeur |
|-----------|--------|
| **Nom** | HeaderWidget |
| **Version** | 3.0.0 |
| **Date création** | 08/02/2025 |
| **Auteur** | SAV Audition |
| **Chemin JS** | `/widgets/header/header.widget.js` |
| **Chemin CSS** | `/widgets/header/header.widget.css` |
| **Dépendances** | `loadWidgetStyles()` depuis `/src/utils/widget-styles-loader.js` |
| **Compatibilité** | ES6+, tous navigateurs modernes |
| **Pattern** | Classe instantiable avec état |
| **Taille** | ~85KB non minifié |
| **Thèmes** | Glassmorphism gradient/solid |

---

## 🏗️ ARCHITECTURE

### Structure des fichiers
```
/widgets/header/
├── header.widget.js      # Logique complète (~2200 lignes)
├── header.widget.css     # Styles glassmorphism (~850 lignes)
└── README.md            # Documentation utilisateur
```

### Architecture interne
```javascript
HeaderWidget
├── constructor(config)           # Configuration initiale
├── loadCSS()                     # Chargement automatique CSS
├── init()                        # Initialisation async
│   ├── getUserData()            # Récupération auth
│   ├── createElement()          # Création DOM
│   ├── inject()                # Injection dans container
│   ├── attachEvents()          # Événements
│   ├── setupTooltips()         # Tooltips globaux
│   ├── setupDropdowns()        # Dropdowns hors contexte
│   └── animate()               # Animation entrée
├── Méthodes publiques
│   ├── setTitle()              # Change le titre
│   ├── setBreadcrumbs()        # Met à jour breadcrumbs
│   ├── updateIndicator()       # Met à jour indicateur
│   ├── addNotification()       # Ajoute notification
│   ├── showProgress()          # Affiche progression
│   └── destroy()               # Destruction complète
└── État interne
    ├── config{}                # Configuration complète
    ├── state{}                 # État dynamique
    └── elements{}              # Références DOM
```

---

## 🔧 CONFIGURATION COMPLÈTE

### Options du constructeur

```javascript
new HeaderWidget({
    // === BASIQUE ===
    title: 'Application',              // Titre principal
    subtitle: '',                      // Sous-titre optionnel
    centerTitle: false,                // Centrer le titre
    theme: 'gradient',                 // 'gradient'|'solid'
    container: 'body',                 // Sélecteur ou élément
    position: 'prepend',               // 'prepend'|'append'|'replace'
    sticky: true,                      // Header fixe
    pageBackground: null,              // 'colorful'|'purple'|null
    
    // === NAVIGATION ===
    showBack: true,                    // Bouton retour
    backUrl: '/modules/home/home.html',
    backText: 'Retour',
    onBack: null,                      // Callback custom
    
    // === LOGO ===
    showLogo: false,                   // Afficher logo
    logoIcon: null,                    // HTML/SVG/Emoji
    logoUrl: '/',                      // URL clic logo
    onLogoClick: null,                 // Callback custom
    
    // === RECHERCHE ===
    showSearch: false,                 // Barre de recherche
    searchPlaceholder: 'Rechercher...',
    searchDebounce: 300,               // Délai debounce (ms)
    searchMaxWidth: '600px',           // Largeur max
    searchHeight: '40px',              // Hauteur
    showSearchSuggestions: false,     // Suggestions dropdown
    onSearch: null,                    // Callback(query)
    
    // === ACTIONS RAPIDES ===
    showQuickActions: false,           // Boutons d'action
    quickActions: [                    // Array d'actions
        {
            id: 'action-id',           // ID unique
            title: 'Tooltip',          // Texte au survol
            icon: '➕',                // Emoji ou SVG
            onClick: () => {}          // Callback
        }
    ],
    onQuickAction: null,               // Callback global
    
    // === INDICATEURS ===
    showIndicators: false,             // Indicateurs état
    indicators: [                      // Array indicateurs
        {
            id: 'status',              // ID unique
            text: 'En ligne',          // Texte affiché
            type: 'success',           // 'success'|'warning'|'danger'|'info'
            animated: true             // Animation pulse
        }
    ],
    
    // === NOTIFICATIONS ===
    showNotifications: false,          // Système notifications
    notificationCount: 0,              // Nombre initial
    notifications: [],                 // Array notifications
    onNotificationClick: null,         // Callback(notif)
    onNotificationClear: null,         // Callback()
    
    // === BREADCRUMBS ===
    showBreadcrumbs: false,            // Fil d'Ariane
    breadcrumbs: [                     // Array breadcrumbs
        { text: 'Accueil', url: '/' },
        { text: 'Module' }             // Dernier = actuel
    ],
    onBreadcrumbClick: null,          // Callback(crumb, index)
    
    // === UTILISATEUR ===
    showUser: true,                    // Menu utilisateur
    showUserDropdown: false,           // Dropdown menu
    showMagasin: true,                 // Afficher magasin
    showLogout: true,                  // Option déconnexion
    userMenuItems: [                   // Items menu
        { id: 'profile', text: 'Mon profil', icon: '👤' },
        { type: 'separator' },
        { id: 'logout', text: 'Déconnexion', icon: '🚪', danger: true }
    ],
    onUserClick: null,                 // Callback(item)
    onLogout: defaultLogout,           // Callback déconnexion
    
    // === AUTO FEATURES ===
    autoAuth: true,                    // Vérif auth auto
    autoRefresh: false,                // Refresh périodique
    refreshInterval: 60000,            // Intervalle refresh (ms)
    
    // === PERSONNALISATION BOUTONS ===
    buttonStyles: {
        back: {
            height: '40px',
            padding: '10px 20px',
            minWidth: 'auto'
        },
        action: {
            height: '40px',
            width: '40px'
        },
        notification: {
            height: '44px',
            width: '44px'
        },
        userMenu: {
            height: '44px',
            padding: '6px 14px 6px 6px',
            maxWidth: '250px'
        },
        indicator: {
            height: '36px',
            padding: '8px 14px',
            minWidth: 'auto'
        }
    },
    
    // === CALLBACKS ===
    onInit: null,                      // Callback après init
    onDestroy: null                    // Callback avant destroy
})
```

---

## 📚 API COMPLÈTE

### Méthodes publiques

| Méthode | Signature | Description | Retour |
|---------|-----------|-------------|--------|
| **setTitle** | `setTitle(title: string)` | Change le titre | `void` |
| **setBreadcrumbs** | `setBreadcrumbs(breadcrumbs: Array)` | Met à jour fil d'Ariane | `void` |
| **updateIndicator** | `updateIndicator(id: string, updates: Object)` | Met à jour un indicateur | `void` |
| **updateIndicators** | `updateIndicators()` | Rafraîchit tous les indicateurs | `void` |
| **addNotification** | `addNotification(notif: Object)` | Ajoute une notification | `void` |
| **clearNotifications** | `clearNotifications()` | Marque tout comme lu | `void` |
| **showProgress** | `showProgress(percent: number)` | Affiche barre progression | `void` |
| **hideProgress** | `hideProgress()` | Cache barre progression | `void` |
| **refresh** | `refresh()` | Rafraîchit données utilisateur | `Promise<void>` |
| **destroy** | `destroy()` | Détruit le widget complet | `void` |

### Méthodes privées principales

| Méthode | Description | Usage interne |
|---------|-------------|---------------|
| `getUserData()` | Récupère auth localStorage | Dans init() |
| `createElement()` | Crée structure HTML | Dans init() |
| `createLeftSection()` | Section gauche (logo, retour, actions) | Dans createElement() |
| `createCenterContent()` | Section centrale (recherche) | Dans createElement() |
| `createRightSection()` | Section droite (indicateurs, notifs, user) | Dans createElement() |
| `inject()` | Injecte dans le DOM | Après createElement() |
| `applyButtonStyles()` | Applique styles personnalisés | Dans inject() |
| `attachEvents()` | Attache tous les événements | Après inject() |
| `setupTooltips()` | Configure tooltips globaux | Après attachEvents() |
| `setupDropdowns()` | Configure dropdowns hors contexte | Après setupTooltips() |
| `toggleNotifications()` | Bascule dropdown notifications | Sur clic |
| `toggleUserMenu()` | Bascule dropdown utilisateur | Sur clic |
| `closeAllDropdowns()` | Ferme tous les dropdowns | Sur clic externe |
| `handleSearch()` | Gère recherche avec debounce | Sur input |
| `animate()` | Animation d'entrée | Fin init() |

---

## 🎨 STRUCTURE DOM GÉNÉRÉE

### Structure principale
```html
<header class="header-widget theme-gradient sticky" id="header-xxx">
    <!-- Titre centré optionnel -->
    <div class="header-title-row">
        <div class="header-title-group">
            <h1 class="header-brand-centered">Titre</h1>
            <p class="header-subtitle-centered">Sous-titre</p>
        </div>
    </div>
    
    <!-- Contenu principal -->
    <div class="header-content">
        <!-- Section gauche -->
        <div class="header-left">
            <div class="header-logo">🏠</div>
            <button class="header-back-btn">Retour</button>
            <div class="header-quick-actions">
                <button class="header-action-btn">➕</button>
            </div>
        </div>
        
        <!-- Section centrale -->
        <div class="header-center">
            <div class="header-search-wrapper">
                <input class="header-search-input">
            </div>
        </div>
        
        <!-- Section droite -->
        <div class="header-right">
            <div class="header-indicators">...</div>
            <button class="header-notification-btn">🔔</button>
            <div class="header-user-menu">...</div>
        </div>
    </div>
    
    <!-- Breadcrumbs optionnels -->
    <div class="header-breadcrumbs">...</div>
    
    <!-- Barre progression -->
    <div class="header-progress">
        <div class="header-progress-bar"></div>
    </div>
</header>

<!-- Dropdowns hors contexte (dans body) -->
<div id="header-dropdowns-container">
    <div class="glass-dropdown glass-notifications">...</div>
    <div class="glass-dropdown glass-user">...</div>
</div>

<!-- Tooltips hors contexte (dans body) -->
<div id="header-tooltips-container">...</div>
```

---

## 🎯 CLASSES CSS PRINCIPALES

### Classes header

| Classe | Description | Application |
|--------|-------------|-------------|
| `.header-widget` | Container principal | Toujours |
| `.theme-gradient` | Thème glassmorphism | Si config |
| `.theme-solid` | Thème solide blanc | Si config |
| `.sticky` | Position fixed | Si sticky: true |
| `.has-centered-title` | Titre centré | Si centerTitle: true |

### Classes sections

| Classe | Description | Styles appliqués |
|--------|-------------|------------------|
| `.header-content` | Grille principale | `display: grid; grid-template-columns: auto 1fr auto` |
| `.header-left` | Section gauche | `justify-self: start` |
| `.header-center` | Section centrale | `justify-self: stretch` |
| `.header-right` | Section droite | `justify-self: end` |

### Classes composants

| Classe | Description | Z-index |
|--------|-------------|---------|
| `.header-logo` | Logo cliquable | 1003 |
| `.header-back-btn` | Bouton retour | 1003 |
| `.header-action-btn` | Boutons actions | 1003 |
| `.header-search-input` | Champ recherche | auto |
| `.header-notification-btn` | Bouton notifications | 1003 |
| `.header-user-menu` | Menu utilisateur | 1003 |

### Classes dropdowns glassmorphism

| Classe | Description | Styles |
|--------|-------------|--------|
| `.glass-dropdown` | Base dropdown | `background: rgba(30, 30, 40, 0.95)` |
| `.glass-notifications` | Dropdown notifications | `width: 360px` |
| `.glass-user` | Dropdown utilisateur | `width: 240px` |
| `.glass-notif-item` | Item notification | Fond transparent + hover |
| `.glass-menu-item` | Item menu | Texte blanc + hover |

---

## 🔄 COMPORTEMENTS

### Cycle de vie

```
1. CONSTRUCTION
   ├── new HeaderWidget(config)
   ├── Stockage config avec défauts
   ├── ID unique généré
   └── init() lancé

2. INITIALISATION
   ├── getUserData() si autoAuth
   ├── createElement() → HTML
   ├── inject() → DOM
   ├── attachEvents() → Listeners
   ├── setupTooltips() → Body
   ├── setupDropdowns() → Body
   └── animate() → Fade in

3. UTILISATION
   ├── Interactions utilisateur
   ├── Callbacks déclenchés
   ├── État mis à jour
   └── DOM synchronisé

4. DESTRUCTION
   ├── Timers nettoyés
   ├── Tooltips supprimés
   ├── Dropdowns supprimés
   ├── Styles custom supprimés
   ├── Element retiré du DOM
   └── Classes body nettoyées
```

### Gestion de l'authentification

```javascript
// Flux d'authentification
1. Lecture localStorage 'sav_auth'
2. Parse JSON + vérification expiry
3. Si expiré → redirect login
4. Si valide → extraction données:
   - nom, prénom, initiales
   - role, magasin
   - email, avatar
5. Affichage menu utilisateur
```

### Gestion des dropdowns

```javascript
// Architecture dropdowns hors contexte
1. Container fixe dans body (z-index: 10000)
2. Positionnement dynamique par rapport au bouton
3. Classes 'glass-*' pour éviter conflits CSS
4. Fond sombre glassmorphism pour contraste
5. Fermeture au clic externe
```

### Gestion de la recherche

```javascript
// Debounce recherche
1. Input détecté
2. Timer précédent annulé
3. Nouveau timer créé (300ms défaut)
4. Callback onSearch(query) déclenché
```

---

## 💻 PATTERNS D'UTILISATION

### 1. Configuration minimale
```javascript
import { HeaderWidget } from '/widgets/header/header.widget.js';

const header = new HeaderWidget({
    title: 'Mon Application'
});
```

### 2. Configuration complète avec actions
```javascript
const header = new HeaderWidget({
    title: 'Gestion Factures',
    centerTitle: true,
    showSearch: true,
    onSearch: (query) => console.log('Recherche:', query),
    
    showQuickActions: true,
    quickActions: [
        {
            id: 'new',
            title: 'Nouvelle facture',
            icon: '➕',
            onClick: () => openModal()
        },
        {
            id: 'export',
            title: 'Export Excel',
            icon: '📊',
            onClick: () => exportData()
        }
    ],
    
    showIndicators: true,
    indicators: [
        { id: 'status', text: 'Connecté', type: 'success' },
        { id: 'count', text: '15 factures', type: 'info' }
    ],
    
    showNotifications: true,
    showUserDropdown: true,
    
    buttonStyles: {
        back: { height: '48px' },
        action: { height: '44px' },
        userMenu: { maxWidth: '220px' }
    }
});
```

### 3. Mise à jour dynamique
```javascript
// Changer le titre
header.setTitle('Nouveau Titre');

// Mettre à jour les breadcrumbs
header.setBreadcrumbs([
    { text: 'Accueil', url: '/' },
    { text: 'Modules', url: '/modules' },
    { text: 'Factures' }
]);

// Ajouter une notification
header.addNotification({
    message: 'Nouvelle facture reçue',
    type: 'info'
});

// Mettre à jour un indicateur
header.updateIndicator('count', {
    text: '23 factures',
    type: 'warning'
});

// Afficher progression
header.showProgress(45); // 45%
```

### 4. Intégration avec orchestrateur
```javascript
class ModuleOrchestrator {
    createHeader() {
        this.header = new HeaderWidget({
            title: 'Module Factures',
            pageBackground: 'colorful',
            showSearch: true,
            searchPlaceholder: 'Rechercher facture...',
            onSearch: (query) => {
                this.currentFilters.search = query;
                this.applyFilters();
            },
            quickActions: [
                {
                    id: 'refresh',
                    title: 'Actualiser',
                    icon: '🔄',
                    onClick: () => this.loadData()
                }
            ],
            indicators: [
                { id: 'status', text: 'Connecté', type: 'success' },
                { id: 'count', text: '0 factures', type: 'info' }
            ]
        });
    }
}
```

---

## 📐 SPÉCIFICATIONS TECHNIQUES

### Hiérarchie Z-index

| Élément | Z-index | Description |
|---------|---------|-------------|
| Header principal | 1000 | Base du header |
| Breadcrumbs | 1001 | Sous le header |
| Content header | 1002 | Contenu principal |
| Boutons/Actions | 1003 | Éléments interactifs |
| Dropdowns (body) | 10000 | Au-dessus de tout |
| Tooltips (body) | 10001 | Niveau max |

### Dimensions par défaut

| Élément | Hauteur | Largeur | Padding |
|---------|---------|---------|---------|
| Header | 70px min | 100% | 10px 0 |
| Bouton retour | 40px | auto | 10px 20px |
| Action button | 40px | 40px | - |
| Notification btn | 44px | 44px | - |
| User menu | 44px | 250px max | 6px 14px |
| Search input | 40px | 100% | 12px 48px |
| Indicateurs | 36px | auto | 8px 14px |

### Breakpoints responsive

| Breakpoint | Comportement |
|------------|--------------|
| > 1024px | Affichage complet |
| 768-1024px | Cache indicateurs |
| < 768px | Cache recherche + actions |
| < 480px | Cache infos user |

### Animations

| Animation | Durée | Easing | Description |
|-----------|-------|--------|-------------|
| fadeInDown | 300ms | ease | Entrée header |
| bell-ring | 2s | ease | Notification active |
| pulse-ring | 2s | infinite | Indicateur success |
| pulse-warning | 1.5s | infinite | Indicateur warning |

---

## 🔍 ÉTAT INTERNE

### Structure config (après merge défauts)
```javascript
{
    title: 'Application',
    subtitle: '',
    centerTitle: false,
    theme: 'gradient',
    container: 'body',
    position: 'prepend',
    sticky: true,
    pageBackground: null,
    // ... toutes les options avec défauts
}
```

### Structure state
```javascript
{
    userData: {
        nom: '',
        prenom: '',
        nomComplet: '',
        initiales: '',
        role: '',
        magasin: '',
        email: '',
        avatar: null,
        authenticated: true
    },
    searchQuery: '',
    searchSuggestions: [],
    notificationsOpen: false,
    userMenuOpen: false,
    indicators: [],
    notifications: [],
    loaded: false
}
```

### Structure elements (références DOM)
```javascript
{
    container: HTMLElement,      // Container d'injection
    mainElement: HTMLElement,    // Header principal
    searchInput: HTMLElement,    // Input recherche
    notificationBadge: HTMLElement,
    notificationBtn: HTMLElement,
    notificationDropdown: HTMLElement,
    userMenu: HTMLElement,
    userDropdown: HTMLElement,
    progressBar: HTMLElement
}
```

---

## 🚨 POINTS D'ATTENTION

### Obligatoire
- ✅ ID unique : `header-${Date.now()}-${random}`
- ✅ Nettoyage complet dans destroy()
- ✅ Dropdowns hors contexte (body)
- ✅ Tooltips hors contexte (body)
- ✅ Classes `glass-*` pour éviter conflits CSS

### Recommandations
- ⚠️ Limiter quickActions à 3-5 boutons
- ⚠️ Limiter indicators à 2-3 éléments
- ⚠️ searchDebounce minimum 200ms
- ⚠️ Toujours vérifier auth si autoAuth: true
- ⚠️ maxWidth userMenu pour noms longs

### Limitations
- ❌ Pas de HTML dans les textes (XSS)
- ❌ Pas de multi-lignes dans header
- ❌ Pas de drag & drop
- ❌ Pas de thème dark automatique
- ❌ Pas de support RTL

### Dépendances localStorage
```javascript
'sav_auth' : {              // Authentification
    collaborateur: {},
    magasin: '',
    timestamp: number,
    expiry: number
}
'header_notifications' : [] // Notifications sauvegardées
```

---

## 📦 EXPORTS

```javascript
// Export nommé : Classe principale
export class HeaderWidget { ... }

// Export par défaut : Classe
export default HeaderWidget;

// Pas de singleton (instances multiples possibles)
```

---

## 🔮 UTILISATION FUTURE

Pour utiliser ce widget dans un nouveau projet, référencez simplement :

> "J'utilise **HeaderWidget v3.0.0** (voir manifest technique)"

Ce document contient TOUTES les spécifications nécessaires pour :
- Comprendre l'architecture complète
- Configurer toutes les options
- Intégrer dans n'importe quel projet
- Personnaliser l'apparence et le comportement
- Débugger les problèmes courants
- Étendre les fonctionnalités
- Former d'autres développeurs

**Caractéristiques uniques du HeaderWidget :**
- Glassmorphism natif avec backdrop-filter
- Dropdowns hors contexte (z-index: 10000)
- Système de notifications intégré
- Support multi-sections (gauche/centre/droite)
- Indicateurs animés temps réel
- Auto-authentification localStorage
- Breadcrumbs optionnels
- Barre de progression intégrée
- Personnalisation complète des tailles de boutons

**Aucun besoin de fournir le code source avec ce manifest.**

---

*Fin du manifest technique HeaderWidget v3.0.0 - Document de référence définitif*
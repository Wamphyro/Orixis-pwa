# 📋 TOASTWIDGET v1.0.0 - MANIFEST TECHNIQUE COMPLET

**Document de référence définitif pour utilisation future**  
*Ce document remplace la nécessité de présenter le code source*

---

## 📊 MÉTADONNÉES

| Propriété | Valeur |
|-----------|--------|
| **Nom** | ToastWidget |
| **Version** | 1.0.0 |
| **Date création** | 08/02/2025 |
| **Auteur** | Assistant Claude |
| **Chemin JS** | `/widgets/toast/toast.widget.js` |
| **Chemin CSS** | `/widgets/toast/toast.widget.css` |
| **Dépendances** | AUCUNE (100% autonome) |
| **Compatibilité** | ES6+, tous navigateurs modernes |
| **Pattern** | Singleton avec instance configurable |
| **Taille** | ~15KB non minifié |

---

## 🏗️ ARCHITECTURE

### Structure des fichiers
```
/widgets/toast/
├── toast.widget.js      # Logique complète (singleton + classe)
├── toast.widget.css     # Styles complets
└── README.md           # Documentation utilisateur
```

### Architecture interne
```javascript
ToastWidget
├── constructor(config)      # Configuration initiale
├── loadCSS()               # Chargement automatique CSS
├── init()                  # Initialisation async
├── createContainer()       # Création DOM container
├── show(msg, type, dur)   # Méthode principale
├── success/error/warning/info() # Méthodes raccourcis
├── clear()                 # Suppression tous toasts
├── destroy()               # Destruction complète
└── État interne
    ├── config{}            # Configuration
    ├── state{}             # État (toasts[], timers)
    └── elements{}          # Références DOM
```

---

## 🔧 CONFIGURATION COMPLÈTE

### Options du constructeur

```javascript
new ToastWidget({
    // POSITION (string)
    position: 'top-right',     // 'top-right'|'top-left'|'bottom-right'|'bottom-left'
    
    // COMPORTEMENT (boolean/number)
    maxToasts: 5,              // Nombre max de toasts visibles
    duration: 4000,            // Durée par défaut en ms (0 = permanent)
    animated: true,            // Activer animations entrée/sortie
    pauseOnHover: true,        // Pause timer au survol souris
    showProgress: true,        // Afficher barre de progression
    
    // APPARENCE (string)
    theme: 'gradient',         // 'gradient'|'solid'|'glass'
    size: 'md'                // 'sm'|'md'|'lg'
})
```

### Valeurs par défaut
| Option | Défaut | Type | Description |
|--------|--------|------|-------------|
| `position` | `'top-right'` | string | Position écran |
| `maxToasts` | `5` | number | Limite toasts simultanés |
| `duration` | `4000` | number | Durée affichage (ms) |
| `animated` | `true` | boolean | Animations activées |
| `pauseOnHover` | `true` | boolean | Pause au survol |
| `showProgress` | `true` | boolean | Barre progression |
| `theme` | `'gradient'` | string | Thème visuel |
| `size` | `'md'` | string | Taille toasts |

---

## 📚 API COMPLÈTE

### Méthodes publiques

| Méthode | Signature | Description | Retour |
|---------|-----------|-------------|--------|
| **show** | `show(message: string, type?: string, duration?: number)` | Affiche un toast | `HTMLElement` |
| **success** | `success(message: string, duration?: number)` | Toast succès vert | `HTMLElement` |
| **error** | `error(message: string, duration?: number)` | Toast erreur rouge | `HTMLElement` |
| **warning** | `warning(message: string, duration?: number)` | Toast warning orange | `HTMLElement` |
| **info** | `info(message: string, duration?: number)` | Toast info bleu | `HTMLElement` |
| **clear** | `clear()` | Supprime tous les toasts | `void` |
| **destroy** | `destroy()` | Détruit le widget complet | `void` |

### Méthodes internes (privées)

| Méthode | Description | Usage interne |
|---------|-------------|---------------|
| `loadCSS()` | Charge le CSS automatiquement | Appelé dans constructor |
| `init()` | Initialisation asynchrone | Appelé dans constructor |
| `createContainer()` | Crée le container DOM | Appelé dans init() |
| `createToast()` | Crée élément toast | Appelé dans show() |
| `attachToastEvents()` | Attache événements | Sur chaque toast |
| `setAutoClose()` | Configure timer fermeture | Si duration > 0 |
| `pauseTimer()` | Pause le timer | Sur mouseenter |
| `resumeTimer()` | Reprend le timer | Sur mouseleave |
| `animateIn()` | Animation entrée | Si animated: true |
| `animateOut()` | Animation sortie | Si animated: true |
| `remove()` | Supprime un toast | Interne |
| `removeOldest()` | Supprime le plus ancien | Si limite atteinte |

---

## 🎨 CLASSES CSS COMPLÈTES

### Classes container

| Classe | Description | Application |
|--------|-------------|-------------|
| `.toast-widget-container` | Container principal | Toujours |
| `.loaded` | État chargé (anti-FOUC) | Après 100ms |
| `.position-top-right` | Position haut droite | Si config |
| `.position-top-left` | Position haut gauche | Si config |
| `.position-bottom-right` | Position bas droite | Si config |
| `.position-bottom-left` | Position bas gauche | Si config |
| `.theme-gradient` | Thème gradient | Si config |
| `.theme-solid` | Thème solid | Si config |
| `.theme-glass` | Thème glass | Si config |
| `.size-sm` | Petite taille | Si config |
| `.size-md` | Taille moyenne | Si config |
| `.size-lg` | Grande taille | Si config |
| `.no-animation` | Désactive animations | Si animated: false |

### Classes toast

| Classe | Description | Styles appliqués |
|--------|-------------|------------------|
| `.toast` | Base toast | padding, border-radius, flex |
| `.toast-success` | Type succès | Gradient vert #10b981→#34d399 |
| `.toast-error` | Type erreur | Gradient rouge #ef4444→#f87171 |
| `.toast-warning` | Type warning | Gradient orange #f59e0b→#fbbf24 |
| `.toast-info` | Type info | Gradient bleu #3b82f6→#60a5fa |

### Classes composants

| Classe | Description | Rôle |
|--------|-------------|------|
| `.toast-icon` | Icône emoji | flex-shrink: 0, 18px |
| `.toast-message` | Texte message | flex: 1, 14px |
| `.toast-close` | Bouton fermer | × symbole, hover scale |
| `.toast-progress` | Barre progression | Animation width 100%→0% |

---

## 🔄 COMPORTEMENTS

### Cycle de vie d'un toast

```
1. CRÉATION
   ├── show() appelé
   ├── Vérification limite maxToasts
   ├── Si limite → removeOldest()
   └── createToast() + appendChild()

2. AFFICHAGE
   ├── Animation entrée (300ms)
   ├── Timer auto-close démarré
   └── Barre progression animée

3. INTERACTIONS
   ├── Hover → pauseTimer()
   ├── Leave → resumeTimer()
   └── Click × → remove()

4. SUPPRESSION
   ├── Timer expire OU click OU clear()
   ├── Animation sortie (300ms)
   ├── Nettoyage timers Map
   └── Remove du DOM
```

### Gestion de la pile

- **FIFO** : First In First Out par défaut
- **Limite** : maxToasts respectée (supprime le plus ancien)
- **Timers** : Map avec ID unique par toast
- **État** : Array toasts[] synchronisé avec DOM

---

## 💻 PATTERNS D'UTILISATION

### 1. Import singleton (RECOMMANDÉ)
```javascript
import toast from '/widgets/toast/toast.widget.js';

// Utilisation directe
toast.success('Opération réussie');
toast.error('Une erreur est survenue');
toast.warning('Attention !');
toast.info('Information');
toast.clear();
```

### 2. Instance personnalisée
```javascript
import { ToastWidget } from '/widgets/toast/toast.widget.js';

const myToast = new ToastWidget({
    position: 'bottom-left',
    theme: 'glass',
    maxToasts: 3
});

myToast.success('Custom toast');
```

### 3. Durées personnalisées
```javascript
toast.success('Rapide', 1000);        // 1 seconde
toast.error('Long', 10000);           // 10 secondes
toast.info('Permanent', 0);           // Ne disparaît pas
```

### 4. Dans un module ES6
```javascript
class MyModule {
    constructor() {
        // Rendre disponible globalement pour debug
        if (typeof window !== 'undefined') {
            window.toast = toast;
        }
    }
    
    showError(msg) {
        toast.error(msg);
    }
}
```

---

## 🎯 INTÉGRATION

### Installation minimale
```html
<!-- Aucune dépendance requise -->
<script type="module">
    import toast from '/widgets/toast/toast.widget.js';
    // CSS chargé automatiquement
    toast.success('Widget prêt !');
</script>
```

### Configuration avancée
```javascript
// Au démarrage application
const appToast = new ToastWidget({
    position: 'top-right',
    duration: 5000,
    theme: 'gradient',
    size: 'md',
    maxToasts: 5,
    showProgress: true,
    pauseOnHover: true,
    animated: true
});

// Export pour utilisation globale
export default appToast;
```

---

## 📐 SPÉCIFICATIONS TECHNIQUES

### Variables CSS
```css
:root {
    --toast-success-start: #10b981;
    --toast-success-end: #34d399;
    --toast-error-start: #ef4444;
    --toast-error-end: #f87171;
    --toast-warning-start: #f59e0b;
    --toast-warning-end: #fbbf24;
    --toast-info-start: #3b82f6;
    --toast-info-end: #60a5fa;
    --toast-gap: 12px;
    --toast-padding: 12px 20px;
    --toast-transition: all 0.3s ease;
}
```

### Dimensions
| Taille | Min width | Max width | Padding | Font |
|--------|-----------|-----------|---------|------|
| **sm** | 200px | auto | 8px 14px | 12px |
| **md** | 280px | 450px | 12px 20px | 14px |
| **lg** | 350px | 550px | 16px 24px | 16px |

### Z-index
- Container : `100000` (au-dessus de tout)
- Toasts : `auto` (ordre DOM)

### Animations
| Animation | Durée | Easing | Description |
|-----------|-------|--------|-------------|
| slideIn | 300ms | ease-out | Entrée Y: -20px→0 |
| slideOut | 300ms | ease-in | Sortie Y: 0→-20px |
| shake | 500ms | ease | Erreur uniquement |
| progress | variable | linear | Barre progression |

---

## 🔍 ÉTAT INTERNE

### Structure state
```javascript
{
    toasts: [],        // Array<HTMLElement> - Toasts actifs
    timers: Map(),     // Map<id, {timer, remaining, startTime}>
    loaded: false      // Boolean - CSS chargé
}
```

### Structure config
```javascript
{
    position: 'top-right',
    maxToasts: 5,
    duration: 4000,
    animated: true,
    pauseOnHover: true,
    showProgress: true,
    theme: 'gradient',
    size: 'md'
}
```

---

## 🚨 POINTS D'ATTENTION

### Obligatoire
- ✅ ID unique par toast : `Date.now() + random`
- ✅ Nettoyage timers dans destroy()
- ✅ Remove listeners avant suppression
- ✅ Clear Map après utilisation

### Recommandations
- ⚠️ Toujours utiliser le singleton sauf besoin spécifique
- ⚠️ Ne pas dépasser 5-7 toasts simultanés (UX)
- ⚠️ Durée minimum 2000ms pour lisibilité
- ⚠️ Éviter les messages trop longs (max 100 caractères)

### Limitations
- ❌ Pas de HTML dans messages (sécurité)
- ❌ Pas de callbacks custom
- ❌ Pas de sons
- ❌ Pas de boutons d'action

---

## 📦 EXPORTS

```javascript
// Export nommé : Classe
export class ToastWidget { ... }

// Export nommé : Factory
export function getToast(config) { ... }

// Export par défaut : Singleton
export default getToast();
```

---

## 🔮 UTILISATION FUTURE

Pour utiliser ce widget dans un nouveau projet, référencez simplement :

> "J'utilise **ToastWidget v1.0.0** (voir manifest technique)"

Ce document contient TOUTES les spécifications nécessaires pour :
- Comprendre le comportement exact
- Intégrer dans n'importe quel projet
- Débugger des problèmes
- Étendre les fonctionnalités
- Former d'autres développeurs

**Aucun besoin de fournir le code source avec ce manifest.**

---

*Fin du manifest technique - Document de référence définitif*
📖 README WIDGETS - GUIDE TECHNIQUE v2.0
📝 CONVENTIONS DE CRÉATION DE FICHIERS
Structure d'en-tête obligatoire
javascript/* ========================================
   [NOM-FICHIER] - [Description courte]
   Chemin: [chemin/complet/depuis/racine]
   
   DESCRIPTION:
   [Description détaillée]
   
   STRUCTURE DU FICHIER:
   1. [SECTION 1]
   2. [SECTION 2]
   
   UTILISATION:
   import { [Nom]Widget } from '/widgets/[nom]/[nom].widget.js';
   const widget = new [Nom]Widget({...});
   
   API PUBLIQUE:
   - method1() - Description
   - method2() - Description
   
   OPTIONS:
   - option1: type (défaut: valeur) - Description
   - option2: type (défaut: valeur) - Description
   
   MODIFICATIONS:
   - JJ/MM/AAAA : Description changement
   
   AUTEUR: [Nom]
   VERSION: [X.Y.Z]
   ======================================== */
🏗️ ARCHITECTURE D'UN WIDGET
Structure fichiers
widgets/
└── [nom-widget]/
    ├── [nom-widget].widget.js   // Classe principale
    └── [nom-widget].widget.css  // Styles (chargé automatiquement)
Structure classe JS complète
javascriptexport class [Nom]Widget {
    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec spread pour défauts
        this.config = {
            // Container
            container: config.container || null,
            
            // Apparence
            size: config.size || 'md',
            theme: config.theme || 'default',
            
            // Options wrapper englobant (pattern optionnel)
            showWrapper: config.showWrapper || false,
            wrapperStyle: config.wrapperStyle || 'card',
            wrapperTitle: config.wrapperTitle || '',
            
            // Comportement
            animated: config.animated !== false,
            
            // Données
            data: config.data || [],
            
            // Callbacks
            onClick: config.onClick || null,
            onUpdate: config.onUpdate || null,
            
            // Spread pour surcharger
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            values: {},
            selected: [],
            enabled: {},
            loaded: false
        };
        
        // 4. Références DOM
        this.elements = {
            container: null,
            mainContainer: null,  // Si wrapper
            wrapper: null,
            items: {}
        };
        
        // 5. ID unique (pattern obligatoire)
        this.id = '[nom]-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // 6. Initialiser
        this.init();
    }
    
    /**
     * Charge le CSS avec timestamp anti-cache
     */
    loadCSS() {
        const cssId = '[nom]-widget-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `/widgets/[nom]/[nom].widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
    }
    
    /**
     * Initialisation asynchrone
     */
    async init() {
        try {
            this.setupContainer();
            this.initState();
            await this.loadData();  // Si besoin
            this.render();
            this.attachEvents();
            this.showWithDelay();   // Anti-FOUC
        } catch (error) {
            console.error('❌ Erreur init [Nom]Widget:', error);
        }
    }
    
    /**
     * Anti-FOUC : affichage avec délai
     */
    showWithDelay() {
        setTimeout(() => {
            this.show();
        }, 100);
    }
    
    /**
     * Affiche le widget (transition opacity)
     */
    show() {
        if (this.elements.mainContainer) {
            this.elements.mainContainer.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    /**
     * Destruction propre OBLIGATOIRE
     */
    destroy() {
        // Nettoyer timers
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        
        // Vider container
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser état
        this.state = {
            values: {},
            selected: [],
            enabled: {},
            loaded: false
        };
        
        // Réinitialiser éléments
        this.elements = {
            container: null,
            mainContainer: null,
            wrapper: null,
            items: {}
        };
        
        console.log('🗑️ [Nom]Widget détruit:', this.id);
    }
}

export default [Nom]Widget;
🎨 PATTERNS CSS
Structure CSS minimale
css/* Container principal */
.[nom]-widget-container {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
}

/* État chargé (anti-FOUC) */
.[nom]-widget-container.loaded {
    opacity: 1;
}

/* Wrapper optionnel avec styles */
.[nom]-widget-container.wrapper-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Import de styles externes si besoin */
@import url('/src/css/components/buttons.css');
🎯 PATTERNS AVANCÉS
1. Anti-FOUC (Flash Of Unstyled Content)
javascript// CSS : opacity: 0 par défaut
// JS : showWithDelay() → setTimeout 100ms → add class 'loaded'
// Évite le flash visuel au chargement
2. Wrapper englobant optionnel
javascript// Permet d'encapsuler dans un container stylisé
showWrapper: true,
wrapperStyle: 'card',  // 'card' | 'minimal' | 'bordered'
wrapperTitle: 'Titre'
3. Formatage intelligent
javascriptformatNumber(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: this.config.format,  // 'currency', 'percent', 'decimal'
        currency: 'EUR'
    }).format(value);
}
4. Animation des valeurs
javascriptanimateNumber(element, from, to) {
    // Animation progressive sur 1s en 30 étapes
    const duration = 1000;
    const steps = 30;
    // ... animation logic
}
5. Debounce pour inputs
javascripthandleInput(e) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
        this.triggerCallback();
    }, this.config.debounceDelay || 300);
}
⚙️ CONFIGURATION FLEXIBLE
Principe des défauts + override
javascript// SANS CONFIG - Marche avec défauts intelligents
const widget = new DataGridWidget();

// AVEC CONFIG - Override seulement ce qui est nécessaire
const widget = new DataGridWidget({
    container: '.ma-div',     // Change container
    pageSize: 50,            // Change pagination
    // Le reste garde les défauts
});
📝 UTILISATION TYPE
javascriptimport { DataGridWidget } from '/widgets/data-grid/data-grid.widget.js';

// Création simple
const grid = new DataGridWidget({
    container: '.content',
    source: 'firestore_collection' || [...data],
    columns: [...],
    onRowClick: (row) => console.log(row)
});

// API publique
grid.refresh();              // Rafraîchir
grid.updateRow(id, data);   // MAJ ligne
grid.setPage(2);            // Pagination
grid.filter({ name: 'x' }); // Filtrer
grid.destroy();             // Nettoyer
⚠️ RÈGLES CRITIQUES

CSS auto-chargé avec timestamp ?v=${Date.now()}
ID unique : widget-Date.now()-random
destroy() obligatoire pour éviter memory leaks
Pas de dépendances entre widgets
État structuré : values, selected, enabled, loaded
Anti-FOUC : opacity 0 → delay 100ms → opacity 1
Callbacks normalisés : onX(data)

🔄 CYCLE DE VIE
constructor
    ↓
loadCSS()
    ↓
init()
    ├── setupContainer()
    ├── initState()
    ├── loadData() [si async]
    ├── render()
    ├── attachEvents()
    └── showWithDelay()
    ↓
[VIE DU WIDGET]
    ├── update()
    ├── refresh()
    └── ...
    ↓
destroy()

Version : 2.0
Mise à jour : 08/02/2025
Pour : Création de widgets autonomes et réutilisables
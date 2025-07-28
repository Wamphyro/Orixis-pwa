// ========================================
// UI SYSTEM - CONFIGURATION GLOBALE
// Configuration centralisée pour tout le système UI
// Version: 1.0.0
// ========================================

/**
 * Configuration globale du système UI
 * Cette configuration peut être partagée avec Claude/Assistant
 * pour qu'il comprenne le système disponible
 */
export const UISystemConfig = {
    // ========================================
    // INFORMATIONS SYSTÈME
    // ========================================
    system: {
        name: 'Modern UI System',
        version: '1.0.0',
        created: '2024',
        author: 'Your Company',
        license: 'MIT',
        description: 'Système UI complet avec composants glassmorphism'
    },
    
    // ========================================
    // CHEMINS ET STRUCTURE
    // ========================================
    paths: {
        root: '/src',
        components: '/src/js/shared/ui',
        styles: '/src/css/shared/ui',
        themes: '/src/css/shared/themes',
        assets: '/src/assets',
        docs: '/docs/ui-system'
    },
    
    // ========================================
    // THÈMES DISPONIBLES
    // ========================================
    themes: {
        // Thème principal
        default: 'glassmorphism',
        
        // Liste des thèmes
        available: {
            glassmorphism: {
                name: 'Glassmorphism',
                description: 'Effet verre dépoli moderne',
                colors: {
                    primary: '#667eea',
                    secondary: '#764ba2',
                    background: 'rgba(255, 255, 255, 0.1)',
                    blur: 20
                }
            },
            neumorphism: {
                name: 'Neumorphism',
                description: 'Relief 3D doux',
                colors: {
                    primary: '#e0e0e0',
                    background: '#f0f0f3',
                    shadow: '#d1d1d1'
                }
            },
            material: {
                name: 'Material Design',
                description: 'Design Google Material',
                colors: {
                    primary: '#1976d2',
                    secondary: '#dc004e',
                    background: '#ffffff'
                }
            },
            minimal: {
                name: 'Minimal',
                description: 'Design épuré et simple',
                colors: {
                    primary: '#000000',
                    secondary: '#666666',
                    background: '#ffffff'
                }
            },
            dark: {
                name: 'Dark Mode',
                description: 'Thème sombre',
                colors: {
                    primary: '#bb86fc',
                    secondary: '#03dac6',
                    background: '#121212'
                }
            }
        }
    },
    
    // ========================================
    // NIVEAUX D'ANIMATION
    // ========================================
    animations: {
        // Niveau par défaut
        default: 'smooth',
        
        // Niveaux disponibles
        levels: {
            none: {
                name: 'Aucune animation',
                duration: 0,
                enabled: false
            },
            subtle: {
                name: 'Animations subtiles',
                duration: 200,
                easing: 'ease-out',
                effects: ['opacity', 'transform']
            },
            smooth: {
                name: 'Animations fluides',
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['opacity', 'transform', 'scale', 'color']
            },
            rich: {
                name: 'Animations riches',
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['all'],
                extras: ['particles', 'glow', 'morph']
            },
            playful: {
                name: 'Animations ludiques',
                duration: 600,
                easing: 'spring',
                effects: ['all'],
                extras: ['bounce', 'wiggle', 'confetti']
            }
        }
    },
    
    // ========================================
    // COMPOSANTS DISPONIBLES
    // ========================================
    components: {
        // Composants déjà créés
        existing: [
            'modal.component.js',
            'dialog.component.js',
            'notification.component.js',
            'timeline.component.js',
            'checkbox-group.component.js',
            'signature-pad.component.js',
            'frosted-icons.component.js',
            'status-badge.component.js',
            'glass-form-fields.js'
        ],
        
        // Catégories de composants
        categories: {
            core: {
                name: 'Composants de base',
                components: ['Button', 'Card', 'FAB'],
                icon: '🎯'
            },
            feedback: {
                name: 'Retours utilisateur',
                components: ['Modal', 'Dialog', 'Notification', 'Toast', 'Alert', 'Snackbar', 'Progress', 'Tour'],
                icon: '💬'
            },
            dataDisplay: {
                name: 'Affichage de données',
                components: ['Table', 'Timeline', 'List', 'Grid', 'Tree', 'Calendar', 'StatsCard', 'EmptyState', 'Kanban', 'Heatmap'],
                icon: '📊'
            },
            dataEntry: {
                name: 'Saisie de données',
                components: ['FormBuilder', 'GlassFormFields', 'Input', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider', 'DatePicker', 'TimePicker', 'ColorPicker', 'FileUpload', 'SignaturePad'],
                icon: '📝'
            },
            elements: {
                name: 'Éléments visuels',
                components: ['FrostedIcons', 'StatusBadge', 'Chip', 'Avatar', 'Rating', 'Tooltip', 'Popover', 'Skeleton'],
                icon: '🎨'
            },
            layout: {
                name: 'Mise en page',
                components: ['PageTemplate', 'Sidebar', 'Header', 'Footer', 'Tabs', 'Accordion', 'Stepper', 'Breadcrumb', 'Divider', 'Drawer'],
                icon: '🏗️'
            },
            navigation: {
                name: 'Navigation',
                components: ['Menu', 'NavMenu', 'ContextMenu', 'Dropdown', 'Pagination', 'Anchor', 'SpeedDial', 'CommandPalette', 'BottomSheet'],
                icon: '🧭'
            },
            filters: {
                name: 'Filtrage',
                components: ['FilterPanel', 'SearchBox', 'FilterChips', 'DateRange', 'AdvancedFilter'],
                icon: '🔍'
            },
            media: {
                name: 'Médias',
                components: ['ImageViewer', 'Gallery', 'Carousel', 'VideoPlayer', 'AudioPlayer', 'PDFViewer'],
                icon: '🖼️'
            },
            charts: {
                name: 'Graphiques',
                components: ['ChartBuilder', 'LineChart', 'BarChart', 'PieChart', 'GaugeChart', 'Sparkline'],
                icon: '📈'
            },
            utilities: {
                name: 'Utilitaires',
                components: ['Clipboard', 'Shortcuts', 'ThemeSwitcher', 'PullRefresh'],
                icon: '🔧'
            }
        },
        
        // Total des composants
        get total() {
            return Object.values(this.categories)
                .reduce((total, cat) => total + cat.components.length, 0);
        }
    },
    
    // ========================================
    // OPTIONS GLOBALES PAR DÉFAUT
    // ========================================
    defaults: {
        // Styles
        style: 'glassmorphism',
        
        // Animations
        animation: 'smooth',
        
        // Langue
        locale: 'fr-FR',
        
        // Responsive
        breakpoints: {
            xs: 0,
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200,
            xxl: 1400
        },
        
        // Densité
        density: 'comfortable', // compact, comfortable, spacious
        
        // Accessibilité
        a11y: {
            enabled: true,
            announcements: true,
            highContrast: false,
            reducedMotion: false
        },
        
        // Performance
        performance: {
            lazyLoad: true,
            virtualScroll: true,
            debounceDelay: 300,
            throttleDelay: 100
        }
    },
    
    // ========================================
    // FONCTIONNALITÉS COMMUNES
    // ========================================
    features: {
        // Fonctionnalités disponibles dans tous les composants
        common: {
            themes: true,
            animations: true,
            responsive: true,
            a11y: true,
            rtl: true,
            customization: true,
            events: true,
            keyboard: true
        },
        
        // Fonctionnalités avancées
        advanced: {
            ai: {
                enabled: false,
                features: ['suggestions', 'predictions', 'auto-complete']
            },
            offline: {
                enabled: true,
                cache: 'service-worker'
            },
            collaboration: {
                enabled: false,
                features: ['real-time', 'presence', 'comments']
            }
        }
    },
    
    // ========================================
    // INTÉGRATIONS
    // ========================================
    integrations: {
        // Frameworks supportés
        frameworks: ['vanilla', 'react', 'vue', 'angular', 'svelte'],
        
        // Bundlers supportés
        bundlers: ['webpack', 'vite', 'rollup', 'parcel', 'esbuild'],
        
        // APIs externes
        apis: {
            maps: 'google',
            payments: 'stripe',
            analytics: 'google',
            auth: 'firebase'
        }
    },
    
    // ========================================
    // MÉTADONNÉES POUR DOCUMENTATION
    // ========================================
    documentation: {
        // Pour générer la doc automatiquement
        generateDocs: true,
        
        // Format de la documentation
        format: 'markdown',
        
        // Exemples inclus
        includeExamples: true,
        
        // API Reference
        apiReference: true,
        
        // Storybook
        storybook: {
            enabled: true,
            url: '/storybook'
        }
    },
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Obtenir une description textuelle du système
     * Utile pour partager avec Claude/Assistant
     */
    toString() {
        return `
# 🎨 ${this.system.name} v${this.system.version}

## 📊 Statistiques
- Total composants: ${this.components.total}
- Composants existants: ${this.components.existing.length}
- Catégories: ${Object.keys(this.components.categories).length}
- Thèmes: ${Object.keys(this.themes.available).length}
- Animations: ${Object.keys(this.animations.levels).length} niveaux

## 🎯 Configuration par défaut
- Thème: ${this.themes.default}
- Animation: ${this.animations.default}
- Style: ${this.defaults.style}
- Langue: ${this.defaults.locale}

## 📦 Import
\`\`\`javascript
import { UI } from '${this.paths.components}';
\`\`\`

## 🚀 Utilisation rapide
\`\`\`javascript
// Créer un composant
const modal = await UI.Modal({
    title: 'Ma Modal',
    style: 'glassmorphism'
});

// Configurer globalement
UI.config({
    theme: 'dark',
    animation: 'rich'
});
\`\`\`
        `;
    },
    
    /**
     * Exporter la configuration en JSON
     */
    toJSON() {
        return JSON.stringify(this, null, 2);
    },
    
    /**
     * Valider la configuration
     */
    validate() {
        const errors = [];
        
        // Vérifier les chemins
        if (!this.paths.components) {
            errors.push('Chemin des composants manquant');
        }
        
        // Vérifier le thème par défaut
        if (!this.themes.available[this.themes.default]) {
            errors.push('Thème par défaut invalide');
        }
        
        // Vérifier l'animation par défaut
        if (!this.animations.levels[this.animations.default]) {
            errors.push('Animation par défaut invalide');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

// Export par défaut
export default UISystemConfig;
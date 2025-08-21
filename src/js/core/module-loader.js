// ========================================
// MODULE-LOADER.JS - Chargeur de modules additionnels
// Chemin: src/js/core/module-loader.js
//
// DESCRIPTION:
// Charge dynamiquement des modules optionnels comme
// document-drop, signature-pad, etc.
//
// API PUBLIQUE:
// - constructor()
// - load(moduleType, config)
// - unload(moduleInstance)
// - isAvailable(moduleType)
//
// MODULES SUPPORTÉS:
// - document-drop : Zone de dépôt de documents
// - signature-pad : Pad de signature
// - timeline : Timeline d'événements
// - calendar : Calendrier
// - chat : Module de chat
// ========================================

export class ModuleLoader {
    constructor() {
        // Registre des modules disponibles
        this.modules = {
            'document-drop': {
                path: '../modules/document-drop/document-drop.component.js',
                class: 'DocumentDrop',
                css: '../modules/document-drop/document-drop.css'
            },
            'signature-pad': {
                path: '../components/signature-pad.js',
                class: 'SignaturePad',
                css: null // CSS inclus dans le composant
            },
            'timeline': {
                path: '../shared/ui/timeline.component.js',
                class: 'Timeline',
                css: '../shared/ui/timeline.css'
            },
            'file-preview': {
                path: '../modules/file-preview/file-preview.component.js',
                class: 'FilePreview',
                css: '../modules/file-preview/file-preview.css'
            },
            'image-gallery': {
                path: '../modules/image-gallery/image-gallery.component.js',
                class: 'ImageGallery',
                css: '../modules/image-gallery/image-gallery.css'
            }
        };
        
        // Cache des modules chargés
        this.loadedModules = new Map();
        
        // CSS déjà chargés
        this.loadedCSS = new Set();
    }
    
    // ========================================
    // CHARGEMENT DE MODULE
    // ========================================
    
    /**
     * Charge un module et retourne son instance
     * @param {string} moduleType - Type du module à charger
     * @param {Object} config - Configuration du module
     * @returns {Promise<Object>} Instance du module
     */
    async load(moduleType, config) {
        console.log(`📦 Chargement du module: ${moduleType}`);
        
        // Vérifier si le module existe
        if (!this.modules[moduleType]) {
            throw new Error(`Module inconnu: ${moduleType}`);
        }
        
        const moduleInfo = this.modules[moduleType];
        
        try {
            // 1. Charger le CSS si nécessaire
            if (moduleInfo.css && !this.loadedCSS.has(moduleInfo.css)) {
                await this.loadCSS(moduleInfo.css);
                this.loadedCSS.add(moduleInfo.css);
            }
            
            // 2. Charger le module JS
            let ModuleClass;
            
            // Vérifier si déjà en cache
            if (this.loadedModules.has(moduleType)) {
                ModuleClass = this.loadedModules.get(moduleType);
            } else {
                // Charger dynamiquement
                const module = await import(moduleInfo.path);
                ModuleClass = module[moduleInfo.class] || module.default;
                
                if (!ModuleClass) {
                    throw new Error(`Classe ${moduleInfo.class} introuvable dans ${moduleInfo.path}`);
                }
                
                // Mettre en cache
                this.loadedModules.set(moduleType, ModuleClass);
            }
            
            // 3. Créer l'instance
            const instance = new ModuleClass(config);
            
            console.log(`✅ Module ${moduleType} chargé avec succès`);
            return instance;
            
        } catch (error) {
            console.error(`❌ Erreur chargement module ${moduleType}:`, error);
            throw error;
        }
    }
    
    // ========================================
    // CHARGEMENT CSS
    // ========================================
    
    /**
     * Charge un fichier CSS dynamiquement
     * @param {string} cssPath - Chemin du fichier CSS
     * @returns {Promise<void>}
     */
    loadCSS(cssPath) {
        return new Promise((resolve, reject) => {
            // Vérifier si déjà chargé
            const existingLink = document.querySelector(`link[href="${cssPath}"]`);
            if (existingLink) {
                resolve();
                return;
            }
            
            // Créer le link
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            
            link.onload = () => {
                console.log(`✅ CSS chargé: ${cssPath}`);
                resolve();
            };
            
            link.onerror = () => {
                console.error(`❌ Erreur chargement CSS: ${cssPath}`);
                reject(new Error(`Impossible de charger ${cssPath}`));
            };
            
            // Ajouter au head
            document.head.appendChild(link);
        });
    }
    
    // ========================================
    // DÉCHARGEMENT
    // ========================================
    
    /**
     * Décharge un module et nettoie ses ressources
     * @param {Object} moduleInstance - Instance du module à décharger
     */
    unload(moduleInstance) {
        if (moduleInstance && typeof moduleInstance.destroy === 'function') {
            moduleInstance.destroy();
        }
    }
    
    // ========================================
    // VÉRIFICATION DISPONIBILITÉ
    // ========================================
    
    /**
     * Vérifie si un module est disponible
     * @param {string} moduleType - Type du module
     * @returns {boolean}
     */
    isAvailable(moduleType) {
        return this.modules.hasOwnProperty(moduleType);
    }
    
    /**
     * Retourne la liste des modules disponibles
     * @returns {string[]}
     */
    getAvailableModules() {
        return Object.keys(this.modules);
    }
    
    // ========================================
    // ENREGISTREMENT DE NOUVEAU MODULE
    // ========================================
    
    /**
     * Enregistre un nouveau module
     * @param {string} type - Type du module
     * @param {Object} moduleInfo - Informations du module
     */
    register(type, moduleInfo) {
        if (!moduleInfo.path || !moduleInfo.class) {
            throw new Error('Module info must have path and class');
        }
        
        this.modules[type] = moduleInfo;
        console.log(`📝 Module ${type} enregistré`);
    }
}

// ========================================
// EXEMPLE DE MODULE (document-drop)
// ========================================

/*
// modules/document-drop/document-drop.component.js
export class DocumentDrop {
    constructor(config) {
        this.config = {
            container: null,
            acceptedTypes: ['pdf', 'jpg', 'png'],
            maxSize: 10, // MB
            onDrop: null,
            onRemove: null,
            ...config
        };
        
        this.files = [];
        this.init();
    }
    
    init() {
        this.render();
        this.attachEvents();
    }
    
    render() {
        const container = 
            typeof this.config.container === 'string' ? 
            document.querySelector(this.config.container) : 
            this.config.container;
            
        container.innerHTML = `
            <div class="document-drop-zone">
                <div class="drop-area">
                    <div class="drop-icon">📎</div>
                    <p>Glissez vos documents ici ou cliquez pour sélectionner</p>
                    <input type="file" multiple hidden>
                </div>
                <div class="files-list"></div>
            </div>
        `;
        
        this.elements = {
            dropArea: container.querySelector('.drop-area'),
            input: container.querySelector('input[type="file"]'),
            filesList: container.querySelector('.files-list')
        };
    }
    
    attachEvents() {
        // Drag & drop
        this.elements.dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropArea.classList.add('drag-over');
        });
        
        this.elements.dropArea.addEventListener('dragleave', () => {
            this.elements.dropArea.classList.remove('drag-over');
        });
        
        this.elements.dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // Click
        this.elements.dropArea.addEventListener('click', () => {
            this.elements.input.click();
        });
        
        this.elements.input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }
    
    handleFiles(files) {
        // Validation et ajout des fichiers
        // ...
        
        if (this.config.onDrop) {
            this.config.onDrop(this.files);
        }
    }
    
    destroy() {
        // Nettoyage
        this.files = [];
        if (this.elements.dropArea) {
            this.elements.dropArea.remove();
        }
    }
}
*/

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [Date] - Description du problème et solution
//
// NOTES POUR REPRISES FUTURES:
// - Les modules doivent avoir une méthode destroy()
// - Le CSS est chargé automatiquement si défini
// - Les modules peuvent être enregistrés dynamiquement
// ========================================
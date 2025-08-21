// ========================================
// DROPZONE.COMPONENT.JS - Zone de dépôt de fichiers glassmorphisme
// Chemin: src/components/ui/dropzone/dropzone.component.js
//
// DESCRIPTION:
// Composant de zone de dépôt (drag & drop) pour fichiers
// Style glassmorphisme avec preview et validation
// 100% indépendant et réutilisable
//
// API PUBLIQUE:
// - constructor(config)
// - addFiles(files)
// - removeFile(index)
// - clear()
// - getFiles()
// - setOptions(options)
// - enable()
// - disable()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onDrop: (files) => void
// - onRemove: (file, index) => void
// - onError: (error) => void
// - beforeDrop: (files) => boolean
// - onChange: (files) => void
//
// EXEMPLE:
// const dropzone = new DropZone({
//     container: '#my-dropzone',
//     acceptedTypes: ['image/*', 'application/pdf'],
//     maxFileSize: 10 * 1024 * 1024, // 10MB
//     maxFiles: 5,
//     showPreview: true,
//     onDrop: (files) => console.log('Files dropped:', files)
// });
// ========================================

export class DropZone {
    constructor(options = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'dropzone-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.options = {
            container: null,
            acceptedTypes: '*', // ['image/*', 'application/pdf'] ou '*' pour tout
            maxFileSize: 50 * 1024 * 1024, // 50MB par défaut
            maxFiles: 10,
            multiple: true,
            showPreview: true,
            previewSize: 'medium', // small, medium, large
            messages: {
                drop: 'Glissez vos fichiers ici',
                browse: 'ou cliquez pour parcourir',
                typeError: 'Type de fichier non accepté',
                sizeError: 'Fichier trop volumineux',
                maxFilesError: 'Nombre maximum de fichiers atteint'
            },
            // Callbacks
            onDrop: null,
            onRemove: null,
            onError: null,
            beforeDrop: null,
            onChange: null,
            ...options
        };
        
        this.container = null;
        this.elements = {};
        this.files = [];
        this.dragCounter = 0;
        this.isDisabled = false;
        
        if (this.options.container) {
            this.init();
        }
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        // Trouver le conteneur
        this.container = typeof this.options.container === 'string' 
            ? document.querySelector(this.options.container)
            : this.options.container;
            
        if (!this.container) {
            console.error('DropZone: Conteneur non trouvé');
            return;
        }
        
        // Charger les styles
        this.loadStyles();
        
        // Créer la structure
        this.render();
        
        // Attacher les événements
        this.attachEvents();
        
        console.log('✅ DropZone initialisée:', this.id);
    }
    
    loadStyles() {
        if (document.getElementById('dropzone-styles')) {
            return;
        }
        
        // ✅ NOUVELLE MÉTHODE : Chemin dynamique
        const componentUrl = new URL(import.meta.url).href;
        const cssUrl = componentUrl.replace('.js', '.css');
        
        const link = document.createElement('link');
        link.id = 'dropzone-styles';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
        
        console.log('📦 DropZone styles chargés depuis:', cssUrl);
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        this.container.innerHTML = '';
        this.container.className = `dropzone-container dropzone-${this.options.previewSize}`;
        this.container.id = this.id;
        
        // Zone de dépôt principale
        const dropArea = document.createElement('div');
        dropArea.className = 'dropzone-area';
        dropArea.innerHTML = `
            <div class="dropzone-content">
                <div class="dropzone-icon">📁</div>
                <p class="dropzone-text">${this.options.messages.drop}</p>
                <p class="dropzone-subtext">${this.options.messages.browse}</p>
                <input type="file" 
                       class="dropzone-input" 
                       ${this.options.multiple ? 'multiple' : ''}
                       accept="${this.formatAcceptTypes()}"
                       style="display: none;">
            </div>
        `;
        
        // Zone de preview
        const previewArea = document.createElement('div');
        previewArea.className = 'dropzone-preview';
        previewArea.style.display = 'none';
        
        // Assembler
        this.container.appendChild(dropArea);
        if (this.options.showPreview) {
            this.container.appendChild(previewArea);
        }
        
        // Stocker les références
        this.elements = {
            dropArea,
            previewArea,
            input: dropArea.querySelector('.dropzone-input'),
            content: dropArea.querySelector('.dropzone-content')
        };
    }
    
    formatAcceptTypes() {
        if (this.options.acceptedTypes === '*') return '*';
        if (Array.isArray(this.options.acceptedTypes)) {
            return this.options.acceptedTypes.join(',');
        }
        return this.options.acceptedTypes;
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        const { dropArea, input } = this.elements;
        
        // Click pour ouvrir le sélecteur
        dropArea.addEventListener('click', () => {
            if (!this.isDisabled) {
                input.click();
            }
        });
        
        // Sélection de fichiers
        input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Drag & Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        dropArea.addEventListener('dragenter', this.handleDragEnter.bind(this));
        dropArea.addEventListener('dragover', this.handleDragOver.bind(this));
        dropArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        dropArea.addEventListener('drop', this.handleDrop.bind(this));
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDragEnter(e) {
        this.dragCounter++;
        if (!this.isDisabled) {
            this.elements.dropArea.classList.add('dragover');
        }
    }
    
    handleDragOver(e) {
        if (!this.isDisabled) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }
    
    handleDragLeave(e) {
        this.dragCounter--;
        if (this.dragCounter === 0) {
            this.elements.dropArea.classList.remove('dragover');
        }
    }
    
    handleDrop(e) {
        this.dragCounter = 0;
        this.elements.dropArea.classList.remove('dragover');
        
        if (!this.isDisabled) {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        }
    }
    
    // ========================================
    // GESTION DES FICHIERS
    // ========================================
    
    async handleFiles(fileList) {
        const files = Array.from(fileList);
        
        // Callback beforeDrop pour validation
        if (this.options.beforeDrop) {
            const proceed = await this.options.beforeDrop(files);
            if (!proceed) return;
        }
        
        // Vérifier le nombre max
        if (this.files.length + files.length > this.options.maxFiles) {
            this.showError(this.options.messages.maxFilesError);
            return;
        }
        
        // Traiter chaque fichier
        const validFiles = [];
        for (const file of files) {
            if (this.validateFile(file)) {
                validFiles.push(file);
            }
        }
        
        if (validFiles.length > 0) {
            this.files.push(...validFiles);
            this.updatePreview();
            this.triggerCallback('onDrop', validFiles);
            this.triggerCallback('onChange', this.files);
        }
        
        // Reset l'input
        this.elements.input.value = '';
    }
    
    validateFile(file) {
        // Vérifier le type
        if (!this.isTypeAccepted(file)) {
            this.showError(`${file.name}: ${this.options.messages.typeError}`);
            return false;
        }
        
        // Vérifier la taille
        if (file.size > this.options.maxFileSize) {
            const sizeMB = (this.options.maxFileSize / 1024 / 1024).toFixed(1);
            this.showError(`${file.name}: ${this.options.messages.sizeError} (max ${sizeMB}MB)`);
            return false;
        }
        
        return true;
    }
    
    isTypeAccepted(file) {
        if (this.options.acceptedTypes === '*') return true;
        
        const acceptedTypes = Array.isArray(this.options.acceptedTypes) 
            ? this.options.acceptedTypes 
            : [this.options.acceptedTypes];
            
        return acceptedTypes.some(type => {
            if (type.includes('*')) {
                // Type générique (ex: image/*)
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType);
            }
            return file.type === type;
        });
    }
    
    // ========================================
    // AFFICHAGE PREVIEW
    // ========================================
    
    updatePreview() {
        if (!this.options.showPreview) return;
        
        const { previewArea } = this.elements;
        previewArea.innerHTML = '';
        
        if (this.files.length === 0) {
            previewArea.style.display = 'none';
            return;
        }
        
        previewArea.style.display = 'block';
        
        this.files.forEach((file, index) => {
            const item = this.createPreviewItem(file, index);
            previewArea.appendChild(item);
        });
    }
    
    createPreviewItem(file, index) {
        const item = document.createElement('div');
        item.className = 'dropzone-preview-item';
        
        // Thumbnail
        const thumbnail = document.createElement('div');
        thumbnail.className = 'dropzone-preview-thumb';
        
        if (file.type.startsWith('image/')) {
            // Aperçu image
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);
            thumbnail.appendChild(img);
        } else {
            // Icône selon le type
            const icon = this.getFileIcon(file);
            thumbnail.innerHTML = `<span class="dropzone-file-icon">${icon}</span>`;
        }
        
        // Info fichier
        const info = document.createElement('div');
        info.className = 'dropzone-preview-info';
        info.innerHTML = `
            <p class="dropzone-preview-name">${this.truncateFilename(file.name, 30)}</p>
            <p class="dropzone-preview-size">${this.formatFileSize(file.size)}</p>
        `;
        
        // Bouton supprimer
        const removeBtn = document.createElement('button');
        removeBtn.className = 'dropzone-preview-remove';
        removeBtn.innerHTML = '✕';
        removeBtn.onclick = () => this.removeFile(index);
        
        // Assembler
        item.appendChild(thumbnail);
        item.appendChild(info);
        item.appendChild(removeBtn);
        
        return item;
    }
    
    getFileIcon(file) {
        const type = file.type;
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('presentation') || type.includes('powerpoint')) return '📑';
        if (type.includes('zip') || type.includes('compressed')) return '🗜️';
        if (type.includes('audio')) return '🎵';
        if (type.includes('video')) return '🎥';
        return '📎';
    }
    
    truncateFilename(name, maxLength) {
        if (name.length <= maxLength) return name;
        
        const ext = name.split('.').pop();
        const nameWithoutExt = name.slice(0, -(ext.length + 1));
        const truncatedName = nameWithoutExt.slice(0, maxLength - ext.length - 4);
        
        return `${truncatedName}...${ext}`;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // ========================================
    // GESTION DES ERREURS
    // ========================================
    
    showError(message) {
        this.triggerCallback('onError', { message, type: 'validation' });
        
        // Affichage temporaire dans la zone
        const errorDiv = document.createElement('div');
        errorDiv.className = 'dropzone-error';
        errorDiv.textContent = message;
        
        this.elements.dropArea.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Ajouter des fichiers programmatiquement
     */
    addFiles(files) {
        this.handleFiles(files);
    }
    
    /**
     * Retirer un fichier
     */
    removeFile(index) {
        if (index < 0 || index >= this.files.length) return;
        
        const removedFile = this.files.splice(index, 1)[0];
        this.updatePreview();
        
        this.triggerCallback('onRemove', removedFile, index);
        this.triggerCallback('onChange', this.files);
    }
    
    /**
     * Vider tous les fichiers
     */
    clear() {
        this.files = [];
        this.updatePreview();
        this.triggerCallback('onChange', this.files);
    }
    
    /**
     * Récupérer tous les fichiers
     */
    getFiles() {
        return [...this.files];
    }
    
    /**
     * Mettre à jour les options
     */
    setOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        // Re-render si nécessaire
        if (newOptions.messages || newOptions.previewSize) {
            this.render();
            this.attachEvents();
            this.updatePreview();
        }
    }
    
    /**
     * Activer la dropzone
     */
    enable() {
        this.isDisabled = false;
        this.container.classList.remove('disabled');
    }
    
    /**
     * Désactiver la dropzone
     */
    disable() {
        this.isDisabled = true;
        this.container.classList.add('disabled');
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.className = '';
        }
        this.files = [];
        this.elements = {};
        
        console.log('🧹 DropZone détruite:', this.id);
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    triggerCallback(name, ...args) {
        if (this.options[name] && typeof this.options[name] === 'function') {
            this.options[name](...args);
        }
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [30/01/2025] - Création du composant
   - Architecture 100% indépendante
   - Style glassmorphisme cohérent
   - Gestion multi-fichiers avec preview
   
   NOTES POUR REPRISES FUTURES:
   - Le composant est totalement autonome
   - Peut être étendu avec progress bars pour uploads
   - Compatible avec tous types de fichiers
   - Responsive par défaut
   ======================================== */
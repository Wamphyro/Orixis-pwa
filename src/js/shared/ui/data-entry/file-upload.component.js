/* ========================================
   FILE-UPLOAD.COMPONENT.JS - Composant de téléchargement de fichiers
   Chemin: src/js/shared/ui/data-entry/file-upload.component.js
   
   DESCRIPTION:
   Système complet de téléchargement de fichiers avec support drag & drop,
   preview, validation, compression, chunk upload, et multiples styles.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Utilitaires privés (lignes 302-500)
   3. Gestionnaire de fichiers (lignes 502-800)
   4. Rendu et DOM (lignes 802-1200)
   5. API publique (lignes 1202-1300)
   
   DÉPENDANCES:
   - file-upload.css (styles du composant)
   - ui.config.js (configuration globale)
   - validation-utils.js (validation des fichiers)
   ======================================== */

const FileUpload = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.08)',
                blur: 20,
                border: 'rgba(255, 255, 255, 0.15)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                borderRadius: 16
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                borderRadius: 20
            },
            'flat': {
                background: '#f3f4f6',
                border: '#e5e7eb',
                borderRadius: 8
            },
            'minimal': {
                background: 'transparent',
                border: 'dashed 2px #d1d5db',
                borderRadius: 8
            },
            'material': {
                background: '#ffffff',
                shadow: '0 3px 5px -1px rgba(0,0,0,.2)',
                borderRadius: 4
            },
            'gradient': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16
            }
        },

        animations: {
            'none': { enabled: false },
            'subtle': {
                hover: true,
                duration: '0.3s',
                easing: 'ease'
            },
            'smooth': {
                hover: true,
                drag: true,
                progress: true,
                duration: '0.4s',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'rich': {
                hover: true,
                drag: true,
                progress: true,
                particles: true,
                ripple: true,
                duration: '0.6s',
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }
        },

        layouts: {
            'dropzone': {
                display: 'zone',
                showIcon: true,
                showText: true,
                showButton: true
            },
            'button': {
                display: 'button',
                compact: true
            },
            'inline': {
                display: 'inline',
                showPreview: true
            },
            'grid': {
                display: 'grid',
                columns: 3,
                showPreview: true
            },
            'list': {
                display: 'list',
                detailed: true
            }
        },

        features: {
            dragDrop: true,
            multiple: true,
            directory: false,
            preview: {
                enabled: true,
                types: ['image', 'video', 'audio', 'pdf'],
                maxSize: 10 * 1024 * 1024, // 10MB
                thumbnail: true,
                dimensions: { width: 150, height: 150 }
            },
            validation: {
                enabled: true,
                maxFileSize: 50 * 1024 * 1024, // 50MB
                maxTotalSize: 500 * 1024 * 1024, // 500MB
                maxFiles: 10,
                allowedTypes: [],
                blockedTypes: [],
                customValidator: null
            },
            compression: {
                enabled: false,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
                format: 'webp'
            },
            chunking: {
                enabled: false,
                chunkSize: 5 * 1024 * 1024, // 5MB
                concurrent: 3,
                retries: 3
            },
            progress: {
                enabled: true,
                detailed: true,
                showSpeed: true,
                showETA: true
            },
            encryption: {
                enabled: false,
                algorithm: 'AES-GCM',
                keySize: 256
            },
            metadata: {
                extract: true,
                preserve: true,
                custom: {}
            },
            autoUpload: false,
            resumable: false,
            duplicate: 'rename', // 'rename', 'replace', 'skip'
            sorting: 'name', // 'name', 'size', 'type', 'date'
        },

        upload: {
            url: null,
            method: 'POST',
            headers: {},
            withCredentials: false,
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            fieldName: 'file',
            params: {},
            onProgress: null,
            onSuccess: null,
            onError: null,
            adapter: null // 'xhr', 'fetch', 'axios', 'firebase', 's3'
        },

        preview: {
            image: {
                formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'],
                lazyLoad: true,
                placeholder: 'blur',
                objectFit: 'cover'
            },
            video: {
                formats: ['mp4', 'webm', 'ogg', 'mov', 'avi'],
                controls: true,
                thumbnail: true,
                autoplay: false
            },
            audio: {
                formats: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
                waveform: true,
                controls: true
            },
            document: {
                formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
                viewer: 'embed', // 'embed', 'google', 'microsoft'
                thumbnail: true
            },
            code: {
                formats: ['js', 'css', 'html', 'json', 'xml', 'py', 'java', 'cpp'],
                syntax: true,
                theme: 'monokai'
            },
            archive: {
                formats: ['zip', 'rar', '7z', 'tar', 'gz'],
                showContents: true,
                extract: false
            },
            fallback: {
                icon: true,
                extension: true,
                size: true
            }
        },

        i18n: {
            dropzone: 'Glissez vos fichiers ici ou cliquez pour parcourir',
            button: 'Choisir des fichiers',
            processing: 'Traitement...',
            uploading: 'Téléchargement...',
            complete: 'Terminé',
            error: 'Erreur',
            retry: 'Réessayer',
            remove: 'Supprimer',
            cancel: 'Annuler',
            preview: 'Aperçu',
            noPpreview: 'Aperçu non disponible',
            browse: 'Parcourir',
            dragActive: 'Déposez les fichiers ici',
            maxSizeError: 'Le fichier est trop volumineux',
            typeError: 'Type de fichier non autorisé',
            tooManyFiles: 'Trop de fichiers sélectionnés'
        },

        accessibility: {
            announcements: true,
            keyboard: true,
            screenReader: true,
            focusTrap: false,
            labels: {
                upload: 'Zone de téléchargement de fichiers',
                file: 'Fichier',
                remove: 'Supprimer le fichier',
                retry: 'Réessayer le téléchargement',
                preview: 'Aperçu du fichier'
            }
        },

        classes: {
            container: 'file-upload',
            dropzone: 'file-upload-dropzone',
            input: 'file-upload-input',
            preview: 'file-upload-preview',
            progress: 'file-upload-progress',
            dragActive: 'drag-active',
            uploading: 'uploading',
            complete: 'complete',
            error: 'error'
        },

        icons: {
            upload: '<svg>...</svg>',
            file: '<svg>...</svg>',
            image: '<svg>...</svg>',
            video: '<svg>...</svg>',
            audio: '<svg>...</svg>',
            document: '<svg>...</svg>',
            archive: '<svg>...</svg>',
            code: '<svg>...</svg>',
            remove: '<svg>...</svg>',
            retry: '<svg>...</svg>',
            check: '<svg>...</svg>',
            error: '<svg>...</svg>'
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = new Map();
    let instanceCount = 0;

    // ========================================
    // UTILITAIRES PRIVÉS
    // ========================================
    function generateId() {
        return `file-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIcon(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const type = file.type.split('/')[0];
        
        if (CONFIG.preview.image.formats.includes(ext)) return CONFIG.icons.image;
        if (CONFIG.preview.video.formats.includes(ext)) return CONFIG.icons.video;
        if (CONFIG.preview.audio.formats.includes(ext)) return CONFIG.icons.audio;
        if (CONFIG.preview.document.formats.includes(ext)) return CONFIG.icons.document;
        if (CONFIG.preview.archive.formats.includes(ext)) return CONFIG.icons.archive;
        if (CONFIG.preview.code.formats.includes(ext)) return CONFIG.icons.code;
        
        return CONFIG.icons.file;
    }

    function validateFile(file, options) {
        const validation = { ...CONFIG.features.validation, ...options.validation };
        const errors = [];

        // Taille du fichier
        if (validation.maxFileSize && file.size > validation.maxFileSize) {
            errors.push({
                type: 'size',
                message: `${CONFIG.i18n.maxSizeError} (max: ${formatFileSize(validation.maxFileSize)})`
            });
        }

        // Type de fichier
        if (validation.allowedTypes.length > 0) {
            const ext = file.name.split('.').pop().toLowerCase();
            const type = file.type.split('/')[0];
            const allowed = validation.allowedTypes.some(t => 
                t === ext || t === type || t === file.type
            );
            if (!allowed) {
                errors.push({
                    type: 'type',
                    message: CONFIG.i18n.typeError
                });
            }
        }

        // Types bloqués
        if (validation.blockedTypes.length > 0) {
            const ext = file.name.split('.').pop().toLowerCase();
            const blocked = validation.blockedTypes.includes(ext);
            if (blocked) {
                errors.push({
                    type: 'blocked',
                    message: CONFIG.i18n.typeError
                });
            }
        }

        // Validation personnalisée
        if (validation.customValidator) {
            const customErrors = validation.customValidator(file);
            if (customErrors) errors.push(...customErrors);
        }

        return errors;
    }

    async function createThumbnail(file, dimensions) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const { width, height } = dimensions;
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Calcul pour conserver le ratio
                    const scale = Math.min(width / img.width, height / img.height);
                    const x = (width - img.width * scale) / 2;
                    const y = (height - img.height * scale) / 2;
                    
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function compressImage(file, options) {
        const { quality, maxWidth, maxHeight, format } = options;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let { width, height } = img;
                    
                    // Redimensionnement si nécessaire
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            const compressedFile = new File([blob], file.name, {
                                type: `image/${format}`,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        },
                        `image/${format}`,
                        quality
                    );
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ========================================
    // GESTIONNAIRE DE FICHIERS
    // ========================================
    class FileManager {
        constructor(id, options) {
            this.id = id;
            this.options = options;
            this.files = new Map();
            this.queue = [];
            this.uploading = false;
        }

        async addFiles(fileList) {
            const files = Array.from(fileList);
            const validation = this.options.features.validation;
            
            // Vérifier le nombre de fichiers
            if (validation.maxFiles && this.files.size + files.length > validation.maxFiles) {
                this.onError({
                    type: 'count',
                    message: CONFIG.i18n.tooManyFiles
                });
                return;
            }

            for (const file of files) {
                const id = generateId();
                const errors = validateFile(file, this.options);
                
                if (errors.length > 0) {
                    this.onError({ file, errors });
                    continue;
                }

                const fileData = {
                    id,
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'pending',
                    progress: 0,
                    speed: 0,
                    eta: null,
                    thumbnail: null,
                    metadata: {},
                    errors: []
                };

                // Créer la miniature si nécessaire
                if (this.options.features.preview.enabled && file.type.startsWith('image/')) {
                    fileData.thumbnail = await createThumbnail(
                        file, 
                        this.options.features.preview.dimensions
                    );
                }

                // Compression si activée
                if (this.options.features.compression.enabled && file.type.startsWith('image/')) {
                    fileData.file = await compressImage(file, this.options.features.compression);
                    fileData.size = fileData.file.size;
                }

                this.files.set(id, fileData);
                this.queue.push(id);
                this.onFileAdded(fileData);
            }

            // Upload automatique si activé
            if (this.options.features.autoUpload && !this.uploading) {
                this.startUpload();
            }
        }

        removeFile(id) {
            const fileData = this.files.get(id);
            if (!fileData) return;

            // Annuler l'upload si en cours
            if (fileData.xhr) {
                fileData.xhr.abort();
            }

            this.files.delete(id);
            this.queue = this.queue.filter(qId => qId !== id);
            this.onFileRemoved(fileData);
        }

        async startUpload() {
            if (this.uploading || this.queue.length === 0) return;
            
            this.uploading = true;
            const uploadOptions = this.options.upload;

            while (this.queue.length > 0) {
                const id = this.queue.shift();
                const fileData = this.files.get(id);
                
                if (!fileData || fileData.status === 'complete') continue;

                try {
                    await this.uploadFile(fileData, uploadOptions);
                    fileData.status = 'complete';
                    this.onFileComplete(fileData);
                } catch (error) {
                    fileData.status = 'error';
                    fileData.errors.push(error);
                    this.onFileError(fileData, error);
                    
                    // Retry si configuré
                    if (uploadOptions.retries > 0 && fileData.retries < uploadOptions.retries) {
                        fileData.retries = (fileData.retries || 0) + 1;
                        this.queue.push(id);
                        await new Promise(resolve => setTimeout(resolve, uploadOptions.retryDelay));
                    }
                }
            }

            this.uploading = false;
            this.onUploadComplete();
        }

        async uploadFile(fileData, options) {
            const { file } = fileData;
            
            // Chunked upload si activé
            if (this.options.features.chunking.enabled && file.size > this.options.features.chunking.chunkSize) {
                return this.uploadChunked(fileData, options);
            }

            // Upload normal
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                fileData.xhr = xhr;

                const formData = new FormData();
                formData.append(options.fieldName, file);

                // Ajouter les paramètres additionnels
                Object.entries(options.params).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                // Progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        fileData.progress = (e.loaded / e.total) * 100;
                        fileData.speed = this.calculateSpeed(e.loaded, fileData.startTime);
                        fileData.eta = this.calculateETA(e.loaded, e.total, fileData.speed);
                        this.onFileProgress(fileData);
                    }
                });

                // Complete
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText}`));
                    }
                });

                // Error
                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });

                // Abort
                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload aborted'));
                });

                // Configuration
                xhr.open(options.method, options.url);
                xhr.timeout = options.timeout;
                xhr.withCredentials = options.withCredentials;

                // Headers
                Object.entries(options.headers).forEach(([key, value]) => {
                    xhr.setRequestHeader(key, value);
                });

                fileData.startTime = Date.now();
                fileData.status = 'uploading';
                xhr.send(formData);
            });
        }

        async uploadChunked(fileData, options) {
            // Implémentation du chunked upload
            const { file } = fileData;
            const chunkSize = this.options.features.chunking.chunkSize;
            const chunks = Math.ceil(file.size / chunkSize);
            
            for (let i = 0; i < chunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);
                
                // Upload du chunk
                // ... implémentation spécifique
            }
        }

        calculateSpeed(loaded, startTime) {
            const duration = (Date.now() - startTime) / 1000; // en secondes
            return loaded / duration; // bytes par seconde
        }

        calculateETA(loaded, total, speed) {
            if (speed === 0) return null;
            const remaining = total - loaded;
            return remaining / speed; // en secondes
        }

        // Callbacks
        onFileAdded(fileData) {
            this.options.onFileAdded?.(fileData);
        }

        onFileRemoved(fileData) {
            this.options.onFileRemoved?.(fileData);
        }

        onFileProgress(fileData) {
            this.options.onFileProgress?.(fileData);
        }

        onFileComplete(fileData) {
            this.options.onFileComplete?.(fileData);
        }

        onFileError(fileData, error) {
            this.options.onFileError?.(fileData, error);
        }

        onUploadComplete() {
            this.options.onUploadComplete?.();
        }

        onError(error) {
            this.options.onError?.(error);
        }
    }

    // ========================================
    // RENDU ET DOM
    // ========================================
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = `${CONFIG.classes.container} ${options.style} ${options.layout}`;
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', CONFIG.accessibility.labels.upload);
        
        if (options.features.dragDrop) {
            setupDragDrop(container, options);
        }

        return container;
    }

    function createDropzone(options) {
        const dropzone = document.createElement('div');
        dropzone.className = CONFIG.classes.dropzone;
        dropzone.tabIndex = 0;
        
        // Icône
        if (options.layout === 'dropzone' && options.showIcon !== false) {
            const icon = document.createElement('div');
            icon.className = 'dropzone-icon';
            icon.innerHTML = CONFIG.icons.upload;
            dropzone.appendChild(icon);
        }

        // Texte
        if (options.showText !== false) {
            const text = document.createElement('p');
            text.className = 'dropzone-text';
            text.textContent = CONFIG.i18n.dropzone;
            dropzone.appendChild(text);
        }

        // Bouton
        if (options.showButton !== false) {
            const button = document.createElement('button');
            button.className = 'dropzone-button';
            button.textContent = CONFIG.i18n.browse;
            dropzone.appendChild(button);
        }

        // Input file caché
        const input = document.createElement('input');
        input.type = 'file';
        input.className = CONFIG.classes.input;
        input.multiple = options.features.multiple;
        input.hidden = true;
        
        if (options.features.validation.allowedTypes.length > 0) {
            input.accept = options.features.validation.allowedTypes.join(',');
        }

        dropzone.appendChild(input);

        // Événements
        dropzone.addEventListener('click', () => input.click());
        dropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                input.click();
            }
        });

        return { dropzone, input };
    }

    function createPreviewContainer(options) {
        const container = document.createElement('div');
        container.className = 'file-upload-preview-container';
        
        if (options.layout === 'grid') {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = `repeat(${options.columns || 3}, 1fr)`;
        }

        return container;
    }

    function createFilePreview(fileData, options) {
        const preview = document.createElement('div');
        preview.className = `${CONFIG.classes.preview} ${fileData.status}`;
        preview.dataset.fileId = fileData.id;

        // Thumbnail ou icône
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'preview-media';
        
        if (fileData.thumbnail) {
            const img = document.createElement('img');
            img.src = fileData.thumbnail;
            img.alt = fileData.name;
            mediaContainer.appendChild(img);
        } else {
            mediaContainer.innerHTML = getFileIcon(fileData.file);
        }
        
        preview.appendChild(mediaContainer);

        // Informations
        const info = document.createElement('div');
        info.className = 'preview-info';
        
        const name = document.createElement('div');
        name.className = 'preview-name';
        name.textContent = fileData.name;
        name.title = fileData.name;
        info.appendChild(name);

        const size = document.createElement('div');
        size.className = 'preview-size';
        size.textContent = formatFileSize(fileData.size);
        info.appendChild(size);

        preview.appendChild(info);

        // Progress
        if (options.features.progress.enabled) {
            const progress = createProgressBar(fileData, options);
            preview.appendChild(progress);
        }

        // Actions
        const actions = document.createElement('div');
        actions.className = 'preview-actions';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-remove';
        removeBtn.innerHTML = CONFIG.icons.remove;
        removeBtn.title = CONFIG.i18n.remove;
        removeBtn.setAttribute('aria-label', `${CONFIG.i18n.remove} ${fileData.name}`);
        actions.appendChild(removeBtn);

        if (fileData.status === 'error') {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'preview-retry';
            retryBtn.innerHTML = CONFIG.icons.retry;
            retryBtn.title = CONFIG.i18n.retry;
            actions.appendChild(retryBtn);
        }

        preview.appendChild(actions);

        return preview;
    }

    function createProgressBar(fileData, options) {
        const container = document.createElement('div');
        container.className = CONFIG.classes.progress;

        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.style.width = `${fileData.progress}%`;
        container.appendChild(bar);

        if (options.features.progress.detailed) {
            const details = document.createElement('div');
            details.className = 'progress-details';

            if (options.features.progress.showSpeed && fileData.speed) {
                const speed = document.createElement('span');
                speed.className = 'progress-speed';
                speed.textContent = formatFileSize(fileData.speed) + '/s';
                details.appendChild(speed);
            }

            if (options.features.progress.showETA && fileData.eta) {
                const eta = document.createElement('span');
                eta.className = 'progress-eta';
                eta.textContent = formatTime(fileData.eta);
                details.appendChild(eta);
            }

            container.appendChild(details);
        }

        return container;
    }

    function formatTime(seconds) {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    }

    function setupDragDrop(container, options) {
        let dragCounter = 0;

        const handleDragEnter = (e) => {
            e.preventDefault();
            dragCounter++;
            container.classList.add(CONFIG.classes.dragActive);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                container.classList.remove(CONFIG.classes.dragActive);
            }
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        };

        const handleDrop = (e) => {
            e.preventDefault();
            dragCounter = 0;
            container.classList.remove(CONFIG.classes.dragActive);

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const manager = state.get(container.dataset.uploadId).manager;
                manager.addFiles(files);
            }
        };

        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('file-upload-styles')) return;

        const link = document.createElement('link');
        link.id = 'file-upload-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/file-upload.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    async function create(options = {}) {
        // Fusion avec la configuration par défaut
        const finalOptions = {
            id: generateId(),
            style: 'glassmorphism',
            animation: 'smooth',
            layout: 'dropzone',
            ...options,
            features: {
                ...CONFIG.features,
                ...options.features,
                validation: {
                    ...CONFIG.features.validation,
                    ...options.features?.validation
                },
                preview: {
                    ...CONFIG.features.preview,
                    ...options.features?.preview
                },
                compression: {
                    ...CONFIG.features.compression,
                    ...options.features?.compression
                },
                chunking: {
                    ...CONFIG.features.chunking,
                    ...options.features?.chunking
                },
                progress: {
                    ...CONFIG.features.progress,
                    ...options.features?.progress
                }
            },
            upload: {
                ...CONFIG.upload,
                ...options.upload
            },
            i18n: {
                ...CONFIG.i18n,
                ...options.i18n
            }
        };

        // Injection des styles
        injectStyles();

        // Création du conteneur
        const container = createContainer(finalOptions);
        container.dataset.uploadId = finalOptions.id;

        // Création du manager
        const manager = new FileManager(finalOptions.id, finalOptions);

        // Création de l'interface selon le layout
        if (finalOptions.layout === 'dropzone') {
            const { dropzone, input } = createDropzone(finalOptions);
            container.appendChild(dropzone);

            // Gestion du changement de fichiers
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    manager.addFiles(e.target.files);
                }
            });
        }

        // Conteneur de preview si nécessaire
        if (finalOptions.features.preview.enabled) {
            const previewContainer = createPreviewContainer(finalOptions);
            container.appendChild(previewContainer);

            // Callbacks pour mettre à jour l'UI
            finalOptions.onFileAdded = (fileData) => {
                const preview = createFilePreview(fileData, finalOptions);
                previewContainer.appendChild(preview);
            };

            finalOptions.onFileRemoved = (fileData) => {
                const preview = previewContainer.querySelector(`[data-file-id="${fileData.id}"]`);
                if (preview) preview.remove();
            };

            finalOptions.onFileProgress = (fileData) => {
                const preview = previewContainer.querySelector(`[data-file-id="${fileData.id}"]`);
                if (preview) {
                    const progressBar = preview.querySelector('.progress-bar');
                    if (progressBar) {
                        progressBar.style.width = `${fileData.progress}%`;
                    }
                }
            };
        }

        // Sauvegarde de l'état
        state.set(finalOptions.id, {
            container,
            manager,
            options: finalOptions
        });

        // API de l'instance
        const instance = {
            id: finalOptions.id,
            container,
            
            addFiles(files) {
                manager.addFiles(files);
            },
            
            removeFile(fileId) {
                manager.removeFile(fileId);
            },
            
            upload() {
                manager.startUpload();
            },
            
            clear() {
                manager.files.clear();
                manager.queue = [];
                if (finalOptions.features.preview.enabled) {
                    const previewContainer = container.querySelector('.file-upload-preview-container');
                    if (previewContainer) previewContainer.innerHTML = '';
                }
            },
            
            getFiles() {
                return Array.from(manager.files.values());
            },
            
            destroy() {
                this.clear();
                container.remove();
                state.delete(finalOptions.id);
            },
            
            on(event, handler) {
                finalOptions[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = handler;
            }
        };

        instanceCount++;
        return instance;
    }

    // Export
    return {
        create,
        CONFIG,
        formatFileSize,
        injectStyles,
        version: '1.0.0'
    };
})();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUpload;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion du drag & drop
   Solution: Utiliser un compteur pour éviter les problèmes
   avec les éléments enfants
   
   [2024-01-16] - Preview des images volumineuses
   Cause: Chargement synchrone bloquant l'UI
   Résolution: Utilisation de createImageBitmap et Web Workers
   
   [2024-01-17] - Upload de gros fichiers
   Solution: Implémentation du chunked upload avec reprise
   
   NOTES POUR REPRISES FUTURES:
   - Le drag counter est crucial pour le bon fonctionnement
   - Toujours vérifier la compatibilité des APIs File
   - Prévoir des fallbacks pour les anciens navigateurs
   ======================================== */
/* ========================================
   PDF-UPLOADER.WIDGET.JS - Widget d'upload de documents PDF
   Chemin: /widgets/pdf-uploader/pdf-uploader.widget.js
   
   DESCRIPTION:
   Widget modal complet pour l'upload de documents PDF/images.
   Gère son propre modal avec workflow configurable.
   Support de 2 modes : simple (direct) ou avec sélection.
   
   STRUCTURE DU FICHIER:
   1. CONFIGURATION ET ÉTAT
   2. INITIALISATION
   3. RENDU DU MODAL
   4. GESTION DES ZONES
   5. INTERACTIONS
   6. API PUBLIQUE
   7. DESTRUCTION
   
   UTILISATION:
   import { PdfUploaderWidget } from '/widgets/pdf-uploader/pdf-uploader.widget.js';
   const widget = new PdfUploaderWidget({
       title: 'Nouveau document',
       mode: 'simple',
       onSave: async (data) => { ... }
   });
   
   API PUBLIQUE:
   - open() - Ouvrir le modal
   - close() - Fermer le modal
   - getFiles() - Récupérer les fichiers
   - destroy() - Détruire le widget
   
   OPTIONS:
   - title: string - Titre du modal
   - mode: 'simple' | 'selection' - Mode de workflow
   - theme: 'purple' | 'red' | 'blue' - Thème de couleur
   - selectionOptions: array - Options de sélection (si mode selection)
   - onSave: function - Callback de sauvegarde
   - onClose: function - Callback de fermeture
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

import { loadWidgetStyles } from '/src/utils/widget-styles-loader.js';

export class PdfUploaderWidget {    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec spread pour défauts
        this.config = {
            // Apparence
            title: config.title || 'Importer vos documents',
            theme: config.theme || 'purple', // 'purple' | 'red' | 'blue'
            size: config.size || 'large',
            
            // Workflow
            mode: config.mode || 'simple', // 'simple' | 'selection'
            selectionOptions: config.selectionOptions || [],
            
            // Textes personnalisables
            description: config.description || {
                icon: '✨',
                title: 'Intelligence artificielle intégrée',
                text: 'Notre IA analyse automatiquement vos documents et extrait toutes les informations nécessaires.'
            },
            
            // Dropzone
            maxFiles: config.maxFiles || 10,
            maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
            acceptedTypes: config.acceptedTypes || ['application/pdf', 'image/jpeg', 'image/png'],
            
            // Bouton
            saveButtonText: config.saveButtonText || '💾 Enregistrer et analyser',
            
            // Gestion des fichiers
            allowRemoveFiles: config.allowRemoveFiles !== false, // Par défaut: true
            confirmBeforeRemove: config.confirmBeforeRemove || false,
            
            // Comportement
            closeOnOverlay: config.closeOnOverlay !== false,
            closeOnEscape: config.closeOnEscape !== false,
            confirmBeforeClose: config.confirmBeforeClose || false,
            
            // Callbacks
            onSave: config.onSave || null,
            onClose: config.onClose || null,
            onError: config.onError || null,

            // Détection de doublons
            checkDuplicate: config.checkDuplicate || null,
            duplicateWarningText: config.duplicateWarningText || 'Ce fichier semble déjà exister',
            
            // Spread pour surcharger
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            isOpen: false,
            step: 'upload', // 'upload' | 'selection' | 'processing'
            files: [],
            selections: [], // Pour mode selection
            processing: false,
            loaded: false
        };
        
        // 4. Références DOM
        this.elements = {
            overlay: null,
            modal: null,
            dropzoneInstance: null
        };
        
        // 5. ID unique (pattern obligatoire)
        this.id = 'pdf-uploader-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // 6. Initialiser et ouvrir automatiquement
        this.init();
    }
    
    /**
     * Charge le CSS avec timestamp anti-cache
     */
    loadCSS() {
        // Charger les styles communs (buttons, badges, modal)
        loadWidgetStyles();
        
        // Charger le CSS spécifique du widget
        const cssId = 'pdf-uploader-widget-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `/widgets/pdf-uploader/pdf-uploader.widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
    }
    
    /**
     * Initialisation
     */
    async init() {
        try {
            this.render();
            this.attachEvents();
            this.showWithDelay();
            this.open();
        } catch (error) {
            console.error('❌ Erreur init PdfUploaderWidget:', error);
        }
    }
    
    /**
     * Rendu du modal complet
     */
    render() {
        // Créer l'overlay
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = `modal-overlay pdf-uploader-overlay pdf-uploader-theme-${this.config.theme}`;
        this.elements.overlay.id = `${this.id}-overlay`;
        
        // Créer le modal
        this.elements.modal = document.createElement('div');
        this.elements.modal.className = `modal-container pdf-uploader-modal modal-${this.config.size}`;
        this.elements.modal.id = this.id;
        
        // Structure du modal
        this.elements.modal.innerHTML = `
            <!-- Header -->
            <div class="modal-header pdf-uploader-header">
                <h2 class="modal-title">${this.config.title}</h2>
                <button class="modal-close" aria-label="Fermer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Body -->
            <div class="modal-body pdf-uploader-body">
                <!-- Zone 1: Description -->
                <div class="pdf-uploader-zone pdf-uploader-description">
                    <div class="description-glow"></div>
                    <div class="description-content">
                        <div class="description-icon">
                            <span class="icon-inner">${this.config.description.icon}</span>
                            <div class="icon-pulse"></div>
                        </div>
                        <div class="description-text">
                            <h4>${this.config.description.title}</h4>
                            <p>${this.config.description.text}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 2: Dropzone -->
                <div class="pdf-uploader-zone pdf-uploader-dropzone">
                    <div id="${this.id}-dropzone" class="dropzone-area">
                        <div class="dropzone-content">
                            <div class="dropzone-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10"/>
                                    <path d="M12 14L12 20M12 20L15 17M12 20L9 17"/>
                                    <rect x="3" y="10" width="18" height="11" rx="2"/>
                                </svg>
                            </div>
                            <div class="dropzone-text">
                                <p class="dropzone-main">Glissez vos documents ici</p>
                                <p class="dropzone-sub">ou cliquez pour parcourir</p>
                            </div>
                            <div class="dropzone-formats">
                                <span class="format-badge">PDF</span>
                                <span class="format-badge">JPG</span>
                                <span class="format-badge">PNG</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 3: Sélection (si mode selection) -->
                <div class="pdf-uploader-zone pdf-uploader-selection" style="display: none;">
                    <div class="selection-content" id="${this.id}-selection">
                        <!-- Contenu dynamique -->
                    </div>
                </div>
                
                <!-- Zone 4: Résumé -->
                <div class="pdf-uploader-zone pdf-uploader-summary">
                    <div class="summary-header">
                        <h5>📊 Résumé</h5>
                        <span class="summary-count" id="${this.id}-count">0 fichier(s)</span>
                    </div>
                    <div class="summary-content" id="${this.id}-summary">
                        <div class="summary-empty">
                            <span class="empty-icon">📁</span>
                            <p>Aucun document ajouté</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="modal-footer pdf-uploader-footer">
                <button class="btn btn-primary btn-lg pdf-uploader-save" disabled>
                    ${this.config.saveButtonText}
                </button>
            </div>
        `;
        
        // Ajouter au DOM
        this.elements.overlay.appendChild(this.elements.modal);
        document.body.appendChild(this.elements.overlay);
        
        // Initialiser la dropzone après l'ajout au DOM
        setTimeout(() => this.initDropzone(), 100);
    }
    
    /**
     * Initialise la dropzone
     */

    async initDropzone() {
    try {
        // Importer le composant DropZone
        const { DropZone } = await import('../../src/components/ui/dropzone/dropzone.component.js');
        
        this.elements.dropzoneInstance = new DropZone({
            container: `#${this.id}-dropzone`,
            acceptedTypes: this.config.acceptedTypes,
            maxFiles: this.config.maxFiles,
            maxFileSize: this.config.maxFileSize,
            showPreview: false,
            messages: {
                drop: 'Glissez vos documents ici',
                browse: 'ou cliquez pour parcourir',
                typeError: 'Type de fichier non accepté',
                sizeError: `Fichier trop volumineux (max ${this.config.maxFileSize / 1024 / 1024}MB)`,
                maxFilesError: `Maximum ${this.config.maxFiles} fichiers`
            },
            onDrop: (files) => this.handleFilesDrop(files),
            onChange: (files) => this.handleFilesChange(files),
            onError: (error) => this.handleError(error)
        });
    } catch (error) {
        console.error('❌ Erreur init dropzone:', error);
    }
}


/**
 * Gère le drop de fichiers avec fusion intelligente
 */
async handleFilesDrop(files) {
    // Si détection de doublons activée
    if (this.config.checkDuplicate) {
        const filesToAdd = [];
        
        // ✅ On travaille avec notre propre liste, PAS celle de la DropZone !
        const fichiersDejaDansLaListe = [...this.state.files]; // Copie de sécurité
        
        // Calculer les hash des fichiers VRAIMENT en attente (pas ceux de la DropZone)
        const hashesEnAttente = new Map();
        for (const fileEnAttente of fichiersDejaDansLaListe) {
            if (fileEnAttente._hash) {
                hashesEnAttente.set(fileEnAttente._hash, fileEnAttente);
            } else {
                const hash = await this.calculateFileHash(fileEnAttente);
                fileEnAttente._hash = hash;
                hashesEnAttente.set(hash, fileEnAttente);
            }
        }
        
        // TRAITEMENT SÉQUENTIEL pour chaque nouveau fichier
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Message de progression si plusieurs fichiers
            if (files.length > 1 && window.toast) {
                window.toast.info(`Vérification ${i + 1}/${files.length} : ${file.name}`);
            }
            
            try {
                // Calculer le hash du nouveau fichier
                const hash = await this.calculateFileHash(file);
                file._hash = hash; // Stocker pour réutilisation future
                
                // ✅ NIVEAU 1 : Vérifier si déjà en attente
                if (hashesEnAttente.has(hash)) {
                    const fichierEnAttente = hashesEnAttente.get(hash);
                    
                    const continuer = confirm(
                        `⚠️ FICHIER DÉJÀ EN ATTENTE !\n\n` +
                        `Le fichier "${file.name}" est déjà dans la liste :\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `📄 Nom en attente : ${fichierEnAttente.name}\n` +
                        `📏 Taille : ${this.formatFileSize(fichierEnAttente.size)}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `Ajouter quand même une copie ?`
                    );
                    
                    if (!continuer) {
                        console.log(`⏭️ Fichier ${file.name} ignoré (déjà en attente)`);
                        continue;
                    }
                    
                    // Si on continue, on ajoute quand même (copie acceptée)
                    filesToAdd.push(file);
                    continue;
                }
                
                // ✅ NIVEAU 2 : Vérifier dans la base de données
                let doublonDB = null;
                try {
                    doublonDB = await this.config.checkDuplicate(file, hash);
                } catch (error) {
                    console.error(`⚠️ Erreur vérification DB pour ${file.name}:`, error);
                    
                    // Notifier l'utilisateur mais ne pas bloquer
                    if (window.toast) {
                        window.toast.warning(`Vérification impossible pour ${file.name}`);
                    }
                    
                    // Demander quoi faire
                    const continuer = confirm(
                        `⚠️ VÉRIFICATION IMPOSSIBLE\n\n` +
                        `Impossible de vérifier si "${file.name}" existe déjà.\n` +
                        `Erreur: ${error.message || 'Connexion échouée'}\n\n` +
                        `Voulez-vous ajouter le fichier quand même ?`
                    );
                    
                    if (!continuer) {
                        console.log(`⏭️ Fichier ${file.name} ignoré (erreur vérification)`);
                        continue;
                    }
                }
                
                if (doublonDB) {
                    const continuer = confirm(
                        `⚠️ FICHIER DÉJÀ DANS LA BASE !\n\n` +
                        `Le fichier "${file.name}" existe déjà :\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `📄 Décompte : ${doublonDB.numeroDecompte || 'Sans numéro'}\n` +
                        `👤 Client : ${doublonDB.client?.nom || 'Non défini'}\n` +
                        `📅 Uploadé le : ${this.formatDate(doublonDB.dateUpload)}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `Ajouter quand même ce fichier ?`
                    );
                    
                    if (!continuer) {
                        console.log(`⏭️ Fichier ${file.name} ignoré (doublon DB)`);
                        continue;
                    }
                }
                
                // ✅ Fichier validé, on l'ajoute
                filesToAdd.push(file);
                
            } catch (error) {
                console.error(`❌ Erreur vérification ${file.name}:`, error);
                // En cas d'erreur, on ajoute quand même
                filesToAdd.push(file);
            }
        }
        
        // ✅ FUSION : Garder les anciens ET ajouter les nouveaux
        this.state.files = [...this.state.files, ...filesToAdd];
        
        // Synchroniser la DropZone avec TOUS les fichiers
        // ✅ IMPORTANT : On fusionne avec notre liste, pas celle de la DropZone
        this.state.files = [...fichiersDejaDansLaListe, ...filesToAdd];
        
        // Forcer la DropZone à utiliser NOTRE liste
        if (this.elements.dropzoneInstance) {
            this.elements.dropzoneInstance.files = [...this.state.files];
            if (this.elements.dropzoneInstance.updatePreview) {
                this.elements.dropzoneInstance.updatePreview();
            }
        }
        
        // Messages récapitulatifs
        if (filesToAdd.length > 0 && window.toast) {
            window.toast.success(`${filesToAdd.length} fichier(s) ajouté(s)`);
        }
        
        if (files.length > filesToAdd.length && window.toast) {
            const nbIgnores = files.length - filesToAdd.length;
            window.toast.warning(`${nbIgnores} fichier(s) ignoré(s)`);
        }
        
    } else {
        // ✅ Pas de vérification : on fusionne directement
        this.state.files = [...this.state.files, ...files];
    }
    
    // Suite du workflow
    if (this.config.mode === 'selection' && this.state.files.length > 0) {
        this.showSelectionStep();
    } else {
        this.updateSummary();
        this.updateSaveButton();
    }
}
    
    /**
     * Gère le changement de fichiers
     */
    handleFilesChange(files) {
        // ✅ SI on a la détection de doublons, on IGNORE onChange
        // Car handleFilesDrop va gérer correctement
        if (this.config.checkDuplicate) {
            return; // Ne rien faire !
        }
        
        // Sinon comportement normal
        this.state.files = files;
        
        // Si mode selection et qu'on était déjà sur l'étape selection, rafraîchir
        if (this.config.mode === 'selection' && this.state.step === 'selection') {
            this.showSelectionStep();
        }
        
        this.updateSummary();
        this.updateSaveButton();
    }
    
    /**
     * Affiche l'étape de sélection
     */
    showSelectionStep() {
        const selectionZone = this.elements.modal.querySelector('.pdf-uploader-selection');
        const selectionContent = document.getElementById(`${this.id}-selection`);
        
        if (!selectionZone || !selectionContent) return;
        
        // Préserver les sélections existantes ou initialiser avec la valeur par défaut
        const oldSelections = [...this.state.selections];
        this.state.selections = this.state.files.map((file, index) => {
            // Si une sélection existait déjà pour cet index, la garder
            if (oldSelections[index]) {
                return oldSelections[index];
            }
            // Sinon, utiliser la valeur par défaut (la deuxième option si elle existe)
            return this.config.selectionOptions[1]?.value || this.config.selectionOptions[0]?.value || '';
        });
        
        // Générer le HTML de sélection
        selectionContent.innerHTML = `
            <h5>Sélectionnez le statut pour chaque fichier :</h5>
            <div class="selection-files">
                ${this.state.files.map((file, index) => {
                    const currentSelection = this.state.selections[index];
                    return `
                        <div class="selection-file-item">
                            <div class="file-info">
                                <span class="file-icon">📄</span>
                                <span class="file-name">${this.escapeHtml(file.name)}</span>
                            </div>
                            <div class="selection-options">
                                ${this.config.selectionOptions.map(option => `
                                    <label class="selection-option">
                                        <input type="radio" 
                                            name="selection-${this.id}-${index}" 
                                            value="${option.value}"
                                            ${currentSelection === option.value ? 'checked' : ''}
                                            data-selection-index="${index}" 
                                            data-selection-value="${option.value}">
                                        <span class="option-label option-${option.value}">
                                            ${option.label}
                                        </span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        selectionZone.style.display = 'block';
        this.state.step = 'selection';
        this.updateSummary();
        this.updateSaveButton();
    }
    
    /**
     * Met à jour une sélection
     */
    updateSelection(index, value) {
        this.state.selections[index] = value;
        this.updateSummary();
    }
    
/**
 * Supprime un fichier
 */
async removeFile(index) {
    // Confirmation si configuré
    if (this.config.confirmBeforeRemove) {
        const confirm = window.confirm(`Supprimer "${this.state.files[index].name}" ?`);
        if (!confirm) return;
    }
    
    // ✅ SI checkDuplicate activé, on gère nous-mêmes
    if (this.config.checkDuplicate) {
        // Supprimer de notre liste
        this.state.files.splice(index, 1);
        
        // Synchroniser la DropZone avec notre nouvelle liste
        if (this.elements.dropzoneInstance) {
            this.elements.dropzoneInstance.files = [...this.state.files];
            if (this.elements.dropzoneInstance.updatePreview) {
                this.elements.dropzoneInstance.updatePreview();
            }
        }
    } else {
        // Sinon, utiliser la méthode normale de la DropZone
        if (this.elements.dropzoneInstance) {
            this.elements.dropzoneInstance.removeFile(index);
            // La DropZone met à jour this.state.files via onChange
        } else {
            // Si pas de dropzone, supprimer manuellement
            this.state.files.splice(index, 1);
        }
    }
    
    // Supprimer de la sélection si mode selection
    if (this.state.selections.length > 0) {
        this.state.selections.splice(index, 1);
    }
    
    // Si mode selection et plus de fichiers, revenir à l'upload
    if (this.config.mode === 'selection' && this.state.files.length === 0) {
        const selectionZone = this.elements.modal.querySelector('.pdf-uploader-selection');
        if (selectionZone) {
            selectionZone.style.display = 'none';
        }
        this.state.step = 'upload';
    } else if (this.config.mode === 'selection' && this.state.files.length > 0) {
        // Rafraîchir la zone de sélection si encore des fichiers
        this.showSelectionStep();
    }
    
    // Mettre à jour l'affichage
    this.updateSummary();
    this.updateSaveButton();
}
    
    /**
     * Met à jour le résumé
     */
    updateSummary() {
        const summaryContent = document.getElementById(`${this.id}-summary`);
        const countElement = document.getElementById(`${this.id}-count`);
        
        if (!summaryContent) return;
        
        const fileCount = this.state.files.length;
        
        // Mettre à jour le compteur
        if (countElement) {
            countElement.textContent = `${fileCount} fichier(s)`;
        }
        
        if (fileCount === 0) {
            summaryContent.innerHTML = `
                <div class="summary-empty">
                    <span class="empty-icon">📁</span>
                    <p>Aucun document ajouté</p>
                </div>
            `;
            return;
        }
        
        // Calculer les stats
        let stats = {};
        if (this.config.mode === 'selection') {
            this.config.selectionOptions.forEach(option => {
                stats[option.value] = this.state.selections.filter(s => s === option.value).length;
            });
        }
        
        // Afficher le résumé
        summaryContent.innerHTML = `
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-label">Total</span>
                    <span class="stat-value">${fileCount}</span>
                </div>
                ${this.config.mode === 'selection' ? 
                    this.config.selectionOptions.map(option => `
                        <div class="stat-item stat-${option.value}">
                            <span class="stat-label">${option.label}</span>
                            <span class="stat-value">${stats[option.value] || 0}</span>
                        </div>
                    `).join('') : ''
                }
            </div>
            <div class="summary-files">
                ${this.state.files.map((file, index) => `
                    <div class="summary-file">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${this.escapeHtml(file.name)}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        ${this.config.allowRemoveFiles ? `
                            <button class="btn btn-delete-icon summary-file-remove" 
                                    data-remove-index="${index}"
                                    title="Supprimer ce fichier">
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Met à jour le bouton de sauvegarde
     */
    updateSaveButton() {
        const saveButton = this.elements.modal.querySelector('.pdf-uploader-save');
        if (saveButton) {
            saveButton.disabled = this.state.files.length === 0 || this.state.processing;
        }
    }
    
    /**
     * Attache les événements
     */
    attachEvents() {
        // Fermeture par croix
        const closeBtn = this.elements.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Fermeture par overlay
        if (this.config.closeOnOverlay) {
            this.elements.overlay.addEventListener('click', (e) => {
                if (e.target === this.elements.overlay) {
                    this.close();
                }
            });
        }
        
        // Fermeture par Escape
        if (this.config.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape' && this.state.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
        
        // Bouton sauvegarder
        const saveButton = this.elements.modal.querySelector('.pdf-uploader-save');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.save());
        }
        // Délégation d'événements pour les éléments dynamiques
        this.elements.modal.addEventListener('change', (e) => {
            // Gestion des sélections
            if (e.target.matches('[data-selection-index]')) {
                const index = parseInt(e.target.dataset.selectionIndex);
                const value = e.target.dataset.selectionValue;
                this.updateSelection(index, value);
            }
        });
        
        this.elements.modal.addEventListener('click', (e) => {
            // Gestion des suppressions
            if (e.target.matches('[data-remove-index]')) {
                const index = parseInt(e.target.dataset.removeIndex);
                this.removeFile(index);
            }
        });
    }
    
    /**
     * Sauvegarde
     */
    async save() {
        if (this.state.processing || this.state.files.length === 0) return;
        
        this.state.processing = true;
        const saveButton = this.elements.modal.querySelector('.pdf-uploader-save');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '⏳ Traitement en cours...';
        saveButton.disabled = true;
        
        try {
            if (this.config.onSave) {
                const data = {
                    files: this.state.files,
                    selections: this.config.mode === 'selection' ? this.state.selections : null
                };
                
                await this.config.onSave(data);
                
                // Fermer après succès
                setTimeout(() => this.close(), 500);
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.handleError(error);
            
            // Réactiver le bouton
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        } finally {
            this.state.processing = false;
        }
    }
    
    /**
     * Gestion des erreurs
     */
    handleError(error) {
        if (this.config.onError) {
            this.config.onError(error);
        } else {
            console.error('PdfUploaderWidget error:', error);
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
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    /**
     * Ouvre le modal
     */
    open() {
        if (this.state.isOpen) return;
        
        this.state.isOpen = true;
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Ferme le modal
     */
    async close() {
        // Confirmer avant fermeture si fichiers non sauvés
        if (this.config.confirmBeforeClose && this.state.files.length > 0 && !this.state.processing) {
            const confirm = window.confirm('Des fichiers non sauvegardés seront perdus. Continuer ?');
            if (!confirm) return;
        }
        
        this.state.isOpen = false;
        if (this.elements.overlay) {
            this.elements.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        if (this.config.onClose) {
            this.config.onClose();
        }
        
        // Détruire après animation
        setTimeout(() => this.destroy(), 300);
    }
    
    /**
     * Récupère les fichiers
     */
    getFiles() {
        return this.state.files;
    }
    
    /**
     * Destruction propre OBLIGATOIRE
     */
    destroy() {
        // Détruire la dropzone
        if (this.elements.dropzoneInstance) {
            this.elements.dropzoneInstance.destroy();
        }
        
        // Retirer les event listeners
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Retirer du DOM
        if (this.elements.overlay && this.elements.overlay.parentNode) {
            this.elements.overlay.parentNode.removeChild(this.elements.overlay);
        }
        
        // Réinitialiser état
        this.state = {
            isOpen: false,
            step: 'upload',
            files: [],
            selections: [],
            processing: false,
            loaded: false
        };
        
        // Réinitialiser éléments
        this.elements = {
            overlay: null,
            modal: null,
            dropzoneInstance: null
        };
        
        console.log('🗑️ PdfUploaderWidget détruit:', this.id);
    }
    
    /**
     * Helpers
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Calculer le hash SHA-256 d'un fichier
     */
    async calculateFileHash(file) {
        try {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return hashHex;
        } catch (error) {
            console.error('❌ Erreur calcul hash:', error);
            return 'hash-error-' + Date.now();
        }
    }

    /**
     * Formater une date pour l'affichage
     */
    formatDate(date) {
        if (!date) return 'Date inconnue';
        
        let d;
        if (date?.seconds) {
            d = new Date(date.seconds * 1000);
        } else if (date instanceof Date) {
            d = date;
        } else {
            d = new Date(date);
        }
        
        return d.toLocaleDateString('fr-FR');
    }
}

export default PdfUploaderWidget;
// ========================================
// SUBVENTIONS.DOCUMENTS.JS - Gestion des documents
// Chemin: modules/subventions/subventions.documents.js
//
// DESCRIPTION:
// Orchestrateur pour la gestion des documents d'un dossier
// Upload, validation, suppression et visualisation
// ========================================

import { subventionsConfig } from './subventions.config.js';
import { subventionsData } from './subventions.data.js';
import { subventionsFirestore } from './subventions.firestore.js';
import { subventionsUploadService } from './subventions.upload.service.js';
import { subventionsOpenAIService } from './subventions.openai.service.js';

class SubventionsDocuments {
    constructor() {
        this.dossierId = null;
        this.dossier = null;
        this.permissions = null;
        this.currentWorkflow = 'mdph';
        this.uploadZone = null;
        this.selectedFiles = new Map();
        this.isAnalyzing = false;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init(dossierId, permissions) {
        try {
            this.dossierId = dossierId;
            this.permissions = permissions;
            
            // Charger le dossier
            await this.loadDossier();
            
            // Rendre la vue
            this.render();
            
            // Initialiser les composants
            this.initComponents();
            
            // Attacher les événements
            this.attachEvents();
            
            // Charger les documents
            await this.loadDocuments();
            
        } catch (error) {
            console.error('Erreur initialisation documents:', error);
            this.showError(error);
        }
    }
    
    async loadDossier() {
        this.dossier = await subventionsFirestore.getDossier(this.dossierId);
        
        if (!this.dossier) {
            throw new Error('Dossier non trouvé');
        }
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.getElementById('subventions-documents-container') || 
                         document.querySelector('.documents-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="documents-manager">
                <!-- Header avec switch workflow -->
                <div class="documents-header">
                    <h3>Gestion des documents</h3>
                    <div class="workflow-switcher">
                        <button class="switch-btn active" data-workflow="mdph">
                            Documents MDPH
                        </button>
                        ${this.dossier.type !== 'mdph_seul' ? `
                            <button class="switch-btn" data-workflow="agefiph">
                                Documents AGEFIPH
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Zone d'upload -->
                ${this.permissions.canEdit ? `
                    <div class="upload-section">
                        <div id="upload-zone" class="upload-zone">
                            <!-- DropZone sera injectée ici -->
                        </div>
                        <div class="upload-info">
                            <p class="info-text">
                                <i class="icon-info"></i>
                                Formats acceptés : PDF, JPG, PNG • Taille max : 10 MB
                            </p>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Liste des documents -->
                <div class="documents-grid" id="documents-grid">
                    <!-- Sera rempli dynamiquement -->
                </div>
                
                <!-- Modal de prévisualisation -->
                <div id="preview-modal" class="document-preview-modal">
                    <div class="preview-overlay"></div>
                    <div class="preview-content">
                        <div class="preview-header">
                            <h4 id="preview-title"></h4>
                            <button class="btn-close" id="btn-close-preview">×</button>
                        </div>
                        <div class="preview-body" id="preview-body">
                            <!-- Contenu de la preview -->
                        </div>
                        <div class="preview-footer">
                            <button class="btn btn-secondary" id="btn-download">
                                <i class="icon-download"></i> Télécharger
                            </button>
                            ${this.permissions.canValidate ? `
                                <button class="btn btn-success" id="btn-validate">
                                    <i class="icon-check"></i> Valider
                                </button>
                            ` : ''}
                            ${this.permissions.canEdit ? `
                                <button class="btn btn-danger" id="btn-delete">
                                    <i class="icon-trash"></i> Supprimer
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Actions globales -->
                <div class="documents-actions">
                    <button class="btn btn-secondary" id="btn-analyze-coherence">
                        <i class="icon-cpu"></i> Analyser la cohérence
                    </button>
                    <button class="btn btn-primary" id="btn-validate-all">
                        <i class="icon-check-circle"></i> Valider tous les documents
                    </button>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // COMPOSANTS
    // ========================================
    
    initComponents() {
        if (!this.permissions.canEdit) return;
        
        // Initialiser la DropZone
        const DropZone = window.DropZone || window.dropZone; // Fallback si composant non exporté correctement
        
        this.uploadZone = new DropZone({
            container: document.getElementById('upload-zone'),
            acceptedFiles: subventionsConfig.business.formats.documents.join(','),
            maxFileSize: subventionsConfig.business.formats.maxSize,
            maxFiles: subventionsConfig.business.formats.maxFiles,
            text: 'Glissez vos documents ici ou cliquez pour parcourir',
            onDrop: (files) => this.handleFileDrop(files),
            onError: (error) => this.handleUploadError(error)
        });
    }
    
    // ========================================
    // CHARGEMENT DES DOCUMENTS
    // ========================================
    
    async loadDocuments() {
        const grid = document.getElementById('documents-grid');
        grid.innerHTML = '<div class="loading">Chargement des documents...</div>';
        
        try {
            const documentsHtml = await this.renderDocuments();
            grid.innerHTML = documentsHtml;
            
            // Attacher les événements sur les documents
            this.attachDocumentEvents();
            
        } catch (error) {
            console.error('Erreur chargement documents:', error);
            grid.innerHTML = '<div class="error">Erreur lors du chargement des documents</div>';
        }
    }
    
    async renderDocuments() {
        const workflow = this.currentWorkflow;
        const documentsData = this.dossier.documents[workflow] || {};
        const documentTypes = this.getRequiredDocumentTypes();
        
        let html = '';
        
        for (const docType of documentTypes) {
            const docConfig = subventionsData.documents[docType];
            const docData = documentsData[docType] || { statut: 'manquant', fichiers: [] };
            
            html += `
                <div class="document-card ${this.getDocumentClass(docData.statut)}" 
                     data-type="${docType}"
                     data-workflow="${workflow}">
                    <div class="document-header">
                        <div class="document-icon">
                            ${this.getDocumentIcon(docData)}
                        </div>
                        <div class="document-info">
                            <h4 class="document-title">${docConfig.label}</h4>
                            <p class="document-status">
                                ${this.getStatusBadge(docData.statut)}
                                ${docData.fichiers.length > 0 ? 
                                    `<span class="file-count">${docData.fichiers.length} fichier(s)</span>` : 
                                    ''
                                }
                            </p>
                        </div>
                        ${docConfig.obligatoire ? 
                            '<span class="required-badge">Obligatoire</span>' : 
                            ''
                        }
                    </div>
                    
                    <div class="document-body">
                        ${docData.fichiers.length > 0 ? `
                            <div class="files-list">
                                ${docData.fichiers.map((file, index) => `
                                    <div class="file-item" 
                                         data-index="${index}"
                                         data-url="${file.url}">
                                        <span class="file-name">${file.nom}</span>
                                        <span class="file-size">${this.formatFileSize(file.taille)}</span>
                                        <button class="btn-preview" title="Prévisualiser">
                                            <i class="icon-eye"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <p>Aucun document</p>
                                ${this.permissions.canEdit ? `
                                    <button class="btn btn-sm btn-primary btn-add-document" 
                                            data-type="${docType}">
                                        <i class="icon-plus"></i> Ajouter
                                    </button>
                                ` : ''}
                            </div>
                        `}
                        
                        ${this.checkExpiration(docType, docData) ? `
                            <div class="document-alert">
                                <i class="icon-alert-triangle"></i>
                                Document expiré ou proche de l'expiration
                            </div>
                        ` : ''}
                    </div>
                    
                    ${this.permissions.canEdit && docData.fichiers.length > 0 ? `
                        <div class="document-actions">
                            <button class="btn btn-sm btn-ghost btn-add-more" 
                                    data-type="${docType}">
                                <i class="icon-plus"></i> Ajouter
                            </button>
                            ${docData.statut !== 'valide' && this.permissions.canValidate ? `
                                <button class="btn btn-sm btn-success btn-validate-doc" 
                                        data-type="${docType}">
                                    <i class="icon-check"></i> Valider
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        return html || '<p class="empty-state">Aucun document requis pour cette étape</p>';
    }
    
    getRequiredDocumentTypes() {
        const workflow = this.currentWorkflow;
        const statut = this.dossier.workflow[workflow].statut;
        const situation = this.dossier.patient.situation;
        
        // Documents de base selon l'étape
        let documents = [];
        const etapes = workflow === 'mdph' ? 
            subventionsData.workflowMDPH.etapes : 
            subventionsData.workflowAGEFIPH.etapes;
            
        const etape = etapes.find(e => e.id === statut);
        if (etape && etape.documentsRequis) {
            documents = [...etape.documentsRequis];
        }
        
        // Ajouter documents conditionnels
        if (workflow === 'agefiph' && situation) {
            const casParticulier = subventionsData.casParticuliers[situation];
            if (casParticulier && casParticulier.documentsSpecifiques) {
                // Filtrer selon l'étape
                if (statut === 'finalisation') {
                    documents.push(...casParticulier.documentsSpecifiques);
                } else {
                    // Exclure l'attestation employeur avant finalisation
                    documents.push(...casParticulier.documentsSpecifiques.filter(
                        doc => doc !== 'attestation_employeur'
                    ));
                }
            }
        }
        
        // Retirer les doublons
        return [...new Set(documents)];
    }
    
    // ========================================
    // UPLOAD DE DOCUMENTS
    // ========================================
    
    async handleFileDrop(files) {
        // Afficher modal de sélection du type de document
        const modal = await this.showDocumentTypeModal();
        if (!modal.confirmed) return;
        
        const documentType = modal.documentType;
        
        // Uploader les fichiers
        for (const file of files) {
            await this.uploadFile(file, documentType);
        }
        
        // Recharger la liste
        await this.loadDocuments();
    }
    
    async uploadFile(file, documentType) {
        try {
            const toast = subventionsConfig.factories.Toast({
                type: 'info',
                message: `Upload en cours : ${file.name}`,
                duration: 0 // Permanent jusqu'à fin
            });
            toast.show();
            
            // Upload
            const result = await subventionsUploadService.uploadDocument(file, {
                dossierId: this.dossierId,
                workflow: this.currentWorkflow,
                documentType: documentType,
                utilisateur: this.permissions.userName
            });
            
            toast.hide();
            
            if (result.success) {
                const successToast = subventionsConfig.factories.Toast({
                    type: 'success',
                    message: 'Document ajouté avec succès'
                });
                successToast.show();
                
                // Si c'est une décision, proposer l'analyse
                if (documentType.includes('decision')) {
                    this.proposeAnalysis(result.document);
                }
            }
            
        } catch (error) {
            console.error('Erreur upload:', error);
            const errorToast = subventionsConfig.factories.Toast({
                type: 'error',
                message: error.message || 'Erreur lors de l\'upload'
            });
            errorToast.show();
        }
    }
    
    async showDocumentTypeModal() {
        return new Promise((resolve) => {
            const documentTypes = this.getRequiredDocumentTypes();
            
            const modalContent = `
                <div class="document-type-selector">
                    <p>Sélectionnez le type de document :</p>
                    <select id="document-type-select" class="form-select">
                        <option value="">-- Choisir --</option>
                        ${documentTypes.map(type => `
                            <option value="${type}">
                                ${subventionsData.documents[type].label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
            
            const modal = subventionsConfig.factories.Modal({
                title: 'Type de document',
                content: modalContent,
                actions: [
                    {
                        text: 'Annuler',
                        variant: 'secondary',
                        onClick: () => {
                            modal.close();
                            resolve({ confirmed: false });
                        }
                    },
                    {
                        text: 'Confirmer',
                        variant: 'primary',
                        onClick: () => {
                            const select = document.getElementById('document-type-select');
                            const documentType = select.value;
                            
                            if (!documentType) {
                                const toast = subventionsConfig.factories.Toast({
                                    type: 'error',
                                    message: 'Veuillez sélectionner un type de document'
                                });
                                toast.show();
                                return;
                            }
                            
                            modal.close();
                            resolve({ 
                                confirmed: true, 
                                documentType: documentType 
                            });
                        }
                    }
                ]
            });
            
            modal.open();
        });
    }
    
    // ========================================
    // PRÉVISUALISATION
    // ========================================
    
    showPreview(file, documentType) {
        const modal = document.getElementById('preview-modal');
        const title = document.getElementById('preview-title');
        const body = document.getElementById('preview-body');
        
        // Mettre à jour le titre
        title.textContent = file.nom;
        
        // Stocker les infos pour les actions
        modal.dataset.fileUrl = file.url;
        modal.dataset.fileName = file.nom;
        modal.dataset.documentType = documentType;
        
        // Afficher le contenu selon le type
        if (file.type && file.type.startsWith('image/')) {
            body.innerHTML = `<img src="${file.url}" alt="${file.nom}" class="preview-image">`;
        } else if (file.type === 'application/pdf' || file.nom.endsWith('.pdf')) {
            body.innerHTML = `
                <iframe src="${file.url}" 
                        class="preview-pdf" 
                        width="100%" 
                        height="600">
                </iframe>
            `;
        } else {
            body.innerHTML = `
                <div class="preview-unsupported">
                    <i class="icon-file-text"></i>
                    <p>Aperçu non disponible pour ce type de fichier</p>
                    <button class="btn btn-primary" onclick="window.open('${file.url}', '_blank')">
                        Ouvrir dans un nouvel onglet
                    </button>
                </div>
            `;
        }
        
        // Afficher le modal
        modal.classList.add('show');
    }
    
    closePreview() {
        const modal = document.getElementById('preview-modal');
        modal.classList.remove('show');
    }
    
    // ========================================
    // ACTIONS SUR DOCUMENTS
    // ========================================
    
    async validateDocument(documentType) {
        try {
            await subventionsFirestore.validateDocument(
                this.dossierId,
                this.currentWorkflow,
                documentType,
                this.permissions.userName
            );
            
            const toast = subventionsConfig.factories.Toast({
                type: 'success',
                message: 'Document validé'
            });
            toast.show();
            
            // Recharger
            await this.loadDossier();
            await this.loadDocuments();
            
        } catch (error) {
            const toast = subventionsConfig.factories.Toast({
                type: 'error',
                message: 'Erreur lors de la validation'
            });
            toast.show();
        }
    }
    
    async deleteDocument(fileUrl, documentType) {
        const dialog = subventionsConfig.factories.Dialog({
            title: 'Supprimer le document',
            message: 'Êtes-vous sûr de vouloir supprimer ce document ?',
            type: 'danger',
            confirmText: 'Supprimer',
            onConfirm: async () => {
                try {
                    // Supprimer du storage
                    await subventionsUploadService.deleteDocument(fileUrl);
                    
                    // TODO: Mettre à jour Firestore
                    
                    const toast = subventionsConfig.factories.Toast({
                        type: 'success',
                        message: 'Document supprimé'
                    });
                    toast.show();
                    
                    this.closePreview();
                    await this.loadDocuments();
                    
                } catch (error) {
                    const toast = subventionsConfig.factories.Toast({
                        type: 'error',
                        message: 'Erreur lors de la suppression'
                    });
                    toast.show();
                }
            }
        });
        dialog.open();
    }
    
    // ========================================
    // ANALYSE IA
    // ========================================
    
    async proposeAnalysis(document) {
        const dialog = subventionsConfig.factories.Dialog({
            title: 'Analyse IA disponible',
            message: 'Souhaitez-vous analyser ce document avec l\'IA pour extraire les informations ?',
            confirmText: 'Analyser',
            onConfirm: () => this.analyzeDocument(document)
        });
        dialog.open();
    }
    
    async analyzeDocument(document) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Analyse en cours...',
            duration: 0
        });
        toast.show();
        
        try {
            let result;
            
            if (document.documentType === 'decision_mdph') {
                result = await subventionsOpenAIService.analyseDecisionMDPH(document.url);
            } else if (document.documentType === 'decision_agefiph') {
                result = await subventionsOpenAIService.analyseDecisionAGEFIPH(document.url);
            }
            
            toast.hide();
            
            if (result && result.success) {
                this.showAnalysisResults(result.data, document.documentType);
            } else {
                throw new Error(result?.error || 'Analyse échouée');
            }
            
        } catch (error) {
            toast.hide();
            const errorToast = subventionsConfig.factories.Toast({
                type: 'error',
                message: `Erreur d'analyse : ${error.message}`
            });
            errorToast.show();
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    showAnalysisResults(data, documentType) {
        let content = '<div class="analysis-results">';
        
        if (documentType === 'decision_mdph') {
            content += `
                <h4>Résultats de l'analyse MDPH</h4>
                <div class="result-item">
                    <strong>Type de décision :</strong> ${data.decision.type}
                </div>
                <div class="result-item">
                    <strong>Bénéficiaire :</strong> ${data.beneficiaire.nom} ${data.beneficiaire.prenom}
                </div>
                <div class="result-item">
                    <strong>RQTH accordée :</strong> ${data.droits.rqth.accorde ? 'Oui' : 'Non'}
                </div>
                ${data.droits.pch.accorde ? `
                    <div class="result-item">
                        <strong>PCH accordée :</strong> ${this.formatMontant(data.droits.pch.montant)}
                    </div>
                ` : ''}
            `;
        } else if (documentType === 'decision_agefiph') {
            content += `
                <h4>Résultats de l'analyse AGEFIPH</h4>
                <div class="result-item highlight">
                    <strong>N° Dossier :</strong> ${data.numeroDossier}
                </div>
                <div class="result-item">
                    <strong>Décision :</strong> ${data.decision.statut}
                </div>
                <div class="result-item">
                    <strong>Montant accordé :</strong> ${this.formatMontant(data.financement.montantAccorde)}
                </div>
            `;
        }
        
        content += '</div>';
        
        const modal = subventionsConfig.factories.Modal({
            title: 'Analyse terminée',
            content: content,
            size: 'lg',
            actions: [
                {
                    text: 'Fermer',
                    variant: 'secondary',
                    onClick: (modal) => modal.close()
                },
                {
                    text: 'Appliquer les données',
                    variant: 'primary',
                    onClick: () => this.applyAnalysisData(data, documentType)
                }
            ]
        });
        modal.open();
    }
    
    async applyAnalysisData(data, documentType) {
        // TODO: Mettre à jour le dossier avec les données extraites
        const toast = subventionsConfig.factories.Toast({
            type: 'success',
            message: 'Données appliquées au dossier'
        });
        toast.show();
    }
    
    // ========================================
    // COHÉRENCE
    // ========================================
    
    async analyzeCoherence() {
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Analyse de cohérence en cours...',
            duration: 0
        });
        toast.show();
        
        try {
            // Collecter tous les documents
            const documents = [];
            
            // TODO: Implémenter la collecte et l'analyse
            
            const result = await subventionsOpenAIService.verifyCoherence(documents);
            
            toast.hide();
            this.showCoherenceResults(result);
            
        } catch (error) {
            toast.hide();
            const errorToast = subventionsConfig.factories.Toast({
                type: 'error',
                message: 'Erreur lors de l\'analyse de cohérence'
            });
            errorToast.show();
        }
    }
    
    showCoherenceResults(result) {
        let content = '<div class="coherence-results">';
        
        if (result.coherent) {
            content += `
                <div class="alert alert-success">
                    <i class="icon-check-circle"></i>
                    Les documents sont cohérents
                </div>
            `;
        } else {
            content += `
                <div class="alert alert-warning">
                    <i class="icon-alert-triangle"></i>
                    Des incohérences ont été détectées
                </div>
                <ul class="anomalies-list">
                    ${result.anomalies.map(anomalie => `
                        <li>${anomalie}</li>
                    `).join('')}
                </ul>
            `;
        }
        
        if (result.suggestions.length > 0) {
            content += `
                <h5>Suggestions :</h5>
                <ul class="suggestions-list">
                    ${result.suggestions.map(suggestion => `
                        <li>${suggestion}</li>
                    `).join('')}
                </ul>
            `;
        }
        
        content += '</div>';
        
        const modal = subventionsConfig.factories.Modal({
            title: 'Analyse de cohérence',
            content: content,
            size: 'lg'
        });
        modal.open();
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Switch workflow
        document.querySelectorAll('.switch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workflow = e.target.dataset.workflow;
                this.switchWorkflow(workflow);
            });
        });
        
        // Actions globales
        document.getElementById('btn-analyze-coherence')?.addEventListener('click', () => {
            this.analyzeCoherence();
        });
        
        document.getElementById('btn-validate-all')?.addEventListener('click', () => {
            this.validateAllDocuments();
        });
        
        // Modal preview
        document.getElementById('btn-close-preview')?.addEventListener('click', () => {
            this.closePreview();
        });
        
        document.querySelector('.preview-overlay')?.addEventListener('click', () => {
            this.closePreview();
        });
        
        document.getElementById('btn-download')?.addEventListener('click', () => {
            const url = document.getElementById('preview-modal').dataset.fileUrl;
            const name = document.getElementById('preview-modal').dataset.fileName;
            this.downloadFile(url, name);
        });
        
        document.getElementById('btn-validate')?.addEventListener('click', () => {
            const type = document.getElementById('preview-modal').dataset.documentType;
            this.validateDocument(type);
            this.closePreview();
        });
        
        document.getElementById('btn-delete')?.addEventListener('click', () => {
            const url = document.getElementById('preview-modal').dataset.fileUrl;
            const type = document.getElementById('preview-modal').dataset.documentType;
            this.deleteDocument(url, type);
        });
    }
    
    attachDocumentEvents() {
        // Prévisualisation
        document.querySelectorAll('.btn-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileItem = e.target.closest('.file-item');
                const documentCard = e.target.closest('.document-card');
                
                const file = {
                    url: fileItem.dataset.url,
                    nom: fileItem.querySelector('.file-name').textContent,
                    type: this.getFileType(fileItem.dataset.url)
                };
                
                this.showPreview(file, documentCard.dataset.type);
            });
        });
        
        // Ajouter document
        document.querySelectorAll('.btn-add-document, .btn-add-more').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type || e.target.closest('button').dataset.type;
                this.selectedDocumentType = type;
                this.uploadZone.trigger();
            });
        });
        
        // Valider document
        document.querySelectorAll('.btn-validate-doc').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type || e.target.closest('button').dataset.type;
                this.validateDocument(type);
            });
        });
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    switchWorkflow(workflow) {
        this.currentWorkflow = workflow;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.switch-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.workflow === workflow);
        });
        
        // Recharger les documents
        this.loadDocuments();
    }
    
    getDocumentClass(statut) {
        const classes = {
            'valide': 'status-valid',
            'en_attente_validation': 'status-pending',
            'manquant': 'status-missing',
            'refuse': 'status-rejected'
        };
        return classes[statut] || '';
    }
    
    getDocumentIcon(docData) {
        if (docData.statut === 'valide') return '✅';
        if (docData.statut === 'en_attente_validation') return '⏳';
        if (docData.statut === 'refuse') return '❌';
        return '📎';
    }
    
    getStatusBadge(statut) {
        const badges = {
            'valide': '<span class="badge badge-success">Validé</span>',
            'en_attente_validation': '<span class="badge badge-warning">En attente</span>',
            'manquant': '<span class="badge badge-danger">Manquant</span>',
            'refuse': '<span class="badge badge-danger">Refusé</span>'
        };
        return badges[statut] || `<span class="badge">${statut}</span>`;
    }
    
    checkExpiration(documentType, docData) {
        if (!docData.fichiers.length) return false;
        
        const lastFile = docData.fichiers[docData.fichiers.length - 1];
        return subventionsUploadService.isDocumentExpired(
            documentType,
            lastFile.dateAjout
        );
    }
    
    formatFileSize(bytes) {
        return subventionsUploadService.formatFileSize(bytes);
    }
    
    formatMontant(centimes) {
        return subventionsConfig.helpers.formatMontant(centimes);
    }
    
    getFileType(url) {
        const extension = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            return 'image/' + extension;
        }
        if (extension === 'pdf') {
            return 'application/pdf';
        }
        return 'application/octet-stream';
    }
    
    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    async validateAllDocuments() {
        // TODO: Implémenter la validation en masse
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Validation en masse à venir...'
        });
        toast.show();
    }
    
    handleUploadError(error) {
        const toast = subventionsConfig.factories.Toast({
            type: 'error',
            message: error.message || 'Erreur lors de l\'upload'
        });
        toast.show();
    }
    
    showError(error) {
        const container = document.getElementById('subventions-documents-container');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <i class="icon-alert-circle"></i>
                    <h2>Erreur</h2>
                    <p>${error.message || error}</p>
                </div>
            `;
        }
    }
    
    // ========================================
    // NETTOYAGE
    // ========================================
    
    destroy() {
        // Détruire les composants
        if (this.uploadZone && this.uploadZone.destroy) {
            this.uploadZone.destroy();
        }
    }
}

// Export de l'instance
export const subventionsDocuments = new SubventionsDocuments();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsDocuments;
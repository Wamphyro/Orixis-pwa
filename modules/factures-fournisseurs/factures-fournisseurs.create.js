// ========================================
// FACTURES-FOURNISSEURS.CREATE.JS - Gestion de la création de factures
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.create.js
//
// DESCRIPTION:
// Module de création de factures fournisseurs
// Upload avec sélection "à payer" AVANT l'analyse IA
//
// ARCHITECTURE:
// - Upload via DropZone
// - Interface de sélection (à payer / déjà payée)
// - Analyse automatique par IA
// - Création avec le bon statut
//
// DÉPENDANCES:
// - config pour les factories de composants
// - uploadService pour l'upload des fichiers
// - firestoreService pour la création de la facture
// ========================================

import config from './factures-fournisseurs.config.js';
import { afficherSucces, afficherErreur } from './factures-fournisseurs.main.js';
import uploadService from './factures-fournisseurs.upload.service.js';
import firestoreService from './factures-fournisseurs.firestore.service.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let nouvelleFacture = {
    documents: [],      // Fichiers uploadés
    selections: []      // Statut sélectionné pour chaque fichier
};

// Instances des composants
let dropzoneDocuments = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationFacture() {
    console.log('Module création facture initialisé');
    
    // Préparer les listeners futurs
    window.resetNouvelleFacture = resetNouvelleFacture;
}

// ========================================
// OUVERTURE MODAL NOUVELLE FACTURE
// ========================================

export function ouvrirNouvelleFacture() {
    resetNouvelleFacture();
    
    // Afficher le formulaire initial
    afficherFormulaireUpload();
    
    // Ouvrir la modal
    window.modalManager.open('modalNouvelleFacture');
}

// ========================================
// AFFICHAGE FORMULAIRE UPLOAD
// ========================================

function afficherFormulaireUpload() {
    // Mettre à jour le footer avec le bouton désactivé
    const modalFooter = document.querySelector('#modalNouvelleFacture .modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button class="btn btn-ghost btn-pill" onclick="fermerModal('modalNouvelleFacture')">
                Annuler
            </button>
        `;
    }
    
    // Créer la structure moderne avec les 3 zones
    const modalBody = document.querySelector('#modalNouvelleFacture .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="nouvelle-facture-wrapper">
                <!-- Zone 1 : Description -->
                <div class="zone-description">
                    <div class="content">
                        <div class="icon-wrapper">
                            <span class="icon">📑</span>
                        </div>
                        <div class="text">
                            <h4>Upload de factures fournisseurs</h4>
                            <p>Déposez vos factures (Free, EDF, etc.). Vous pourrez ensuite indiquer lesquelles sont à payer ou déjà payées avant l'analyse automatique.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 2 : Dropzone -->
                <div class="zone-dropzone">
                    <div id="facture-dropzone"></div>
                </div>
                
                <!-- Zone 3 : Résultats (vide au départ) -->
                <div class="zone-resultats">
                    <div class="zone-resultats-header">
                        <h5>
                            📋 Fichiers uploadés
                            <span class="count" id="files-count" style="display: none;">0</span>
                        </h5>
                    </div>
                    <div class="zone-resultats-content">
                        <div id="resultats-content">
                            <div class="empty-state">
                                <div class="icon">📄</div>
                                <p>Aucun fichier uploadé</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Créer la DropZone après que le HTML soit inséré
    setTimeout(() => {
        if (dropzoneDocuments) {
            dropzoneDocuments.destroy();
        }
        
        dropzoneDocuments = config.createFactureDropzone('#facture-dropzone', {
            messages: {
                drop: '📁 Glissez vos factures ici',
                browse: 'ou cliquez pour parcourir',
                typeError: 'Seuls les PDF et images (JPG, PNG) sont acceptés',
                sizeError: 'Fichier trop volumineux (max 10MB)',
                maxFilesError: 'Maximum 10 fichiers autorisés'
            },
            previewSize: 'none',
            showPreview: false,
            onDrop: (files) => {
                console.log('📎 Fichiers déposés:', files);
                // AJOUTER les nouveaux fichiers aux existants
                const fichiersExistants = nouvelleFacture.documents || [];
                const nouveauxFichiers = Array.from(files);
                
                // Vérifier la limite
                if (fichiersExistants.length + nouveauxFichiers.length > 10) {
                    afficherErreur(`Maximum 10 fichiers. Vous avez déjà ${fichiersExistants.length} fichier(s).`);
                    return;
                }
                
                // Fusionner les fichiers
                nouvelleFacture.documents = [...fichiersExistants, ...nouveauxFichiers];
                
                // Afficher l'interface de sélection avec TOUS les fichiers
                afficherSelectionStatuts(nouvelleFacture.documents);
            },
            onRemove: (file, index) => {
                console.log('🗑️ Fichier retiré:', file.name);
                // Retirer le fichier et sa sélection
                nouvelleFacture.documents.splice(index, 1);
                nouvelleFacture.selections.splice(index, 1);
                
                // Retour à l'upload si plus de fichiers
                if (nouvelleFacture.documents.length === 0) {
                    afficherFormulaireUpload();
                } else {
                    // Réafficher avec les fichiers restants
                    afficherSelectionStatuts(nouvelleFacture.documents);
                }
            },
            onChange: (files) => {
                // Ne rien faire ici pour éviter les conflits
                // Tout est géré dans onDrop et onRemove
            }
        });
    }, 100);
}

// Exposer globalement
window.afficherFormulaireUpload = afficherFormulaireUpload;

// ========================================
// INTERFACE DE SÉLECTION DES STATUTS
// ========================================

function afficherSelectionStatuts(files) {
    const modalFooter = document.querySelector('#modalNouvelleFacture .modal-footer');
    
    // Initialiser les sélections (par défaut : à payer)
    nouvelleFacture.selections = files.map(() => 'deja_payee');
    
    // Mettre à jour le compteur
    const filesCount = document.getElementById('files-count');
    if (filesCount) {
        filesCount.style.display = 'inline-block';
        filesCount.textContent = files.length;
    }
    
    // Mettre à jour la zone de résultats
    const resultatsContent = document.getElementById('resultats-content');
    if (resultatsContent) {
        resultatsContent.innerHTML = `
            <!-- Section fichiers sélectionnés -->
            <div class="result-section">
                <h6>📁 Fichiers sélectionnés</h6>
                <div class="files-analysis-list">
                    ${files.map((file, index) => `
                        <div class="file-analysis-item">
                            <div class="file-icon">📄</div>
                            <div class="file-info">
                                <div class="file-name">${escapeHtml(file.name)}</div>
                                <div class="file-size">${formatFileSize(file.size)}</div>
                            </div>
                            <div class="status-options">
                                <label class="status-radio">
                                    <input type="radio" 
                                           name="status-${index}" 
                                           value="a_payer" 
                                           onchange="updateStatutFacture(${index}, 'a_payer')">
                                    <span class="status-label a-payer">💳 À payer</span>
                                </label>
                                <label class="status-radio">
                                    <input type="radio" 
                                           name="status-${index}" 
                                           value="deja_payee"
                                           checked
                                           onchange="updateStatutFacture(${index}, 'deja_payee')">
                                    <span class="status-label deja-payee">✅ Déjà payée</span>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Résumé de la sélection -->
            <div class="result-section">
                <h6>📊 Résumé de la sélection</h6>
                <div class="stats-grid">
                    <div class="stat-card a-payer">
                        <span class="label">À payer</span>
                        <span class="value" id="count-a-payer">0</span>
                        <span class="count">facture(s)</span>
                    </div>
                    <div class="stat-card deja-payee">
                        <span class="label">Déjà payées</span>
                        <span class="value" id="count-deja-payee">${files.length}</span>
                        <span class="count">facture(s)</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Mettre à jour le header
    const resultatsHeader = document.querySelector('.zone-resultats-header h5');
    if (resultatsHeader) {
        resultatsHeader.innerHTML = `
            📋 Sélection du statut des factures
            <span class="count">${files.length}</span>
        `;
    }
    
    // Boutons d'action
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button class="btn btn-ghost btn-pill" onclick="afficherFormulaireUpload()">
                ← Retour
            </button>
            <button id="btnAnalyserFactures" class="btn btn-primary btn-pill">
                🤖 Analyser les factures
            </button>
        `;
    }
    
    // Gérer le clic sur analyser
    const btnAnalyser = document.getElementById('btnAnalyserFactures');
    if (btnAnalyser) {
        btnAnalyser.onclick = analyserFactures;
    }
}

// Fonction globale pour mettre à jour le statut
window.updateStatutFacture = function(index, statut) {
    nouvelleFacture.selections[index] = statut;
    console.log(`Facture ${index} : ${statut}`);
    
    // Mettre à jour les compteurs
    const countAPayer = nouvelleFacture.selections.filter(s => s === 'a_payer').length;
    const countDejaPayee = nouvelleFacture.selections.filter(s => s === 'deja_payee').length;
    
    const countAPayerEl = document.getElementById('count-a-payer');
    const countDejaPayeeEl = document.getElementById('count-deja-payee');
    
    if (countAPayerEl) countAPayerEl.textContent = countAPayer;
    if (countDejaPayeeEl) countDejaPayeeEl.textContent = countDejaPayee;
};

// ========================================
// ANALYSE ET CRÉATION DES FACTURES
// ========================================

async function analyserFactures() {
    try {
        // Préparer le récapitulatif
        const countAPayer = nouvelleFacture.selections.filter(s => s === 'a_payer').length;
        const countDejaPayee = nouvelleFacture.selections.filter(s => s === 'deja_payee').length;
        
        // Créer le contenu HTML du récapitulatif
        const recapContent = `
            <div class="dialog-recap-factures">
                <div class="recap-section">
                    <h4>📋 Récapitulatif des factures à traiter</h4>
                    <div class="recap-stats">
                        <div class="stat-item a-payer">
                            <span class="stat-icon">💳</span>
                            <span class="stat-value">${countAPayer}</span>
                            <span class="stat-label">à payer</span>
                        </div>
                        <div class="stat-item deja-payee">
                            <span class="stat-icon">✅</span>
                            <span class="stat-value">${countDejaPayee}</span>
                            <span class="stat-label">déjà payée${countDejaPayee > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                
                <div class="recap-section">
                    <h5>Détail des fichiers :</h5>
                    <div class="recap-files-list">
                        ${nouvelleFacture.documents.map((file, index) => {
                            const statut = nouvelleFacture.selections[index];
                            const statusLabel = statut === 'a_payer' ? '💳 À payer' : '✅ Déjà payée';
                            const statusClass = statut === 'a_payer' ? 'a-payer' : 'deja-payee';
                            
                            return `
                                <div class="recap-file-item">
                                    <span class="file-icon">📄</span>
                                    <span class="file-name">${escapeHtml(file.name)}</span>
                                    <span class="file-status ${statusClass}">${statusLabel}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="recap-warning">
                    <span class="warning-icon">🤖</span>
                    <span class="warning-text">L'analyse IA va extraire automatiquement les informations des factures.</span>
                </div>
            </div>
        `;
        
        // Afficher la boîte de dialogue de confirmation
        const confirme = await config.Dialog.custom({
            type: 'confirm',
            title: 'Confirmer l\'analyse',
            message: recapContent,
            showCancel: true,
            confirmText: 'Lancer l\'analyse',
            cancelText: 'Annuler',
            confirmClass: 'primary'
        });
        
        // Si annulation, ne rien faire
        if (!confirme) {
            return;
        }
        
        // Si confirmation, continuer avec l'analyse
        const btnAnalyser = document.getElementById('btnAnalyserFactures');
        const texteOriginal = btnAnalyser.innerHTML;
        btnAnalyser.disabled = true;
        btnAnalyser.innerHTML = '⏳ Upload et analyse en cours...';
        
        // Afficher la zone de progression
        const resultatsContent = document.getElementById('resultats-content');
        if (resultatsContent) {
            resultatsContent.innerHTML = `
                <div class="analyse-progress">
                    <div class="progress-header">
                        <div class="icon">🤖</div>
                        <h6>Analyse en cours...</h6>
                    </div>
                    <div class="progress-list" id="progress-list">
                        <!-- Items de progression ajoutés dynamiquement -->
                    </div>
                    <div class="progress-summary" id="progress-summary" style="display: none;">
                        <div class="summary-stats">
                            <span class="success">✅ <span id="count-success">0</span> réussie(s)</span>
                            <span class="error">❌ <span id="count-error">0</span> erreur(s)</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        let compteurCreees = 0;
        let compteurErreurs = 0;
        const progressList = document.getElementById('progress-list');
        
        // Traiter chaque facture
        for (let i = 0; i < nouvelleFacture.documents.length; i++) {
            const file = nouvelleFacture.documents[i];
            const statut = nouvelleFacture.selections[i];
            
            // Ajouter l'item de progression
            if (progressList) {
                progressList.innerHTML += `
                    <div class="progress-item" id="progress-${i}">
                        <div class="progress-icon">⏳</div>
                        <div class="progress-info">
                            <div class="progress-name">${escapeHtml(file.name)}</div>
                            <div class="progress-status">Upload en cours...</div>
                        </div>
                    </div>
                `;
            }
            
            try {
                console.log(`📤 Traitement facture ${i + 1}/${nouvelleFacture.documents.length}`);
                
                // 1. Upload du document
                const uploadResult = await uploadService.uploadFactureDocument(file);
                
                // Mettre à jour le statut
                updateProgressItem(i, '📤', 'Création de la facture...');
                
                // 2. Créer la facture dans Firestore
                const factureData = {
                    documents: [uploadResult],
                    aPayer: statut === 'a_payer',
                    dejaPayee: statut === 'deja_payee'
                };
                
                const factureId = await firestoreService.creerFacture(factureData);
                
                console.log(`✅ Facture créée: ${factureId} (${statut})`);
                compteurCreees++;
                
                // Mettre à jour le statut de succès
                updateProgressItem(i, '✅', 'Facture créée avec succès', true);
                
                // 3. Lancer l'analyse IA en arrière-plan
                analyserAvecIA(factureId, uploadResult.url);
                
            } catch (error) {
                console.error(`❌ Erreur traitement ${file.name}:`, error);
                compteurErreurs++;
                updateProgressItem(i, '❌', 'Erreur lors du traitement', false);
            }
            
            // Mettre à jour le résumé
            updateProgressSummary(compteurCreees, compteurErreurs);
        }
        
        // Afficher le résultat
        if (compteurCreees > 0) {
            afficherSucces(`${compteurCreees} facture(s) créée(s) avec succès !`);
        }
        
        if (compteurErreurs > 0) {
            afficherErreur(`${compteurErreurs} erreur(s) lors du traitement`);
        }
        
        // Fermer la modal après succès
        if (compteurCreees > 0) {
            setTimeout(() => {
                window.modalManager.close('modalNouvelleFacture');
                resetNouvelleFacture();
                
                // Recharger la liste
                if (window.refreshFacturesList) {
                    window.refreshFacturesList();
                }
            }, 2000);
        } else {
            // Réactiver le bouton en cas d'erreur
            btnAnalyser.disabled = false;
            btnAnalyser.innerHTML = texteOriginal;
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error);
        afficherErreur('Une erreur est survenue');
    }
}

// Fonctions helper pour la progression
function updateProgressItem(index, icon, status, success = null) {
    const item = document.getElementById(`progress-${index}`);
    if (item) {
        const iconEl = item.querySelector('.progress-icon');
        const statusEl = item.querySelector('.progress-status');
        
        if (iconEl) iconEl.textContent = icon;
        if (statusEl) statusEl.textContent = status;
        
        if (success !== null) {
            item.classList.add(success ? 'success' : 'error');
        }
    }
}

function updateProgressSummary(success, errors) {
    const summary = document.getElementById('progress-summary');
    const countSuccess = document.getElementById('count-success');
    const countError = document.getElementById('count-error');
    
    if (summary) summary.style.display = 'block';
    if (countSuccess) countSuccess.textContent = success;
    if (countError) countError.textContent = errors;
}

// ========================================
// ANALYSE IA EN ARRIÈRE-PLAN
// ========================================

async function analyserAvecIA(factureId, documentUrl) {
    try {
        console.log('🤖 Lancement analyse IA pour facture:', factureId);
        
        // Import dynamique du service OpenAI
        const { default: OpenAIService } = await import('./factures-fournisseurs.openai.service.js');
        
        // Analyser le document
        const resultIA = await OpenAIService.analyserDocumentExistant(factureId);
        
        console.log('✅ Analyse IA terminée:', resultIA);
        
        // Notification discrète
        config.notify.info('Analyse IA terminée pour une facture');
        
    } catch (error) {
        console.error('❌ Erreur analyse IA:', error);
        // Pas de notification d'erreur pour ne pas polluer
    }
}

// ========================================
// RESET DU FORMULAIRE
// ========================================

function resetNouvelleFacture() {
    nouvelleFacture = {
        documents: [],
        selections: []
    };
    
    // Détruire le composant s'il existe
    if (dropzoneDocuments) {
        dropzoneDocuments.destroy();
        dropzoneDocuments = null;
    }
}

// ========================================
// HELPERS
// ========================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// EXPORTS GLOBAUX POUR COMPATIBILITÉ
// ========================================

// Fonction exportée pour le refresh après création
window.refreshFacturesList = async () => {
    if (window.chargerDonnees) {
        await window.chargerDonnees();
    }
};

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création initiale
   - Interface de sélection AVANT l'IA
   - Choix : à payer / déjà payée
   - Analyse IA en arrière-plan
   - Création avec le bon statut initial
   
   [03/02/2025] - Refonte style moderne
   - Adaptation du style operations-bancaires
   - Structure en 3 zones
   - Affichage progression moderne
   
   NOTES:
   - Workflow : Upload → Sélection → Création → IA
   - L'IA enrichit les données après création
   - Statut défini dès le départ
   ======================================== */
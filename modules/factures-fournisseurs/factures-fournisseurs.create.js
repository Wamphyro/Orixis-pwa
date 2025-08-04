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
    
    // Créer la structure avec la dropzone
    const modalBody = document.querySelector('#modalNouvelleFacture .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="nouvelle-facture-wrapper">
                <!-- Zone 1 : Description -->
                <div class="zone-description-ia">
                    <div class="content">
                        <div class="icon-wrapper">
                            <span class="icon">📑</span>
                        </div>
                        <div class="text">
                            <h4>Upload de factures fournisseurs</h4>
                            <p>Déposez vos factures (Free, EDF, etc.). Vous pourrez ensuite indiquer lesquelles sont à payer ou déjà payées.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 2 : Dropzone -->
                <div class="zone-dropzone">
                    <div id="facture-dropzone"></div>
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
                nouvelleFacture.documents = files;
                // Afficher l'interface de sélection
                afficherSelectionStatuts(files);
            },
            onRemove: (file, index) => {
                console.log('🗑️ Fichier retiré:', file.name);
                // Retour à l'upload si plus de fichiers
                if (nouvelleFacture.documents.length === 0) {
                    afficherFormulaireUpload();
                }
            },
            onChange: (files) => {
                nouvelleFacture.documents = files;
                if (files.length === 0) {
                    afficherFormulaireUpload();
                }
            }
        });
    }, 100);
}

// ========================================
// INTERFACE DE SÉLECTION DES STATUTS
// ========================================

function afficherSelectionStatuts(files) {
    const modalBody = document.querySelector('#modalNouvelleFacture .modal-body');
    const modalFooter = document.querySelector('#modalNouvelleFacture .modal-footer');
    
    if (!modalBody || !modalFooter) return;
    
    // Initialiser les sélections (par défaut : à payer)
    nouvelleFacture.selections = files.map(() => 'a_payer');
    
    // HTML de l'interface
    modalBody.innerHTML = `
        <div class="factures-selection">
            <h4>📋 Sélectionnez le statut de chaque facture</h4>
            <div class="factures-list">
                ${files.map((file, index) => `
                    <div class="facture-item">
                        <div>
                            📄 ${file.name}
                            <span class="file-size">(${formatFileSize(file.size)})</span>
                        </div>
                        <div class="status-options">
                            <label>
                                <input type="radio" 
                                       name="status-${index}" 
                                       value="a_payer" 
                                       checked
                                       onchange="updateStatutFacture(${index}, 'a_payer')">
                                💳 À payer
                            </label>
                            <label>
                                <input type="radio" 
                                       name="status-${index}" 
                                       value="deja_payee"
                                       onchange="updateStatutFacture(${index}, 'deja_payee')">
                                ✅ Déjà payée
                            </label>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Boutons d'action
    modalFooter.innerHTML = `
        <button class="btn btn-ghost btn-pill" onclick="afficherFormulaireUpload()">
            ← Retour
        </button>
        <button id="btnAnalyserFactures" class="btn btn-primary btn-pill">
            🤖 Analyser les factures
        </button>
    `;
    
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
};

// ========================================
// ANALYSE ET CRÉATION DES FACTURES
// ========================================

async function analyserFactures() {
    try {
        const btnAnalyser = document.getElementById('btnAnalyserFactures');
        const texteOriginal = btnAnalyser.innerHTML;
        btnAnalyser.disabled = true;
        btnAnalyser.innerHTML = '⏳ Upload et analyse en cours...';
        
        let compteurCreees = 0;
        let compteurErreurs = 0;
        
        // Traiter chaque facture
        for (let i = 0; i < nouvelleFacture.documents.length; i++) {
            const file = nouvelleFacture.documents[i];
            const statut = nouvelleFacture.selections[i];
            
            try {
                console.log(`📤 Traitement facture ${i + 1}/${nouvelleFacture.documents.length}`);
                
                // 1. Upload du document
                const uploadResult = await uploadService.uploadFactureDocument(file);
                
                // 2. Créer la facture dans Firestore
                const factureData = {
                    documents: [uploadResult],
                    aPayer: statut === 'a_payer',
                    dejaPayee: statut === 'deja_payee'
                };
                
                const factureId = await firestoreService.creerFacture(factureData);
                
                console.log(`✅ Facture créée: ${factureId} (${statut})`);
                compteurCreees++;
                
                // 3. Lancer l'analyse IA en arrière-plan
                analyserAvecIA(factureId, uploadResult.url);
                
            } catch (error) {
                console.error(`❌ Erreur traitement ${file.name}:`, error);
                compteurErreurs++;
            }
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

// ========================================
// EXPORTS GLOBAUX POUR COMPATIBILITÉ
// ========================================

// Fonction exportée pour le refresh après création
window.refreshFacturesList = async () => {
    if (window.chargerDonnees) {
        await window.chargerDonnees();
    }
};

// Reset global
window.afficherFormulaireUpload = afficherFormulaireUpload;

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création initiale
   - Interface de sélection AVANT l'IA
   - Choix : à payer / déjà payée
   - Analyse IA en arrière-plan
   - Création avec le bon statut initial
   
   NOTES:
   - Workflow : Upload → Sélection → Création → IA
   - L'IA enrichit les données après création
   - Statut défini dès le départ
   ======================================== */
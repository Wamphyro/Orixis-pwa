// ========================================
// DECOMPTE-SECU.CREATE.JS - Gestion de la création de décomptes
// Chemin: modules/decompte-secu/decompte-secu.create.js
//
// DESCRIPTION:
// Module de création de décomptes sécurité sociale
// Upload direct des documents avec analyse IA automatique
//
// ARCHITECTURE:
// - Upload via DropZone
// - Analyse automatique par IA
// - Pas de saisie manuelle nécessaire
//
// DÉPENDANCES:
// - config pour les factories de composants
// - uploadService pour l'upload des fichiers
// - firestoreService pour la création du décompte
// ========================================

import config from './decompte-secu.config.js';
import { afficherSucces, afficherErreur } from './decompte-secu.main.js';
import uploadService from './decompte-secu.upload.service.js';
import firestoreService from './decompte-secu.firestore.service.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let nouveauDecompteSecu = {
    documents: []  // Seulement les documents uploadés
};

// Instance du composant
let dropzoneDocuments = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationDecompteSecu() {
    console.log('Module création décompte sécu initialisé');
    
    // Préparer les listeners futurs
    window.resetNouveauDecompteSecu = resetNouveauDecompteSecu;
}

// ========================================
// OUVERTURE MODAL NOUVEAU DÉCOMPTE
// ========================================

export function ouvrirNouveauDecompteSecu() {
    console.log('🔵 === DEBUT ouvrirNouveauDecompteSecu ===');
    
    try {
        // Reset d'abord
        resetNouveauDecompteSecu();
        
        // Attendre un peu pour que le DOM se stabilise
        setTimeout(() => {
            console.log('⏱️ Affichage après timeout');
            afficherPlaceholder();
            
            // Ouvrir la modal
            console.log('🚀 Tentative ouverture modal');
            window.modalManager.open('modalNouveauDecompteSecu');
            console.log('✅ Modal devrait être ouvert');
        }, 100);
        
    } catch (error) {
        console.error('❌ ERREUR dans ouvrirNouveauDecompteSecu:', error);
    }
    
    console.log('🔵 === FIN ouvrirNouveauDecompteSecu ===');
}

// ========================================
// AFFICHAGE PLACEHOLDER
// ========================================

function afficherPlaceholder() {
    // Vérifier si le contenu est déjà affiché
    const existingContent = document.querySelector('.nouveau-decompte-secu-wrapper');
    if (existingContent) {
        console.log('⚠️ Contenu déjà affiché, pas de recréation');
        return;
    }
    
    // Mettre à jour le footer avec le bouton
    const modalFooter = document.querySelector('#modalNouveauDecompteSecu .modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button id="btnEnregistrerDecompteSecu" class="btn btn-primary btn-pill" disabled>
                💾 Enregistrer et analyser
            </button>
        `;
    }
    
    // Créer la structure avec les 3 zones
    const modalBody = document.querySelector('#modalNouveauDecompteSecu .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="nouveau-decompte-secu-wrapper">
                <!-- Zone 1 : Description IA -->
                <div class="zone-description-ia">
                    <div class="content">
                        <div class="icon-wrapper">
                            <span class="icon">🤖</span>
                        </div>
                        <div class="text">
                            <h4>Intelligence artificielle spécialisée Sécurité Sociale</h4>
                            <p>Notre IA analyse automatiquement vos décomptes CPAM et extrait : bénéficiaire, NSS, actes médicaux, taux de remboursement, participations forfaitaires... Aucune saisie manuelle nécessaire !</p>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 2 : Dropzone -->
                <div class="zone-dropzone">
                    <div id="decompte-secu-dropzone"></div>
                </div>
                
                <!-- Zone 3 : Liste des fichiers -->
                <div class="zone-fichiers">
                    <div class="zone-fichiers-header">
                        <h5>
                            📁 Documents ajoutés
                            <span class="count" id="files-count-secu">0</span>
                        </h5>
                    </div>
                    <div class="zone-fichiers-content">
                        <div id="files-list-secu">
                            <div class="empty-state">
                                <div class="icon">📄</div>
                                <p>Aucun document ajouté</p>
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
        
        dropzoneDocuments = config.createDecompteSecuDropzone('#decompte-secu-dropzone', {
            messages: {
                drop: '📤 Glissez vos décomptes CPAM ici',
                browse: 'ou cliquez pour parcourir',
                typeError: 'Seuls les PDF et images (JPG, PNG) sont acceptés',
                sizeError: 'Fichier trop volumineux (max 10MB)',
                maxFilesError: 'Maximum 10 fichiers autorisés'
            },
            previewSize: 'none',
            showPreview: false,
            onDrop: (files) => {
                console.log('📎 Fichiers déposés:', files);
                nouveauDecompteSecu.documents = files;
                updateFilesList(files);
                updateButton(files);
                config.notify.success(`${files.length} fichier(s) ajouté(s)`);
            },
            onRemove: (file, index) => {
                console.log('🗑️ Fichier retiré:', file.name);
                updateFilesList(nouveauDecompteSecu.documents);
                updateButton(nouveauDecompteSecu.documents);
            },
            onChange: (files) => {
                nouveauDecompteSecu.documents = files;
                updateFilesList(files);
                updateButton(files);
            }
        });
        
        // Gérer le clic sur enregistrer
        const btnEnregistrer = document.getElementById('btnEnregistrerDecompteSecu');
        if (btnEnregistrer) {
            btnEnregistrer.onclick = enregistrerDecompteSecu;
        }
    }, 100);
}

// Fonction pour mettre à jour la liste des fichiers
function updateFilesList(files) {
    const filesList = document.getElementById('files-list-secu');
    const filesCount = document.getElementById('files-count-secu');
    
    if (!filesList) return;
    
    // Mettre à jour le compteur
    if (filesCount) {
        filesCount.textContent = files.length;
    }
    
    if (files.length === 0) {
        filesList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📄</div>
                <p>Aucun document ajouté</p>
            </div>
        `;
        return;
    }
    
    const filesHtml = files.map((file, index) => {
        const fileIcon = file.type === 'application/pdf' ? '📑' : '🖼️';
        const fileSize = formatFileSize(file.size);
        
        return `
            <div class="file-item">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
                <button class="file-remove" onclick="removeFileSecu(${index})" title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
    
    filesList.innerHTML = `<div class="files-list">${filesHtml}</div>`;
}

// Fonction pour formater la taille du fichier
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Fonction pour mettre à jour le bouton
function updateButton(files) {
    const btnEnregistrer = document.getElementById('btnEnregistrerDecompteSecu');
    if (btnEnregistrer) {
        btnEnregistrer.disabled = files.length === 0;
    }
}

// Fonction globale pour retirer un fichier
window.removeFileSecu = function(index) {
    if (dropzoneDocuments) {
        dropzoneDocuments.removeFile(index);
    }
};

// ========================================
// RESET DU FORMULAIRE
// ========================================

function resetNouveauDecompteSecu() {
    console.log('🔄 Reset nouveau décompte sécu...');
    
    nouveauDecompteSecu = {
        documents: []
    };
    
    // Détruire le composant s'il existe
    if (dropzoneDocuments) {
        console.log('🧹 Destruction dropzone existante');
        dropzoneDocuments.destroy();
        dropzoneDocuments = null;
    }
    
    // Vider le contenu du modal
    const modalBody = document.querySelector('#modalNouveauDecompteSecu .modal-body');
    if (modalBody) {
        console.log('🧹 Nettoyage modal body');
        modalBody.innerHTML = '';
    }
}

// ========================================
// ENREGISTREMENT DU DÉCOMPTE
// ========================================

async function enregistrerDecompteSecu() {
    try {
        // Vérifier qu'il y a des documents
        if (!nouveauDecompteSecu.documents || nouveauDecompteSecu.documents.length === 0) {
            afficherErreur('Veuillez ajouter au moins un document');
            return;
        }

        // Désactiver le bouton et afficher un loader
        const btnEnregistrer = document.getElementById('btnEnregistrerDecompteSecu');
        const texteOriginal = btnEnregistrer.innerHTML;
        btnEnregistrer.disabled = true;
        btnEnregistrer.innerHTML = '⏳ Upload en cours...';
        
        try {
            // Upload des documents
            console.log(`📤 Upload de ${nouveauDecompteSecu.documents.length} fichiers`);
            
            const resultats = await uploadService.uploadMultipleDocuments(
                nouveauDecompteSecu.documents
            );
            
            // Vérifier les résultats
            if (resultats.erreurs.length > 0) {
                console.error('⚠️ Erreurs upload:', resultats.erreurs);
                resultats.erreurs.forEach(err => {
                    afficherErreur(`${err.fichier}: ${err.erreur}`);
                });
            }
            
            if (resultats.reussis.length > 0) {
                afficherSucces(`${resultats.reussis.length} document(s) uploadé(s) avec succès`);
                
                console.log('📎 Documents uploadés:', resultats.reussis);
                
                try {
                    // Créer le décompte dans Firestore
                    btnEnregistrer.innerHTML = '💾 Enregistrement...';
                    
                    const decompteId = await firestoreService.creerDecompteSecu({
                        documents: resultats.reussis
                    });
                    
                    afficherSucces('Décompte sécurité sociale créé avec succès !');
                    console.log('✅ Décompte créé avec ID:', decompteId);
                    
                    // Fermer la modal après succès
                    setTimeout(() => {
                        window.modalManager.close('modalNouveauDecompteSecu');
                        resetNouveauDecompteSecu();
                        
                        // Optionnel : Recharger la liste
                        if (window.refreshDecomptesSecuList) {
                            window.refreshDecomptesSecuList();
                        }
                    }, 1500);
                    
                } catch (error) {
                    console.error('❌ Erreur création décompte:', error);
                    afficherErreur('Erreur lors de la création du décompte');
                    
                    // Réactiver le bouton
                    btnEnregistrer.disabled = false;
                    btnEnregistrer.innerHTML = texteOriginal;
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur upload:', error);
            afficherErreur(`Erreur lors de l'upload: ${error.message}`);
            
            // Réactiver le bouton
            btnEnregistrer.disabled = false;
            btnEnregistrer.innerHTML = texteOriginal;
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error);
        afficherErreur('Une erreur est survenue');
    }
}

// ========================================
// EXPORTS GLOBAUX POUR COMPATIBILITÉ
// ========================================

// Fonction exportée pour le refresh après création
window.refreshDecomptesSecuList = async () => {
    if (window.chargerDonnees) {
        await window.chargerDonnees();
    }
};

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création initiale
   - Adaptation depuis decompte-mutuelle.create.js
   - Texte adapté pour sécurité sociale
   - IDs uniques pour éviter conflits (suffixe -secu)
   - Workflow : Upload → IA → Validation
   
   NOTES:
   - CSS dans decompte-secu.css uniquement
   - Workflow identique aux mutuelles
   - Plus de saisie manuelle
   ======================================== */
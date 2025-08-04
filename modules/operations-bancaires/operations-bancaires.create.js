// ========================================
// DECOMPTE-MUTUELLE.CREATE.JS - Gestion de la création de décomptes
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.create.js
//
// DESCRIPTION:
// Module de création de décomptes mutuelles
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

import config from './decompte-mutuelle.config.js';
import { afficherSucces, afficherErreur } from './decompte-mutuelle.main.js';
import uploadService from './decompte-mutuelle.upload.service.js';
import firestoreService from './decompte-mutuelle.firestore.service.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let nouveauDecompte = {
    documents: []  // Seulement les documents uploadés
};

// Instance du composant
let dropzoneDocuments = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationDecompte() {
    console.log('Module création décompte initialisé');
    
    // Préparer les listeners futurs
    window.resetNouveauDecompte = resetNouveauDecompte;
}

// ========================================
// OUVERTURE MODAL NOUVEAU DÉCOMPTE
// ========================================

export function ouvrirNouveauDecompte() {
    resetNouveauDecompte();
    
    // Afficher le formulaire
    afficherPlaceholder();
    
    // Ouvrir la modal
    window.modalManager.open('modalNouveauDecompte');
}

// ========================================
// AFFICHAGE PLACEHOLDER
// ========================================

function afficherPlaceholder() {
    // Mettre à jour le footer avec le bouton
    const modalFooter = document.querySelector('#modalNouveauDecompte .modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button id="btnEnregistrerDecompte" class="btn btn-primary btn-pill" disabled>
                💾 Enregistrer et analyser
            </button>
        `;
    }
    
    // Créer la structure avec les 3 zones
    const modalBody = document.querySelector('#modalNouveauDecompte .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="nouveau-decompte-wrapper">
                <!-- Zone 1 : Description IA -->
                <div class="zone-description-ia">
                    <div class="content">
                        <div class="icon-wrapper">
                            <span class="icon">🤖</span>
                        </div>
                        <div class="text">
                            <h4>Intelligence artificielle intégrée</h4>
                            <p>Notre IA analyse automatiquement vos documents et extrait toutes les informations : client, NSS, mutuelle, montants... Aucune saisie manuelle nécessaire !</p>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 2 : Dropzone -->
                <div class="zone-dropzone">
                    <div id="decompte-dropzone"></div>
                </div>
                
                <!-- Zone 3 : Liste des fichiers -->
                <div class="zone-fichiers">
                    <div class="zone-fichiers-header">
                        <h5>
                            📁 Documents ajoutés
                            <span class="count" id="files-count">0</span>
                        </h5>
                    </div>
                    <div class="zone-fichiers-content">
                        <div id="files-list">
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
        
        dropzoneDocuments = config.createDecompteDropzone('#decompte-dropzone', {
            messages: {
                drop: '📤 Glissez vos décomptes mutuelles ici',
                browse: 'ou cliquez pour parcourir',
                typeError: 'Seuls les PDF et images (JPG, PNG) sont acceptés',
                sizeError: 'Fichier trop volumineux (max 10MB)',
                maxFilesError: 'Maximum 10 fichiers autorisés'
            },
            previewSize: 'none',
            showPreview: false,
            onDrop: (files) => {
                console.log('📎 Fichiers déposés:', files);
                nouveauDecompte.documents = files;
                updateFilesList(files);
                updateButton(files);
                config.notify.success(`${files.length} fichier(s) ajouté(s)`);
            },
            onRemove: (file, index) => {
                console.log('🗑️ Fichier retiré:', file.name);
                updateFilesList(nouveauDecompte.documents);
                updateButton(nouveauDecompte.documents);
            },
            onChange: (files) => {
                nouveauDecompte.documents = files;
                updateFilesList(files);
                updateButton(files);
            }
        });
        
        // Gérer le clic sur enregistrer
        const btnEnregistrer = document.getElementById('btnEnregistrerDecompte');
        if (btnEnregistrer) {
            btnEnregistrer.onclick = enregistrerDecompte;
        }
    }, 100);
}

// Fonction pour mettre à jour la liste des fichiers
function updateFilesList(files) {
    const filesList = document.getElementById('files-list');
    const filesCount = document.getElementById('files-count');
    
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
                <button class="file-remove" onclick="removeFile(${index})" title="Supprimer">
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
    const btnEnregistrer = document.getElementById('btnEnregistrerDecompte');
    if (btnEnregistrer) {
        btnEnregistrer.disabled = files.length === 0;
    }
}

// Fonction globale pour retirer un fichier
window.removeFile = function(index) {
    if (dropzoneDocuments) {
        dropzoneDocuments.removeFile(index);
    }
};

// ========================================
// RESET DU FORMULAIRE
// ========================================

function resetNouveauDecompte() {
    nouveauDecompte = {
        documents: []  // Seulement les fichiers
    };
    
    // Détruire le composant s'il existe
    if (dropzoneDocuments) {
        dropzoneDocuments.destroy();
        dropzoneDocuments = null;
    }
}

// ========================================
// ENREGISTREMENT DU DÉCOMPTE
// ========================================

async function enregistrerDecompte() {
    try {
        // Vérifier qu'il y a des documents
        if (!nouveauDecompte.documents || nouveauDecompte.documents.length === 0) {
            afficherErreur('Veuillez ajouter au moins un document');
            return;
        }

        // Désactiver le bouton et afficher un loader
        const btnEnregistrer = document.getElementById('btnEnregistrerDecompte');
        const texteOriginal = btnEnregistrer.innerHTML;
        btnEnregistrer.disabled = true;
        btnEnregistrer.innerHTML = '⏳ Upload en cours...';
        
        try {
            // Upload des documents
            console.log(`📤 Upload de ${nouveauDecompte.documents.length} fichiers`);
            
            const resultats = await uploadService.uploadMultipleDocuments(
                nouveauDecompte.documents
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
                    
                    const decompteId = await firestoreService.creerDecompte({
                        documents: resultats.reussis
                    });
                    
                    afficherSucces('Décompte créé avec succès !');
                    console.log('✅ Décompte créé avec ID:', decompteId);
                    
                    // Fermer la modal après succès
                    setTimeout(() => {
                        window.modalManager.close('modalNouveauDecompte');
                        resetNouveauDecompte();
                        
                        // Optionnel : Recharger la liste
                        if (window.refreshDecomptesList) {
                            window.refreshDecomptesList();
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
window.refreshDecomptesList = async () => {
    if (window.chargerDonnees) {
        await window.chargerDonnees();
    }
};

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [02/02/2025] - Création initiale
   [03/02/2025] - Simplification du modal
   [03/02/2025] - Déplacement du CSS vers decompte-mutuelle.css
   
   NOTES:
   - CSS dans decompte-mutuelle.css uniquement
   - Workflow : Upload → IA → Validation
   - Plus de saisie manuelle
   ======================================== */
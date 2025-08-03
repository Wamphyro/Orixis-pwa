// ========================================
// DECOMPTE-MUTUELLE.CREATE.JS - Gestion de la création de décomptes
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.create.js
//
// DESCRIPTION:
// Module de création de décomptes mutuelles
// Pour l'instant : structure vide préparée pour implémentation future
//
// ARCHITECTURE:
// - Préparé pour SearchDropdown (clients)
// - Préparé pour DropdownList (mutuelles, prestataires)
// - Structure pour saisie des montants
// - Workflow de création en étapes si nécessaire
//
// DÉPENDANCES FUTURES:
// - ClientsService pour la recherche de clients
// - DecomptesMutuellesService pour la création
// - config pour les factories de composants
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
    console.log('Module création décompte initialisé (vide pour l\'instant)');
    
    // Préparer les listeners futurs
    window.resetNouveauDecompte = resetNouveauDecompte;
}

// ========================================
// OUVERTURE MODAL NOUVEAU DÉCOMPTE
// ========================================

export function ouvrirNouveauDecompte() {
    resetNouveauDecompte();
    
    // Pour l'instant, afficher juste le placeholder
    afficherPlaceholder();
    
    // Ouvrir la modal
    window.modalManager.open('modalNouveauDecompte');
}

// ========================================
// AFFICHAGE PLACEHOLDER
// ========================================

function afficherPlaceholder() {
    const modalBody = document.querySelector('#modalNouveauDecompte .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="nouveau-decompte-form">
                <!-- Zone de dépôt des documents -->
                <div class="form-section">
                    <h4>📄 Documents du décompte</h4>
                    <p class="form-section-help">Déposez ici les décomptes mutuelles (PDF, JPG, PNG)</p>
                    <p class="form-section-info">
                        <small>💡 L'IA extraira automatiquement toutes les informations du document (client, mutuelle, montants...)</small>
                    </p>
                    <div id="decompte-dropzone"></div>
                </div>
                
                <!-- Boutons d'action -->
                <div class="form-actions">
                    <button class="btn btn-ghost btn-pill" onclick="window.modalManager.close('modalNouveauDecompte')">
                        Annuler
                    </button>
                    <button id="btnEnregistrerDecompte" class="btn btn-primary btn-pill" disabled>
                        💾 Enregistrer et analyser
                    </button>
                </div>
            </div>
        `;
        
        // Créer la DropZone après que le HTML soit inséré
        setTimeout(() => {
            if (dropzoneDocuments) {
                dropzoneDocuments.destroy();
            }
            
            dropzoneDocuments = config.createDecompteDropzone('#decompte-dropzone', {
                onDrop: (files) => {
                    console.log('📎 Fichiers déposés:', files);
                    nouveauDecompte.documents = files;
                    
                    // Activer le bouton si au moins un fichier
                    const btnEnregistrer = document.getElementById('btnEnregistrerDecompte');
                    if (btnEnregistrer && files.length > 0) {
                        btnEnregistrer.disabled = false;
                    }
                    
                    // Afficher un message temporaire
                    config.notify.success(`${files.length} fichier(s) ajouté(s)`);
                },
                onRemove: (file, index) => {
                    console.log('🗑️ Fichier retiré:', file.name);
                },
                onChange: (files) => {
                    nouveauDecompte.documents = files;
                }
            });
            
            // Gérer le clic sur enregistrer
            const btnEnregistrer = document.getElementById('btnEnregistrerDecompte');
            if (btnEnregistrer) {
                btnEnregistrer.onclick = enregistrerDecompte;
            }
        }, 100);
    }
}

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
   
   [02/02/2025] - Création initiale (structure vide)
   [03/02/2025] - Simplification du modal
   - Suppression des champs client/mutuelle/montant
   - Upload direct des documents uniquement
   - L'IA extrait toutes les informations
   
   NOTES:
   - Workflow simplifié : Upload → IA → Validation
   - Plus besoin de saisie manuelle
   ======================================== */
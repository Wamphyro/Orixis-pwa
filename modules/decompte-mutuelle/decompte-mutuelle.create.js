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

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let nouveauDecompte = {
    client: null,
    mutuelle: '',
    prestataireTP: '',
    montantRemboursementClient: 0,
    typeDecompte: 'individuel',
    nombreClients: 1
};

// Instances des composants
let dropzoneDocuments = null;
let clientSearchDropdown = null;
let dropdownMutuelle = null;
let dropdownPrestataire = null;

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
                    <div id="decompte-dropzone"></div>
                </div>
                
                <!-- Section client (à venir) -->
                <div class="form-section disabled">
                    <h4>👤 Sélection du client</h4>
                    <p class="form-section-help">Recherche et sélection du client (bientôt disponible)</p>
                    <div class="placeholder-box">
                        <span>🔍 SearchDropdown à implémenter</span>
                    </div>
                </div>
                
                <!-- Section mutuelle et montants (à venir) -->
                <div class="form-section disabled">
                    <h4>🏥 Mutuelle et montants</h4>
                    <p class="form-section-help">Sélection de la mutuelle et saisie des montants (bientôt disponible)</p>
                    <div class="placeholder-box">
                        <span>📝 Formulaire à implémenter</span>
                    </div>
                </div>
                
                <!-- Boutons d'action -->
                <div class="form-actions">
                    <button class="btn btn-ghost btn-pill" onclick="window.modalManager.close('modalNouveauDecompte')">
                        Annuler
                    </button>
                    <button id="btnEnregistrerDecompte" class="btn btn-primary btn-pill" disabled>
                        💾 Enregistrer
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
        client: null,
        mutuelle: '',
        prestataireTP: '',
        montantRemboursementClient: 0,
        typeDecompte: 'individuel',
        nombreClients: 1,
        documents: []  // Ajout pour stocker les fichiers
    };
    
    // Détruire les composants s'ils existent
    if (dropzoneDocuments) {
        dropzoneDocuments.destroy();
        dropzoneDocuments = null;
    }
    if (clientSearchDropdown) {
        clientSearchDropdown.destroy();
        clientSearchDropdown = null;
    }
    if (dropdownMutuelle) {
        dropdownMutuelle.destroy();
        dropdownMutuelle = null;
    }
    if (dropdownPrestataire) {
        dropdownPrestataire.destroy();
        dropdownPrestataire = null;
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
        
        // Récupérer le magasin de l'utilisateur
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        const magasin = auth.magasin || auth.collaborateur?.magasin || '9XXX';
        
        // Désactiver le bouton et afficher un loader
        const btnEnregistrer = document.getElementById('btnEnregistrerDecompte');
        const texteOriginal = btnEnregistrer.innerHTML;
        btnEnregistrer.disabled = true;
        btnEnregistrer.innerHTML = '⏳ Upload en cours...';
        
        try {
            // Upload des documents
            console.log(`📤 Upload de ${nouveauDecompte.documents.length} fichiers vers le magasin ${magasin}`);
            
            const resultats = await uploadService.uploadMultipleDocuments(
                nouveauDecompte.documents,
                magasin
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
                
                // Pour l'instant, on affiche juste les URLs
                console.log('📎 Documents uploadés:', resultats.reussis);
                
                // TODO: Créer le décompte dans Firestore
                // const decompteId = await DecomptesMutuellesService.creerDecompte({
                //     ...nouveauDecompte,
                //     documents: resultats.reussis,
                //     magasin: magasin
                // });
                
                // Fermer la modal
                setTimeout(() => {
                    window.modalManager.close('modalNouveauDecompte');
                    resetNouveauDecompte();
                }, 2000);
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
// FUTURES FONCTIONS DE CRÉATION
// ========================================

// Structure préparée pour la recherche client
async function initClientSearch() {
    // TODO: Implémenter avec SearchDropdown
    /*
    clientSearchDropdown = config.createSearchDropdown('.client-search', {
        placeholder: 'Rechercher un client (nom, NSS...)',
        onSearch: async (query) => {
            // Recherche dans ClientsService
        },
        onSelect: (client) => {
            selectionnerClient(client);
        },
        renderItem: (client) => {
            return `
                <strong>${client.prenom} ${client.nom}</strong>
                <small>NSS: ${client.nss || 'Non renseigné'}</small>
            `;
        }
    });
    */
}

// Structure préparée pour la sélection mutuelle
async function initMutuelleDropdown() {
    // TODO: Implémenter avec DropdownList
    /*
    const mutuelles = getListeMutuelles();
    
    dropdownMutuelle = config.createDropdown('#mutuelleSelect', {
        placeholder: '-- Sélectionner une mutuelle --',
        searchable: true,
        options: mutuelles.map(m => ({
            value: m,
            label: m
        })),
        onChange: (value) => {
            nouveauDecompte.mutuelle = value;
        }
    });
    */
}

// Structure préparée pour la validation
async function validerNouveauDecompte() {
    // TODO: Implémenter la validation et création
    /*
    try {
        // Validation des données
        if (!nouveauDecompte.client) {
            throw new Error('Client requis');
        }
        
        // Création via service
        const decompteId = await DecomptesMutuellesService.creerDecompte(nouveauDecompte);
        
        // Fermer modal et rafraîchir
        window.modalManager.close('modalNouveauDecompte');
        await chargerDonnees();
        
        afficherSucces('Décompte créé avec succès');
        
    } catch (error) {
        afficherErreur(error.message);
    }
    */
}

// ========================================
// EXPORTS GLOBAUX POUR COMPATIBILITÉ
// ========================================

// Ces fonctions seront appelées depuis le HTML quand l'implémentation sera prête
window.validerNouveauDecompte = () => {
    console.log('Validation décompte - À implémenter');
};

window.changerTypeDecompte = (type) => {
    console.log('Changement type décompte:', type, '- À implémenter');
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [02/02/2025] - Création initiale (structure vide)
   - Structure préparée pour implémentation future
   - Placeholder informatif pour l'utilisateur
   - Architecture prête pour SearchDropdown et DropdownList
   
   NOTES POUR REPRISES FUTURES:
   - Implémenter la recherche client avec NSS
   - Ajouter la validation des montants
   - Gérer les décomptes groupés
   - Intégrer avec ClientsService
   ======================================== */
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
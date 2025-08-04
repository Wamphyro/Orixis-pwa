// ========================================
// OPERATIONS-BANCAIRES.DETAIL.JS - Orchestrateur du détail opération
// Chemin: modules/operations-bancaires/operations-bancaires.detail.js
//
// DESCRIPTION:
// Orchestre l'affichage détaillé d'une opération bancaire
// Architecture IoC : les composants ne se connaissent pas
// L'orchestrateur gère tout l'affichage
//
// STRUCTURE:
// 1. Affichage du détail avec toutes les sections
// 2. Gestion des actions selon le statut
// 3. Export des fonctions pour main.js
//
// DÉPENDANCES:
// - OperationsBancairesService (logique métier)
// - config (factories)
// ========================================

import { OperationsBancairesService } from './operations-bancaires.service.js';
import { 
    OPERATIONS_CONFIG,
    formaterDate,
    formaterMontant
} from './operations-bancaires.data.js';
import config from './operations-bancaires.config.js';
import { chargerDonnees } from './operations-bancaires.list.js';
import { afficherSucces, afficherErreur, state } from './operations-bancaires.main.js';

// ========================================
// VARIABLES GLOBALES DU MODULE
// ========================================

// Opération actuellement affichée
let operationActuelle = null;

// ========================================
// FONCTION PRINCIPALE : AFFICHER LE DÉTAIL
// ========================================

export async function voirDetailOperation(operationId) {
    try {
        const operation = await OperationsBancairesService.getOperation(operationId);
        if (!operation) return;
        
        operationActuelle = operation;
        afficherDetailOperation(operation);
        
        // Ouvrir le modal
        window.modalManager.open('modalDetailOperation');
        
        // FORCER le scroll à 0 APRÈS que le modal ait fait son scroll
        setTimeout(() => {
            const modalBody = document.querySelector('#modalDetailOperation .modal-body');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
        }, 100);
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
    }
}

// ========================================
// AFFICHAGE DU DÉTAIL
// ========================================

function afficherDetailOperation(operation) {
    // Sauvegarder la position actuelle du scroll
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // En-tête
    document.getElementById('detailTitreOperation').textContent = 
        `${operation.libelle ? operation.libelle.substring(0, 50) + '...' : 'Opération'}`;
    
    // Sections d'information
    afficherSectionOperation(operation);
    afficherSectionCompte(operation);
    afficherSectionMontants(operation);
    afficherSectionCategorisation(operation);
    afficherSectionTracabilite(operation);
    
    // Actions disponibles
    afficherActionsOperation(operation);
    
    // Restaurer la position du scroll
    setTimeout(() => {
        window.scrollTo(0, scrollPosition);
        document.getElementById('modalDetailOperation').scrollTop = 0;
    }, 0);
}

// ========================================
// SECTIONS D'AFFICHAGE
// ========================================

function afficherSectionOperation(operation) {
    const detailOperation = document.getElementById('detailOperation');
    
    const type = operation.montant >= 0 ? 'credit' : 'debit';
    const typeConfig = OPERATIONS_CONFIG.TYPES_OPERATION[type];
    
    detailOperation.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Date opération</span>
                <span class="detail-value">${formaterDate(operation.date, 'complet')}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Date valeur</span>
                <span class="detail-value">${formaterDate(operation.dateValeur || operation.date, 'complet')}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Libellé</span>
                <span class="detail-value" style="font-weight: 600;">${operation.libelle || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">${config.HTML_TEMPLATES.typeOperation(type)}</span>
            </div>
            ${operation.reference ? `
                <div class="detail-info-item">
                    <span class="detail-label">Référence</span>
                    <span class="detail-value">${operation.reference}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function afficherSectionCompte(operation) {
    const detailCompte = document.getElementById('detailCompte');
    
    detailCompte.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Numéro de compte</span>
                <span class="detail-value">${operation.accountNumber ? '•••' + operation.accountNumber.slice(-4) : '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Nom du compte</span>
                <span class="detail-value">${operation.accountName || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Banque</span>
                <span class="detail-value">${operation.bank || 'Crédit Mutuel'}</span>
            </div>
            ${operation.solde !== null && operation.solde !== undefined ? `
                <div class="detail-info-item">
                    <span class="detail-label">Solde après opération</span>
                    <span class="detail-value">${formaterMontant(operation.solde)}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function afficherSectionMontants(operation) {
    const detailMontants = document.getElementById('detailMontants');
    const type = operation.montant >= 0 ? 'credit' : 'debit';
    
    detailMontants.innerHTML = `
        <div class="montants-detail">
            <div class="montant-row montant-total">
                <span class="montant-label">Montant ${type === 'credit' ? 'crédit' : 'débit'}</span>
                <span class="detail-value" style="color: ${type === 'credit' ? '#28a745' : '#dc3545'}; font-size: 24px; font-weight: 700;">
                    ${type === 'credit' ? '+' : ''}${formaterMontant(operation.montant)}
                </span>
            </div>
            ${operation.devise && operation.devise !== 'EUR' ? `
                <div class="montant-row">
                    <span class="montant-label">Devise</span>
                    <span class="detail-value">${operation.devise}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function afficherSectionCategorisation(operation) {
    const detailCategorisation = document.getElementById('detailCategorisation');
    const categorie = OPERATIONS_CONFIG.CATEGORIES[operation.categorie] || OPERATIONS_CONFIG.CATEGORIES.autre;
    
    detailCategorisation.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Catégorie actuelle</span>
                <span class="detail-value">
                    <span class="categorie-badge">
                        ${categorie.icon} ${categorie.label}
                    </span>
                </span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Statut de pointage</span>
                <span class="detail-value">
                    ${operation.pointee ? 
                        '<span style="color: #28a745;">✓ Pointée</span>' : 
                        '<span style="color: #f57c00;">✗ Non pointée</span>'
                    }
                </span>
            </div>
        </div>
    `;
}

function afficherSectionTracabilite(operation) {
    const detailTracabilite = document.getElementById('detailTracabilite');
    
    // Formater les dates
    const dateCreation = operation.createdAt ? formaterDate(operation.createdAt, 'complet') : '-';
    const dateModification = operation.updatedAt ? formaterDate(operation.updatedAt, 'complet') : '-';
    
    // Formater les intervenants
    const creePar = operation.createdBy ? 
        `${operation.createdBy.prenom || ''} ${operation.createdBy.nom || ''}`.trim() || 'Système' : 'Import';
    
    const modifiePar = operation.updatedBy ? 
        `${operation.updatedBy.prenom || ''} ${operation.updatedBy.nom || ''}`.trim() : '-';
    
    detailTracabilite.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Importée le</span>
                <span class="detail-value">${dateCreation}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Importée par</span>
                <span class="detail-value">${creePar}</span>
            </div>
            ${operation.updatedAt ? `
                <div class="detail-info-item">
                    <span class="detail-label">Modifiée le</span>
                    <span class="detail-value">${dateModification}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-label">Modifiée par</span>
                    <span class="detail-value">${modifiePar}</span>
                </div>
            ` : ''}
        </div>
        ${operation.raw ? `
            <div class="detail-info-item" style="margin-top: 15px;">
                <span class="detail-label">Ligne CSV originale</span>
                <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; margin-top: 5px;">
                    ${operation.raw}
                </div>
            </div>
        ` : ''}
    `;
}

// ========================================
// ACTIONS SELON LE STATUT
// ========================================

function afficherActionsOperation(operation) {
    const detailActions = document.getElementById('detailActions');
    let actions = [];
    
    // Bouton pointer/dépointer
    if (operation.pointee) {
        actions.push(`
            <button class="btn btn-warning btn-pill" onclick="depointerOperation('${operation.id}')">
                ✗ Dépointer l'opération
            </button>
        `);
    } else {
        actions.push(`
            <button class="btn btn-success btn-pill" onclick="pointerOperationDetail('${operation.id}')">
                ✓ Pointer l'opération
            </button>
        `);
    }
    
    // Bouton modifier catégorie
    actions.push(`
        <button class="btn btn-info btn-pill" onclick="modifierCategorie('${operation.id}')">
            🏷️ Modifier la catégorie
        </button>
    `);
    
    // Bouton supprimer
    actions.push(`
        <button class="btn btn-danger btn-sm" onclick="supprimerOperationDetail('${operation.id}')">
            🗑️ Supprimer
        </button>
    `);
    
    detailActions.innerHTML = actions.join('');
}

// ========================================
// ACTIONS WINDOW
// ========================================

window.pointerOperationDetail = async function(operationId) {
    try {
        await OperationsBancairesService.pointerOperation(operationId, true);
        
        // Mettre à jour localement
        const operation = state.operationsData.find(op => op.id === operationId);
        if (operation) {
            operation.pointee = true;
        }
        
        await chargerDonnees();
        await voirDetailOperation(operationId);
        afficherSucces('Opération pointée');
    } catch (error) {
        afficherErreur('Erreur lors du pointage');
    }
};

window.depointerOperation = async function(operationId) {
    try {
        await OperationsBancairesService.pointerOperation(operationId, false);
        
        // Mettre à jour localement
        const operation = state.operationsData.find(op => op.id === operationId);
        if (operation) {
            operation.pointee = false;
        }
        
        await chargerDonnees();
        await voirDetailOperation(operationId);
        afficherSucces('Opération dépointée');
    } catch (error) {
        afficherErreur('Erreur lors du dépointage');
    }
};

window.modifierCategorie = async function(operationId) {
    // TODO: Ouvrir un dialog pour choisir la nouvelle catégorie
    console.log('Modifier catégorie de', operationId);
    afficherSucces('Fonctionnalité en cours de développement');
};

window.supprimerOperationDetail = async function(operationId) {
    const confirme = await config.Dialog.confirm(
        'Êtes-vous sûr de vouloir supprimer cette opération ?\n\nCette action est irréversible.',
        'Suppression de l\'opération',
        {
            confirmText: 'Supprimer',
            confirmClass: 'danger'
        }
    );
    
    if (confirme) {
        try {
            await OperationsBancairesService.supprimerOperation(operationId);
            
            // Retirer de la liste locale
            const index = state.operationsData.findIndex(op => op.id === operationId);
            if (index > -1) {
                state.operationsData.splice(index, 1);
            }
            
            await chargerDonnees();
            window.modalManager.close('modalDetailOperation');
            afficherSucces('Opération supprimée');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de la suppression');
        }
    }
};
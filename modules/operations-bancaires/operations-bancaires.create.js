// ========================================
// OPERATIONS-BANCAIRES.CREATE.JS - Gestion de l'import CSV
// Chemin: modules/operations-bancaires/operations-bancaires.create.js
//
// DESCRIPTION:
// Module d'import des opérations bancaires
// Import CSV/Excel avec détection automatique du format
//
// ARCHITECTURE:
// - Upload via DropZone
// - Analyse du format bancaire
// - Preview des opérations
// - Import en masse
//
// DÉPENDANCES:
// - config pour les factories de composants
// - importService pour l'analyse CSV
// - operationsService pour la création
// ========================================

import config from './operations-bancaires.config.js';
import { afficherSucces, afficherErreur } from './operations-bancaires.main.js';
import importService from './operations-bancaires.import.service.js';
import { OperationsBancairesService } from './operations-bancaires.service.js';
import { chargerDonnees } from './operations-bancaires.list.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let importState = {
    file: null,
    operations: [],
    stats: null,
    format: null
};

// Instance du composant
let dropzoneImport = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initImportOperations() {
    console.log('Module import opérations initialisé');
    
    // Préparer les listeners futurs
    window.resetImport = resetImport;
    window.confirmerImport = confirmerImport;
}

// ========================================
// OUVERTURE MODAL IMPORT
// ========================================

export function ouvrirModalImport() {
    resetImport();
    
    // Afficher le formulaire
    afficherFormulaireImport();
    
    // Ouvrir la modal
    window.modalManager.open('modalImportCSV');
}

// ========================================
// AFFICHAGE FORMULAIRE IMPORT
// ========================================

function afficherFormulaireImport() {
    // Mettre à jour le footer avec les boutons
    const modalFooter = document.querySelector('#modalImportCSV .modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button id="btnAnnulerImport" class="btn btn-ghost btn-pill" onclick="fermerModal('modalImportCSV')">
                Annuler
            </button>
            <button id="btnConfirmerImport" class="btn btn-primary btn-pill" onclick="confirmerImport()" disabled>
                📥 Importer les opérations
            </button>
        `;
    }
    
    // Créer la structure moderne avec les 3 zones
    const modalBody = document.querySelector('#modalImportCSV .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="import-csv-wrapper">
                <!-- Zone 1 : Description -->
                <div class="zone-description">
                    <div class="content">
                        <div class="icon-wrapper">
                            <span class="icon">📊</span>
                        </div>
                        <div class="text">
                            <h4>Analyse automatique des relevés</h4>
                            <p>Import intelligent de vos relevés bancaires. Format détecté automatiquement, catégories assignées, doublons ignorés. Compatible avec toutes les banques françaises.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 2 : Dropzone -->
                <div class="zone-dropzone">
                    <div id="import-dropzone"></div>
                </div>
                
                <!-- Zone 3 : Résultats analyse -->
                <div class="zone-resultats">
                    <div class="zone-resultats-header">
                        <h5>
                            📈 Analyse du fichier
                            <span class="count" id="operations-count" style="display: none;">0</span>
                        </h5>
                    </div>
                    <div class="zone-resultats-content">
                        <div id="resultats-content">
                            <div class="empty-state">
                                <div class="icon">📄</div>
                                <p>Aucun fichier analysé</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Créer la DropZone après que le HTML soit inséré
    setTimeout(() => {
        if (dropzoneImport) {
            dropzoneImport.destroy();
        }
        
        dropzoneImport = config.createImportDropzone('#import-dropzone', {
            messages: {
                drop: '📤 Glissez votre relevé bancaire ici',
                browse: 'ou cliquez pour parcourir',
                typeError: 'Seuls les fichiers CSV et Excel sont acceptés',
                sizeError: 'Fichier trop volumineux (max 5MB)',
                maxFilesError: 'Un seul fichier à la fois'
            },
            previewSize: 'none',
            showPreview: false,
            onDrop: async (files) => {
                if (files.length > 0) {
                    await analyserFichier(files[0]);
                }
            },
            onChange: async (files) => {
                if (files.length > 0) {
                    await analyserFichier(files[0]);
                }
            }
        });
    }, 100);
}

// ========================================
// ANALYSE DU FICHIER
// ========================================

async function analyserFichier(file) {
    try {
        // Afficher un loader
        const resultatsContent = document.getElementById('resultats-content');
        
        resultatsContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">⏳</div>
                <p>Analyse en cours...</p>
            </div>
        `;
        
        // Analyser le fichier
        const resultat = await importService.importFile(file);
        
        // Stocker le résultat
        importState = {
            file: file,
            operations: resultat.operations,
            stats: resultat.stats,
            format: resultat.format,
            accountInfo: resultat.accountInfo
        };
        
        // Afficher les résultats avec le nouveau design
        afficherResultatsAnalyse(resultat);
        
    } catch (error) {
        console.error('❌ Erreur analyse:', error);
        afficherErreur(`Erreur lors de l'analyse: ${error.message}`);
        
        const resultatsContent = document.getElementById('resultats-content');
        if (resultatsContent) {
            resultatsContent.innerHTML = `
                <div class="result-section">
                    <div class="alert alert-danger">
                        ❌ ${error.message}
                    </div>
                </div>
            `;
        }
    }
}

// ========================================
// AFFICHAGE DES RÉSULTATS
// ========================================

function afficherResultatsAnalyse(resultat) {
    const resultatsContent = document.getElementById('resultats-content');
    const operationsCount = document.getElementById('operations-count');
    
    // Mettre à jour le compteur
    if (operationsCount) {
        operationsCount.style.display = 'inline-block';
        operationsCount.textContent = resultat.stats.total;
    }
    
    // Créer le contenu modernisé
    resultatsContent.innerHTML = `
        <!-- Section informations générales -->
        <div class="result-section">
            <h6>📋 Informations générales</h6>
            <div class="analyse-info">
                <div class="info-item">
                    <strong>Format détecté :</strong> ${resultat.format}
                </div>
                ${resultat.accountInfo ? `
                    <div class="info-item">
                        <strong>Compte :</strong> 
                        ${resultat.accountInfo.bank} - ${resultat.accountInfo.maskedNumber}
                    </div>
                ` : ''}
                <div class="info-item">
                    <strong>Période :</strong> 
                    ${formatDateComplete(resultat.stats.periodes.debut)} → ${formatDateComplete(resultat.stats.periodes.fin)}
                </div>
                <div class="info-item">
                    <strong>Durée :</strong> ${resultat.stats.periodes.jours} jours
                </div>
            </div>
        </div>
        
        <!-- Section statistiques -->
        <div class="result-section">
            <h6>📊 Statistiques</h6>
            <div class="stats-grid">
                <div class="stat-card credit">
                    <span class="label">Crédits</span>
                    <span class="value">+${formatMontant(resultat.stats.montantCredits)}</span>
                    <span class="count">${resultat.stats.credits} opérations</span>
                </div>
                <div class="stat-card debit">
                    <span class="label">Débits</span>
                    <span class="value">-${formatMontant(resultat.stats.montantDebits)}</span>
                    <span class="count">${resultat.stats.debits} opérations</span>
                </div>
                <div class="stat-card balance ${resultat.stats.balance >= 0 ? 'positive' : 'negative'}">
                    <span class="label">Balance</span>
                    <span class="value">${resultat.stats.balance >= 0 ? '+' : ''}${formatMontant(resultat.stats.balance)}</span>
                    <span class="count">Total période</span>
                </div>
            </div>
        </div>
        
        <!-- Section aperçu -->
        <div class="result-section">
            <h6>👁️ Aperçu des opérations</h6>
            <div class="preview-wrapper">
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Libellé</th>
                            <th>Catégorie</th>
                            <th>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultat.operations.slice(0, 5).map(op => `
                            <tr>
                                <td>${formatDate(op.date)}</td>
                                <td class="text-truncate" style="max-width: 200px;" title="${escapeHtml(op.libelle)}">
                                    ${escapeHtml(op.libelle)}
                                </td>
                                <td>
                                    <span class="badge badge-${op.categorie}">
                                        ${getCategorieLabel(op.categorie)}
                                    </span>
                                </td>
                                <td class="text-end ${op.montant >= 0 ? 'text-success' : 'text-danger'}">
                                    ${op.montant >= 0 ? '+' : ''}${formatMontant(op.montant)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p class="text-muted text-center" style="margin-top: 8px; font-size: 12px;">
                Affichage des 5 premières opérations sur ${resultat.stats.total}
            </p>
        </div>
    `;
    
    // Activer le bouton d'import
    const btnConfirmer = document.getElementById('btnConfirmerImport');
    if (btnConfirmer) {
        btnConfirmer.disabled = false;
    }
}

// ========================================
// CONFIRMATION IMPORT
// ========================================

async function confirmerImport() {
    if (!importState.operations || importState.operations.length === 0) {
        afficherErreur('Aucune opération à importer');
        return;
    }
    
    try {
        // Désactiver le bouton
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        const texteOriginal = btnConfirmer.innerHTML;
        btnConfirmer.disabled = true;
        btnConfirmer.innerHTML = '⏳ Import en cours...';
        
        // Importer les opérations
        const resultat = await OperationsBancairesService.importerOperations(importState.operations);
        
        // Afficher le résultat
        const message = `
            ✅ ${resultat.reussies} opérations importées
            ${resultat.doublons > 0 ? `\n⚠️ ${resultat.doublons} doublons ignorés` : ''}
            ${resultat.echecs > 0 ? `\n❌ ${resultat.echecs} erreurs` : ''}
        `;
        
        afficherSucces(message);
        
        // Fermer la modal après succès
        setTimeout(() => {
            window.modalManager.close('modalImportCSV');
            resetImport();
            
            // Recharger la liste
            chargerDonnees();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur import:', error);
        afficherErreur(`Erreur lors de l'import: ${error.message}`);
        
        // Réactiver le bouton
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.innerHTML = '📥 Importer les opérations';
        }
    }
}

// ========================================
// RESET
// ========================================

function resetImport() {
    importState = {
        file: null,
        operations: [],
        stats: null,
        format: null
    };
    
    // Détruire le composant s'il existe
    if (dropzoneImport) {
        dropzoneImport.destroy();
        dropzoneImport = null;
    }
}

// ========================================
// HELPERS
// ========================================

function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(Math.abs(montant));
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
}

function formatDateComplete(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCategorieLabel(categorie) {
    const categories = {
        salaires: 'Salaires',
        remboursement_secu: 'Remb. Sécu',
        remboursement_mutuelle: 'Remb. Mutuelle',
        impots: 'Impôts',
        energie: 'Énergie',
        telecom: 'Télécom',
        assurances: 'Assurances',
        alimentation: 'Alimentation',
        carburant: 'Carburant',
        restaurant: 'Restaurant',
        ecommerce: 'E-commerce',
        credit_immobilier: 'Crédit immo',
        loyer: 'Loyer',
        sante: 'Santé',
        retrait_especes: 'Retrait',
        virement: 'Virement',
        cheque: 'Chèque',
        frais_bancaires: 'Frais',
        abonnements: 'Abonnements',
        autre: 'Autre'
    };
    
    return categories[categorie] || categorie;
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création basée sur decompte-mutuelle
   - Import CSV au lieu d'upload documents
   - Analyse automatique du format bancaire
   - Preview des opérations avant import
   - Détection des doublons
   
   NOTES:
   - Le service d'import gère tous les formats
   - Les catégories sont auto-détectées
   - Les comptes sont extraits du nom de fichier
   ======================================== */
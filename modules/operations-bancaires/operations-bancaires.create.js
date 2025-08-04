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
    
    // Créer la structure
    const modalBody = document.querySelector('#modalImportCSV .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="import-wrapper">
                <!-- Zone 1 : Instructions -->
                <div class="zone-instructions">
                    <div class="content">
                        <div class="icon-wrapper">
                            <span class="icon">📊</span>
                        </div>
                        <div class="text">
                            <h4>Import de relevés bancaires</h4>
                            <p>Formats supportés : CSV et Excel des principales banques françaises (Crédit Mutuel, BNP, Société Générale...)</p>
                            <p class="small text-muted">Le format est détecté automatiquement. Les doublons sont ignorés.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Zone 2 : Dropzone -->
                <div class="zone-dropzone">
                    <div id="import-dropzone"></div>
                </div>
                
                <!-- Zone 3 : Résultat analyse -->
                <div id="zoneResultat" class="zone-resultat" style="display: none;">
                    <h5>📋 Analyse du fichier</h5>
                    <div id="resultatsAnalyse"></div>
                </div>
                
                <!-- Zone 4 : Preview des opérations -->
                <div id="zonePreview" class="zone-preview" style="display: none;">
                    <h5>👁️ Aperçu des opérations</h5>
                    <div class="preview-stats" id="previewStats"></div>
                    <div class="preview-table-wrapper">
                        <table class="preview-table" id="previewTable">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Libellé</th>
                                    <th>Catégorie</th>
                                    <th>Montant</th>
                                </tr>
                            </thead>
                            <tbody id="previewTableBody"></tbody>
                        </table>
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
        const resultatsDiv = document.getElementById('resultatsAnalyse');
        const zoneResultat = document.getElementById('zoneResultat');
        
        zoneResultat.style.display = 'block';
        resultatsDiv.innerHTML = '<div class="text-center">⏳ Analyse en cours...</div>';
        
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
        
        // Afficher les résultats
        afficherResultatsAnalyse(resultat);
        
        // Afficher le preview
        afficherPreview(resultat.operations.slice(0, 10)); // 10 premières
        
        // Activer le bouton d'import
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Erreur analyse:', error);
        afficherErreur(`Erreur lors de l'analyse: ${error.message}`);
        
        const resultatsDiv = document.getElementById('resultatsAnalyse');
        if (resultatsDiv) {
            resultatsDiv.innerHTML = `
                <div class="alert alert-danger">
                    ❌ ${error.message}
                </div>
            `;
        }
    }
}

// ========================================
// AFFICHAGE DES RÉSULTATS
// ========================================

function afficherResultatsAnalyse(resultat) {
    const resultatsDiv = document.getElementById('resultatsAnalyse');
    
    const accountHtml = resultat.accountInfo ? `
        <div class="info-item">
            <strong>Compte détecté :</strong> 
            ${resultat.accountInfo.bank} - ${resultat.accountInfo.maskedNumber}
        </div>
    ` : '';
    
    resultatsDiv.innerHTML = `
        <div class="analyse-info">
            <div class="info-item">
                <strong>Format :</strong> ${resultat.format}
            </div>
            ${accountHtml}
            <div class="info-item">
                <strong>Période :</strong> 
                ${resultat.stats.periodes.debut} → ${resultat.stats.periodes.fin}
                (${resultat.stats.periodes.jours} jours)
            </div>
            <div class="info-item">
                <strong>Opérations :</strong> ${resultat.stats.total}
            </div>
            <div class="info-grid">
                <div class="stat-item credit">
                    <span class="label">Crédits</span>
                    <span class="value">+${formatMontant(resultat.stats.montantCredits)}</span>
                    <span class="count">${resultat.stats.credits} op.</span>
                </div>
                <div class="stat-item debit">
                    <span class="label">Débits</span>
                    <span class="value">-${formatMontant(resultat.stats.montantDebits)}</span>
                    <span class="count">${resultat.stats.debits} op.</span>
                </div>
                <div class="stat-item balance ${resultat.stats.balance >= 0 ? 'positive' : 'negative'}">
                    <span class="label">Balance</span>
                    <span class="value">${formatMontant(resultat.stats.balance)}</span>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// AFFICHAGE PREVIEW
// ========================================

function afficherPreview(operations) {
    const zonePreview = document.getElementById('zonePreview');
    const tbody = document.getElementById('previewTableBody');
    const stats = document.getElementById('previewStats');
    
    if (!zonePreview || !tbody) return;
    
    // Afficher la zone
    zonePreview.style.display = 'block';
    
    // Stats du preview
    stats.innerHTML = `
        <span class="text-muted">
            Aperçu des ${operations.length} premières opérations sur ${importState.stats.total}
        </span>
    `;
    
    // Remplir le tableau
    tbody.innerHTML = operations.map(op => `
        <tr>
            <td>${formatDate(op.date)}</td>
            <td class="text-truncate" style="max-width: 300px;" title="${escapeHtml(op.libelle)}">
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
    `).join('');
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
// ========================================
// OPERATIONS-BANCAIRES.CREATE.JS - Gestion de l'import CSV
// Chemin: modules/operations-bancaires/operations-bancaires.create.js
//
// DESCRIPTION:
// Module d'import des opérations bancaires
// Import CSV/Excel avec détection automatique du format
// Support multi-fichiers (jusqu'à 10 simultanément)
//
// ARCHITECTURE:
// - Upload via DropZone (multi-fichiers)
// - Analyse parallèle des formats bancaires
// - Détection des doublons inter-fichiers
// - Preview des opérations globales
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
    files: [],              // Array de fichiers
    analyses: [],           // Array des analyses par fichier
    globalStats: null,      // Stats globales
    allOperations: [],      // Toutes les opérations fusionnées
    doublons: []            // Doublons détectés entre fichiers
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
                📥 Importer <span id="btnImportCount"></span>
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
                            <span class="icon">🚀</span>
                        </div>
                        <div class="text">
                            <h4>Import multiple intelligent</h4>
                            <p>Importez jusqu'à 10 fichiers simultanément ! Analyse parallèle, détection automatique des doublons entre fichiers, fusion intelligente des opérations.</p>
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
                            📈 Analyse des fichiers
                            <span class="count" id="files-analyzed-count" style="display: none;">0</span>
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
            onDrop: async (files) => {
                await analyserFichiers(files);
            },
            // RETIRER onChange complètement !
            onRemove: (file, index) => {
                // Retirer l'analyse correspondante
                importState.analyses.splice(index, 1);
                importState.files.splice(index, 1);
                // Recalculer les stats globales
                recalculerStatsGlobales();
            }
        });
    }, 100);
}

// ========================================
// ANALYSE MULTIPLE DES FICHIERS
// ========================================

async function analyserFichiers(files) {
    if (!files || files.length === 0) return;
    
    try {
        // Réinitialiser l'état
        importState.files = files;
        importState.analyses = [];
        importState.allOperations = [];
        importState.doublons = [];
        
        // Afficher un loader
        const resultatsContent = document.getElementById('resultats-content');
        resultatsContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">⏳</div>
                <p>Analyse de ${files.length} fichier(s) en cours...</p>
            </div>
        `;
        
        // Analyser tous les fichiers en parallèle
        const promesses = files.map(file => importService.importFile(file));
        const resultats = await Promise.allSettled(promesses);
        
        // Traiter les résultats
        let successCount = 0;
        let totalOperations = [];
        
        resultats.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
                const analyse = {
                    ...result.value,
                    fileIndex: index,
                    fileName: files[index].name,
                    status: 'success'
                };
                importState.analyses.push(analyse);
                totalOperations = totalOperations.concat(result.value.operations);
            } else {
                importState.analyses.push({
                    fileIndex: index,
                    fileName: files[index].name,
                    status: 'error',
                    error: result.reason.message
                });
            }
        });
        
        // Détecter les doublons entre fichiers
        const { operations: operationsUniques, doublons } = detecterDoublons(totalOperations);
        importState.allOperations = operationsUniques;
        importState.doublons = doublons;
        
        // Calculer les stats globales
        importState.globalStats = importService.calculateStats(operationsUniques);
        
        // Afficher les résultats
        afficherResultatsMultiples();
        
        // Activer le bouton si au moins un fichier réussi
        if (successCount > 0) {
            const btnConfirmer = document.getElementById('btnConfirmerImport');
            const btnCount = document.getElementById('btnImportCount');
            if (btnConfirmer) {
                btnConfirmer.disabled = false;
                if (btnCount) {
                    btnCount.textContent = `(${operationsUniques.length} opérations)`;
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur analyse multiple:', error);
        afficherErreur(`Erreur lors de l'analyse: ${error.message}`);
    }
}

// ========================================
// DÉTECTION DES DOUBLONS
// ========================================

function detecterDoublons(operations) {
    const operationsMap = new Map();
    const doublons = [];
    const operationsUniques = [];
    
    operations.forEach((op, index) => {
        // Créer une clé unique basée sur : date + montant + libellé (sans espaces)
        const key = `${op.date}_${op.montant}_${op.libelle.replace(/\s+/g, '')}`;
        
        if (operationsMap.has(key)) {
            // Doublon détecté
            doublons.push({
                operation: op,
                originalIndex: operationsMap.get(key),
                duplicateIndex: index
            });
        } else {
            operationsMap.set(key, index);
            operationsUniques.push(op);
        }
    });
    
    console.log(`✅ ${operationsUniques.length} opérations uniques, ${doublons.length} doublons détectés`);
    
    return { operations: operationsUniques, doublons };
}

// ========================================
// RECALCUL DES STATS GLOBALES
// ========================================

function recalculerStatsGlobales() {
    if (importState.analyses.length === 0) {
        const resultatsContent = document.getElementById('resultats-content');
        resultatsContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">📄</div>
                <p>Aucun fichier analysé</p>
            </div>
        `;
        
        // Désactiver le bouton
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
        }
        return;
    }
    
    // Refaire l'analyse globale
    let totalOperations = [];
    importState.analyses.forEach(analyse => {
        if (analyse.status === 'success' && analyse.operations) {
            totalOperations = totalOperations.concat(analyse.operations);
        }
    });
    
    // Recalculer les doublons
    const { operations: operationsUniques, doublons } = detecterDoublons(totalOperations);
    importState.allOperations = operationsUniques;
    importState.doublons = doublons;
    importState.globalStats = importService.calculateStats(operationsUniques);
    
    // Réafficher
    afficherResultatsMultiples();
}

// ========================================
// AFFICHAGE DES RÉSULTATS MULTIPLES
// ========================================

function afficherResultatsMultiples() {
    const resultatsContent = document.getElementById('resultats-content');
    const filesCount = document.getElementById('files-analyzed-count');
    
    // Mettre à jour le compteur de fichiers
    if (filesCount) {
        const successCount = importState.analyses.filter(a => a.status === 'success').length;
        filesCount.style.display = 'inline-block';
        filesCount.textContent = `${successCount}/${importState.files.length}`;
    }
    
    // Section 1 : Liste des fichiers analysés
    const filesListHtml = importState.analyses.map(analyse => {
        if (analyse.status === 'success') {
            return `
                <div class="file-analysis-item success">
                    <div class="file-icon">✅</div>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(analyse.fileName)}</div>
                        <div class="file-stats">
                            ${analyse.stats.total} opérations • 
                            ${formatDate(analyse.stats.periodes.debut)} → ${formatDate(analyse.stats.periodes.fin)}
                        </div>
                    </div>
                    <div class="file-amounts">
                        <span class="credit">+${formatMontant(analyse.stats.montantCredits)}</span>
                        <span class="debit">-${formatMontant(analyse.stats.montantDebits)}</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="file-analysis-item error">
                    <div class="file-icon">❌</div>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(analyse.fileName)}</div>
                        <div class="file-error">${escapeHtml(analyse.error)}</div>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Section 2 : Statistiques globales
    let globalStatsHtml = '';
    if (importState.globalStats) {
        globalStatsHtml = `
            <div class="result-section">
                <h6>📊 Statistiques globales</h6>
                <div class="stats-grid">
                    <div class="stat-card credit">
                        <span class="label">Total Crédits</span>
                        <span class="value">+${formatMontant(importState.globalStats.montantCredits)}</span>
                        <span class="count">${importState.globalStats.credits} opérations</span>
                    </div>
                    <div class="stat-card debit">
                        <span class="label">Total Débits</span>
                        <span class="value">-${formatMontant(importState.globalStats.montantDebits)}</span>
                        <span class="count">${importState.globalStats.debits} opérations</span>
                    </div>
                    <div class="stat-card balance ${importState.globalStats.balance >= 0 ? 'positive' : 'negative'}">
                        <span class="label">Balance globale</span>
                        <span class="value">${importState.globalStats.balance >= 0 ? '+' : ''}${formatMontant(importState.globalStats.balance)}</span>
                        <span class="count">Sur toute la période</span>
                    </div>
                </div>
                
                ${importState.doublons.length > 0 ? `
                    <div class="doublons-alert">
                        ⚠️ ${importState.doublons.length} doublon(s) détecté(s) entre les fichiers et seront ignorés
                    </div>
                ` : ''}
                
                <div class="periode-info">
                    <strong>Période totale :</strong> 
                    ${formatDateComplete(importState.globalStats.periodes.debut)} → 
                    ${formatDateComplete(importState.globalStats.periodes.fin)}
                    (${importState.globalStats.periodes.jours} jours)
                </div>
            </div>
        `;
    }
    
    // Composer le HTML final
    resultatsContent.innerHTML = `
        <!-- Section fichiers analysés -->
        <div class="result-section">
            <h6>📁 Fichiers analysés</h6>
            <div class="files-analysis-list">
                ${filesListHtml}
            </div>
        </div>
        
        ${globalStatsHtml}
        
        <!-- Section aperçu des opérations -->
        ${importState.allOperations.length > 0 ? `
            <div class="result-section">
                <h6>👁️ Aperçu des opérations (10 premières)</h6>
                <div class="preview-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Libellé</th>
                                <th>Catégorie</th>
                                <th>Montant</th>
                                <th>Fichier</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${importState.allOperations.slice(0, 10).map(op => `
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
                                    <td class="text-muted" style="font-size: 12px;">
                                        ${op.accountName || '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p class="text-muted text-center" style="margin-top: 8px; font-size: 12px;">
                    ${importState.allOperations.length} opérations uniques au total
                </p>
            </div>
        ` : ''}
    `;
}

// ========================================
// CONFIRMATION IMPORT
// ========================================

async function confirmerImport() {
    if (!importState.allOperations || importState.allOperations.length === 0) {
        afficherErreur('Aucune opération à importer');
        return;
    }
    
    try {
        // Désactiver le bouton
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        const texteOriginal = btnConfirmer.innerHTML;
        btnConfirmer.disabled = true;
        btnConfirmer.innerHTML = '⏳ Import en cours...';
        
        // Importer toutes les opérations uniques
        const resultat = await OperationsBancairesService.importerOperations(importState.allOperations);
        
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
        files: [],
        analyses: [],
        globalStats: null,
        allOperations: [],
        doublons: []
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
        epargne: 'Épargne',
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
   
   [03/02/2025] - Ajout du multi-import
   - Support jusqu'à 10 fichiers simultanés
   - Analyse parallèle avec Promise.allSettled
   - Détection des doublons inter-fichiers
   - Stats globales consolidées
   
   NOTES:
   - Le service d'import gère tous les formats
   - Les catégories sont auto-détectées
   - Les comptes sont extraits du nom de fichier
   - Les doublons sont détectés par date+montant+libellé
   ======================================== */
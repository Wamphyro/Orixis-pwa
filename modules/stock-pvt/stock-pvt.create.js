// ========================================
// STOCK-PVT.CREATE.JS - Gestion de l'import CSV
// Chemin: modules/stock-pvt/stock-pvt.create.js
//
// DESCRIPTION:
// Module d'import des stocks PVT
// Import CSV/Excel avec détection automatique des colonnes
// Support multi-fichiers (jusqu'à 10 simultanément)
//
// ARCHITECTURE:
// - Upload via DropZone (multi-fichiers)
// - Analyse parallèle avec détection colonnes
// - Détection des doublons inter-fichiers
// - Preview des articles globaux
// - Import en masse
//
// VERSION: 1.0.0
// DATE: 03/02/2025
// ========================================

import config from './stock-pvt.config.js';
import { afficherSucces, afficherErreur } from './stock-pvt.main.js';
import uploadService from './stock-pvt.upload.service.js';
import firestoreService from './stock-pvt.firestore.service.js';
import orchestrator from './stock-pvt.orchestrator.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let importState = {
    files: [],              // Array de fichiers
    analyses: [],           // Array des analyses par fichier
    globalStats: null,      // Stats globales
    allArticles: [],        // Tous les articles fusionnés
    doublons: []            // Doublons détectés entre fichiers
};

// Instance du composant
let dropzoneImport = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initImportStock() {
    console.log('Module import stock PVT initialisé');
    
    // Préparer les listeners
    window.resetImport = resetImport;
}

// ========================================
// OUVERTURE MODAL IMPORT
// ========================================

export function ouvrirModalImport() {
    resetImport();
    
    // Ouvrir la modal
    window.modalManager.open('modalImportCSV');
    
    // Afficher le formulaire après un court délai
    setTimeout(() => {
        afficherFormulaireImport();
    }, 100);
}

// ========================================
// AFFICHAGE FORMULAIRE IMPORT
// ========================================

function afficherFormulaireImport() {
    // Mettre à jour le footer avec les boutons
    const modalFooter = document.querySelector('#modalImportCSV .modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = '';
        
        // Créer les boutons
        const btnAnnuler = new config.Button({
            text: 'Annuler',
            variant: 'ghost',
            pill: true,
            onClick: () => window.fermerModal('modalImportCSV')
        });

        const btnConfirmer = new config.Button({
            text: '📦 Importer',
            variant: 'primary',
            pill: true,
            disabled: true,
            onClick: () => window.confirmerImport()
        });
        btnConfirmer.getElement().id = 'btnConfirmerImport';
        
        // Ajouter le span pour le count
        const countSpan = document.createElement('span');
        countSpan.id = 'btnImportCount';
        btnConfirmer.getElement().appendChild(countSpan);
        
        modalFooter.appendChild(btnAnnuler.getElement());
        modalFooter.appendChild(btnConfirmer.getElement());
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
                            <h4>Import intelligent multi-colonnes</h4>
                            <p>Importez jusqu'à 10 fichiers CSV simultanément ! Détection automatique des colonnes peu importe leur ordre, analyse parallèle, fusion intelligente des stocks.</p>
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
        // Ne pas réinitialiser, mais ajouter aux fichiers existants
        const nouveauxFichiers = Array.from(files);
        const fichiersExistants = importState.files || [];
        
        // Vérifier qu'on ne dépasse pas la limite
        if (fichiersExistants.length + nouveauxFichiers.length > 10) {
            afficherErreur(`Maximum 10 fichiers. Vous avez déjà ${fichiersExistants.length} fichier(s).`);
            return;
        }
        
        // Afficher un loader
        const resultatsContent = document.getElementById('resultats-content');
        resultatsContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">⏳</div>
                <p>Analyse de ${nouveauxFichiers.length} nouveau(x) fichier(s)...</p>
            </div>
        `;
        
        // Analyser les nouveaux fichiers
        const promesses = nouveauxFichiers.map(file => uploadService.analyserCSV(file));
        const resultats = await Promise.allSettled(promesses);
        
        // Ajouter les résultats aux analyses existantes
        resultats.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const analyse = {
                    ...result.value,
                    fileIndex: fichiersExistants.length + index,
                    fileName: nouveauxFichiers[index].name,
                    status: 'success'
                };
                importState.analyses.push(analyse);
            } else {
                importState.analyses.push({
                    fileIndex: fichiersExistants.length + index,
                    fileName: nouveauxFichiers[index].name,
                    status: 'error',
                    error: result.reason.message
                });
            }
        });
        
        // Ajouter les nouveaux fichiers à la liste
        importState.files = [...fichiersExistants, ...nouveauxFichiers];
        
        // Recalculer tout avec tous les fichiers
        recalculerStatsGlobales();
        
    } catch (error) {
        console.error('❌ Erreur analyse multiple:', error);
        afficherErreur(`Erreur lors de l'analyse: ${error.message}`);
    }
}

// ========================================
// DÉTECTION DES DOUBLONS
// ========================================

function detecterDoublons(articles) {
    const articlesMap = new Map();
    const doublons = [];
    const articlesUniques = [];
    
    articles.forEach((article, index) => {
        // Créer une clé unique basée sur : référence ou (désignation + code barre)
        let key;
        if (article.reference) {
            key = `ref_${article.reference}`;
        } else {
            key = `des_${article.designation}_${article.codeBarres || ''}`;
        }
        
        if (articlesMap.has(key)) {
            // Doublon détecté
            doublons.push({
                article: article,
                originalIndex: articlesMap.get(key),
                duplicateIndex: index
            });
        } else {
            articlesMap.set(key, index);
            articlesUniques.push(article);
        }
    });
    
    console.log(`✅ ${articlesUniques.length} articles uniques, ${doublons.length} doublons détectés`);
    
    return { articles: articlesUniques, doublons };
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
    let totalArticles = [];
    importState.analyses.forEach(analyse => {
        if (analyse.status === 'success' && analyse.articles) {
            totalArticles = totalArticles.concat(analyse.articles);
        }
    });
    
    // Recalculer les doublons
    const { articles: articlesUniques, doublons } = detecterDoublons(totalArticles);
    importState.allArticles = articlesUniques;
    importState.doublons = doublons;
    importState.globalStats = uploadService.calculateStats(articlesUniques);
    
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
            const colonnesDetectees = analyse.mapping ? analyse.mapping.foundColumns.join(', ') : 'aucune';
            return `
                <div class="file-analysis-item success">
                    <div class="file-icon">✅</div>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(analyse.fileName)}</div>
                        <div class="file-stats">
                            ${analyse.stats.total} articles • 
                            Colonnes: ${colonnesDetectees}
                        </div>
                    </div>
                    <div class="file-amounts">
                        <span class="credit">Stock: ${analyse.stats.quantiteTotale}</span>
                        <span class="debit">Valeur: ${formatMontant(analyse.stats.valeurStock)}</span>
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
                    <div class="stat-card info">
                        <span class="label">Total Articles</span>
                        <span class="value">${importState.globalStats.total}</span>
                        <span class="count">Références uniques</span>
                    </div>
                    <div class="stat-card success">
                        <span class="label">Valeur Stock</span>
                        <span class="value">${formatMontant(importState.globalStats.valeurStock)}</span>
                        <span class="count">Prix de vente</span>
                    </div>
                    <div class="stat-card warning">
                        <span class="label">Valeur Achat</span>
                        <span class="value">${formatMontant(importState.globalStats.valeurAchat)}</span>
                        <span class="count">Coût total</span>
                    </div>
                    <div class="stat-card ${importState.globalStats.margeGlobale >= 0 ? 'success' : 'danger'}">
                        <span class="label">Marge Globale</span>
                        <span class="value">${formatMontant(importState.globalStats.margeGlobale)}</span>
                        <span class="count">Bénéfice potentiel</span>
                    </div>
                </div>
                
                ${importState.doublons.length > 0 ? `
                    <div class="doublons-alert">
                        ⚠️ ${importState.doublons.length} doublon(s) détecté(s) entre les fichiers et seront ignorés
                    </div>
                ` : ''}
                
                ${importState.globalStats.articlesEnRupture > 0 ? `
                    <div class="rupture-alert">
                        🔴 ${importState.globalStats.articlesEnRupture} article(s) en rupture de stock
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Section 3 : Aperçu des articles
    let previewHtml = '';
    if (importState.allArticles.length > 0) {
        previewHtml = `
            <div class="result-section">
                <h6>👁️ Aperçu des articles (10 premiers)</h6>
                <div class="preview-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>Référence</th>
                                <th>Désignation</th>
                                <th>Quantité</th>
                                <th>PA</th>
                                <th>PV</th>
                                <th>Marge</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${importState.allArticles.slice(0, 10).map(article => {
                                const marge = ((article.prixVente || 0) - (article.prixAchat || 0));
                                const tauxMarge = article.prixAchat > 0 
                                    ? ((marge / article.prixAchat) * 100).toFixed(1) 
                                    : 0;
                                return `
                                    <tr>
                                        <td>${escapeHtml(article.reference || 'AUTO')}</td>
                                        <td class="text-truncate" style="max-width: 200px;" title="${escapeHtml(article.designation || '')}">
                                            ${escapeHtml(article.designation || '-')}
                                        </td>
                                        <td class="text-center ${article.quantite <= 0 ? 'text-danger' : ''}">
                                            ${article.quantite || 0}
                                        </td>
                                        <td class="text-end">${formatMontant(article.prixAchat || 0)}</td>
                                        <td class="text-end">${formatMontant(article.prixVente || 0)}</td>
                                        <td class="text-end ${marge >= 0 ? 'text-success' : 'text-danger'}">
                                            ${tauxMarge}%
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <p class="text-muted text-center" style="margin-top: 8px; font-size: 12px;">
                    ${importState.allArticles.length} articles uniques au total
                </p>
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
        ${previewHtml}
    `;
    
    // Activer le bouton si des articles sont disponibles
    if (importState.allArticles.length > 0) {
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        const btnCount = document.getElementById('btnImportCount');
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            if (btnCount) {
                btnCount.textContent = ` (${importState.allArticles.length} articles)`;
            }
        }
    } else {
        // Désactiver le bouton si aucun article
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
        }
    }
}

// ========================================
// CONFIRMATION IMPORT
// ========================================

async function confirmerImport() {
    if (!importState.allArticles || importState.allArticles.length === 0) {
        afficherErreur('Aucun article à importer');
        return;
    }
    
    try {
        // Désactiver le bouton
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        const texteOriginal = btnConfirmer.innerHTML;
        btnConfirmer.disabled = true;
        btnConfirmer.innerHTML = '⏳ Import en cours...';
        
        // Importer tous les articles uniques
        const resultat = await firestoreService.importerArticles(
            importState.allArticles,
            importState.files[0]?.name // Passer le nom du premier fichier pour ACM
        );
        
        // Afficher le résultat
        const message = `
            ✅ ${resultat.reussies} articles importés
            ${resultat.doublons > 0 ? `\n⚠️ ${resultat.doublons} doublons ignorés` : ''}
            ${resultat.erreurs.length > 0 ? `\n❌ ${resultat.erreurs.length} erreurs` : ''}
        `;
        
        afficherSucces(message);
        
        // Fermer la modal après succès
        setTimeout(() => {
            window.modalManager.close('modalImportCSV');
            resetImport();
            
            // Recharger la liste
            orchestrator.loadData();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur import:', error);
        afficherErreur(`Erreur lors de l'import: ${error.message}`);
        
        // Réactiver le bouton
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.innerHTML = '📦 Importer les articles';
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
        allArticles: [],
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Assigner la fonction à window après sa définition
window.confirmerImport = confirmerImport;

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création basée sur operations-bancaires
   - Import CSV avec détection automatique colonnes
   - Support multi-fichiers
   - Détection doublons par référence
   - Preview articles avant import
   ======================================== */
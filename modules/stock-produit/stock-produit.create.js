// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                         STOCK-PRODUIT.CREATE.JS                            ║
// ║                      Module Import CSV Multi-fichiers                      ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Gestion import CSV avec preview                                    ║
// ║ Version: 1.0.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

import config from './stock-produit.config.js';
import uploadService from './stock-produit.upload.service.js';
import firestoreService from './stock-produit.firestore.service.js';

// ╔════════════════════════════════════════╗
// ║     SECTION 1: ÉTAT LOCAL              ║
// ╚════════════════════════════════════════╝

let importState = {
    files: [],              // Fichiers uploadés
    analyses: [],           // Analyses par fichier
    globalStats: null,      // Statistiques globales
    allArticles: [],        // Articles fusionnés
    doublons: []           // Doublons détectés
};

let dropzoneImport = null;

// ╔════════════════════════════════════════╗
// ║   SECTION 2: INITIALISATION            ║
// ╚════════════════════════════════════════╝

export function initImportStock() {
    console.log('Module import stock audioprothèse initialisé');
    
    // ─── Exposition globale des fonctions ───
    window.resetImport = resetImport;
}

// ╔════════════════════════════════════════╗
// ║   SECTION 3: MODAL IMPORT              ║
// ╚════════════════════════════════════════╝

// ┌────────────────────────────────────────┐
// │      OUVERTURE MODAL                   │
// └────────────────────────────────────────┘

export function ouvrirModalImport() {
    resetImport();
    
    window.modalManager.open('modalImportCSV');
    
    setTimeout(() => {
        afficherFormulaireImport();
    }, 100);
}

// ┌────────────────────────────────────────┐
// │      AFFICHAGE FORMULAIRE              │
// └────────────────────────────────────────┘

function afficherFormulaireImport() {
    // ─── Footer avec boutons ───
    const modalFooter = document.querySelector('#modalImportCSV .modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = '';
        
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
        
        const countSpan = document.createElement('span');
        countSpan.id = 'btnImportCount';
        btnConfirmer.getElement().appendChild(countSpan);
        
        modalFooter.appendChild(btnAnnuler.getElement());
        modalFooter.appendChild(btnConfirmer.getElement());
    }
    
    // ─── Structure modal en 3 zones ───
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
                            <p>Importez jusqu'à 10 fichiers CSV simultanément ! Détection automatique : Marque, Libellé, N° Série, Centre, État, Client...</p>
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
    
    // ─── Création DropZone ───
    setTimeout(() => {
        if (dropzoneImport) {
            dropzoneImport.destroy();
        }
        
        dropzoneImport = config.createImportDropzone('#import-dropzone', {
            onDrop: async (files) => {
                await analyserFichiers(files);
            },
            onRemove: (file, index) => {
                importState.analyses.splice(index, 1);
                importState.files.splice(index, 1);
                recalculerStatsGlobales();
            }
        });
    }, 100);
}

// ╔════════════════════════════════════════╗
// ║   SECTION 4: ANALYSE FICHIERS          ║
// ╚════════════════════════════════════════╝

async function analyserFichiers(files) {
    if (!files || files.length === 0) return;
    
    try {
        const nouveauxFichiers = Array.from(files);
        const fichiersExistants = importState.files || [];
        
        // ─── Vérification limite 10 fichiers ───
        if (fichiersExistants.length + nouveauxFichiers.length > 10) {
            // Utiliser la fonction globale
            window.afficherErreur(`Maximum 10 fichiers. Vous avez déjà ${fichiersExistants.length} fichier(s).`);
            return;
        }
        
        // ─── Affichage loader ───
        const resultatsContent = document.getElementById('resultats-content');
        resultatsContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">⏳</div>
                <p>Analyse de ${nouveauxFichiers.length} nouveau(x) fichier(s)...</p>
            </div>
        `;
        
        // ─── Analyse parallèle des fichiers ───
        const promesses = nouveauxFichiers.map(file => uploadService.analyserCSV(file));
        const resultats = await Promise.allSettled(promesses);
        
        // ─── Traitement résultats ───
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
        
        // ─── Mise à jour état ───
        importState.files = [...fichiersExistants, ...nouveauxFichiers];
        
        // ─── Recalcul global ───
        recalculerStatsGlobales();
        
    } catch (error) {
        console.error('❌ Erreur analyse multiple:', error);
        window.afficherErreur(`Erreur lors de l'analyse: ${error.message}`);
    }
}

// ┌────────────────────────────────────────┐
// │      DÉTECTION DOUBLONS                │
// └────────────────────────────────────────┘

function detecterDoublons(articles) {
    const articlesMap = new Map();
    const doublons = [];
    const articlesUniques = [];
    
    articles.forEach((article, index) => {
        // ─── Création clé unique ───
        let key;
        if (article.numeroSerie) {
            key = `serie_${article.numeroSerie}_${article.magasin || ''}`;
        } else {
            key = `libelle_${article.libelle}_${article.magasin || ''}`;
        }
        
        if (articlesMap.has(key)) {
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

// ┌────────────────────────────────────────┐
// │      CALCUL STATS GLOBALES             │
// └────────────────────────────────────────┘

function recalculerStatsGlobales() {
    if (importState.analyses.length === 0) {
        const resultatsContent = document.getElementById('resultats-content');
        resultatsContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">📄</div>
                <p>Aucun fichier analysé</p>
            </div>
        `;
        
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
        }
        return;
    }
    
    // ─── Fusion articles ───
    let totalArticles = [];
    importState.analyses.forEach(analyse => {
        if (analyse.status === 'success' && analyse.articles) {
            totalArticles = totalArticles.concat(analyse.articles);
        }
    });
    
    // ─── Détection doublons ───
    const { articles: articlesUniques, doublons } = detecterDoublons(totalArticles);
    importState.allArticles = articlesUniques;
    importState.doublons = doublons;
    importState.globalStats = uploadService.calculateStats(articlesUniques);
    
    // ─── Affichage résultats ───
    afficherResultatsMultiples();
}

// ┌────────────────────────────────────────┐
// │      AFFICHAGE RÉSULTATS               │
// └────────────────────────────────────────┘

function afficherResultatsMultiples() {
    const resultatsContent = document.getElementById('resultats-content');
    const filesCount = document.getElementById('files-analyzed-count');
    
    // ─── Mise à jour compteur ───
    if (filesCount) {
        const successCount = importState.analyses.filter(a => a.status === 'success').length;
        filesCount.style.display = 'inline-block';
        filesCount.textContent = `${successCount}/${importState.files.length}`;
    }
    
    // ─── Section 1: Liste fichiers ───
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
    
    // ─── Section 2: Stats globales ───
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
    
    // ─── Section 3: Aperçu articles ───
    let previewHtml = '';
    if (importState.allArticles.length > 0) {
        previewHtml = `
            <div class="result-section">
                <h6>👁️ Aperçu des articles (10 premiers)</h6>
                <div class="preview-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>N° Série</th>
                                <th>Libellé</th>
                                <th>Marque</th>
                                <th>Quantité</th>
                                <th>Statut</th>
                                <th>Client</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${importState.allArticles.slice(0, 10).map(article => {
                                return `
                                    <tr>
                                        <td>${escapeHtml(article.numeroSerie || 'AUTO')}</td>
                                        <td class="text-truncate" style="max-width: 200px;" title="${escapeHtml(article.libelle || '')}">
                                            ${escapeHtml(article.libelle || '-')}
                                        </td>
                                        <td>${escapeHtml(article.marque || '-')}</td>
                                        <td class="text-center ${article.quantite <= 0 ? 'text-danger' : ''}">
                                            ${article.quantite || 0}
                                        </td>
                                        <td>${article.statut || 'STO'}</td>
                                        <td>${escapeHtml(article.client || '-')}</td>
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
    
    // ─── Composition HTML final ───
    resultatsContent.innerHTML = `
        <div class="result-section">
            <h6>📁 Fichiers analysés</h6>
            <div class="files-analysis-list">
                ${filesListHtml}
            </div>
        </div>
        
        ${globalStatsHtml}
        ${previewHtml}
    `;
    
    // ─── Activation bouton import ───
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
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = true;
        }
    }
}

// ╔════════════════════════════════════════╗
// ║   SECTION 5: CONFIRMATION IMPORT       ║
// ╚════════════════════════════════════════╝

async function confirmerImport() {
    if (!importState.allArticles || importState.allArticles.length === 0) {
        window.afficherErreur('Aucun article à importer');
        return;
    }
    
    try {
        // ─── Désactivation bouton ───
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        const texteOriginal = btnConfirmer.innerHTML;
        btnConfirmer.disabled = true;
        btnConfirmer.innerHTML = '⏳ Import en cours...';
        
        // ─── Import articles ───
        const resultat = await firestoreService.importerArticles(
            importState.allArticles,
            importState.files[0]?.name
        );
        
        // ─── Affichage résultat ───
        const message = `
            ✅ ${resultat.reussies} articles importés
            ${resultat.doublons > 0 ? `\n⚠️ ${resultat.doublons} doublons ignorés` : ''}
            ${resultat.erreurs.length > 0 ? `\n❌ ${resultat.erreurs.length} erreurs` : ''}
        `;
        
        window.afficherSucces(message);
        
        // ─── Fermeture modal ───
        setTimeout(() => {
            window.modalManager.close('modalImportCSV');
            resetImport();
            
            // Recharger les données via l'orchestrator
            if (window.stockProduitOrchestrator) {
                window.stockProduitOrchestrator.loadData();
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur import:', error);
        window.afficherErreur(`Erreur lors de l'import: ${error.message}`);
        
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.innerHTML = '📦 Importer les articles';
        }
    }
}

// ╔════════════════════════════════════════╗
// ║   SECTION 6: UTILITAIRES               ║
// ╚════════════════════════════════════════╝

function resetImport() {
    importState = {
        files: [],
        analyses: [],
        globalStats: null,
        allArticles: [],
        doublons: []
    };
    
    if (dropzoneImport) {
        dropzoneImport.destroy();
        dropzoneImport = null;
    }
}

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

// ─── Exposition globale ───
window.confirmerImport = confirmerImport;
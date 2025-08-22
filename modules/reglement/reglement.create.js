// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                            REGLEMENT.CREATE.JS                             ║
// ║                      Module Import CSV Multi-fichiers                      ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Gestion import CSV avec preview                                    ║
// ║ Version: 1.0.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

import config from './reglement.config.js';
import uploadService from './reglement.upload.service.js';
import firestoreService from './reglement.firestore.service.js';

// ╔════════════════════════════════════════╗
// ║     SECTION 1: ÉTAT LOCAL              ║
// ╚════════════════════════════════════════╝

let importState = {
    files: [],              // Fichiers uploadés
    analyses: [],           // Analyses par fichier
    globalStats: null,      // Statistiques globales
    allReglements: [],      // Règlements fusionnés
    doublons: []           // Doublons détectés
};

let dropzoneImport = null;

// ╔════════════════════════════════════════╗
// ║   SECTION 2: INITIALISATION            ║
// ╚════════════════════════════════════════╝

export function initImportReglement() {
    console.log('Module import règlements initialisé');
    
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
            text: '💰 Importer',
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
                            <span class="icon">💰</span>
                        </div>
                        <div class="text">
                            <h4>Import de règlements</h4>
                            <p>Importez jusqu'à 10 fichiers CSV simultanément ! Format : Date, Client, Magasin, Type, Montant</p>
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

function detecterDoublons(reglements) {
    const reglementsMap = new Map();
    const doublons = [];
    const reglementsUniques = [];
    
    reglements.forEach((reglement, index) => {
        // ─── Création clé unique ───
        const key = `${reglement.date}_${reglement.client}_${reglement.montant}_${reglement.typeReglement}`;
        
        if (reglementsMap.has(key)) {
            doublons.push({
                reglement: reglement,
                originalIndex: reglementsMap.get(key),
                duplicateIndex: index
            });
        } else {
            reglementsMap.set(key, index);
            reglementsUniques.push(reglement);
        }
    });
    
    console.log(`✅ ${reglementsUniques.length} règlements uniques, ${doublons.length} doublons détectés`);
    
    return { reglements: reglementsUniques, doublons };
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
    
    // ─── Fusion règlements ───
    let totalReglements = [];
    importState.analyses.forEach(analyse => {
        if (analyse.status === 'success' && analyse.reglements) {
            totalReglements = totalReglements.concat(analyse.reglements);
        }
    });
    
    // ─── Détection doublons ───
    const { reglements: reglementsUniques, doublons } = detecterDoublons(totalReglements);
    importState.allReglements = reglementsUniques;
    importState.doublons = doublons;
    importState.globalStats = uploadService.calculateStats(reglementsUniques);
    
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
                            ${analyse.stats.total} règlements • 
                            Colonnes: ${colonnesDetectees}
                        </div>
                    </div>
                    <div class="file-amounts">
                        <span class="credit">Total: ${formatMontant(analyse.stats.montantTotal)}</span>
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
                        <span class="label">Total Règlements</span>
                        <span class="value">${importState.globalStats.total}</span>
                        <span class="count">Encaissements</span>
                    </div>
                    <div class="stat-card success">
                        <span class="label">Montant Total</span>
                        <span class="value">${formatMontant(importState.globalStats.montantTotal)}</span>
                        <span class="count">Encaissé</span>
                    </div>
                </div>
                
                ${importState.doublons.length > 0 ? `
                    <div class="doublons-alert">
                        ⚠️ ${importState.doublons.length} doublon(s) détecté(s) et seront ignorés
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // ─── Section 3: Aperçu règlements ───
    let previewHtml = '';
    if (importState.allReglements.length > 0) {
        previewHtml = `
            <div class="result-section">
                <h6>👁️ Aperçu des règlements (10 premiers)</h6>
                <div class="preview-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Magasin</th>
                                <th>Type</th>
                                <th>Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${importState.allReglements.slice(0, 10).map(reglement => {
                                return `
                                    <tr>
                                        <td>${escapeHtml(reglement.date || '-')}</td>
                                        <td>${escapeHtml(reglement.client || '-')}</td>
                                        <td>${escapeHtml(reglement.magasin || '-')}</td>
                                        <td>${escapeHtml(reglement.typeReglement || '-')}</td>
                                        <td class="text-right">${formatMontant(reglement.montant || 0)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <p class="text-muted text-center" style="margin-top: 8px; font-size: 12px;">
                    ${importState.allReglements.length} règlements au total
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
    if (importState.allReglements.length > 0) {
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        const btnCount = document.getElementById('btnImportCount');
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            if (btnCount) {
                btnCount.textContent = ` (${importState.allReglements.length} règlements)`;
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
    if (!importState.allReglements || importState.allReglements.length === 0) {
        window.afficherErreur('Aucun règlement à importer');
        return;
    }
    
    try {
        // ─── Désactivation bouton ───
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        const texteOriginal = btnConfirmer.innerHTML;
        btnConfirmer.disabled = true;
        btnConfirmer.innerHTML = '⏳ Import en cours...';
        
        // ─── Import règlements ───
        const resultat = await firestoreService.importerReglements(
            importState.allReglements,
            importState.files[0]?.name
        );
        
        // ─── Affichage résultat ───
        const message = `
            ✅ ${resultat.reussies} règlements importés
            ${resultat.doublons > 0 ? `\n⚠️ ${resultat.doublons} doublons ignorés` : ''}
            ${resultat.erreurs.length > 0 ? `\n❌ ${resultat.erreurs.length} erreurs` : ''}
        `;
        
        window.afficherSucces(message);
        
        // ─── Fermeture modal ───
        setTimeout(() => {
            window.modalManager.close('modalImportCSV');
            resetImport();
            
            // Recharger les données via l'orchestrator
            if (window.reglementOrchestrator) {
                window.reglementOrchestrator.loadData();
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur import:', error);
        window.afficherErreur(`Erreur lors de l'import: ${error.message}`);
        
        const btnConfirmer = document.getElementById('btnConfirmerImport');
        if (btnConfirmer) {
            btnConfirmer.disabled = false;
            btnConfirmer.innerHTML = '💰 Importer les règlements';
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
        allReglements: [],
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
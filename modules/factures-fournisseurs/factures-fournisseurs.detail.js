// ========================================
// FACTURES-FOURNISSEURS.DETAIL.JS - Orchestrateur du détail facture
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.detail.js
//
// DESCRIPTION:
// Orchestre l'affichage détaillé d'une facture avec Timeline
// Architecture IoC : les composants ne se connaissent pas
// L'orchestrateur crée la timeline et gère l'affichage
//
// STRUCTURE:
// 1. Affichage du détail avec toutes les sections
// 2. Timeline du workflow
// 3. Gestion des actions selon le statut
// 4. Export des fonctions pour main.js
//
// DÉPENDANCES:
// - FacturesFournisseursService (logique métier)
// - Timeline (composant UI générique)
// - config (factories)
// ========================================

import { FacturesFournisseursService } from './factures-fournisseurs.service.js';
import { 
    FACTURES_CONFIG,
    formaterDate,
    formaterMontant,
    calculerMontantHT,
    calculerMontantTVA
} from './factures-fournisseurs.data.js';
import config from './factures-fournisseurs.config.js';
import { chargerDonnees } from './factures-fournisseurs.list.js';
import { afficherSucces, afficherErreur } from './factures-fournisseurs.main.js';

// ========================================
// VARIABLES GLOBALES DU MODULE
// ========================================

// Facture actuellement affichée
let factureActuelle = null;

// Instance de Timeline
let timelineInstance = null;

// ========================================
// FONCTION PRINCIPALE : AFFICHER LE DÉTAIL
// ========================================

export async function voirDetailFacture(factureId) {
    try {
        const facture = await FacturesFournisseursService.getFacture(factureId);
        if (!facture) return;
        
        factureActuelle = facture;
        afficherDetailFacture(facture);
        
        // Ouvrir le modal
        window.modalManager.open('modalDetailFacture');
        
        // FORCER le scroll à 0 APRÈS que le modal ait fait son scroll
        setTimeout(() => {
            const modalBody = document.querySelector('#modalDetailFacture .modal-body');
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

function afficherDetailFacture(facture) {
    // Sauvegarder la position actuelle du scroll
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // En-tête
    document.getElementById('detailNumFacture').textContent = facture.numeroFacture || facture.numeroInterne;
    
    // Timeline
    afficherTimeline(facture);
    
    // Sections d'information
    afficherSectionFournisseur(facture);
    afficherSectionMontants(facture);
    afficherSectionDates(facture);
    afficherSectionPaiement(facture);
    afficherSectionOrganisation(facture);
    afficherSectionDocuments(facture);
    afficherSectionHistorique(facture);
    
    // Actions disponibles
    afficherActionsFacture(facture);
    
    // Restaurer la position du scroll
    setTimeout(() => {
        window.scrollTo(0, scrollPosition);
        document.getElementById('modalDetailFacture').scrollTop = 0;
    }, 0);
}

// ========================================
// TIMELINE
// ========================================

function afficherTimeline(facture) {
    // Détruire l'ancienne timeline si elle existe
    if (timelineInstance) {
        timelineInstance.destroy();
        timelineInstance = null;
    }
    
    // Recréer le container
    const timelineWrapper = document.querySelector('.timeline-container');
    if (!timelineWrapper) {
        console.error('❌ Container .timeline-container non trouvé');
        return;
    }
    
    timelineWrapper.innerHTML = '<div class="timeline" id="timeline"></div>';
    
    // Créer les items de timeline
    const items = creerItemsTimeline(facture);
    
    // Créer la nouvelle timeline
    try {
        timelineInstance = config.createFactureTimeline('#timeline', items, {
            orientation: 'horizontal',
            theme: 'colorful',
            animated: true,
            showDates: true,
            showLabels: true,
            clickable: false
        });
        console.log('✅ Timeline créée avec succès');
    } catch (error) {
        console.error('❌ Erreur création timeline:', error);
    }
}

function creerItemsTimeline(facture) {
    const items = [];
    
    // UN SEUL WORKFLOW POUR TOUS
    let sequence = ['nouvelle', 'a_payer'];
    
    // Ajouter "en retard" si nécessaire
    if (facture.statut === 'en_retard' || facture.enRetard) {
        sequence.push('en_retard');
    }
    
    // Toujours finir par payée → à pointer → pointée
    sequence.push('payee', 'a_pointer', 'pointee');
    
    sequence.forEach(statutKey => {
    const statutConfig = FACTURES_CONFIG.STATUTS[statutKey];
    if (!statutConfig) return;
    
    const isCompleted = isStatutComplete(facture, statutKey);
    
    // Logique spéciale pour déterminer l'étape courante
    let isCurrent = false;
    if (facture.statut === 'deja_payee') {
        // Si le statut est "déjà payée", l'étape courante est "à pointer"
        isCurrent = statutKey === 'a_pointer';
    } else {
        // Sinon, l'étape courante est celle qui correspond au statut actuel
        isCurrent = facture.statut === statutKey || (statutKey === 'en_retard' && facture.enRetard);
    }
    
    items.push({
        label: statutConfig.label,
        icon: statutConfig.icon,
        date: getDateStatut(facture, statutKey),
        status: isCurrent ? 'current' : (isCompleted ? 'completed' : 'pending'),
        details: statutConfig.description
    });
});
    
    return items;
}

function isStatutComplete(facture, statut) {
    // Logique pour déterminer si un statut est complété
    switch (statut) {
        case 'nouvelle':
            return facture.dates.creation !== null;
        case 'a_payer':
            // Si déjà payée, alors "à payer" est forcément complété
            return ['payee', 'deja_payee', 'a_pointer', 'pointee'].includes(facture.statut);
        case 'deja_payee':
            // Complété si on est à cette étape OU après
            return ['deja_payee', 'a_pointer', 'pointee'].includes(facture.statut);
        case 'payee':
            return facture.dates.paiement !== null || ['a_pointer', 'pointee'].includes(facture.statut);
        case 'a_pointer':
            return facture.statut === 'pointee';
        case 'pointee':
            return facture.statut === 'pointee';
        case 'en_retard':
            return facture.statut === 'payee' || facture.dates.paiement !== null;
        default:
            return false;
    }
}

function getDateStatut(facture, statut) {
    switch (statut) {
        case 'nouvelle':
            return formaterDate(facture.dates.creation, 'complet');
        case 'a_payer':
            return facture.dates.analyse ? formaterDate(facture.dates.analyse, 'complet') : '';
        case 'deja_payee':
            return facture.dates.creation ? formaterDate(facture.dates.creation, 'complet') : '';
        case 'payee':
            return facture.dates.paiement ? formaterDate(facture.dates.paiement, 'complet') : '';
        case 'a_pointer':
            return facture.dates.paiement ? formaterDate(facture.dates.paiement, 'complet') : '';
        case 'pointee':
            return facture.dates.pointage ? formaterDate(facture.dates.pointage, 'complet') : '';
        default:
            return '';
    }
}

// ========================================
// SECTIONS D'AFFICHAGE
// ========================================

function afficherSectionFournisseur(facture) {
    const detailFournisseur = document.getElementById('detailFournisseur');
    
    const categorie = facture.fournisseur?.categorie ? 
        FACTURES_CONFIG.CATEGORIES_FOURNISSEURS[facture.fournisseur.categorie]?.label || facture.fournisseur.categorie : 
        '-';
    
    detailFournisseur.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Nom</span>
                <span class="detail-value">${facture.fournisseur?.nom || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Catégorie</span>
                <span class="detail-value">${categorie}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">N° Client</span>
                <span class="detail-value">${facture.fournisseur?.numeroClient || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">SIREN</span>
                <span class="detail-value">${facture.fournisseur?.siren || '-'}</span>
            </div>
        </div>
    `;
}

function afficherSectionMontants(facture) {
    const detailMontants = document.getElementById('detailMontants');
    
    // Recalculer si nécessaire
    const montantHT = facture.montantHT || calculerMontantHT(facture.montantTTC, facture.tauxTVA);
    const montantTVA = facture.montantTVA || calculerMontantTVA(montantHT, facture.tauxTVA);
    
    detailMontants.innerHTML = `
        <div class="montants-detail">
            <div class="montant-row">
                <span class="montant-label">Montant HT</span>
                <span class="detail-value">${formaterMontant(montantHT)}</span>
            </div>
            <div class="montant-row">
                <span class="montant-label">TVA (${facture.tauxTVA || 20}%)</span>
                <span class="detail-value">${formaterMontant(montantTVA)}</span>
            </div>
            <div class="montant-row montant-total">
                <span class="montant-label">Montant TTC</span>
                <span class="detail-value">${formaterMontant(facture.montantTTC)}</span>
            </div>
        </div>
    `;
}

function afficherSectionDates(facture) {
    const detailDates = document.getElementById('detailDates');
    
    // Période facturée
    let periodeText = '-';
    if (facture.periodeDebut && facture.periodeFin) {
        const debut = formaterDate(facture.periodeDebut, 'jour');
        const fin = formaterDate(facture.periodeFin, 'jour');
        periodeText = `Du ${debut} au ${fin}`;
    }
    
    // Échéance avec retard
    let echeanceText = formaterDate(facture.dateEcheance, 'jour');
    if (facture.enRetard && facture.statut === 'a_payer') {
        const jours = Math.floor((new Date() - new Date(facture.dateEcheance)) / (1000 * 60 * 60 * 24));
        echeanceText += ` <span class="echeance-depassee">(${jours} jours de retard)</span>`;
    }
    
    detailDates.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Date facture</span>
                <span class="detail-value">${formaterDate(facture.dateFacture, 'jour')}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Date échéance</span>
                <span class="detail-value">${echeanceText}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Réception</span>
                <span class="detail-value">${formaterDate(facture.dateReception, 'jour')}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Période facturée</span>
                <span class="detail-value">${periodeText}</span>
            </div>
        </div>
    `;
}

function afficherSectionPaiement(facture) {
    const detailPaiement = document.getElementById('detailPaiement');
    
    const modePaiement = facture.modePaiement ? 
        FACTURES_CONFIG.MODES_PAIEMENT[facture.modePaiement]?.label || facture.modePaiement : 
        '-';
    
    detailPaiement.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Statut</span>
                <span class="detail-value">
                    ${config.HTML_TEMPLATES.badge(facture.statut, FACTURES_CONFIG.STATUTS[facture.statut].label, FACTURES_CONFIG.STATUTS[facture.statut].icon)}
                </span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">À payer</span>
                <span class="detail-value">${facture.aPayer ? 'Oui' : 'Non'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Mode de paiement</span>
                <span class="detail-value">${modePaiement}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Date de paiement</span>
                <span class="detail-value">${formaterDate(facture.datePaiement, 'jour')}</span>
            </div>
            ${facture.referenceVirement ? `
                <div class="detail-info-item">
                    <span class="detail-label">Référence virement</span>
                    <span class="detail-value" style="font-family: monospace;">${facture.referenceVirement}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function afficherSectionOrganisation(facture) {
    const detailOrganisation = document.getElementById('detailOrganisation');
    
    detailOrganisation.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Société</span>
                <span class="detail-value">${facture.societe || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Code magasin</span>
                <span class="detail-value">${facture.codeMagasin || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">N° Interne</span>
                <span class="detail-value">${facture.numeroInterne || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Uploadé par</span>
                <span class="detail-value">${facture.magasinUploadeur || '-'}</span>
            </div>
        </div>
    `;
}

function afficherSectionDocuments(facture) {
    const detailDocuments = document.getElementById('detailDocuments');
    
    if (!facture.documents || facture.documents.length === 0) {
        detailDocuments.innerHTML = '<p style="color: #666;">Aucun document</p>';
        return;
    }
    
    const documentsHtml = facture.documents.map(doc => `
        <div class="document-item" style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${doc.nomOriginal || doc.nom}</strong>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        Uploadé le ${formaterDate(doc.dateUpload, 'complet')} • ${(doc.taille / 1024).toFixed(1)} KB
                    </div>
                </div>
                <a href="${doc.url}" target="_blank" class="btn btn-sm btn-secondary">
                    📄 Voir
                </a>
            </div>
        </div>
    `).join('');
    
    detailDocuments.innerHTML = documentsHtml;
}

function afficherSectionHistorique(facture) {
    const detailHistorique = document.getElementById('detailHistorique');
    
    if (!facture.historique || facture.historique.length === 0) {
        detailHistorique.innerHTML = '<p style="color: #666;">Aucun historique</p>';
        return;
    }
    
    // Trier par date décroissante
    const historiqueTrie = [...facture.historique].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    });
    
    const historiqueHtml = historiqueTrie.map(entry => {
        const utilisateur = entry.utilisateur ? 
            `${entry.utilisateur.prenom} ${entry.utilisateur.nom}` : 'Système';
        
        const actionIcon = {
            'creation': '🆕',
            'extraction_ia': '🤖',
            'changement_statut': '🔄',
            'statut_payee': '💰',
            'statut_a_pointer': '🔍',
            'statut_pointee': '✓✓',
            'paiement': '💳',
            'suppression': '🗑️'
        }[entry.action] || '📝';
        
        return `
            <div class="historique-item" style="padding: 12px; border-left: 3px solid #ff6b6b; margin-bottom: 10px; background: #fff5f5;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${actionIcon} ${entry.action.replace(/_/g, ' ').charAt(0).toUpperCase() + entry.action.replace(/_/g, ' ').slice(1)}</strong>
                        <div style="color: #666; font-size: 12px; margin-top: 4px;">
                            ${entry.details || ''}
                        </div>
                        <div style="color: #999; font-size: 11px; margin-top: 4px;">
                            Par ${utilisateur}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #666;">
                        ${formaterDate(entry.date, 'complet')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    detailHistorique.innerHTML = historiqueHtml;
}

// ========================================
// ACTIONS SELON LE STATUT
// ========================================

function afficherActionsFacture(facture) {
    const detailActions = document.getElementById('detailActions');
    let actions = [];
    
    switch (facture.statut) {
        case 'nouvelle':
            actions.push(`
                <button class="btn btn-warning btn-pill" onclick="marquerAPayer('${facture.id}')">
                    💳 Marquer comme à payer
                </button>
                <button class="btn btn-success btn-pill" onclick="marquerDejaPayee('${facture.id}')">
                    ✅ Déjà payée
                </button>
            `);
            break;
            
        case 'a_payer':
        case 'en_retard':
            actions.push(`
                <button class="btn btn-success btn-pill" onclick="marquerPayee('${facture.id}')">
                    💰 Marquer comme payée
                </button>
            `);
            break;
            
        case 'payee':
        case 'deja_payee':
        case 'a_pointer':
            actions.push(`
                <button class="btn btn-info btn-pill" onclick="pointer('${facture.id}')">
                    🔍 Pointer
                </button>
            `);
            break;
    }
    
    // Relancer l'IA si pas encore analysée
    if (!facture.numeroFacture && facture.documents?.length > 0) {
        actions.push(`
            <button class="btn btn-secondary btn-pill" onclick="relancerIA('${facture.id}')">
                🤖 Relancer l'analyse IA
            </button>
        `);
    }
    
    // Action de suppression toujours disponible sauf si pointée
    if (facture.statut !== 'pointee') {
        actions.push(`
            <button class="btn btn-danger btn-sm" onclick="supprimerFacture('${facture.id}')">
                🗑️ Annuler
            </button>
        `);
    }
    
    detailActions.innerHTML = actions.join('');
}

// ========================================
// ACTIONS WINDOW
// ========================================

window.marquerAPayer = async function(factureId) {
    try {
        await FacturesFournisseursService.changerStatut(factureId, 'a_payer');
        await chargerDonnees();
        await voirDetailFacture(factureId);
        afficherSucces('Facture marquée à payer');
    } catch (error) {
        afficherErreur(error.message || 'Erreur lors du changement');
    }
};

window.marquerDejaPayee = async function(factureId) {
    try {
        // Marquer comme déjà payée (qui reste le statut en base)
        await FacturesFournisseursService.changerStatut(factureId, 'deja_payee');
        
        // Recharger pour afficher la Timeline correcte
        await chargerDonnees();
        await voirDetailFacture(factureId);
        
        afficherSucces('Facture marquée comme déjà payée - prête à pointer');
    } catch (error) {
        afficherErreur(error.message || 'Erreur lors du changement');
    }
};

window.marquerPayee = async function(factureId) {
    // Demander le mode de paiement
    const modePaiement = await new Promise((resolve) => {
        const dialogHtml = `
            <div class="dialog-overlay"></div>
            <div class="dialog-box">
                <div class="dialog-header">
                    <div class="dialog-icon success">💰</div>
                    <h3 class="dialog-title">Marquer comme payée</h3>
                </div>
                <div class="dialog-body">
                    <div>
                        <label style="display: block; margin-bottom: 10px; font-weight: 600;">
                            Mode de paiement
                        </label>
                        <select id="modePaiement" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px;">
                            <option value="virement">🏦 Virement</option>
                            <option value="prelevement">🔄 Prélèvement</option>
                            <option value="cheque">📄 Chèque</option>
                            <option value="cb">💳 Carte bancaire</option>
                            <option value="especes">💵 Espèces</option>
                        </select>
                    </div>
                    <div style="margin-top: 15px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: 600;">
                            Référence (optionnel)
                        </label>
                        <input type="text" id="referenceVirement" 
                               placeholder="Ex: VIR-2025-001" 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px;">
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn secondary paiement-cancel">Annuler</button>
                    <button class="dialog-btn success paiement-confirm">Confirmer</button>
                </div>
            </div>
        `;
        
        const dialogContainer = document.getElementById('dialog-container');
        if (!dialogContainer) {
            resolve(null);
            return;
        }
        
        dialogContainer.innerHTML = dialogHtml;
        dialogContainer.classList.add('active');
        
        const confirmBtn = document.querySelector('.paiement-confirm');
        const cancelBtn = document.querySelector('.paiement-cancel');
        const overlay = document.querySelector('.dialog-overlay');
        
        const handleConfirm = () => {
            const mode = document.getElementById('modePaiement').value;
            const reference = document.getElementById('referenceVirement').value.trim();
            
            dialogContainer.classList.remove('active');
            setTimeout(() => {
                dialogContainer.innerHTML = '';
            }, 200);
            
            resolve({ mode, reference });
        };
        
        const handleCancel = () => {
            dialogContainer.classList.remove('active');
            setTimeout(() => {
                dialogContainer.innerHTML = '';
            }, 200);
            resolve(null);
        };
        
        if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
        if (overlay) overlay.addEventListener('click', handleCancel);
    });
    
    if (modePaiement) {
        try {
            await FacturesFournisseursService.changerStatut(factureId, 'payee', {
                modePaiement: modePaiement.mode,
                referenceVirement: modePaiement.reference || null
            });
            await chargerDonnees();
            await voirDetailFacture(factureId);
            afficherSucces('Facture marquée comme payée');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors du paiement');
        }
    }
};

window.pointer = async function(factureId) {
    const confirme = await config.Dialog.confirm(
        'Confirmer le rapprochement bancaire de cette facture ?',
        'Rapprochement bancaire'
    );
    
    if (confirme) {
        try {
            // Récupérer la facture actuelle pour vérifier son statut
            const facture = await FacturesFournisseursService.getFacture(factureId);
            
            if (facture.statut === 'deja_payee') {
                // Si "déjà payée", passer d'abord à "à pointer"
                await FacturesFournisseursService.changerStatut(factureId, 'a_pointer');
                // Puis immédiatement à "pointée"
                await FacturesFournisseursService.changerStatut(factureId, 'pointee');
            } else {
                // Sinon, passer directement à "pointée"
                await FacturesFournisseursService.changerStatut(factureId, 'pointee');
            }
            
            await chargerDonnees();
            window.modalManager.close('modalDetailFacture');
            afficherSucces('Facture pointée');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors du pointage');
        }
    }
};

window.supprimerFacture = async function(factureId) {
    const confirme = await config.Dialog.confirm(
        'Êtes-vous sûr de vouloir annuler cette facture ?\n\nElle ne sera pas supprimée mais marquée comme annulée.',
        'Annulation de la facture',
        {
            confirmText: 'Annuler la facture',
            confirmClass: 'danger'
        }
    );
    
    if (confirme) {
        try {
            await FacturesFournisseursService.supprimerFacture(factureId);
            await chargerDonnees();
            window.modalManager.close('modalDetailFacture');
            afficherSucces('Facture annulée');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de l\'annulation');
        }
    }
};

window.relancerIA = async function(factureId) {
    try {
        config.notify.info('🤖 Analyse IA en cours...');
        
        const OpenAIService = await import('./factures-fournisseurs.openai.service.js');
        const resultIA = await OpenAIService.default.analyserDocumentExistant(factureId);
        
        console.log('✅ Résultat IA:', resultIA);
        
        await chargerDonnees();
        await voirDetailFacture(factureId);
        
        afficherSucces('Analyse IA terminée !');
        
    } catch (error) {
        console.error('❌ Erreur IA:', error);
        afficherErreur('Erreur lors de l\'analyse IA : ' + error.message);
    }
};

// ========================================
// NETTOYAGE
// ========================================

window.addEventListener('beforeunload', () => {
    if (timelineInstance) {
        timelineInstance.destroy();
        timelineInstance = null;
    }
});

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Architecture IoC stricte
   - Timeline générique avec items créés ici
   - Gestion du workflow factures
   - Actions selon le statut avec paiement
   
   NOTES POUR REPRISES FUTURES:
   - La logique métier est ICI, pas dans Timeline
   - Timeline est un composant générique
   - Les actions changent selon le statut
   - Workflow adapté aux factures fournisseurs
   ======================================== */
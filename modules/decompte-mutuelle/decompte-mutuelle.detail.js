// ========================================
// DECOMPTE-MUTUELLE.DETAIL.JS - Orchestrateur du détail décompte
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.detail.js
//
// DESCRIPTION:
// Orchestre l'affichage détaillé d'un décompte avec Timeline
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
// - DecomptesMutuellesService (logique métier)
// - Timeline (composant UI générique)
// - config (factories)
// ========================================

import { DecomptesMutuellesService } from './decompte-mutuelle.service.js';
import { 
    DECOMPTES_CONFIG,
    formaterDate,
    formaterMontant,
    formaterNSS
} from './decompte-mutuelle.data.js';
import config from './decompte-mutuelle.config.js';
import { chargerDonnees } from './decompte-mutuelle.list.js';
import { afficherSucces, afficherErreur } from './decompte-mutuelle.main.js';

// ========================================
// VARIABLES GLOBALES DU MODULE
// ========================================

// Décompte actuellement affiché
let decompteActuel = null;

// Instance de Timeline
let timelineInstance = null;

// ========================================
// FONCTION PRINCIPALE : AFFICHER LE DÉTAIL
// ========================================

export async function voirDetailDecompte(decompteId) {
    try {
        const decompte = await DecomptesMutuellesService.getDecompte(decompteId);
        if (!decompte) return;
        
        decompteActuel = decompte;
        afficherDetailDecompte(decompte);
        window.modalManager.open('modalDetailDecompte');
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
    }
}

// ========================================
// AFFICHAGE DU DÉTAIL
// ========================================

function afficherDetailDecompte(decompte) {
    // En-tête
    document.getElementById('detailNumDecompte').textContent = decompte.numeroDecompte;
    
    // Timeline
    afficherTimeline(decompte);
    
    // Sections d'information
    afficherSectionClient(decompte);
    afficherSectionMutuelle(decompte);
    afficherSectionMontants(decompte);
    afficherSectionInformations(decompte);
    
    // Actions disponibles
    afficherActionsDecompte(decompte);
}

// ========================================
// TIMELINE
// ========================================

function afficherTimeline(decompte) {
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
    const items = creerItemsTimeline(decompte);
    
    // Créer la nouvelle timeline
    try {
        timelineInstance = config.createDecompteTimeline('#timeline', items, {
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

function creerItemsTimeline(decompte) {
    const items = [];
    const sequence = ['nouveau', 'traitement_ia', 'traitement_effectue', 'rapprochement_bancaire'];
    
    // Ajouter traitement_manuel si nécessaire
    if (decompte.statut === 'traitement_manuel' || decompte.dates.traitementManuel) {
        const index = sequence.indexOf('traitement_effectue');
        sequence.splice(index, 0, 'traitement_manuel');
    }
    
    sequence.forEach(statutKey => {
        const statutConfig = DECOMPTES_CONFIG.STATUTS[statutKey];
        const isCompleted = isStatutComplete(decompte, statutKey);
        const isCurrent = decompte.statut === statutKey;
        
        items.push({
            label: statutConfig.label,
            icon: statutConfig.icon,
            date: getDateStatut(decompte, statutKey),
            status: isCurrent ? 'current' : (isCompleted ? 'completed' : 'pending'),
            details: statutConfig.description
        });
    });
    
    return items;
}

function isStatutComplete(decompte, statut) {
    const sequence = ['nouveau', 'traitement_ia', 'traitement_effectue', 'rapprochement_bancaire'];
    const currentIndex = sequence.indexOf(decompte.statut);
    const statutIndex = sequence.indexOf(statut);
    
    // Cas spécial pour traitement_manuel
    if (statut === 'traitement_manuel') {
        return decompte.dates.traitementManuel !== null;
    }
    
    return statutIndex < currentIndex || decompte.dates[getDateField(statut)] !== null;
}

function getDateStatut(decompte, statut) {
    const dateField = getDateField(statut);
    const date = decompte.dates[dateField];
    
    if (date) {
        return formaterDate(date, 'complet');
    }
    
    return null;
}

function getDateField(statut) {
    const mapping = {
        'nouveau': 'creation',
        'traitement_ia': 'transmissionIA',
        'traitement_effectue': 'traitementEffectue',
        'traitement_manuel': 'traitementManuel',
        'rapprochement_bancaire': 'rapprochementBancaire'
    };
    
    return mapping[statut] || 'creation';
}

// ========================================
// SECTIONS D'AFFICHAGE
// ========================================

function afficherSectionClient(decompte) {
    const detailClient = document.getElementById('detailClient');
    
    // Gestion des valeurs null
    const nomComplet = (decompte.client?.nom || decompte.client?.prenom) 
        ? `${decompte.client.prenom || ''} ${decompte.client.nom || ''}`.trim()
        : '-';
    
    const nss = decompte.client?.numeroSecuriteSociale 
        ? formaterNSS(decompte.client.numeroSecuriteSociale)
        : '-';
    
    detailClient.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Nom complet</span>
                <span class="detail-value">${nomComplet}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">N° Sécurité Sociale</span>
                <span class="detail-value nss-value">${nss}</span>
            </div>
        </div>
    `;
}

function afficherSectionMutuelle(decompte) {
    const detailMutuelle = document.getElementById('detailMutuelle');
    detailMutuelle.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Mutuelle</span>
                <span class="detail-value">${decompte.mutuelle || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Prestataire TP</span>
                <span class="detail-value">${decompte.prestataireTP || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Type de décompte</span>
                <span class="detail-value">${config.HTML_TEMPLATES.typeDecompte(decompte.typeDecompte)}</span>
            </div>
            ${decompte.typeDecompte === 'groupe' ? `
                <div class="detail-info-item">
                    <span class="detail-label">Nombre de clients</span>
                    <span class="detail-value">${decompte.nombreClients}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function afficherSectionMontants(decompte) {
    const detailMontants = document.getElementById('detailMontants');
    detailMontants.innerHTML = `
        <div class="montants-detail">
            <div class="montant-row">
                <span class="montant-label">Remboursement client</span>
                <span class="detail-value">${formaterMontant(decompte.montantRemboursementClient)}</span>
            </div>
            ${decompte.typeDecompte === 'groupe' ? `
                <div class="montant-row">
                    <span class="montant-label">Nombre de clients</span>
                    <span class="detail-value">× ${decompte.nombreClients}</span>
                </div>
            ` : ''}
            <div class="montant-row montant-total">
                <span class="montant-label">Montant du virement</span>
                <span class="detail-value">${formaterMontant(decompte.montantVirement)}</span>
            </div>
        </div>
    `;
}

function afficherSectionInformations(decompte) {
    const detailInformations = document.getElementById('detailInformations');
    
    // Gestion de la date virement
    const dateVirement = decompte.dateVirement 
        ? formaterDate(decompte.dateVirement, 'jour')
        : '-';
    
    detailInformations.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">N° Virement</span>
                <span class="detail-value">${decompte.virementId || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Date virement</span>
                <span class="detail-value">${dateVirement}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Code magasin</span>
                <span class="detail-value">${decompte.codeMagasin || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Société</span>
                <span class="detail-value">${decompte.societe || '-'}</span>
            </div>
        </div>
        ${decompte.motifTraitementManuel ? `
            <div class="detail-info-item" style="margin-top: 15px;">
                <span class="detail-label">Motif traitement manuel</span>
                <span class="detail-value" style="color: #f57c00;">${decompte.motifTraitementManuel}</span>
            </div>
        ` : ''}
    `;
}

// ========================================
// ACTIONS SELON LE STATUT
// ========================================

function afficherActionsDecompte(decompte) {
    const detailActions = document.getElementById('detailActions');
    let actions = [];
    
    switch (decompte.statut) {
        case 'nouveau':
            actions.push(`
                <button class="btn btn-info btn-pill" onclick="transmettreIA('${decompte.id}')">
                    🤖 Transmettre à l'IA
                </button>
            `);
            break;
            
        case 'traitement_ia':
            actions.push(`
                <button class="btn btn-success btn-pill" onclick="validerTraitement('${decompte.id}')">
                    ✅ Valider le traitement
                </button>
                <button class="btn btn-warning btn-pill" onclick="passerTraitementManuel('${decompte.id}')">
                    ✏️ Passer en traitement manuel
                </button>
            `);
            break;
            
        case 'traitement_effectue':
        case 'traitement_manuel':
            actions.push(`
                <button class="btn btn-primary btn-pill" onclick="rapprochementBancaire('${decompte.id}')">
                    🔗 Rapprochement bancaire
                </button>
            `);
            break;
    }
    
    // Action de suppression toujours disponible sauf si déjà supprimé ou rapproché
    if (decompte.statut !== 'supprime' && decompte.statut !== 'rapprochement_bancaire') {
        actions.push(`
            <button class="btn btn-danger btn-sm" onclick="supprimerDecompte('${decompte.id}')">
                🗑️ Supprimer
            </button>
        `);
    }
    
    detailActions.innerHTML = actions.join('');
}

// ========================================
// ACTIONS WINDOW
// ========================================

window.transmettreIA = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Confirmer la transmission à l\'IA pour traitement automatique ?',
        'Transmission IA'
    );
    
    if (confirme) {
        try {
            await DecomptesMutuellesService.changerStatut(decompteId, 'traitement_ia');
            await chargerDonnees();
            await voirDetailDecompte(decompteId);
            afficherSucces('Décompte transmis à l\'IA');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de la transmission');
        }
    }
};

window.validerTraitement = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Confirmer la validation du traitement IA ?',
        'Validation du traitement'
    );
    
    if (confirme) {
        try {
            await DecomptesMutuellesService.changerStatut(decompteId, 'traitement_effectue');
            await chargerDonnees();
            await voirDetailDecompte(decompteId);
            afficherSucces('Traitement validé');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de la validation');
        }
    }
};

window.passerTraitementManuel = async function(decompteId) {
    const motif = await new Promise((resolve) => {
        const dialogHtml = `
            <div class="dialog-overlay"></div>
            <div class="dialog-box">
                <div class="dialog-header">
                    <div class="dialog-icon warning">✏️</div>
                    <h3 class="dialog-title">Traitement manuel</h3>
                </div>
                <div class="dialog-body">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                            Motif du traitement manuel *
                        </label>
                        <textarea id="motifManuel" 
                                  placeholder="Précisez la raison..." 
                                  rows="3"
                                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; 
                                         border-radius: 6px; box-sizing: border-box; resize: vertical;"
                                  required></textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn secondary manuel-cancel">Annuler</button>
                    <button class="dialog-btn warning manuel-confirm">Confirmer</button>
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
        
        const motifTextarea = document.getElementById('motifManuel');
        const confirmBtn = document.querySelector('.manuel-confirm');
        const cancelBtn = document.querySelector('.manuel-cancel');
        const overlay = document.querySelector('.dialog-overlay');
        
        setTimeout(() => {
            if (motifTextarea) motifTextarea.focus();
        }, 100);
        
        const handleConfirm = () => {
            const motif = motifTextarea ? motifTextarea.value.trim() : '';
            
            if (!motif) {
                if (motifTextarea) {
                    motifTextarea.style.borderColor = '#f44336';
                    motifTextarea.focus();
                }
                return;
            }
            
            dialogContainer.classList.remove('active');
            setTimeout(() => {
                dialogContainer.innerHTML = '';
            }, 200);
            
            resolve(motif);
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
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
        
        const originalResolve = resolve;
        resolve = (value) => {
            document.removeEventListener('keydown', handleKeydown);
            originalResolve(value);
        };
    });
    
    if (motif) {
        try {
            await DecomptesMutuellesService.changerStatut(decompteId, 'traitement_manuel', {
                motif: motif
            });
            await chargerDonnees();
            await voirDetailDecompte(decompteId);
            afficherSucces('Décompte passé en traitement manuel');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors du changement');
        }
    }
};

window.rapprochementBancaire = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Confirmer le rapprochement bancaire ?\n\nCette action est définitive.',
        'Rapprochement bancaire'
    );
    
    if (confirme) {
        try {
            await DecomptesMutuellesService.changerStatut(decompteId, 'rapprochement_bancaire');
            await chargerDonnees();
            window.modalManager.close('modalDetailDecompte');
            afficherSucces('Rapprochement bancaire effectué');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors du rapprochement');
        }
    }
};

window.supprimerDecompte = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Êtes-vous sûr de vouloir supprimer ce décompte ?\n\nCette action est irréversible.',
        'Suppression du décompte',
        {
            confirmText: 'Supprimer',
            confirmClass: 'danger'
        }
    );
    
    if (confirme) {
        try {
            await DecomptesMutuellesService.supprimerDecompte(decompteId);
            await chargerDonnees();
            window.modalManager.close('modalDetailDecompte');
            afficherSucces('Décompte supprimé');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de la suppression');
        }
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
   
   [02/02/2025] - Création initiale
   - Architecture IoC stricte
   - Timeline générique avec items créés ici
   - Gestion du workflow métier
   - Actions selon le statut
   
   NOTES POUR REPRISES FUTURES:
   - La logique métier est ICI, pas dans Timeline
   - Timeline est un composant générique
   - Les actions changent selon le statut
   ======================================== */
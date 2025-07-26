// ========================================
// COMMANDES.DETAIL.JS - Gestion du détail et des modifications (VERSION AMÉLIORÉE)
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { Dialog, confirmerAction, notify } from '../../shared/index.js';
import { chargerDonnees } from './commandes.list.js';
import { afficherSucces, afficherErreur } from './commandes.main.js';

// Variable pour stocker la commande actuelle
let commandeActuelle = null;

// ========================================
// DÉTAIL COMMANDE
// ========================================

export async function voirDetailCommande(commandeId) {
    try {
        // Afficher un loader pendant le chargement
        afficherLoader(true);
        
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) {
            afficherErreur('Commande introuvable');
            return;
        }
        
        // Stocker la commande actuelle
        commandeActuelle = commande;
        
        // Afficher les informations dans la modal
        afficherDetailCommande(commande);
        
        // Ouvrir la modal
        window.modalManager.open('modalDetailCommande');
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
    } finally {
        afficherLoader(false);
    }
}

// Fonction pour rafraîchir uniquement le contenu du modal
async function rafraichirDetailCommande() {
    if (!commandeActuelle) return;
    
    try {
        // Recharger les données depuis Firebase
        const commande = await CommandesService.getCommande(commandeActuelle.id);
        if (!commande) return;
        
        // Mettre à jour la commande actuelle
        commandeActuelle = commande;
        
        // Rafraîchir l'affichage
        afficherDetailCommande(commande);
        
        // Animation de succès sur la timeline
        animerTimeline();
        
    } catch (error) {
        console.error('Erreur rafraîchissement:', error);
        afficherErreur('Erreur lors du rafraîchissement');
    }
}

function afficherDetailCommande(commande) {
    // Numéro de commande
    document.getElementById('detailNumCommande').textContent = commande.numeroCommande;
    
    // Timeline du statut
    afficherTimeline(commande);
    
    // Informations client
    const detailClient = document.getElementById('detailClient');
    detailClient.innerHTML = `
        <div class="detail-info">
            <span class="detail-label">Nom :</span>
            <span class="detail-value">${commande.client.prenom} ${commande.client.nom}</span>
        </div>
        <div class="detail-info">
            <span class="detail-label">Téléphone :</span>
            <span class="detail-value">${commande.client.telephone || '-'}</span>
        </div>
        <div class="detail-info">
            <span class="detail-label">Email :</span>
            <span class="detail-value">${commande.client.email || '-'}</span>
        </div>
        <div class="detail-info">
            <span class="detail-label">Magasin :</span>
            <span class="detail-value">${commande.magasinReference}</span>
        </div>
    `;
    
    // Produits commandés
    const detailProduits = document.getElementById('detailProduits');
    detailProduits.innerHTML = `
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Qté</th>
                </tr>
            </thead>
            <tbody>
                ${commande.produits.map(p => `
                    <tr>
                        <td>
                            ${p.designation}
                            ${p.cote ? `<small>(${p.cote})</small>` : ''}
                            ${p.numeroSerie ? `<br><small>NS: ${p.numeroSerie}</small>` : ''}
                        </td>
                        <td style="text-align: center;">${p.quantite}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Informations de livraison
    const detailLivraison = document.getElementById('detailLivraison');
    detailLivraison.innerHTML = `
        <div class="detail-info">
            <span class="detail-label">Type :</span>
            <span class="detail-value">${COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label}</span>
        </div>
        <div class="detail-info">
            <span class="detail-label">Urgence :</span>
            <span class="detail-value">${COMMANDES_CONFIG.NIVEAUX_URGENCE[commande.niveauUrgence]?.label}</span>
        </div>
        <div class="detail-info">
            <span class="detail-label">Magasin livraison :</span>
            <span class="detail-value">${commande.magasinLivraison}</span>
        </div>
        <div class="detail-info">
            <span class="detail-label">Date prévue :</span>
            <span class="detail-value">${formatDate(commande.dates.livraisonPrevue)}</span>
        </div>
        ${commande.commentaires ? `
            <div class="detail-info">
                <span class="detail-label">Commentaires :</span>
                <span class="detail-value">${commande.commentaires}</span>
            </div>
        ` : ''}
    `;
    
    // Section expédition (si nécessaire)
    const sectionExpedition = document.getElementById('sectionExpedition');
    if (commande.expedition?.necessiteExpedition) {
        sectionExpedition.style.display = 'block';
        const detailExpedition = document.getElementById('detailExpedition');
        
        if (commande.expedition.envoi?.numeroSuivi) {
            detailExpedition.innerHTML = `
                <div class="detail-info">
                    <span class="detail-label">Transporteur :</span>
                    <span class="detail-value">${commande.expedition.envoi.transporteur}</span>
                </div>
                <div class="detail-info">
                    <span class="detail-label">N° suivi :</span>
                    <span class="detail-value">${commande.expedition.envoi.numeroSuivi}</span>
                </div>
                <div class="detail-info">
                    <span class="detail-label">Date envoi :</span>
                    <span class="detail-value">${formatDate(commande.expedition.envoi.dateEnvoi)}</span>
                </div>
            `;
        } else {
            detailExpedition.innerHTML = '<p>En attente d\'expédition</p>';
        }
    } else {
        sectionExpedition.style.display = 'none';
    }
    
    // Historique de la commande (si présent)
    if (commande.historique && commande.historique.length > 0) {
        const historiqueSection = document.createElement('div');
        historiqueSection.className = 'detail-section';
        historiqueSection.innerHTML = `
            <h3>Historique</h3>
            <div class="historique-list">
                ${commande.historique.map(h => `
                    <div class="historique-item">
                        <span class="historique-date">${formatDate(h.date)} ${formatTime(h.date)}</span>
                        <span class="historique-action">${h.details}</span>
                        <span class="historique-user">par ${h.utilisateur.prenom} ${h.utilisateur.nom}</span>
                    </div>
                `).join('')}
            </div>
        `;
        document.querySelector('.detail-sections').appendChild(historiqueSection);
    }
    
    // Actions disponibles
    afficherActionsCommande(commande);
}

function afficherTimeline(commande) {
    const timeline = document.getElementById('timeline');
    const statuts = ['nouvelle', 'preparation', 'terminee', 'expediee', 'receptionnee', 'livree'];
    
    timeline.innerHTML = statuts.map(statut => {
        const config = COMMANDES_CONFIG.STATUTS[statut];
        let className = 'timeline-item';
        
        if (commande.statut === 'annulee') {
            className += ' disabled';
        } else if (statut === commande.statut) {
            className += ' active';
        } else if (statuts.indexOf(statut) < statuts.indexOf(commande.statut)) {
            className += ' completed';
        }
        
        return `
            <div class="${className}" data-statut="${statut}">
                <div class="timeline-icon">${config.icon}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${config.label}</div>
                    <div class="timeline-date">${getDateForStatut(commande, statut)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function animerTimeline() {
    // Ajouter une animation pulse sur l'étape active
    const activeItem = document.querySelector('.timeline-item.active');
    if (activeItem) {
        activeItem.classList.add('pulse');
        setTimeout(() => {
            activeItem.classList.remove('pulse');
        }, 1000);
    }
}

function getDateForStatut(commande, statut) {
    switch (statut) {
        case 'nouvelle':
            return formatDate(commande.dates.commande);
        case 'preparation':
            return formatDate(commande.dates.preparationDebut) || '-';
        case 'terminee':
            return formatDate(commande.dates.preparationFin) || '-';
        case 'expediee':
            return formatDate(commande.dates.expeditionValidee) || '-';
        case 'receptionnee':
            return formatDate(commande.dates.receptionValidee) || '-';
        case 'livree':
            return formatDate(commande.dates.livraisonClient) || '-';
        default:
            return '-';
    }
}

function afficherActionsCommande(commande) {
    const detailActions = document.getElementById('detailActions');
    let actions = [];
    
    // Désactiver les boutons pendant le chargement
    detailActions.classList.remove('loading');
    
    // Actions selon le statut
    switch (commande.statut) {
        case 'nouvelle':
            actions.push(`
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'preparation')">
                    <span class="btn-icon">🔄</span>
                    <span class="btn-text">Commencer la préparation</span>
                </button>
            `);
            break;
            
        case 'preparation':
            actions.push(`
                <button class="btn btn-secondary" onclick="saisirNumerosSerie('${commande.id}')">
                    <span class="btn-icon">🔢</span>
                    <span class="btn-text">Saisir les numéros de série</span>
                </button>
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'terminee')">
                    <span class="btn-icon">✅</span>
                    <span class="btn-text">Terminer la préparation</span>
                </button>
            `);
            break;
            
        case 'terminee':
            if (commande.expedition?.necessiteExpedition) {
                actions.push(`
                    <button class="btn btn-primary" onclick="saisirExpedition('${commande.id}')">
                        <span class="btn-icon">📦</span>
                        <span class="btn-text">Valider l'expédition</span>
                    </button>
                `);
            } else {
                actions.push(`
                    <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'livree')">
                        <span class="btn-icon">✅</span>
                        <span class="btn-text">Marquer comme livrée</span>
                    </button>
                `);
            }
            break;
            
        case 'expediee':
            actions.push(`
                <button class="btn btn-primary" onclick="validerReception('${commande.id}')">
                    <span class="btn-icon">📥</span>
                    <span class="btn-text">Valider la réception</span>
                </button>
            `);
            break;
            
        case 'receptionnee':
            if (!commande.patientPrevenu) {
                actions.push(`
                    <button class="btn btn-secondary" onclick="marquerPatientPrevenu('${commande.id}')">
                        <span class="btn-icon">📞</span>
                        <span class="btn-text">Patient prévenu</span>
                    </button>
                `);
            }
            actions.push(`
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'livree')">
                    <span class="btn-icon">✅</span>
                    <span class="btn-text">Livrer au patient</span>
                </button>
            `);
            break;
    }
    
    // Bouton annuler (sauf si déjà annulée ou livrée)
    if (commande.statut !== 'annulee' && commande.statut !== 'livree') {
        actions.push(`
            <button class="btn btn-danger" onclick="annulerCommande('${commande.id}')">
                <span class="btn-icon">❌</span>
                <span class="btn-text">Annuler la commande</span>
            </button>
        `);
    }
    
    // Ajouter un bouton pour rafraîchir
    actions.push(`
        <button class="btn btn-secondary" onclick="rafraichirDetail()">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Rafraîchir</span>
        </button>
    `);
    
    detailActions.innerHTML = actions.join('');
}

// ========================================
// CHANGEMENT DE STATUT
// ========================================

export async function changerStatutCommande(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        const prochainStatut = COMMANDES_CONFIG.STATUTS[commande.statut]?.suivant;
        if (!prochainStatut) return;
        
        const confirme = await confirmerAction({
            titre: 'Confirmation du changement de statut',
            message: `Passer la commande au statut "${COMMANDES_CONFIG.STATUTS[prochainStatut].label}" ?`,
            boutonConfirmer: 'Confirmer',
            boutonAnnuler: 'Annuler',
            danger: false
        });
        
        if (confirme) {
            await CommandesService.changerStatut(commandeId, prochainStatut);
            await chargerDonnees();
            afficherSucces('Statut mis à jour');
        }
        
    } catch (error) {
        console.error('Erreur changement statut:', error);
        afficherErreur('Erreur lors du changement de statut');
    }
}

// Fonction exposée pour les actions depuis la modal détail
window.changerStatutDetail = async function(commandeId, nouveauStatut) {
    try {
        const labelStatut = COMMANDES_CONFIG.STATUTS[nouveauStatut]?.label || nouveauStatut;
        
        const confirme = await confirmerAction({
            titre: 'Confirmation',
            message: `Confirmer le passage au statut "${labelStatut}" ?`,
            boutonConfirmer: 'Confirmer',
            boutonAnnuler: 'Annuler'
        });
        
        if (!confirme) return;
        
        // Afficher un loader sur les boutons
        afficherLoaderActions(true);
        
        // Effectuer le changement
        await CommandesService.changerStatut(commandeId, nouveauStatut);
        
        // Rafraîchir le modal au lieu de le fermer
        await rafraichirDetailCommande();
        
        // Rafraîchir aussi la liste en arrière-plan
        await chargerDonnees();
        
        // Notification de succès
        notify.success(`Statut mis à jour : ${labelStatut}`);
        
    } catch (error) {
        console.error('Erreur changement statut:', error);
        afficherErreur('Erreur lors du changement de statut: ' + error.message);
    } finally {
        afficherLoaderActions(false);
    }
};

// ========================================
// ACTIONS SPÉCIFIQUES
// ========================================

window.saisirNumerosSerie = async function(commandeId) {
    try {
        // Créer un formulaire pour saisir les NS
        const commande = commandeActuelle;
        let formulaireHtml = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        
        commande.produits.forEach((produit, index) => {
            if (produit.type === 'appareil_auditif' && produit.cote) {
                formulaireHtml += `
                    <div>
                        <label style="font-weight: 600; margin-bottom: 5px; display: block;">
                            ${produit.designation} (${produit.cote})
                        </label>
                        <input type="text" 
                               id="ns_${index}" 
                               placeholder="Numéro de série"
                               style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
                    </div>
                `;
            }
        });
        
        formulaireHtml += '</div>';
        
        const result = await Dialog.custom({
            type: 'info',
            title: 'Saisir les numéros de série',
            message: formulaireHtml,
            showCancel: true,
            confirmText: 'Valider',
            cancelText: 'Annuler'
        });
        
        if (!result) return;
        
        // Récupérer les valeurs saisies
        const numerosSerie = {};
        commande.produits.forEach((produit, index) => {
            if (produit.type === 'appareil_auditif' && produit.cote) {
                const input = document.getElementById(`ns_${index}`);
                if (input && input.value) {
                    numerosSerie[produit.cote] = input.value;
                }
            }
        });
        
        // Mettre à jour les NS
        await CommandesService.mettreAJourNumerosSerie(commandeId, numerosSerie);
        
        // Rafraîchir
        await rafraichirDetailCommande();
        
        notify.success('Numéros de série enregistrés');
        
    } catch (error) {
        console.error('Erreur saisie NS:', error);
        afficherErreur('Erreur lors de la saisie des numéros de série');
    }
};

window.saisirExpedition = async function(commandeId) {
    try {
        // Récupérer les transporteurs depuis les paramètres
        const transporteurs = ['Colissimo', 'Chronopost', 'UPS', 'Livraison interne'];
        
        // Créer le formulaire d'expédition
        const formulaireHtml = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="font-weight: 600; margin-bottom: 5px; display: block;">
                        Transporteur
                    </label>
                    <select id="transporteur" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
                        ${transporteurs.map(t => `<option value="${t}" ${t === 'Colissimo' ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="font-weight: 600; margin-bottom: 5px; display: block;">
                        Numéro de suivi
                    </label>
                    <input type="text" 
                           id="numeroSuivi" 
                           placeholder="Ex: 6C12345678901"
                           style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;"
                           required>
                </div>
            </div>
        `;
        
        const result = await Dialog.custom({
            type: 'info',
            title: '📦 Valider l\'expédition',
            message: formulaireHtml,
            showCancel: true,
            confirmText: 'Valider',
            cancelText: 'Annuler'
        });
        
        if (!result) return;
        
        const transporteur = document.getElementById('transporteur').value;
        const numeroSuivi = document.getElementById('numeroSuivi').value;
        
        if (!numeroSuivi) {
            notify.warning('Le numéro de suivi est obligatoire');
            return;
        }
        
        afficherLoaderActions(true);
        
        await CommandesService.changerStatut(commandeId, 'expediee', {
            numeroSuivi: numeroSuivi,
            transporteur: transporteur
        });
        
        await rafraichirDetailCommande();
        await chargerDonnees();
        
        notify.success(`Expédition validée avec ${transporteur}`);
    } catch (error) {
        console.error('Erreur validation expédition:', error);
        afficherErreur('Erreur lors de la validation de l\'expédition');
    } finally {
        afficherLoaderActions(false);
    }
};

window.validerReception = async function(commandeId) {
    try {
        const confirme = await confirmerAction({
            titre: 'Valider la réception',
            message: 'Confirmez-vous avoir reçu le colis en bon état ?',
            boutonConfirmer: 'Oui, colis reçu',
            boutonAnnuler: 'Annuler'
        });
        
        if (!confirme) return;
        
        afficherLoaderActions(true);
        
        await CommandesService.changerStatut(commandeId, 'receptionnee', {
            colisConforme: true
        });
        
        await rafraichirDetailCommande();
        await chargerDonnees();
        
        notify.success('Réception validée');
    } catch (error) {
        console.error('Erreur validation réception:', error);
        afficherErreur('Erreur lors de la validation de la réception');
    } finally {
        afficherLoaderActions(false);
    }
};

window.marquerPatientPrevenu = async function(commandeId) {
    try {
        afficherLoaderActions(true);
        
        await CommandesService.marquerPatientPrevenu(commandeId);
        await rafraichirDetailCommande();
        
        notify.success('Patient marqué comme prévenu');
    } catch (error) {
        console.error('Erreur marquage patient:', error);
        afficherErreur('Erreur lors du marquage du patient');
    } finally {
        afficherLoaderActions(false);
    }
};

window.annulerCommande = async function(commandeId) {
    try {
        const confirme = await confirmerAction({
            titre: 'Annuler la commande',
            message: 'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.',
            boutonConfirmer: 'Annuler la commande',
            boutonAnnuler: 'Non, conserver',
            danger: true
        });
        
        if (!confirme) return;
        
        const motif = await Dialog.prompt('Motif d\'annulation :', '', 'Annulation');
        if (!motif) return;
        
        afficherLoaderActions(true);
        
        await CommandesService.changerStatut(commandeId, 'annulee', {
            motif: motif
        });
        
        await rafraichirDetailCommande();
        await chargerDonnees();
        
        notify.error('Commande annulée');
    } catch (error) {
        console.error('Erreur annulation:', error);
        afficherErreur('Erreur lors de l\'annulation');
    } finally {
        afficherLoaderActions(false);
    }
};

// Fonction pour rafraîchir manuellement
window.rafraichirDetail = async function() {
    try {
        afficherLoaderActions(true);
        await rafraichirDetailCommande();
        notify.info('Données rafraîchies');
    } catch (error) {
        console.error('Erreur rafraîchissement:', error);
        afficherErreur('Erreur lors du rafraîchissement');
    } finally {
        afficherLoaderActions(false);
    }
};

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function formatDate(timestamp) {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function afficherLoader(show) {
    // Ajouter un loader global si nécessaire
    const modalBody = document.querySelector('#modalDetailCommande .modal-body');
    if (modalBody) {
        modalBody.style.opacity = show ? '0.5' : '1';
    }
}

function afficherLoaderActions(show) {
    const detailActions = document.getElementById('detailActions');
    if (detailActions) {
        if (show) {
            detailActions.classList.add('loading');
            // Désactiver tous les boutons
            detailActions.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
            });
        } else {
            detailActions.classList.remove('loading');
            // Réactiver les boutons
            detailActions.querySelectorAll('button').forEach(btn => {
                btn.disabled = false;
            });
        }
    }
}
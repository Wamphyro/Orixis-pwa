// ========================================
// COMMANDES.DETAIL.JS - Gestion du détail et des modifications
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { confirmerAction } from '../../shared/modal.component.js';
import { chargerDonnees } from './commandes.list.js';
import { afficherSucces, afficherErreur } from './commandes.main.js';

// ========================================
// DÉTAIL COMMANDE
// ========================================

export async function voirDetailCommande(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        // Afficher les informations dans la modal
        afficherDetailCommande(commande);
        
        // Ouvrir la modal
        window.modalManager.open('modalDetailCommande');
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
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
                    <th>Prix unit.</th>
                    <th>Total</th>
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
                        <td>${p.quantite}</td>
                        <td>${formatMoney(p.prixUnitaire)}</td>
                        <td>${formatMoney(p.prixUnitaire * p.quantite)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <th colspan="3">Total</th>
                    <th>${formatMoney(commande.prixTotal)}</th>
                </tr>
            </tfoot>
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
            <div class="${className}">
                <div class="timeline-icon">${config.icon}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${config.label}</div>
                    <div class="timeline-date">${getDateForStatut(commande, statut)}</div>
                </div>
            </div>
        `;
    }).join('');
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
    
    // Actions selon le statut
    switch (commande.statut) {
        case 'nouvelle':
            actions.push(`
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'preparation')">
                    Commencer la préparation
                </button>
            `);
            break;
            
        case 'preparation':
            actions.push(`
                <button class="btn btn-primary" onclick="saisirNumerosSerie('${commande.id}')">
                    Saisir les numéros de série
                </button>
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'terminee')">
                    Terminer la préparation
                </button>
            `);
            break;
            
        case 'terminee':
            if (commande.expedition?.necessiteExpedition) {
                actions.push(`
                    <button class="btn btn-primary" onclick="saisirExpedition('${commande.id}')">
                        📦 Valider l'expédition
                    </button>
                `);
            } else {
                actions.push(`
                    <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'livree')">
                        ✅ Marquer comme livrée
                    </button>
                `);
            }
            break;
            
        case 'expediee':
            actions.push(`
                <button class="btn btn-primary" onclick="validerReception('${commande.id}')">
                    📥 Valider la réception
                </button>
            `);
            break;
            
        case 'receptionnee':
            if (!commande.patientPrevenu) {
                actions.push(`
                    <button class="btn btn-secondary" onclick="marquerPatientPrevenu('${commande.id}')">
                        📞 Patient prévenu
                    </button>
                `);
            }
            actions.push(`
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'livree')">
                    ✅ Livrer au patient
                </button>
            `);
            break;
    }
    
    // Bouton annuler (sauf si déjà annulée ou livrée)
    if (commande.statut !== 'annulee' && commande.statut !== 'livree') {
        actions.push(`
            <button class="btn btn-danger" onclick="annulerCommande('${commande.id}')">
                ❌ Annuler la commande
            </button>
        `);
    }
    
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
        const confirme = await confirmerAction({
            titre: 'Confirmation',
            message: `Confirmer le changement de statut ?`,
            boutonConfirmer: 'Confirmer',
            boutonAnnuler: 'Annuler'
        });
        
        if (confirme) {
            await CommandesService.changerStatut(commandeId, nouveauStatut);
            await chargerDonnees();
            window.modalManager.close('modalDetailCommande');
            afficherSucces('Statut mis à jour');
        }
    } catch (error) {
        console.error('Erreur changement statut:', error);
        afficherErreur('Erreur lors du changement de statut');
    }
};

// ========================================
// ACTIONS SPÉCIFIQUES
// ========================================

window.saisirNumerosSerie = async function(commandeId) {
    // TODO: Implémenter la saisie des numéros de série
    alert('Fonctionnalité de saisie des numéros de série à implémenter');
};

window.saisirExpedition = async function(commandeId) {
    // TODO: Implémenter la saisie des informations d'expédition
    const numeroSuivi = prompt('Numéro de suivi du colis :');
    if (!numeroSuivi) return;
    
    try {
        await CommandesService.changerStatut(commandeId, 'expediee', {
            numeroSuivi: numeroSuivi,
            transporteur: 'Colissimo' // TODO: Permettre le choix du transporteur
        });
        
        await chargerDonnees();
        window.modalManager.close('modalDetailCommande');
        afficherSucces('Expédition validée');
    } catch (error) {
        console.error('Erreur validation expédition:', error);
        afficherErreur('Erreur lors de la validation de l\'expédition');
    }
};

window.validerReception = async function(commandeId) {
    const confirme = await confirmerAction({
        titre: 'Valider la réception',
        message: 'Confirmez-vous avoir reçu le colis en bon état ?',
        boutonConfirmer: 'Oui, colis reçu',
        boutonAnnuler: 'Annuler'
    });
    
    if (confirme) {
        try {
            await CommandesService.changerStatut(commandeId, 'receptionnee', {
                colisConforme: true
            });
            
            await chargerDonnees();
            window.modalManager.close('modalDetailCommande');
            afficherSucces('Réception validée');
        } catch (error) {
            console.error('Erreur validation réception:', error);
            afficherErreur('Erreur lors de la validation de la réception');
        }
    }
};

window.marquerPatientPrevenu = async function(commandeId) {
    try {
        await CommandesService.marquerPatientPrevenu(commandeId);
        await voirDetailCommande(commandeId); // Rafraîchir la modal
        afficherSucces('Patient marqué comme prévenu');
    } catch (error) {
        console.error('Erreur marquage patient:', error);
        afficherErreur('Erreur lors du marquage du patient');
    }
};

window.annulerCommande = async function(commandeId) {
    const confirme = await confirmerAction({
        titre: 'Annuler la commande',
        message: 'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.',
        boutonConfirmer: 'Annuler la commande',
        boutonAnnuler: 'Non, conserver',
        danger: true
    });
    
    if (confirme) {
        const motif = prompt('Motif d\'annulation :');
        if (!motif) return;
        
        try {
            await CommandesService.changerStatut(commandeId, 'annulee', {
                motif: motif
            });
            
            await chargerDonnees();
            window.modalManager.close('modalDetailCommande');
            afficherSucces('Commande annulée');
        } catch (error) {
            console.error('Erreur annulation:', error);
            afficherErreur('Erreur lors de l\'annulation');
        }
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

function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}
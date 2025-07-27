// ========================================
// COMMANDES.DETAIL.JS - Gestion du détail et des modifications + ÉDITION
// Chemin: src/js/pages/commandes/commandes.detail.js
//
// DESCRIPTION:
// Gère l'affichage détaillé d'une commande et les actions de modification de statut.
// Utilise le composant Timeline pour afficher la progression visuelle.
// Modifié le 29/07/2025 : Ajout complet des fonctions d'édition avec icônes stylo
//
// STRUCTURE:
// 1. Imports et dépendances (lignes 15-30)
// 2. Affichage du détail (lignes 32-200)
// 3. Changement de statut (lignes 202-320)
// 4. Actions spécifiques (lignes 322-500)
// 5. Fonction de suppression sécurisée (lignes 502-570)
// 6. NOUVELLES FONCTIONS D'ÉDITION (lignes 572-1200)
// 7. Fonctions utilitaires (lignes 1202-1220)
//
// DÉPENDANCES:
// - CommandesService: Accès aux données des commandes + nouvelles méthodes d'édition
// - Timeline component: Pour l'affichage de la progression
// - Dialog/notify: Pour les interactions utilisateur
// - commandes.serial: Pour la gestion des numéros de série
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { Dialog, confirmerAction, createOrderTimeline, notify } from '../../shared/index.js';
import { chargerDonnees } from './commandes.list.js';
import { afficherSucces, afficherErreur } from './commandes.main.js';

// Variable globale pour stocker la commande en cours d'affichage
let commandeActuelle = null;

// ========================================
// DÉTAIL COMMANDE
// ========================================

export async function voirDetailCommande(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        // Stocker la commande actuelle pour l'édition
        commandeActuelle = commande;
        
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
    
    // ========================================
    // TIMELINE avec le composant
    // ========================================
    const timelineContainer = document.getElementById('timeline');
    
    // Vider le conteneur avant de créer la nouvelle timeline
    timelineContainer.innerHTML = '';
    
    // Utiliser le composant Timeline avec orientation horizontale
    createOrderTimeline(timelineContainer, commande, {
        orientation: 'horizontal',  // Force l'affichage horizontal
        theme: 'colorful',          // Thème avec gradients colorés
        animated: true,             // Animations activées
        showDates: true,            // Afficher les dates
        showLabels: true            // Afficher les labels
    });
    
    // ========================================
    // INFORMATIONS CLIENT - VERSION COMPACTE + ICÔNE ÉDITION
    // ========================================
    const detailClient = document.getElementById('detailClient');
    detailClient.innerHTML = `
        <button class="section-edit-icon" onclick="editerClient()" title="Modifier les informations client">
            ✏️
        </button>
        <div class="detail-info-compact" id="clientReadOnly">
            <div class="info-row">
                <span class="detail-label">Nom :</span>
                <span class="detail-value">${commande.client.prenom} ${commande.client.nom}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Tél :</span>
                <span class="detail-value">${commande.client.telephone || '-'}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Email :</span>
                <span class="detail-value">${commande.client.email || '-'}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Magasin :</span>
                <span class="detail-value">${commande.magasinReference}</span>
            </div>
        </div>
        <div class="edit-form" id="clientEditForm">
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>Prénom *</label>
                    <input type="text" id="editClientPrenom" value="${commande.client.prenom}" required>
                </div>
                <div class="edit-form-group">
                    <label>Nom *</label>
                    <input type="text" id="editClientNom" value="${commande.client.nom}" required>
                </div>
            </div>
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>Téléphone</label>
                    <input type="tel" id="editClientTelephone" value="${commande.client.telephone}">
                </div>
                <div class="edit-form-group">
                    <label>Email</label>
                    <input type="email" id="editClientEmail" value="${commande.client.email}">
                </div>
            </div>
            <div class="edit-actions">
                <button class="edit-btn edit-btn-cancel" onclick="annulerEditionClient()">Annuler</button>
                <button class="edit-btn edit-btn-save" onclick="sauvegarderClient()">Sauvegarder</button>
            </div>
        </div>
    `;
    
// ========================================
// PRODUITS COMMANDÉS - DESIGN ORIGINAL + ICÔNE STYLO
// ========================================
const detailProduits = document.getElementById('detailProduits');
const peutModifierProduits = ['nouvelle', 'preparation'].includes(commande.statut);

detailProduits.innerHTML = `
    ${peutModifierProduits ? `
        <button class="section-edit-icon" onclick="editerProduits()" title="Modifier les produits">
            ✏️
        </button>
    ` : ''}
    <div class="produits-list" id="produitsReadOnly">
        ${commande.produits.map((p, index) => `
            <div class="produit-item" data-index="${index}">
                <div class="produit-header">
                    <div class="produit-nom">
                        ${p.designation}
                        ${p.cote ? `<span class="produit-cote">(${p.cote})</span>` : ''}
                    </div>
                    <div class="produit-quantite">
                        <span class="qty-label">Qté:</span>
                        <span class="qty-value">${p.quantite}</span>
                    </div>
                </div>
                ${(p.type === 'appareil_auditif' || p.necessiteCote || p.numeroSerie) ? `
                    <div class="produit-serial ${p.numeroSerie ? 'serial-ok' : 'serial-missing'}">
                        <span class="serial-icon">${p.numeroSerie ? '✓' : '⚠️'}</span>
                        <span class="serial-label">N° Série :</span>
                        <span class="serial-value">
                            ${p.numeroSerie ? `<code>${p.numeroSerie}</code>` : 'Non saisi'}
                        </span>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    
    <!-- FORMULAIRE D'ÉDITION INTÉGRÉ (caché par défaut) -->
    <div class="edit-form" id="produitsEditForm">
        <!-- Liste des produits existants avec suppression -->
        <div id="editProduitsExistants"></div>
        
        <!-- Recherche et ajout de nouveaux produits -->
        <div class="edit-section">
            <h4>Ajouter un produit</h4>
            <div class="product-search">
                <input type="text" id="editProductSearch" placeholder="Rechercher un produit..." 
                       oninput="rechercherProduitEdit()">
                <div class="search-results" id="editProductSearchResults"></div>
            </div>
        </div>
        
        <div class="edit-actions">
            <button class="edit-btn edit-btn-cancel" onclick="annulerEditionProduits()">Annuler</button>
            <button class="edit-btn edit-btn-save" onclick="sauvegarderProduits()">Sauvegarder</button>
        </div>
    </div>
`;
    
    // ========================================
    // INFORMATIONS DE LIVRAISON + ICÔNE ÉDITION
    // ========================================
    const detailLivraison = document.getElementById('detailLivraison');
    detailLivraison.innerHTML = `
        <button class="section-edit-icon" onclick="editerLivraison()" title="Modifier la livraison">
            ✏️
        </button>
        <div class="detail-info-compact" id="livraisonReadOnly">
            <div class="info-row">
                <span class="detail-label">Type :</span>
                <span class="detail-value">${COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Urgence :</span>
                <span class="detail-value">${COMMANDES_CONFIG.NIVEAUX_URGENCE[commande.niveauUrgence]?.label}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Magasin :</span>
                <span class="detail-value">${commande.magasinLivraison}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Date :</span>
                <span class="detail-value">${formatDate(commande.dates.livraisonPrevue)}</span>
            </div>
            ${commande.commentaires ? `
                <div class="info-row">
                    <span class="detail-label">Note :</span>
                    <span class="detail-value">${commande.commentaires}</span>
                </div>
            ` : ''}
        </div>
        <div class="edit-form" id="livraisonEditForm">
            <div class="edit-form-group">
                <label>Magasin de livraison *</label>
                <select id="editMagasinLivraison" required>
                    <!-- Options chargées dynamiquement -->
                </select>
            </div>
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>Niveau d'urgence *</label>
                    <select id="editNiveauUrgence" required>
                        <option value="normal" ${commande.niveauUrgence === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="urgent" ${commande.niveauUrgence === 'urgent' ? 'selected' : ''}>🟡 Urgent</option>
                        <option value="tres_urgent" ${commande.niveauUrgence === 'tres_urgent' ? 'selected' : ''}>🔴 Très urgent</option>
                    </select>
                </div>
                <div class="edit-form-group">
                    <label>Date de livraison prévue *</label>
                    <input type="date" id="editDateLivraison" value="${formatDateForInput(commande.dates.livraisonPrevue)}" required>
                </div>
            </div>
            <div class="edit-form-group">
                <label>Commentaires</label>
                <textarea id="editCommentaires" rows="3">${commande.commentaires || ''}</textarea>
            </div>
            <div class="edit-actions">
                <button class="edit-btn edit-btn-cancel" onclick="annulerEditionLivraison()">Annuler</button>
                <button class="edit-btn edit-btn-save" onclick="sauvegarderLivraison()">Sauvegarder</button>
            </div>
        </div>
    `;
    
    // ========================================
    // SECTION EXPÉDITION + ICÔNE ÉDITION (si applicable)
    // ========================================
    const sectionExpedition = document.getElementById('sectionExpedition');
    if (commande.expedition?.necessiteExpedition || commande.expedition?.envoi?.numeroSuivi) {
        sectionExpedition.style.display = 'block';
        const detailExpedition = document.getElementById('detailExpedition');
        
        if (commande.expedition.envoi?.numeroSuivi) {
            detailExpedition.innerHTML = `
                <button class="section-edit-icon" onclick="editerExpedition()" title="Modifier l'expédition">
                    ✏️
                </button>
                <div id="expeditionReadOnly">
                    <div class="detail-info">
                        <span class="detail-label">Transporteur :</span>
                        <span class="detail-value">${commande.expedition.envoi.transporteur}</span>
                    </div>
                    <div class="detail-info">
                        <span class="detail-label">N° suivi envoi :</span>
                        <span class="detail-value"><strong>${commande.expedition.envoi.numeroSuivi}</strong></span>
                    </div>
                    <div class="detail-info">
                        <span class="detail-label">Date envoi :</span>
                        <span class="detail-value">${formatDate(commande.expedition.envoi.dateEnvoi)}</span>
                    </div>
                    ${commande.expedition.reception?.numeroSuiviRecu ? `
                        <hr style="margin: 15px 0;">
                        <div class="detail-info">
                            <span class="detail-label">N° suivi réception :</span>
                            <span class="detail-value"><strong>${commande.expedition.reception.numeroSuiviRecu}</strong></span>
                        </div>
                        <div class="detail-info">
                            <span class="detail-label">Date réception :</span>
                            <span class="detail-value">${formatDate(commande.expedition.reception.dateReception)}</span>
                        </div>
                        <div class="detail-info">
                            <span class="detail-label">Colis conforme :</span>
                            <span class="detail-value">${commande.expedition.reception.colisConforme ? '✅ Oui' : '❌ Non'}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="edit-form" id="expeditionEditForm">
                    <div class="edit-form-row">
                        <div class="edit-form-group">
                            <label>Transporteur</label>
                            <select id="editTransporteur">
                                <option value="Colissimo" ${commande.expedition.envoi.transporteur === 'Colissimo' ? 'selected' : ''}>Colissimo</option>
                                <option value="Chronopost" ${commande.expedition.envoi.transporteur === 'Chronopost' ? 'selected' : ''}>Chronopost</option>
                                <option value="UPS" ${commande.expedition.envoi.transporteur === 'UPS' ? 'selected' : ''}>UPS</option>
                                <option value="DHL" ${commande.expedition.envoi.transporteur === 'DHL' ? 'selected' : ''}>DHL</option>
                                <option value="Fedex" ${commande.expedition.envoi.transporteur === 'Fedex' ? 'selected' : ''}>Fedex</option>
                                <option value="GLS" ${commande.expedition.envoi.transporteur === 'GLS' ? 'selected' : ''}>GLS</option>
                            </select>
                        </div>
                        <div class="edit-form-group">
                            <label>Numéro de suivi envoi</label>
                            <input type="text" id="editNumeroSuivi" value="${commande.expedition.envoi.numeroSuivi}">
                        </div>
                    </div>
                    ${commande.expedition.reception?.numeroSuiviRecu ? `
                        <div class="edit-form-row">
                            <div class="edit-form-group">
                                <label>Numéro de suivi réception</label>
                                <input type="text" id="editNumeroSuiviRecu" value="${commande.expedition.reception.numeroSuiviRecu}">
                            </div>
                            <div class="edit-form-group">
                                <label>Colis conforme</label>
                                <select id="editColisConforme">
                                    <option value="true" ${commande.expedition.reception.colisConforme ? 'selected' : ''}>✅ Oui</option>
                                    <option value="false" ${!commande.expedition.reception.colisConforme ? 'selected' : ''}>❌ Non</option>
                                </select>
                            </div>
                        </div>
                        <div class="edit-form-group">
                            <label>Commentaires réception</label>
                            <textarea id="editCommentairesReception" rows="2">${commande.expedition.reception.commentaires || ''}</textarea>
                        </div>
                    ` : ''}
                    <div class="edit-actions">
                        <button class="edit-btn edit-btn-cancel" onclick="annulerEditionExpedition()">Annuler</button>
                        <button class="edit-btn edit-btn-save" onclick="sauvegarderExpedition()">Sauvegarder</button>
                    </div>
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

function afficherActionsCommande(commande) {
    const detailActions = document.getElementById('detailActions');
    let actions = [];
    
    // Actions selon le statut
    switch (commande.statut) {
        case 'nouvelle':
            actions.push(`
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'preparation')">
                    🔵 Commencer la préparation
                </button>
            `);
            break;
            
        case 'preparation':
            actions.push(`
                <button class="btn btn-primary" onclick="saisirNumerosSerie('${commande.id}')">
                    📝 Saisir les numéros de série
                </button>
                <button class="btn btn-success" onclick="terminerPreparation('${commande.id}')">
                    ✅ Terminer la préparation
                </button>
            `);
            break;
            
        case 'terminee':
            // MODIFIÉ le 29/07/2025 : Toujours proposer les deux options (expédition ET livraison directe)
            actions.push(`
                <button class="btn btn-primary" onclick="saisirExpedition('${commande.id}')">
                    📦 Expédier le colis
                </button>
                <button class="btn btn-success" onclick="livrerDirectement('${commande.id}')">
                    ✅ Livrer directement au patient
                </button>
            `);
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
                <button class="btn btn-success" onclick="changerStatutDetail('${commande.id}', 'livree')">
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
    console.log('🔄 Début changement statut:', { commandeId, nouveauStatut });
    
    try {
        // Vérifier que CommandesService est disponible
        if (!CommandesService || typeof CommandesService.changerStatut !== 'function') {
            throw new Error('CommandesService.changerStatut non disponible');
        }
        
        // Obtenir le label du statut pour un message plus clair
        const labelStatut = COMMANDES_CONFIG.STATUTS[nouveauStatut]?.label || nouveauStatut;
        
        const confirme = await confirmerAction({
            titre: 'Confirmation du changement de statut',
            message: `Êtes-vous sûr de vouloir passer la commande au statut "${labelStatut}" ?`,
            boutonConfirmer: 'Confirmer',
            boutonAnnuler: 'Annuler',
            danger: false
        });
        
        if (confirme) {
            console.log('✅ Confirmation reçue, appel au service...');
            
            // Appeler le service pour changer le statut
            await CommandesService.changerStatut(commandeId, nouveauStatut);
            
            console.log('✅ Statut changé avec succès dans Firebase');
            
            // Recharger les données de la liste
            await chargerDonnees();
            
            // Recharger et rafraîchir la modal avec les nouvelles données
            const commandeMAJ = await CommandesService.getCommande(commandeId);
            if (commandeMAJ) {
                commandeActuelle = commandeMAJ;
                afficherDetailCommande(commandeMAJ);
            }
            
            afficherSucces(`Commande passée au statut : ${labelStatut}`);
        } else {
            console.log('❌ Changement annulé par l\'utilisateur');
        }
    } catch (error) {
        console.error('❌ Erreur changement statut:', error);
        console.error('Stack trace:', error.stack);
        
        // Message d'erreur détaillé
        let messageErreur = 'Erreur lors du changement de statut';
        
        if (error.message) {
            if (error.message.includes('non autorisé')) {
                messageErreur = error.message;
            } else if (error.message.includes('Firebase')) {
                messageErreur = 'Erreur de connexion à la base de données';
            } else {
                messageErreur += ` : ${error.message}`;
            }
        }
        
        afficherErreur(messageErreur);
    }
};

// ========================================
// ACTIONS SPÉCIFIQUES
// ========================================

// NOUVEAU : Saisir les numéros de série
window.saisirNumerosSerie = async function(commandeId) {
    console.log('🔍 Clic sur saisir NS, commande:', commandeId);
    
    // Importer et appeler directement la fonction
    const { ouvrirSaisieNumerosSerie } = await import('./commandes.serial.js');
    await ouvrirSaisieNumerosSerie(commandeId);
};

// NOUVEAU : Terminer la préparation avec vérification NS
window.terminerPreparation = async function(commandeId) {
    try {
        // Récupérer la commande pour vérifier les NS
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        // Importer et utiliser verifierNumerosSerie
        const { verifierNumerosSerie } = await import('./commandes.serial.js');
        
        // Vérifier que les NS sont saisis pour les appareils auditifs
        const nsValides = await verifierNumerosSerie(commande);
        if (!nsValides) {
            // La fonction verifierNumerosSerie affiche déjà le message d'erreur
            return;
        }
        
        // Si tout est OK, changer le statut
        await changerStatutDetail(commandeId, 'terminee');
        
    } catch (error) {
        console.error('Erreur terminer préparation:', error);
        afficherErreur('Erreur lors de la finalisation de la préparation');
    }
};

// MODIFIÉ : Saisir expédition avec transporteur et numéro (SYSTÈME ORIGINAL)
window.saisirExpedition = async function(commandeId) {
    try {
        console.log('🚀 Début saisir expédition pour commande:', commandeId);
        
        // Créer un dialog custom avec les deux champs (comme avant)
        const result = await new Promise((resolve) => {
            // Créer le HTML du dialog
            const dialogHtml = `
                <div class="dialog-overlay"></div>
                <div class="dialog-box">
                    <div class="dialog-header">
                        <div class="dialog-icon info">📦</div>
                        <h3 class="dialog-title">Expédition du colis</h3>
                    </div>
                    <div class="dialog-body">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Transporteur :</label>
                            <select id="expeditionTransporteur" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; box-sizing: border-box;">
                                <option value="Colissimo">Colissimo</option>
                                <option value="Chronopost">Chronopost</option>
                                <option value="UPS">UPS</option>
                                <option value="DHL">DHL</option>
                                <option value="Fedex">Fedex</option>
                                <option value="GLS">GLS</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Numéro de suivi :</label>
                            <input type="text" id="expeditionNumeroSuivi" 
                                   placeholder="Ex: 1234567890" 
                                   style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; box-sizing: border-box;"
                                   required>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="dialog-btn secondary expedition-cancel">Annuler</button>
                        <button class="dialog-btn primary expedition-confirm">Valider l'expédition</button>
                    </div>
                </div>
            `;
            
            // Ajouter au conteneur dialog
            const dialogContainer = document.getElementById('dialog-container');
            if (!dialogContainer) {
                console.error('❌ Dialog container introuvable');
                resolve(null);
                return;
            }
            
            dialogContainer.innerHTML = dialogHtml;
            dialogContainer.classList.add('active');
            
            // Récupérer les éléments
            const transporteurSelect = document.getElementById('expeditionTransporteur');
            const numeroSuiviInput = document.getElementById('expeditionNumeroSuivi');
            const confirmBtn = document.querySelector('.expedition-confirm');
            const cancelBtn = document.querySelector('.expedition-cancel');
            const overlay = document.querySelector('.dialog-overlay');
            
            // Focus sur le champ numéro de suivi
            setTimeout(() => {
                if (numeroSuiviInput) {
                    numeroSuiviInput.focus();
                }
            }, 100);
            
            // Fonction de validation et confirmation
            const handleConfirm = () => {
                const transporteur = transporteurSelect ? transporteurSelect.value : 'Colissimo';
                const numeroSuivi = numeroSuiviInput ? numeroSuiviInput.value.trim() : '';
                
                console.log('📝 Validation - Transporteur:', transporteur);
                console.log('📝 Validation - Numéro:', numeroSuivi);
                
                if (!numeroSuivi) {
                    // Mettre en rouge le champ requis
                    if (numeroSuiviInput) {
                        numeroSuiviInput.style.borderColor = '#f44336';
                        numeroSuiviInput.focus();
                    }
                    return;
                }
                
                // Fermer le dialog
                dialogContainer.classList.remove('active');
                setTimeout(() => {
                    dialogContainer.innerHTML = '';
                }, 200);
                
                // Retourner les valeurs
                resolve({
                    transporteur: transporteur,
                    numeroSuivi: numeroSuivi
                });
            };
            
            // Fonction d'annulation
            const handleCancel = () => {
                dialogContainer.classList.remove('active');
                setTimeout(() => {
                    dialogContainer.innerHTML = '';
                }, 200);
                resolve(null);
            };
            
            // Event listeners
            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleConfirm);
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
            }
            
            if (overlay) {
                overlay.addEventListener('click', handleCancel);
            }
            
            // Gestion du clavier
            const handleKeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                }
            };
            
            document.addEventListener('keydown', handleKeydown);
            
            // Nettoyer l'event listener après fermeture
            const originalResolve = resolve;
            resolve = (value) => {
                document.removeEventListener('keydown', handleKeydown);
                originalResolve(value);
            };
        });
        
        // Si l'utilisateur a annulé
        if (!result) {
            console.log('❌ Annulation utilisateur');
            return;
        }
        
        console.log('✅ Données récupérées:', result);
        
        // Envoyer au service
        console.log('⏳ Envoi au service CommandesService...');
        
        await CommandesService.changerStatut(commandeId, 'expediee', {
            numeroSuivi: result.numeroSuivi,
            transporteur: result.transporteur
        });
        
        console.log('✅ Statut changé avec succès');
        
        // Rafraîchir l'interface
        await chargerDonnees();
        await voirDetailCommande(commandeId);
        
        // Notification de succès
        afficherSucces(`Expédition validée - ${result.transporteur} - N° ${result.numeroSuivi}`);
        
        console.log('🎉 Processus terminé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur validation expédition:', error);
        console.error('Stack:', error.stack);
        
        let messageErreur = 'Erreur lors de la validation de l\'expédition';
        if (error.message) {
            messageErreur += ' : ' + error.message;
        }
        
        afficherErreur(messageErreur);
    }
};

// MODIFIÉ : Valider réception avec vérification du numéro
window.validerReception = async function(commandeId) {
    try {
        // Récupérer la commande pour avoir le numéro de suivi
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        const numeroSuiviEnvoi = commande.expedition?.envoi?.numeroSuivi;
        if (!numeroSuiviEnvoi) {
            await Dialog.alert('Aucun numéro de suivi trouvé pour cette expédition', 'Erreur');
            return;
        }
        
        // Demander le numéro de suivi reçu
        const numeroSuiviRecu = await Dialog.prompt(
            `Pour confirmer la réception, veuillez saisir le numéro de suivi du colis reçu.\n\nNuméro attendu : ${numeroSuiviEnvoi}`,
            '',
            '📥 Validation de la réception'
        );
        
        if (!numeroSuiviRecu) return;
        
        // Vérifier que les numéros correspondent
        const numerosCorrespondent = numeroSuiviRecu.trim() === numeroSuiviEnvoi.trim();
        
        if (!numerosCorrespondent) {
            const forcer = await confirmerAction({
                titre: '⚠️ Numéros différents',
                message: `Le numéro saisi (${numeroSuiviRecu}) ne correspond pas au numéro d'envoi (${numeroSuiviEnvoi}).\n\nVoulez-vous quand même valider la réception ?`,
                boutonConfirmer: 'Oui, valider quand même',
                boutonAnnuler: 'Non, vérifier',
                danger: true
            });
            
            if (!forcer) return;
        }
        
        // Demander si le colis est conforme
        const colisConforme = await confirmerAction({
            titre: 'État du colis',
            message: 'Le colis est-il arrivé en bon état et conforme à la commande ?',
            boutonConfirmer: 'Oui, conforme',
            boutonAnnuler: 'Non, problème'
        });
        
        // Valider la réception
        await CommandesService.changerStatut(commandeId, 'receptionnee', {
            numeroSuiviRecu: numeroSuiviRecu.trim(),
            colisConforme: colisConforme
        });
        
        await chargerDonnees();
        await voirDetailCommande(commandeId);
        
        if (colisConforme) {
            afficherSucces('Réception validée - Colis conforme');
        } else {
            notify.warning('Réception validée - Problème signalé sur le colis');
        }
        
    } catch (error) {
        console.error('Erreur validation réception:', error);
        afficherErreur('Erreur lors de la validation de la réception');
    }
};

// NOUVEAU : Livrer directement sans expédition
window.livrerDirectement = async function(commandeId) {
    const confirme = await confirmerAction({
        titre: 'Livraison directe',
        message: 'Confirmez-vous la livraison directe au patient (sans expédition) ?',
        boutonConfirmer: 'Oui, livrer',
        boutonAnnuler: 'Annuler'
    });
    
    if (confirme) {
        try {
            await CommandesService.changerStatut(commandeId, 'livree');
            await chargerDonnees();
            window.modalManager.close('modalDetailCommande');
            afficherSucces('Commande livrée avec succès');
        } catch (error) {
            console.error('Erreur livraison directe:', error);
            afficherErreur('Erreur lors de la livraison');
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
        const motif = await Dialog.prompt('Motif d\'annulation :');
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
// FONCTION SUPPRESSION SÉCURISÉE
// ========================================
window.supprimerCommande = async function(commandeId) {
    try {
        // Récupérer les infos de la commande
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) {
            afficherErreur('Commande introuvable');
            return;
        }
        
        // Demander la confirmation avec saisie du numéro de commande
        const numeroSaisi = await Dialog.prompt(
            `Pour confirmer la suppression de la commande de ${commande.client.prenom} ${commande.client.nom}, veuillez saisir le numéro de commande : ${commande.numeroCommande}`,
            '',
            '🗑️ Suppression de commande'
        );
        
        // Si annulation
        if (!numeroSaisi) {
            return;
        }
        
        // Validation du numéro de commande
        if (numeroSaisi.trim() !== commande.numeroCommande) {
            afficherErreur('Le numéro de commande saisi ne correspond pas');
            // Relancer la fonction pour une nouvelle tentative
            return window.supprimerCommande(commandeId);
        }
        
        // Si validation OK, demander une dernière confirmation
        const confirme = await confirmerAction({
            titre: '⚠️ Confirmation finale',
            message: `Êtes-vous absolument sûr de vouloir supprimer définitivement la commande ${commande.numeroCommande} ?`,
            boutonConfirmer: 'Oui, supprimer définitivement',
            boutonAnnuler: 'Non, conserver',
            danger: true
        });
        
        if (confirme) {
            try {
                await CommandesService.supprimerCommande(commandeId, {
                    motif: `Suppression confirmée par saisie du numéro de commande`,
                    numeroCommandeValide: numeroSaisi
                });
                
                // Recharger les données
                await chargerDonnees();
                
                // Fermer le modal détail si ouvert
                if (window.modalManager && window.modalManager.get('modalDetailCommande')?.isOpen) {
                    window.modalManager.close('modalDetailCommande');
                }
                
                afficherSucces('Commande supprimée avec succès');
                
            } catch (error) {
                console.error('Erreur suppression:', error);
                afficherErreur('Erreur lors de la suppression : ' + error.message);
            }
        }
    } catch (error) {
        console.error('Erreur suppression commande:', error);
        afficherErreur('Erreur lors de la suppression');
    }
};

// ========================================
// ÉDITION PRODUITS - RÉUTILISE COMMANDES.CREATE.JS
// ========================================

// Variable pour stocker les produits en cours d'édition
let produitsEnEdition = [];
let produitEnCoursSelectionEdit = null;

/**
 * Activer l'édition des produits (réutilise create.js)
 */
window.editerProduits = function() {
    if (!commandeActuelle || !['nouvelle', 'preparation'].includes(commandeActuelle.statut)) {
        afficherErreur('Modification impossible : préparation déjà validée');
        return;
    }
    
    // Copier les produits actuels pour l'édition
    produitsEnEdition = [...commandeActuelle.produits];
    
    const section = document.getElementById('detailProduits').parentElement;
    const readOnlyDiv = document.getElementById('produitsReadOnly');
    const editForm = document.getElementById('produitsEditForm');
    
    // Basculer vers le mode édition
    section.classList.add('editing');
    readOnlyDiv.style.display = 'none';
    editForm.classList.add('active');
    
    // Remplir la liste des produits existants
    afficherProduitsExistants();
    
    // Focus sur la recherche
    document.getElementById('editProductSearch').focus();
};

/**
 * Afficher les produits existants avec options de suppression
 */
function afficherProduitsExistants() {
    const container = document.getElementById('editProduitsExistants');
    
    if (produitsEnEdition.length === 0) {
        container.innerHTML = '<p>Aucun produit dans la commande</p>';
        return;
    }
    
    container.innerHTML = `
        <h4>Produits actuels</h4>
        ${produitsEnEdition.map((produit, index) => `
            <div class="edit-produit-item">
                <div class="edit-produit-header">
                    <span>${produit.designation} ${produit.cote ? `(${produit.cote})` : ''}</span>
                    <button class="btn-delete-produit" onclick="supprimerProduitEdit(${index})" title="Supprimer ce produit">
                        🗑️
                    </button>
                </div>
                <div class="edit-produit-fields">
                    <div class="edit-produit-field">
                        <label>Quantité</label>
                        <input type="number" id="editProduitQte${index}" value="${produit.quantite}" min="1" max="99" 
                               onchange="modifierQuantiteProduitEdit(${index}, this.value)">
                    </div>
                    ${(produit.type === 'appareil_auditif' || produit.necessiteCote) ? `
                        <div class="edit-produit-field serial">
                            <label>Numéro de série</label>
                            <input type="text" id="editProduitNS${index}" value="${produit.numeroSerie || ''}" 
                                   onchange="modifierNSProduitEdit(${index}, this.value)"
                                   style="font-family: 'Courier New', monospace; text-transform: uppercase;">
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    `;
}

/**
 * Supprimer un produit de l'édition
 */
window.supprimerProduitEdit = function(index) {
    if (produitsEnEdition.length === 1) {
        afficherErreur('Impossible de supprimer le dernier produit');
        return;
    }
    
    const produit = produitsEnEdition[index];
    const confirme = confirm(`Supprimer "${produit.designation}" ${produit.cote ? `(${produit.cote})` : ''} ?`);
    
    if (confirme) {
        produitsEnEdition.splice(index, 1);
        afficherProduitsExistants();
    }
};

/**
 * Modifier la quantité d'un produit
 */
window.modifierQuantiteProduitEdit = function(index, nouvelleQuantite) {
    const qte = parseInt(nouvelleQuantite);
    if (qte >= 1 && qte <= 99) {
        produitsEnEdition[index].quantite = qte;
    }
};

/**
 * Modifier le numéro de série d'un produit
 */
window.modifierNSProduitEdit = function(index, nouveauNS) {
    produitsEnEdition[index].numeroSerie = nouveauNS.trim().toUpperCase() || null;
};

/**
 * Recherche de produits pour ajout (réutilise create.js)
 */
window.rechercherProduitEdit = async function() {
    const recherche = document.getElementById('editProductSearch').value;
    const resultsDiv = document.getElementById('editProductSearchResults');
    
    if (recherche.length < 2) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    try {
        // Réutiliser ProduitsService comme dans create.js
        const { ProduitsService } = await import('../../services/produits.service.js');
        const produits = await ProduitsService.rechercherProduits(recherche);
        
        if (produits.length > 0) {
            resultsDiv.innerHTML = produits.map(produit => `
                <div class="product-card" onclick="ajouterProduitEdit('${produit.id}')">
                    <div class="product-card-header">
                        <div>
                            <div class="product-name">${produit.designation}</div>
                            <div class="product-reference">${produit.reference}</div>
                        </div>
                    </div>
                    <div class="product-info">
                        ${produit.marque} - ${produit.categorie}
                    </div>
                </div>
            `).join('');
            resultsDiv.classList.add('active');
        } else {
            resultsDiv.innerHTML = '<div class="search-result-item">Aucun produit trouvé</div>';
            resultsDiv.classList.add('active');
        }
    } catch (error) {
        console.error('Erreur recherche produit:', error);
    }
};

/**
 * Ajouter un produit (réutilise create.js avec sélecteur côté)
 */
window.ajouterProduitEdit = async function(produitId) {
    try {
        const { ProduitsService } = await import('../../services/produits.service.js');
        const produit = await ProduitsService.getProduit(produitId);
        if (!produit) return;
        
        if (produit.necessiteCote) {
            produitEnCoursSelectionEdit = produit;
            
            // RÉUTILISER le même sélecteur que create.js
            const selectorHtml = `
                <div id="coteSelector" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                     background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
                     z-index: 10000; min-width: 400px;">
                    <h3 style="margin-bottom: 20px; text-align: center; color: #2c3e50;">
                        Sélectionner le côté pour<br><strong>${produit.designation}</strong>
                    </h3>
                    <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
                        <button onclick="selectionnerCoteEdit('gauche')" style="background: white; border: 3px solid #2196F3; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#E3F2FD'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂</span>
                            <span style="color: #2196F3; font-weight: bold;">Gauche</span>
                        </button>
                        <button onclick="selectionnerCoteEdit('droit')" style="background: white; border: 3px solid #F44336; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#FFEBEE'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂</span>
                            <span style="color: #F44336; font-weight: bold;">Droit</span>
                        </button>
                        <button onclick="selectionnerCoteEdit('both')" style="background: white; border: 3px solid #9C27B0; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#F3E5F5'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂👂</span>
                            <span style="color: #9C27B0; font-weight: bold;">Les deux</span>
                        </button>
                    </div>
                    <button onclick="annulerSelectionCoteEdit()" style="background: #f8f9fa; border: 2px solid #e9ecef; 
                            border-radius: 10px; padding: 10px 20px; cursor: pointer; width: 100%; 
                            color: #6c757d; font-weight: 500;">
                        Annuler
                    </button>
                </div>
                <div id="coteSelectorOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.5); z-index: 9999;" onclick="annulerSelectionCoteEdit()"></div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', selectorHtml);
            
        } else {
            // Produit sans côté
            produitsEnEdition.push({
                ...produit,
                quantite: 1
            });
            
            afficherProduitsExistants();
            
            // Reset recherche
            document.getElementById('editProductSearchResults').classList.remove('active');
            document.getElementById('editProductSearch').value = '';
        }
        
    } catch (error) {
        console.error('Erreur ajout produit:', error);
    }
};

/**
 * Sélectionner le côté (réutilise create.js)
 */
window.selectionnerCoteEdit = function(cote) {
    if (!produitEnCoursSelectionEdit) return;
    
    if (cote === 'both') {
        produitsEnEdition.push({
            ...produitEnCoursSelectionEdit,
            cote: 'droit',
            quantite: 1
        });
        produitsEnEdition.push({
            ...produitEnCoursSelectionEdit,
            cote: 'gauche',
            quantite: 1
        });
    } else {
        produitsEnEdition.push({
            ...produitEnCoursSelectionEdit,
            cote: cote,
            quantite: 1
        });
    }
    
    // Nettoyer le sélecteur
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    
    produitEnCoursSelectionEdit = null;
    
    // Rafraîchir l'affichage
    afficherProduitsExistants();
    
    // Reset recherche
    document.getElementById('editProductSearchResults').classList.remove('active');
    document.getElementById('editProductSearch').value = '';
};

/**
 * Annuler la sélection de côté
 */
window.annulerSelectionCoteEdit = function() {
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    produitEnCoursSelectionEdit = null;
};

/**
 * Annuler l'édition des produits
 */
window.annulerEditionProduits = function() {
    const section = document.getElementById('detailProduits').parentElement;
    const readOnlyDiv = document.getElementById('produitsReadOnly');
    const editForm = document.getElementById('produitsEditForm');
    
    // Revenir au mode lecture
    section.classList.remove('editing');
    readOnlyDiv.style.display = 'block';
    editForm.classList.remove('active');
    
    // Reset variables
    produitsEnEdition = [];
    produitEnCoursSelectionEdit = null;
    
    // Reset recherche
    document.getElementById('editProductSearch').value = '';
    document.getElementById('editProductSearchResults').innerHTML = '';
    document.getElementById('editProductSearchResults').classList.remove('active');
};

/**
 * Sauvegarder les modifications des produits
 */
window.sauvegarderProduits = async function() {
    if (produitsEnEdition.length === 0) {
        afficherErreur('Au moins un produit est obligatoire');
        return;
    }
    
    try {
        const editIcon = document.querySelector('#detailProduits .section-edit-icon');
        const saveBtn = document.querySelector('#produitsEditForm .edit-btn-save');
        
        // États visuels
        if (editIcon) editIcon.classList.add('saving');
        if (saveBtn) {
            saveBtn.classList.add('loading');
            saveBtn.disabled = true;
        }
        
        // Remplacer tous les produits de la commande
        await CommandesService.remplacerProduits(commandeActuelle.id, produitsEnEdition);
        
        // Rafraîchir la commande
        const commandeMAJ = await CommandesService.getCommande(commandeActuelle.id);
        if (commandeMAJ) {
            commandeActuelle = commandeMAJ;
            afficherDetailCommande(commandeMAJ);
        }
        
        // Recharger la liste
        await chargerDonnees();
        
        // Notification de succès
        afficherSucces('Produits modifiés avec succès');
        
    } catch (error) {
        console.error('Erreur modification produits:', error);
        afficherErreur('Erreur lors de la modification : ' + error.message);
        
        // Restaurer les états visuels
        const editIcon = document.querySelector('#detailProduits .section-edit-icon');
        const saveBtn = document.querySelector('#produitsEditForm .edit-btn-save');
        
        if (editIcon) {
            editIcon.classList.remove('saving');
            editIcon.classList.add('error');
            setTimeout(() => editIcon.classList.remove('error'), 3000);
        }
        
        if (saveBtn) {
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;
        }
    }
};

// ========================================
// NOUVELLES FONCTIONS D'ÉDITION AVEC ICÔNES STYLO
// Ajoutées le 29/07/2025
// ========================================

/**
 * Activer l'édition des informations client
 */
window.editerClient = function() {
    const section = document.getElementById('detailClient').parentElement;
    const readOnlyDiv = document.getElementById('clientReadOnly');
    const editForm = document.getElementById('clientEditForm');
    
    // Basculer vers le mode édition
    section.classList.add('editing');
    readOnlyDiv.style.display = 'none';
    editForm.classList.add('active');
    
    // Focus sur le premier champ
    document.getElementById('editClientPrenom').focus();
};

/**
 * Annuler l'édition du client
 */
window.annulerEditionClient = function() {
    const section = document.getElementById('detailClient').parentElement;
    const readOnlyDiv = document.getElementById('clientReadOnly');
    const editForm = document.getElementById('clientEditForm');
    
    // Revenir au mode lecture
    section.classList.remove('editing');
    readOnlyDiv.style.display = 'block';
    editForm.classList.remove('active');
    
    // Restaurer les valeurs originales
    if (commandeActuelle) {
        document.getElementById('editClientPrenom').value = commandeActuelle.client.prenom;
        document.getElementById('editClientNom').value = commandeActuelle.client.nom;
        document.getElementById('editClientTelephone').value = commandeActuelle.client.telephone;
        document.getElementById('editClientEmail').value = commandeActuelle.client.email;
    }
};

/**
 * Sauvegarder les modifications client
 */
window.sauvegarderClient = async function() {
    try {
        const editIcon = document.querySelector('#detailClient .section-edit-icon');
        const saveBtn = document.querySelector('#clientEditForm .edit-btn-save');
        
        // Récupérer les valeurs
        const donnees = {
            prenom: document.getElementById('editClientPrenom').value.trim(),
            nom: document.getElementById('editClientNom').value.trim(),
            telephone: document.getElementById('editClientTelephone').value.trim(),
            email: document.getElementById('editClientEmail').value.trim()
        };
        
        // Validation basique
        if (!donnees.prenom || !donnees.nom) {
            afficherErreur('Le prénom et le nom sont obligatoires');
            return;
        }
        
        // États visuels
        editIcon.classList.add('saving');
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;
        
        // Appeler le service
        await CommandesService.modifierClient(commandeActuelle.id, donnees);
        
        // Rafraîchir la commande
        const commandeMAJ = await CommandesService.getCommande(commandeActuelle.id);
        if (commandeMAJ) {
            commandeActuelle = commandeMAJ;
            afficherDetailCommande(commandeMAJ);
        }
        
        // Recharger la liste
        await chargerDonnees();
        
        // Notification de succès
        afficherSucces('Informations client modifiées avec succès');
        
    } catch (error) {
        console.error('Erreur modification client:', error);
        afficherErreur('Erreur lors de la modification : ' + error.message);
        
        // Restaurer les états visuels
        const editIcon = document.querySelector('#detailClient .section-edit-icon');
        const saveBtn = document.querySelector('#clientEditForm .edit-btn-save');
        
        editIcon.classList.remove('saving');
        editIcon.classList.add('error');
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
        
        setTimeout(() => {
            editIcon.classList.remove('error');
        }, 3000);
    }
};

/**
 * Activer l'édition des informations de livraison
 */
window.editerLivraison = async function() {
    const section = document.getElementById('detailLivraison').parentElement;
    const readOnlyDiv = document.getElementById('livraisonReadOnly');
    const editForm = document.getElementById('livraisonEditForm');
    
    // Charger les magasins disponibles
    try {
        // Simuler le chargement des magasins (à adapter selon votre service)
        const selectMagasin = document.getElementById('editMagasinLivraison');
        selectMagasin.innerHTML = `
            <option value="9MAR" ${commandeActuelle.magasinLivraison === '9MAR' ? 'selected' : ''}>Marseille</option>
            <option value="9AIX" ${commandeActuelle.magasinLivraison === '9AIX' ? 'selected' : ''}>Aix-en-Provence</option>
            <option value="9TOU" ${commandeActuelle.magasinLivraison === '9TOU' ? 'selected' : ''}>Toulon</option>
            <option value="9NIC" ${commandeActuelle.magasinLivraison === '9NIC' ? 'selected' : ''}>Nice</option>
            <option value="9CAN" ${commandeActuelle.magasinLivraison === '9CAN' ? 'selected' : ''}>Cannes</option>
        `;
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
    }
    
    // Basculer vers le mode édition
    section.classList.add('editing');
    readOnlyDiv.style.display = 'none';
    editForm.classList.add('active');
    
    // Focus sur le premier champ
    document.getElementById('editMagasinLivraison').focus();
};

/**
 * Annuler l'édition de la livraison
 */
window.annulerEditionLivraison = function() {
    const section = document.getElementById('detailLivraison').parentElement;
    const readOnlyDiv = document.getElementById('livraisonReadOnly');
    const editForm = document.getElementById('livraisonEditForm');
    
    // Revenir au mode lecture
    section.classList.remove('editing');
    readOnlyDiv.style.display = 'block';
    editForm.classList.remove('active');
};

/**
 * Sauvegarder les modifications de livraison
 */
window.sauvegarderLivraison = async function() {
    try {
        const editIcon = document.querySelector('#detailLivraison .section-edit-icon');
        const saveBtn = document.querySelector('#livraisonEditForm .edit-btn-save');
        
        // Récupérer les valeurs
        const donnees = {
            magasinLivraison: document.getElementById('editMagasinLivraison').value,
            niveauUrgence: document.getElementById('editNiveauUrgence').value,
            dateLivraisonPrevue: document.getElementById('editDateLivraison').value,
            commentaires: document.getElementById('editCommentaires').value.trim()
        };
        
        // Validation
        if (!donnees.magasinLivraison || !donnees.niveauUrgence || !donnees.dateLivraisonPrevue) {
            afficherErreur('Tous les champs obligatoires doivent être remplis');
            return;
        }
        
        // États visuels
        editIcon.classList.add('saving');
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;
        
        // Appeler le service
        await CommandesService.modifierLivraison(commandeActuelle.id, donnees);
        
        // Rafraîchir la commande
        const commandeMAJ = await CommandesService.getCommande(commandeActuelle.id);
        if (commandeMAJ) {
            commandeActuelle = commandeMAJ;
            afficherDetailCommande(commandeMAJ);
        }
        
        // Recharger la liste
        await chargerDonnees();
        
        // Notification de succès
        afficherSucces('Informations de livraison modifiées avec succès');
        
    } catch (error) {
        console.error('Erreur modification livraison:', error);
        afficherErreur('Erreur lors de la modification : ' + error.message);
        
        // Restaurer les états visuels
        const editIcon = document.querySelector('#detailLivraison .section-edit-icon');
        const saveBtn = document.querySelector('#livraisonEditForm .edit-btn-save');
        
        editIcon.classList.remove('saving');
        editIcon.classList.add('error');
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
        
        setTimeout(() => {
            editIcon.classList.remove('error');
        }, 3000);
    }
};



/**
 * Annuler l'édition des produits
 */
window.annulerEditionProduits = function() {
    const section = document.getElementById('detailProduits').parentElement;
    const readOnlyDiv = document.getElementById('produitsReadOnly');
    const editForm = document.getElementById('produitsEditForm');
    
    // Revenir au mode lecture
    section.classList.remove('editing');
    readOnlyDiv.style.display = 'block';
    editForm.classList.remove('active');
};

/**
 * Sauvegarder les modifications des produits
 */
window.sauvegarderProduits = async function() {
    try {
        const editIcon = document.querySelector('#detailProduits .section-edit-icon');
        const saveBtn = document.querySelector('#produitsEditForm .edit-btn-save');
        
        // États visuels
        editIcon.classList.add('saving');
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;
        
        // Parcourir chaque produit modifié
        for (let i = 0; i < commandeActuelle.produits.length; i++) {
            const qteInput = document.getElementById(`editProduitQte${i}`);
            const nsInput = document.getElementById(`editProduitNS${i}`);
            
            const produitOriginal = commandeActuelle.produits[i];
            const nouvelleQuantite = parseInt(qteInput.value);
            const nouveauNS = nsInput ? nsInput.value.trim() : null;
            
            // Vérifier s'il y a des changements
            const qteChangee = nouvelleQuantite !== produitOriginal.quantite;
            const nsChange = nouveauNS !== (produitOriginal.numeroSerie || '');
            
            if (qteChangee || nsChange) {
                const donneesModif = {};
                
                if (qteChangee) {
                    donneesModif.quantite = nouvelleQuantite;
                }
                
                if (nsChange) {
                    donneesModif.numeroSerie = nouveauNS || null;
                }
                
                // Appeler le service pour ce produit
                await CommandesService.modifierProduit(commandeActuelle.id, i, donneesModif);
            }
        }
        
        // Rafraîchir la commande
        const commandeMAJ = await CommandesService.getCommande(commandeActuelle.id);
        if (commandeMAJ) {
            commandeActuelle = commandeMAJ;
            afficherDetailCommande(commandeMAJ);
        }
        
        // Recharger la liste
        await chargerDonnees();
        
        // Notification de succès
        afficherSucces('Produits modifiés avec succès');
        
    } catch (error) {
        console.error('Erreur modification produits:', error);
        afficherErreur('Erreur lors de la modification : ' + error.message);
        
        // Restaurer les états visuels
        const editIcon = document.querySelector('#detailProduits .section-edit-icon');
        const saveBtn = document.querySelector('#produitsEditForm .edit-btn-save');
        
        editIcon.classList.remove('saving');
        editIcon.classList.add('error');
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
        
        setTimeout(() => {
            editIcon.classList.remove('error');
        }, 3000);
    }
};

/**
 * Activer l'édition de l'expédition
 */
window.editerExpedition = function() {
    const section = document.getElementById('detailExpedition').parentElement;
    const readOnlyDiv = document.getElementById('expeditionReadOnly');
    const editForm = document.getElementById('expeditionEditForm');
    
    // Basculer vers le mode édition
    section.classList.add('editing');
    readOnlyDiv.style.display = 'none';
    editForm.classList.add('active');
    
    // Focus sur le premier champ
    document.getElementById('editTransporteur').focus();
};

/**
 * Annuler l'édition de l'expédition
 */
window.annulerEditionExpedition = function() {
    const section = document.getElementById('detailExpedition').parentElement;
    const readOnlyDiv = document.getElementById('expeditionReadOnly');
    const editForm = document.getElementById('expeditionEditForm');
    
    // Revenir au mode lecture
    section.classList.remove('editing');
    readOnlyDiv.style.display = 'block';
    editForm.classList.remove('active');
};

/**
 * Sauvegarder les modifications d'expédition
 */
window.sauvegarderExpedition = async function() {
    try {
        const editIcon = document.querySelector('#detailExpedition .section-edit-icon');
        const saveBtn = document.querySelector('#expeditionEditForm .edit-btn-save');
        
        // Récupérer les valeurs
        const donnees = {
            transporteur: document.getElementById('editTransporteur').value,
            numeroSuivi: document.getElementById('editNumeroSuivi').value.trim()
        };
        
        // Ajouter les champs de réception s'ils existent
        const numeroSuiviRecuInput = document.getElementById('editNumeroSuiviRecu');
        const colisConformeInput = document.getElementById('editColisConforme');
        const commentairesInput = document.getElementById('editCommentairesReception');
        
        if (numeroSuiviRecuInput) {
            donnees.numeroSuiviRecu = numeroSuiviRecuInput.value.trim();
        }
        
        if (colisConformeInput) {
            donnees.colisConforme = colisConformeInput.value === 'true';
        }
        
        if (commentairesInput) {
            donnees.commentairesReception = commentairesInput.value.trim();
        }
        
        // États visuels
        editIcon.classList.add('saving');
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;
        
        // Appeler le service
        await CommandesService.modifierExpedition(commandeActuelle.id, donnees);
        
        // Rafraîchir la commande
        const commandeMAJ = await CommandesService.getCommande(commandeActuelle.id);
        if (commandeMAJ) {
            commandeActuelle = commandeMAJ;
            afficherDetailCommande(commandeMAJ);
        }
        
        // Recharger la liste
        await chargerDonnees();
        
        // Notification de succès
        afficherSucces('Informations d\'expédition modifiées avec succès');
        
    } catch (error) {
        console.error('Erreur modification expédition:', error);
        afficherErreur('Erreur lors de la modification : ' + error.message);
        
        // Restaurer les états visuels
        const editIcon = document.querySelector('#detailExpedition .section-edit-icon');
        const saveBtn = document.querySelector('#expeditionEditForm .edit-btn-save');
        
        editIcon.classList.remove('saving');
        editIcon.classList.add('error');
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
        
        setTimeout(() => {
            editIcon.classList.remove('error');
        }, 3000);
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

function formatDateForInput(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-XX] - Timeline verticale au lieu d'horizontale
   Problème: La timeline s'affichait verticalement malgré les styles
   Cause: Utilisation de HTML statique au lieu du composant Timeline
   Résolution: Remplacé par createOrderTimeline() avec orientation: 'horizontal'
   
   [2025-07-26] - Erreur changement de statut
   Problème: Message d'erreur générique lors du changement de statut
   Cause: Mauvaise gestion des erreurs dans changerStatutDetail
   Résolution: Ajout de logs et messages d'erreur détaillés
   
   [27/07/2025] - Ajout suppression sécurisée
   Problème: Besoin de supprimer des commandes avec validation
   Solution: Fonction supprimerCommande avec validation par numéro de commande
   Impact: Soft delete avec statut "supprime"
   
   [27/07/2025] - Ajout saisie NS et flux expédition
   Problème: Pas de saisie NS, flux expédition incomplet
   Solution: 
   - Import du module commandes.serial.js
   - Fonction terminerPreparation avec vérification NS
   - saisirExpedition avec transporteur et numéro
   - validerReception avec vérification du numéro
   - livrerDirectement pour skip l'expédition
   
   [29/07/2025] - Bouton expédition manquant après préparation terminée
   Problème: Le bouton "Expédier le colis" ne s'affichait que sous conditions
   Solution: Toujours afficher les deux options (expédition ET livraison directe)
   Impact: L'utilisateur a toujours le choix entre expédier ou livrer directement
   
   [29/07/2025] - Ajout complet des fonctions d'édition avec icônes stylo
   Fonctionnalité: Édition inline de toutes les sections du modal détail
   Solution: 8 nouvelles fonctions d'édition (editer/annuler/sauvegarder pour chaque section)
   Impact: Interface moderne avec édition directe et feedback visuel
   
   NOTES POUR REPRISES FUTURES:
   - Le composant Timeline gère automatiquement l'orientation
   - Les styles sont dans commandes-modal.css section 4 + 7 (édition)
   - Ne pas générer de HTML manuel pour la timeline
   - La modal reste ouverte après changement de statut
   - La suppression nécessite la saisie exacte du numéro de commande
   - Les NS sont obligatoires pour les appareils auditifs
   - L'expédition est optionnelle (bouton livrer directement)
   - Les deux boutons (expédier + livrer) s'affichent toujours pour le statut "terminee"
   - Variable globale commandeActuelle stocke la commande en cours d'affichage
   - Chaque section éditable a 3 fonctions : editer, annuler, sauvegarder
   - États visuels avec classes CSS : .saving, .error sur les icônes
   - Les formulaires d'édition sont intégrés dans le HTML de chaque section
   ======================================== */
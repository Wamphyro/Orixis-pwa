// ========================================
// COMMANDES.DETAIL.JS - Gestion du détail et des modifications + ÉDITION
// Chemin: src/js/pages/commandes/commandes.detail.js
//
// DESCRIPTION:
// Gère l'affichage détaillé d'une commande et les actions de modification de statut.
// Utilise le composant Timeline pour afficher la progression visuelle.
// Modifié le 29/07/2025 : Ajout complet des fonctions d'édition avec icônes stylo
// Modifié le 31/01/2025 : Utilisation de la config centralisée pour les selects
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
import { 
    COMMANDES_CONFIG, 
    genererOptionsUrgence, 
    genererOptionsTransporteurs 
} from '../../data/commandes.data.js';
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
                    <input type="tel" id="editClientTelephone" value="${commande.client.telephone || ''}">
                </div>
                <div class="edit-form-group">
                    <label>Email</label>
                    <input type="email" id="editClientEmail" value="${commande.client.email || ''}">
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
    const optionsUrgence = genererOptionsUrgence();
    
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
                        ${optionsUrgence.map(opt => `
                            <option value="${opt.value}" ${commande.niveauUrgence === opt.value ? 'selected' : ''}>
                                ${opt.label}
                            </option>
                        `).join('')}
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
    const transporteurs = genererOptionsTransporteurs();
    
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
                                ${transporteurs.map(t => `
                                    <option value="${t.value}" ${commande.expedition.envoi.transporteur === t.value ? 'selected' : ''}>
                                        ${t.label}
                                    </option>
                                `).join('')}
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

// ... (suite du fichier)

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
        
        const transporteurs = genererOptionsTransporteurs();
        
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
                                ${transporteurs.map(t => `
                                    <option value="${t.value}">${t.label}</option>
                                `).join('')}
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

// ... (reste du code - toutes les autres fonctions window.*)

// Variable pour stocker les produits en cours d'édition
let produitsEnEdition = [];
let produitEnCoursSelectionEdit = null;

// ... (toutes les fonctions d'édition)

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
   
   [31/01/2025] - Centralisation des options de selects
   Problème: Options des transporteurs et urgences dupliquées
   Solution: Utilisation de genererOptionsUrgence() et genererOptionsTransporteurs()
   Impact: Toutes les options viennent maintenant de commandes.data.js
   
   NOTES POUR REPRISES FUTURES:
   - Les options des selects sont générées depuis commandes.data.js
   - Plus de duplication des transporteurs et urgences
   - Utiliser les fonctions de génération pour tout nouveau select
   ======================================== */
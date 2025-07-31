// ========================================
// COMMANDES.DETAIL.JS - Gestion du détail avec DropdownList
// Chemin: src/js/pages/commandes/commandes.detail.js
//
// DESCRIPTION:
// Gère l'affichage détaillé d'une commande et les actions de modification
// Modifié le 01/02/2025 : Intégration de DropdownList pour l'édition
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { 
    COMMANDES_CONFIG, 
    genererOptionsUrgence, 
    genererOptionsTransporteurs,
    genererOptionsTypesPreparation 
} from '../../data/commandes.data.js';
import { Dialog, confirmerAction, createOrderTimeline, notify, DropdownList } from '../../shared/index.js';
import { chargerDonnees } from './commandes.list.js';
import { afficherSucces, afficherErreur } from './commandes.main.js';

// Variable globale pour stocker la commande en cours
let commandeActuelle = null;

// Variables pour les dropdowns d'édition
let dropdownEditMagasin = null;
let dropdownEditUrgence = null;
let dropdownEditTransporteur = null;

// ========================================
// DÉTAIL COMMANDE
// ========================================

export async function voirDetailCommande(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        commandeActuelle = commande;
        afficherDetailCommande(commande);
        window.modalManager.open('modalDetailCommande');
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
    }
}

function afficherDetailCommande(commande) {
    document.getElementById('detailNumCommande').textContent = commande.numeroCommande;
    
    // Timeline
    const timelineContainer = document.getElementById('timeline');
    timelineContainer.innerHTML = '';
    
    createOrderTimeline(timelineContainer, commande, {
        orientation: 'horizontal',
        theme: 'colorful',
        animated: true,
        showDates: true,
        showLabels: true
    });
    
    // Informations client
    const detailClient = document.getElementById('detailClient');
    detailClient.innerHTML = `
        <button class="btn btn-icon btn-sm btn-primary section-edit-icon" onclick="editerClient()" title="Modifier les informations client">
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
                <button class="btn btn-secondary" onclick="annulerEditionClient()">Annuler</button>
                <button class="btn btn-primary" onclick="sauvegarderClient()">Sauvegarder</button>
            </div>
        </div>
    `;
    
    // Produits commandés
    const detailProduits = document.getElementById('detailProduits');
    const peutModifierProduits = ['nouvelle', 'preparation'].includes(commande.statut);
    
    detailProduits.innerHTML = `
        ${peutModifierProduits ? `
            <button class="btn btn-icon btn-sm btn-primary section-edit-icon" onclick="editerClient()" title="Modifier les informations client">
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
        
        <div class="edit-form" id="produitsEditForm">
            <div id="editProduitsExistants"></div>
            <div class="edit-section">
                <h4>Ajouter un produit</h4>
                <div class="product-search">
                    <input type="text" id="editProductSearch" placeholder="Rechercher un produit..." 
                           oninput="rechercherProduitEdit()">
                    <div class="search-results" id="editProductSearchResults"></div>
                </div>
            </div>
            <div class="edit-actions">
                <button class="btn btn-secondary" onclick="annulerEditionProduits()">Annuler</button>
                <button class="btn btn-primary" onclick="sauvegarderProduits()">Sauvegarder</button>
            </div>
        </div>
    `;
    
    // Informations de livraison
    const detailLivraison = document.getElementById('detailLivraison');
    
    detailLivraison.innerHTML = `
        <button class="btn btn-icon btn-sm btn-primary section-edit-icon" onclick="editerClient()" title="Modifier les informations client">
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
                <div id="editMagasinLivraison"></div>
            </div>
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>Niveau d'urgence *</label>
                    <div id="editNiveauUrgence"></div>
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
                <button class="btn btn-secondary" onclick="annulerEditionLivraison()">Annuler</button>
                <button class="btn btn-primary" onclick="sauvegarderLivraison()">Sauvegarder</button>
            </div>
        </div>
    `;
    
    // Section expédition
    const sectionExpedition = document.getElementById('sectionExpedition');
    
    if (commande.expedition?.necessiteExpedition || commande.expedition?.envoi?.numeroSuivi) {
        sectionExpedition.style.display = 'block';
        const detailExpedition = document.getElementById('detailExpedition');
        
        if (commande.expedition.envoi?.numeroSuivi) {
            detailExpedition.innerHTML = `
                <button class="btn btn-icon btn-sm btn-primary section-edit-icon" onclick="editerClient()" title="Modifier les informations client">
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
                            <div id="editTransporteur"></div>
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
                        <button class="btn btn-secondary" onclick="annulerEditionExpedition()">Annuler</button>
                        <button class="btn btn-primary" onclick="sauvegarderExpedition()">Sauvegarder</button>
                    </div>
                </div>
            `;
        } else {
            detailExpedition.innerHTML = '<p>En attente d\'expédition</p>';
        }
    } else {
        sectionExpedition.style.display = 'none';
    }
    
    afficherActionsCommande(commande);
}

// ========================================
// FONCTIONS D'ÉDITION
// ========================================

// Édition de la livraison
window.editerLivraison = async function() {
    const section = document.querySelector('#detailLivraison').parentElement;
    section.classList.add('editing');
    
    document.getElementById('livraisonReadOnly').style.display = 'none';
    document.getElementById('livraisonEditForm').classList.add('active');
    
    // Charger les magasins et créer le dropdown
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        
        const magasins = [];
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.actif !== false) {
                magasins.push({
                    code: data.code || doc.id,
                    nom: data.nom || data.code || doc.id
                });
            }
        });
        
        magasins.sort((a, b) => a.code.localeCompare(b.code));
        
        // Créer le dropdown magasin avec recherche
        dropdownEditMagasin = new DropdownList({
            container: '#editMagasinLivraison',
            searchable: true,
            placeholder: 'Sélectionner un magasin',
            options: magasins.map(m => ({
                value: m.code,
                label: m.nom
            })),
            value: commandeActuelle.magasinLivraison
        });
        
        // Créer le dropdown urgence
        const optionsUrgence = genererOptionsUrgence();
        dropdownEditUrgence = new DropdownList({
            container: '#editNiveauUrgence',
            placeholder: 'Sélectionner l\'urgence',
            options: optionsUrgence.map(opt => ({
                value: opt.value,
                label: opt.label,
                icon: COMMANDES_CONFIG.NIVEAUX_URGENCE[opt.value]?.icon
            })),
            value: commandeActuelle.niveauUrgence,
            showIcons: true
        });
        
    } catch (error) {
        console.error('Erreur chargement dropdowns:', error);
        notify.error('Erreur lors du chargement des options');
    }
};

window.annulerEditionLivraison = function() {
    const section = document.querySelector('#detailLivraison').parentElement;
    section.classList.remove('editing');
    
    document.getElementById('livraisonReadOnly').style.display = 'block';
    document.getElementById('livraisonEditForm').classList.remove('active');
    
    // Détruire les dropdowns
    if (dropdownEditMagasin) {
        dropdownEditMagasin.destroy();
        dropdownEditMagasin = null;
    }
    if (dropdownEditUrgence) {
        dropdownEditUrgence.destroy();
        dropdownEditUrgence = null;
    }
};

window.sauvegarderLivraison = async function() {
    try {
        const updates = {
            magasinLivraison: dropdownEditMagasin ? dropdownEditMagasin.getValue() : '',
            niveauUrgence: dropdownEditUrgence ? dropdownEditUrgence.getValue() : '',
            'dates.livraisonPrevue': new Date(document.getElementById('editDateLivraison').value),
            commentaires: document.getElementById('editCommentaires').value
        };
        
        await CommandesService.mettreAJourCommande(commandeActuelle.id, updates);
        
        annulerEditionLivraison();
        await voirDetailCommande(commandeActuelle.id);
        notify.success('Informations de livraison mises à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde livraison:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

// Édition de l'expédition
window.editerExpedition = async function() {
    const section = document.getElementById('sectionExpedition');
    section.classList.add('editing');
    
    document.getElementById('expeditionReadOnly').style.display = 'none';
    document.getElementById('expeditionEditForm').classList.add('active');
    
    // Créer le dropdown transporteur
    const transporteurs = genererOptionsTransporteurs();
    dropdownEditTransporteur = new DropdownList({
        container: '#editTransporteur',
        placeholder: 'Sélectionner un transporteur',
        options: transporteurs.map(t => ({
            value: t.value,
            label: t.label
        })),
        value: commandeActuelle.expedition.envoi.transporteur
    });
};

window.annulerEditionExpedition = function() {
    const section = document.getElementById('sectionExpedition');
    section.classList.remove('editing');
    
    document.getElementById('expeditionReadOnly').style.display = 'block';
    document.getElementById('expeditionEditForm').classList.remove('active');
    
    if (dropdownEditTransporteur) {
        dropdownEditTransporteur.destroy();
        dropdownEditTransporteur = null;
    }
};

window.sauvegarderExpedition = async function() {
    try {
        const updates = {
            'expedition.envoi.transporteur': dropdownEditTransporteur ? dropdownEditTransporteur.getValue() : '',
            'expedition.envoi.numeroSuivi': document.getElementById('editNumeroSuivi').value
        };
        
        if (commandeActuelle.expedition.reception?.numeroSuiviRecu) {
            updates['expedition.reception.numeroSuiviRecu'] = document.getElementById('editNumeroSuiviRecu').value;
            updates['expedition.reception.colisConforme'] = document.getElementById('editColisConforme').value === 'true';
            updates['expedition.reception.commentaires'] = document.getElementById('editCommentairesReception').value;
        }
        
        await CommandesService.mettreAJourCommande(commandeActuelle.id, updates);
        
        annulerEditionExpedition();
        await voirDetailCommande(commandeActuelle.id);
        notify.success('Informations d\'expédition mises à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde expédition:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

// ========================================
// ACTIONS ET CHANGEMENT DE STATUT
// ========================================

function afficherActionsCommande(commande) {
    const detailActions = document.getElementById('detailActions');
    let actions = [];
    
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

window.changerStatutDetail = async function(commandeId, nouveauStatut, skipConfirmation = false) {
    console.log('🔄 Début changement statut:', { commandeId, nouveauStatut, skipConfirmation });
    
    try {
        if (!CommandesService || typeof CommandesService.changerStatut !== 'function') {
            throw new Error('CommandesService.changerStatut non disponible');
        }
        
        const labelStatut = COMMANDES_CONFIG.STATUTS[nouveauStatut]?.label || nouveauStatut;
        
        // Si skipConfirmation est true, on passe directement au changement
        let confirme = skipConfirmation;
        
        if (!skipConfirmation) {
            confirme = await confirmerAction({
                titre: 'Confirmation du changement de statut',
                message: `Êtes-vous sûr de vouloir passer la commande au statut "${labelStatut}" ?`,
                boutonConfirmer: 'Confirmer',
                boutonAnnuler: 'Annuler',
                danger: false
            });
        }
        
        if (confirme) {
            console.log('✅ Confirmation reçue ou skippée, appel au service...');
            
            await CommandesService.changerStatut(commandeId, nouveauStatut);
            
            console.log('✅ Statut changé avec succès dans Firebase');
            
            await chargerDonnees();
            
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

window.saisirNumerosSerie = async function(commandeId) {
    console.log('🔍 Clic sur saisir NS, commande:', commandeId);
    const { ouvrirSaisieNumerosSerie } = await import('./commandes.serial.js');
    await ouvrirSaisieNumerosSerie(commandeId);
};

window.terminerPreparation = async function(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        const { verifierNumerosSerie } = await import('./commandes.serial.js');
        
        const nsValides = await verifierNumerosSerie(commande);
        if (!nsValides) {
            return;
        }
        
        await changerStatutDetail(commandeId, 'terminee');
        
    } catch (error) {
        console.error('Erreur terminer préparation:', error);
        afficherErreur('Erreur lors de la finalisation de la préparation');
    }
};

window.saisirExpedition = async function(commandeId) {
    try {
        console.log('🚀 Début saisir expédition pour commande:', commandeId);
        
        const transporteurs = genererOptionsTransporteurs();
        
        const result = await new Promise((resolve) => {
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
                            <div id="expeditionTransporteurDropdown"></div>
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
            
            const dialogContainer = document.getElementById('dialog-container');
            if (!dialogContainer) {
                console.error('❌ Dialog container introuvable');
                resolve(null);
                return;
            }
            
            dialogContainer.innerHTML = dialogHtml;
            dialogContainer.classList.add('active');
            
            // Créer le dropdown pour le transporteur
            let dropdownExpedition = new DropdownList({
                container: '#expeditionTransporteurDropdown',
                placeholder: 'Sélectionner un transporteur',
                options: transporteurs.map(t => ({
                    value: t.value,
                    label: t.label
                })),
                value: 'Colissimo'
            });
            
            const numeroSuiviInput = document.getElementById('expeditionNumeroSuivi');
            const confirmBtn = document.querySelector('.expedition-confirm');
            const cancelBtn = document.querySelector('.expedition-cancel');
            const overlay = document.querySelector('.dialog-overlay');
            
            setTimeout(() => {
                if (numeroSuiviInput) {
                    numeroSuiviInput.focus();
                }
            }, 100);
            
            const handleConfirm = () => {
                const transporteur = dropdownExpedition.getValue();
                const numeroSuivi = numeroSuiviInput ? numeroSuiviInput.value.trim() : '';
                
                console.log('📝 Validation - Transporteur:', transporteur);
                console.log('📝 Validation - Numéro:', numeroSuivi);
                
                if (!numeroSuivi) {
                    if (numeroSuiviInput) {
                        numeroSuiviInput.style.borderColor = '#f44336';
                        numeroSuiviInput.focus();
                    }
                    return;
                }
                
                // IMPORTANT: Capturer les valeurs AVANT de détruire
                const resultData = {
                    transporteur: transporteur,
                    numeroSuivi: numeroSuivi
                };
                
                // Détruire le dropdown IMMÉDIATEMENT
                if (dropdownExpedition) {
                    try {
                        dropdownExpedition.destroy();
                        dropdownExpedition = null; // Important: mettre à null
                    } catch (e) {
                        console.warn('Erreur destroy dropdown:', e);
                    }
                }
                
                // Petit délai pour laisser le destroy se terminer
                setTimeout(() => {
                    dialogContainer.classList.remove('active');
                    setTimeout(() => {
                        dialogContainer.innerHTML = '';
                        resolve(resultData);
                    }, 200);
                }, 50);
            };

            const handleCancel = () => {
                // Détruire le dropdown IMMÉDIATEMENT
                if (dropdownExpedition) {
                    try {
                        dropdownExpedition.destroy();
                        dropdownExpedition = null; // Important: mettre à null
                    } catch (e) {
                        console.warn('Erreur destroy dropdown:', e);
                    }
                }
                
                // Petit délai pour laisser le destroy se terminer
                setTimeout(() => {
                    dialogContainer.classList.remove('active');
                    setTimeout(() => {
                        dialogContainer.innerHTML = '';
                        resolve(null);
                    }, 200);
                }, 50);
            };
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleConfirm);
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
            }
            
            if (overlay) {
                overlay.addEventListener('click', handleCancel);
            }
            
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
            
            const originalResolve = resolve;
            resolve = (value) => {
                document.removeEventListener('keydown', handleKeydown);
                originalResolve(value);
            };
        });
        
        if (!result) {
            console.log('❌ Annulation utilisateur');
            return;
        }
        
        console.log('✅ Données récupérées:', result);
        
        console.log('⏳ Envoi au service CommandesService...');
        
        await CommandesService.changerStatut(commandeId, 'expediee', {
            numeroSuivi: result.numeroSuivi,
            transporteur: result.transporteur
        });
        
        console.log('✅ Statut changé avec succès');
        
        await chargerDonnees();
        await voirDetailCommande(commandeId);
        
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

window.validerReception = async function(commandeId) {
    try {
        const result = await new Promise((resolve) => {
            const dialogHtml = `
                <div class="dialog-overlay"></div>
                <div class="dialog-box">
                    <div class="dialog-header">
                        <div class="dialog-icon info">📥</div>
                        <h3 class="dialog-title">Valider la réception</h3>
                    </div>
                    <div class="dialog-body">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Numéro de suivi reçu *</label>
                            <input type="text" id="numeroSuiviRecu" 
                                   placeholder="Ex: RET123456" 
                                   style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; box-sizing: border-box;"
                                   required>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Le colis est-il conforme ?</label>
                            <select id="colisConforme" 
                                    style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
                                <option value="true">✅ Oui, conforme</option>
                                <option value="false">❌ Non, problème</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Commentaires (optionnel)</label>
                            <textarea id="commentairesReception" 
                                      placeholder="Précisions sur l'état du colis..." 
                                      rows="3"
                                      style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; box-sizing: border-box; resize: vertical;"></textarea>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="dialog-btn secondary reception-cancel">Annuler</button>
                        <button class="dialog-btn primary reception-confirm">Valider la réception</button>
                    </div>
                </div>
            `;
            
            const dialogContainer = document.getElementById('dialog-container');
            if (!dialogContainer) {
                console.error('❌ Dialog container introuvable');
                resolve(null);
                return;
            }
            
            dialogContainer.innerHTML = dialogHtml;
            dialogContainer.classList.add('active');
            
            const numeroSuiviInput = document.getElementById('numeroSuiviRecu');
            const colisConformeSelect = document.getElementById('colisConforme');
            const commentairesTextarea = document.getElementById('commentairesReception');
            const confirmBtn = document.querySelector('.reception-confirm');
            const cancelBtn = document.querySelector('.reception-cancel');
            const overlay = document.querySelector('.dialog-overlay');
            
            setTimeout(() => {
                if (numeroSuiviInput) {
                    numeroSuiviInput.focus();
                }
            }, 100);
            
            const handleConfirm = () => {
                const numeroSuivi = numeroSuiviInput ? numeroSuiviInput.value.trim() : '';
                
                if (!numeroSuivi) {
                    if (numeroSuiviInput) {
                        numeroSuiviInput.style.borderColor = '#f44336';
                        numeroSuiviInput.focus();
                    }
                    return;
                }
                
                const result = {
                    numeroSuiviRecu: numeroSuivi,
                    colisConforme: colisConformeSelect.value,
                    commentaires: commentairesTextarea.value.trim()
                };
                
                dialogContainer.classList.remove('active');
                setTimeout(() => {
                    dialogContainer.innerHTML = '';
                }, 200);
                
                resolve(result);
            };
            
            const handleCancel = () => {
                dialogContainer.classList.remove('active');
                setTimeout(() => {
                    dialogContainer.innerHTML = '';
                }, 200);
                resolve(null);
            };
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleConfirm);
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
            }
            
            if (overlay) {
                overlay.addEventListener('click', handleCancel);
            }
            
            const handleKeydown = (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    handleConfirm();
                } else if (e.key === 'Escape') {
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
        
        if (result) {
            await CommandesService.changerStatut(commandeId, 'receptionnee', {
                numeroSuiviRecu: result.numeroSuiviRecu,
                colisConforme: result.colisConforme === 'true',
                commentairesReception: result.commentaires
            });
            
            await chargerDonnees();
            await voirDetailCommande(commandeId);
            
            afficherSucces('Réception validée');
        }
    } catch (error) {
        // Ne pas logger les erreurs de validation métier (numéros de suivi)
        if (!error.message.includes('Les numéros de suivi ne correspondent pas')) {
            console.error('Erreur validation réception:', error);
        }
        
        // Afficher le message d'erreur détaillé à l'utilisateur
        afficherErreur(error.message || 'Erreur lors de la validation de la réception');
    }
};

// ========================================
// ÉDITION CLIENT
// ========================================

window.editerClient = function() {
    const section = document.querySelector('#detailClient').parentElement;
    section.classList.add('editing');
    
    document.getElementById('clientReadOnly').style.display = 'none';
    document.getElementById('clientEditForm').classList.add('active');
};

window.annulerEditionClient = function() {
    const section = document.querySelector('#detailClient').parentElement;
    section.classList.remove('editing');
    
    document.getElementById('clientReadOnly').style.display = 'block';
    document.getElementById('clientEditForm').classList.remove('active');
};

window.sauvegarderClient = async function() {
    try {
        const updates = {
            'client.prenom': document.getElementById('editClientPrenom').value,
            'client.nom': document.getElementById('editClientNom').value,
            'client.telephone': document.getElementById('editClientTelephone').value,
            'client.email': document.getElementById('editClientEmail').value
        };
        
        await CommandesService.mettreAJourCommande(commandeActuelle.id, updates);
        
        annulerEditionClient();
        await voirDetailCommande(commandeActuelle.id);
        notify.success('Informations client mises à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde client:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

// ========================================
// ÉDITION PRODUITS
// ========================================

let produitsEnEdition = [];

window.editerProduits = function() {
    const section = document.querySelector('#detailProduits').parentElement;
    section.classList.add('editing');
    
    document.getElementById('produitsReadOnly').style.display = 'none';
    document.getElementById('produitsEditForm').classList.add('active');
    
    produitsEnEdition = [...commandeActuelle.produits];
    afficherProduitsEdition();
};

function afficherProduitsEdition() {
    const container = document.getElementById('editProduitsExistants');
    
    container.innerHTML = produitsEnEdition.map((produit, index) => `
        <div class="edit-produit-item">
            <div class="edit-produit-header">
                ${produit.designation} ${produit.cote ? `(${produit.cote})` : ''}
            </div>
            <div class="edit-produit-fields">
                <div class="edit-produit-field">
                    <label>Quantité</label>
                    <input type="number" value="${produit.quantite}" min="1" 
                           onchange="updateProduitQuantite(${index}, this.value)">
                </div>
                ${produit.necessiteCote ? `
                    <div class="edit-produit-field serial">
                        <label>N° Série</label>
                        <input type="text" value="${produit.numeroSerie || ''}" 
                               placeholder="Saisir le numéro..."
                               onchange="updateProduitSerial(${index}, this.value)">
                    </div>
                ` : ''}
                <button class="btn-delete-produit" onclick="supprimerProduitEdition(${index})">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

window.updateProduitQuantite = function(index, value) {
    produitsEnEdition[index].quantite = parseInt(value) || 1;
};

window.updateProduitSerial = function(index, value) {
    produitsEnEdition[index].numeroSerie = value;
};

window.supprimerProduitEdition = function(index) {
    produitsEnEdition.splice(index, 1);
    afficherProduitsEdition();
};

window.annulerEditionProduits = function() {
    const section = document.querySelector('#detailProduits').parentElement;
    section.classList.remove('editing');
    
    document.getElementById('produitsReadOnly').style.display = 'block';
    document.getElementById('produitsEditForm').classList.remove('active');
    
    produitsEnEdition = [];
};

window.sauvegarderProduits = async function() {
    try {
        await CommandesService.mettreAJourCommande(commandeActuelle.id, {
            produits: produitsEnEdition
        });
        
        annulerEditionProduits();
        await voirDetailCommande(commandeActuelle.id);
        notify.success('Produits mis à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde produits:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

window.rechercherProduitEdit = function() {
    // TODO: Implémenter la recherche de produits pour l'édition
    console.log('Recherche produit pour édition - À implémenter');
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

// Variable pour stocker l'import du module Firebase
let db = null;

// Fonction pour obtenir la référence db
async function getDb() {
    if (!db) {
        const { db: firebaseDb } = await import('../../services/firebase.service.js');
        db = firebaseDb;
    }
    return db;
}

// Utiliser getDb() dans les fonctions qui en ont besoin

window.marquerPatientPrevenu = async function(commandeId) {
    const confirme = await confirmerAction({
        titre: 'Patient prévenu',
        message: 'Confirmer que le patient a été prévenu ?',
        boutonConfirmer: 'Oui, patient prévenu',
        boutonAnnuler: 'Annuler',
        danger: false
    });
    
    if (confirme) {
        try {
            await CommandesService.mettreAJourCommande(commandeId, {
                patientPrevenu: true,
                'dates.patientPrevenu': new Date()
            });
            
            await chargerDonnees();
            await voirDetailCommande(commandeId);
            
            afficherSucces('Patient marqué comme prévenu');
        } catch (error) {
            console.error('Erreur mise à jour:', error);
            afficherErreur('Erreur lors de la mise à jour');
        }
    }
};

window.livrerDirectement = async function(commandeId) {
    const confirme = await confirmerAction({
        titre: 'Livraison directe',
        message: 'Confirmer la livraison directe au patient (sans expédition) ?',
        boutonConfirmer: 'Confirmer la livraison',
        boutonAnnuler: 'Annuler',
        danger: false
    });
    
    if (confirme) {
        // Passer true pour skipConfirmation afin d'éviter la double popup
        await changerStatutDetail(commandeId, 'livree', true);
    }
};

window.annulerCommande = async function(commandeId) {
    const result = await new Promise((resolve) => {
        const dialogHtml = `
            <div class="dialog-overlay"></div>
            <div class="dialog-box">
                <div class="dialog-header">
                    <div class="dialog-icon danger">❌</div>
                    <h3 class="dialog-title">Annuler la commande</h3>
                </div>
                <div class="dialog-body">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Motif d'annulation *</label>
                        <textarea id="motifAnnulation" 
                                  placeholder="Précisez la raison de l'annulation..." 
                                  rows="3"
                                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; box-sizing: border-box; resize: vertical;"
                                  required></textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn secondary annulation-cancel">Annuler</button>
                    <button class="dialog-btn danger annulation-confirm">Confirmer l'annulation</button>
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
        
        const motifTextarea = document.getElementById('motifAnnulation');
        const confirmBtn = document.querySelector('.annulation-confirm');
        const cancelBtn = document.querySelector('.annulation-cancel');
        const overlay = document.querySelector('.dialog-overlay');
        
        setTimeout(() => {
            if (motifTextarea) {
                motifTextarea.focus();
            }
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
            
            resolve({ motif });
        };
        
        const handleCancel = () => {
            dialogContainer.classList.remove('active');
            setTimeout(() => {
                dialogContainer.innerHTML = '';
            }, 200);
            resolve(null);
        };
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', handleConfirm);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', handleCancel);
        }
        
        if (overlay) {
            overlay.addEventListener('click', handleCancel);
        }
        
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
    
    if (result && result.motif) {
        try {
            await CommandesService.changerStatut(commandeId, 'annulee', {
                motifAnnulation: result.motif
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

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [01/02/2025] - Intégration complète de DropdownList
   - Remplacement de tous les <select> par DropdownList dans l'édition
   - Dropdown magasin avec recherche activée
   - Dropdown urgence avec icônes
   - Dropdown transporteur dans le dialog d'expédition
   - Gestion propre du destroy() sur tous les dropdowns
   - Import db géré avec fonction async getDb()
   
   [31/01/2025] - Correction double popup livraison directe
   - Problème: Double confirmation lors de "Livrer directement au patient"
   - Solution: Ajout paramètre skipConfirmation dans changerStatutDetail
   - Impact: Plus de double popup, passage direct au statut livré
   
   NOTES POUR REPRISES FUTURES:
   - Tous les dropdowns d'édition utilisent DropdownList
   - La recherche est activée uniquement sur les magasins
   - Les icônes sont affichées pour l'urgence
   - Toujours détruire les dropdowns dans les fonctions annuler
   - livrerDirectement utilise skipConfirmation = true
   ======================================== */
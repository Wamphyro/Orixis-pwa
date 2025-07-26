// ========================================
// COMMANDES.DETAIL.JS - Gestion du détail et des modifications (CORRIGÉ)
// Chemin: src/js/pages/commandes/commandes.detail.js
//
// DESCRIPTION:
// Gère l'affichage détaillé d'une commande et les actions de modification de statut.
// Utilise le composant Timeline pour afficher la progression visuelle.
// Modifié le 27/07/2025 : Ajout suppression sécurisée + saisie NS + flux expédition
// Modifié le 29/07/2025 : Toujours afficher les boutons expédition ET livraison directe
//
// STRUCTURE:
// 1. Imports et dépendances (lignes 15-30)
// 2. Affichage du détail (lignes 32-200)
// 3. Changement de statut (lignes 202-320)
// 4. Actions spécifiques (lignes 322-500)
// 5. Fonction de suppression sécurisée (lignes 502-570)
// 6. Fonctions utilitaires (lignes 572-580)
//
// DÉPENDANCES:
// - CommandesService: Accès aux données des commandes
// - Timeline component: Pour l'affichage de la progression
// - Dialog/notify: Pour les interactions utilisateur
// - commandes.serial: Pour la gestion des numéros de série
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { Dialog, confirmerAction, createOrderTimeline, notify } from '../../shared/index.js';
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
    
    // Informations client - VERSION COMPACTE
    const detailClient = document.getElementById('detailClient');
    detailClient.innerHTML = `
        <div class="detail-info-compact">
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
    `;
    
    // Produits commandés - NOUVEAU DESIGN SANS TABLEAU
    const detailProduits = document.getElementById('detailProduits');
    detailProduits.innerHTML = `
        <div class="produits-list">
            ${commande.produits.map(p => `
                <div class="produit-item">
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
    `;
    
    // Informations de livraison - DANS LA MÊME LIGNE QUE CLIENT
    const detailLivraison = document.getElementById('detailLivraison');
    detailLivraison.innerHTML = `
        <div class="detail-info-compact">
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
    `;
    
    // Section expédition (MODIFIÉE pour afficher plus d'infos)
    const sectionExpedition = document.getElementById('sectionExpedition');
    if (commande.expedition?.necessiteExpedition || commande.expedition?.envoi?.numeroSuivi) {
        sectionExpedition.style.display = 'block';
        const detailExpedition = document.getElementById('detailExpedition');
        
        if (commande.expedition.envoi?.numeroSuivi) {
            detailExpedition.innerHTML = `
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

// ========================================
// FONCTION SAISIR EXPÉDITION - VERSION SIMPLIFIÉE ET CORRIGÉE
// À remplacer dans commandes.detail.js
// ========================================

// MODIFIÉ : Saisir expédition avec transporteur et numéro
window.saisirExpedition = async function(commandeId) {
    try {
        console.log('🚀 Début saisir expédition pour commande:', commandeId);
        
        // Étape 1 : Demander le numéro de suivi (OBLIGATOIRE)
        const numeroSuivi = await Dialog.prompt(
            'Saisissez le numéro de suivi du colis :',
            '',
            '📦 Expédition du colis'
        );
        
        console.log('📝 Numéro saisi:', numeroSuivi);
        
        // Vérification que l'utilisateur n'a pas annulé
        if (numeroSuivi === false || numeroSuivi === null) {
            console.log('❌ Annulation utilisateur');
            return;
        }
        
        // Vérification que le numéro n'est pas vide
        if (!numeroSuivi || !numeroSuivi.toString().trim()) {
            console.log('❌ Numéro vide');
            await Dialog.alert('Le numéro de suivi est obligatoire', 'Attention');
            return;
        }
        
        // Étape 2 : Demander le transporteur (OPTIONNEL)
        const transporteurs = ['Colissimo', 'Chronopost', 'UPS', 'DHL', 'Fedex', 'GLS', 'Autre'];
        
        // Créer une liste des transporteurs
        const listeTransporteurs = transporteurs.map((t, index) => 
            `${index + 1}. ${t}`
        ).join('\n');
        
        const choixTransporteur = await Dialog.prompt(
            `Choisissez le transporteur :\n\n${listeTransporteurs}\n\nTapez le numéro (1-7) ou laissez vide pour Colissimo :`,
            '1',
            '🚚 Transporteur'
        );
        
        // Déterminer le transporteur
        let transporteur = 'Colissimo'; // Par défaut
        
        if (choixTransporteur && choixTransporteur !== false) {
            const index = parseInt(choixTransporteur) - 1;
            if (index >= 0 && index < transporteurs.length) {
                transporteur = transporteurs[index];
            }
        }
        
        console.log('🚚 Transporteur choisi:', transporteur);
        console.log('📦 Numéro final:', numeroSuivi.toString().trim());
        
        // Étape 3 : Envoyer au service
        console.log('⏳ Envoi au service CommandesService...');
        
        await CommandesService.changerStatut(commandeId, 'expediee', {
            numeroSuivi: numeroSuivi.toString().trim(),
            transporteur: transporteur
        });
        
        console.log('✅ Statut changé avec succès');
        
        // Étape 4 : Rafraîchir l'interface
        await chargerDonnees();
        await voirDetailCommande(commandeId);
        
        // Notification de succès
        afficherSucces(`Expédition validée - ${transporteur} - N° ${numeroSuivi.toString().trim()}`);
        
        console.log('🎉 Processus terminé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur validation expédition:', error);
        console.error('Stack:', error.stack);
        
        // Message d'erreur détaillé
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
// FONCTIONS UTILITAIRES
// ========================================

function formatDate(timestamp) {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
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
   
   NOTES POUR REPRISES FUTURES:
   - Le composant Timeline gère automatiquement l'orientation
   - Les styles sont dans commandes-modal.css section 4
   - Ne pas générer de HTML manuel pour la timeline
   - La modal reste ouverte après changement de statut
   - La suppression nécessite la saisie exacte du numéro de commande
   - Les NS sont obligatoires pour les appareils auditifs
   - L'expédition est optionnelle (bouton livrer directement)
   - Les deux boutons (expédier + livrer) s'affichent toujours pour le statut "terminee"
   ======================================== */
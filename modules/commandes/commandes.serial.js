/* ========================================
   COMMANDES.SERIAL.JS - Gestion des numéros de série
   Chemin: src/js/pages/commandes/commandes.serial.js
   
   DESCRIPTION:
   Module de gestion de la saisie des numéros de série pour les appareils auditifs
   et accessoires nécessitant une traçabilité.
   
   STRUCTURE:
   1. Modal de saisie des NS (lignes 20-150)
   2. Validation et sauvegarde (lignes 152-220)
   3. Helpers et utilitaires (lignes 222-250)
   
   DÉPENDANCES:
   - CommandesService: Pour la mise à jour des NS
   - Dialog: Pour les confirmations
   - notify: Pour les notifications
   ======================================== */

import { CommandesService } from './commandes.service.js';
import config from './commandes.config.js';

// ========================================
// CRÉATION DU MODAL DE SAISIE
// ========================================

export function creerModalNumerosSerie() {
    // Vérifier si le modal existe déjà
    if (document.getElementById('modalNumerosSerie')) {
        return;
    }
    
    const modalHtml = `
        <div id="modalNumerosSerie" class="modal" style="display: none;">
            <div class="modal-content modal-md">
                <div class="modal-header">
                    <h2>Saisie des numéros de série</h2>
                    <button class="modal-close" onclick="window.modalManager.close('modalNumerosSerie')">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="ns-info-alert">
                        <span class="alert-icon">ℹ️</span>
                        <div>
                            <strong>Important :</strong> Les numéros de série sont obligatoires pour les appareils auditifs.
                            Ils permettent la traçabilité et la gestion de la garantie.
                        </div>
                    </div>
                    
                    <form id="formNumerosSerie">
                        <div id="nsFieldsContainer">
                            <!-- Les champs seront générés dynamiquement -->
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.modalManager.close('modalNumerosSerie')">
                        Annuler
                    </button>
                    <button class="btn btn-primary" onclick="validerNumerosSerie()">
                        Valider les numéros
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Enregistrer le modal
    window.modalManager.register('modalNumerosSerie', {
        closeOnOverlayClick: false,
        closeOnEscape: true
    });
}

// ========================================
// OUVERTURE ET REMPLISSAGE DU MODAL
// ========================================

export async function ouvrirSaisieNumerosSerie(commandeId) {
    try {
        // Récupérer la commande
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) {
            config.notify.error('Commande introuvable');
            return;
        }
        
        // Créer le modal si nécessaire
        creerModalNumerosSerie();
        
        // Stocker l'ID de la commande
        window.currentCommandeNS = commandeId;
        
        // Générer les champs de saisie
        const container = document.getElementById('nsFieldsContainer');
        container.innerHTML = '';
        
        // Grouper les produits par type
        const appareilsAuditifs = commande.produits.filter(p => 
            p.type === 'appareil_auditif' || p.necessiteCote
        );
        const accessoires = commande.produits.filter(p => 
            p.type !== 'appareil_auditif' && !p.necessiteCote && p.necessiteNumeroSerie
        );
        
        let html = '';
        
        // Appareils auditifs
        if (appareilsAuditifs.length > 0) {
            html += '<h4 class="ns-section-title">Appareils auditifs</h4>';
            
            appareilsAuditifs.forEach((produit, index) => {
                const fieldId = `ns_appareil_${index}`;
                const coteLabel = produit.cote ? ` - Côté ${produit.cote}` : '';
                const valueExistant = produit.numeroSerie || '';
                
                html += `
                    <div class="form-group ns-field-group">
                        <label for="${fieldId}">
                            ${produit.designation}${coteLabel} *
                            <span class="ns-reference">${produit.reference}</span>
                        </label>
                        <input type="text" 
                               id="${fieldId}" 
                               name="${fieldId}"
                               class="form-control ns-input"
                               placeholder="Ex: 123456789"
                               value="${valueExistant}"
                               data-produit-index="${index}"
                               data-type="appareil"
                               data-cote="${produit.cote || ''}"
                               required>
                        <small class="form-text">Format: numéro de série du fabricant</small>
                    </div>
                `;
            });
        }
        
        // Accessoires avec NS
        if (accessoires.length > 0) {
            html += '<h4 class="ns-section-title">Accessoires</h4>';
            
            accessoires.forEach((produit, index) => {
                const fieldId = `ns_accessoire_${index}`;
                const valueExistant = produit.numeroSerie || '';
                
                html += `
                    <div class="form-group ns-field-group">
                        <label for="${fieldId}">
                            ${produit.designation}
                            <span class="ns-reference">${produit.reference}</span>
                        </label>
                        <input type="text" 
                               id="${fieldId}" 
                               name="${fieldId}"
                               class="form-control ns-input"
                               placeholder="Optionnel"
                               value="${valueExistant}"
                               data-produit-index="${appareilsAuditifs.length + index}"
                               data-type="accessoire">
                        <small class="form-text">Laisser vide si pas de numéro de série</small>
                    </div>
                `;
            });
        }
        
        // Si aucun produit ne nécessite de NS
        if (appareilsAuditifs.length === 0 && accessoires.length === 0) {
            html = `
                <div class="ns-empty-state">
                    <p>✅ Aucun produit de cette commande ne nécessite de numéro de série.</p>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Ouvrir le modal
        window.modalManager.open('modalNumerosSerie');
        
        // Focus sur le premier champ
        setTimeout(() => {
            const firstInput = container.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 300);
        
    } catch (error) {
        console.error('Erreur ouverture saisie NS:', error);
        config.notify.error('Erreur lors de l\'ouverture de la saisie');
    }
}

// ========================================
// VALIDATION ET SAUVEGARDE
// ========================================

window.validerNumerosSerie = async function() {
    try {
        const form = document.getElementById('formNumerosSerie');
        
        // Validation HTML5
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Récupérer tous les numéros saisis
        const numerosSerie = {
            droit: null,
            gauche: null,
            accessoires: []
        };
        
        // Parcourir tous les champs
        const inputs = form.querySelectorAll('.ns-input');
        const produitsMAJ = [];
        
        inputs.forEach(input => {
            const value = input.value.trim();
            const type = input.dataset.type;
            const cote = input.dataset.cote;
            const index = parseInt(input.dataset.produitIndex);
            
            if (value) {
                // Pour les appareils auditifs
                if (type === 'appareil' && cote) {
                    numerosSerie[cote] = value;
                }
                // Pour les accessoires
                else if (type === 'accessoire') {
                    numerosSerie.accessoires.push({
                        index: index,
                        numeroSerie: value
                    });
                }
                
                // Préparer la mise à jour du produit
                produitsMAJ.push({
                    index: index,
                    numeroSerie: value
                });
            }
        });
        
        // Vérifier qu'on a au moins un NS pour les appareils obligatoires
        const appareilsObligatoires = form.querySelectorAll('[data-type="appareil"][required]');
        if (appareilsObligatoires.length > 0) {
            const tousRemplis = Array.from(appareilsObligatoires).every(input => input.value.trim());
            if (!tousRemplis) {
                await config.Dialog.alert('Tous les numéros de série des appareils auditifs sont obligatoires.', 'Attention');
                return;
            }
        }
        
        // Sauvegarder les numéros
        const commandeId = window.currentCommandeNS;
        await CommandesService.mettreAJourNumerosSerie(commandeId, numerosSerie);
        
        // Fermer le modal
        window.modalManager.close('modalNumerosSerie');
        
        // Rafraîchir la vue
        if (window.voirDetailCommande) {
            await window.voirDetailCommande(commandeId);
        }
        
        config.notify.success('Numéros de série enregistrés avec succès');
        
    } catch (error) {
        console.error('Erreur validation NS:', error);
        config.notify.error('Erreur lors de l\'enregistrement des numéros');
    }
};

// ========================================
// VÉRIFICATION AVANT TERMINER PRÉPARATION
// ========================================

export async function verifierNumerosSerie(commande) {
    // Vérifier si des appareils auditifs n'ont pas de NS
    const appareilsSansNS = commande.produits.filter(p => 
        (p.type === 'appareil_auditif' || p.necessiteCote) && !p.numeroSerie
    );
    
    if (appareilsSansNS.length > 0) {
        const message = `${appareilsSansNS.length} appareil(s) auditif(s) n'ont pas de numéro de série. 
                        La saisie est obligatoire avant de terminer la préparation.`;
        
        await config.Dialog.alert(message, '⚠️ Numéros de série manquants');
        return false;
    }
    
    return true;
}

// Exposer les fonctions pour l'utilisation globale
window.ouvrirSaisieNumerosSerie = ouvrirSaisieNumerosSerie;
window.verifierNumerosSerie = verifierNumerosSerie;
// ========================================
// SUBVENTIONS.CREATE.JS - Création de dossier
// Chemin: modules/subventions/orchestrators/subventions.create.js
//
// DESCRIPTION:
// Orchestrateur pour la création de nouveaux dossiers
// Gère le formulaire, la recherche patient et la validation
// ========================================

import config from '../core/subventions.config.js';
import { ClientsService } from '../../../src/services/clients.service.js';

class SubventionsCreate {
    constructor() {
        this.permissions = null;
        this.selectedPatient = null;
        this.formData = {
            type: 'mdph_agefiph',
            montantAppareil: 350000, // 3500€ en centimes
            notes: ''
        };
        
        this.elements = {};
        this.isSubmitting = false;
        this.searchDropdown = null;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init(permissions) {
        this.permissions = permissions;
        this.render();
        this.attachEvents();
        
        // Focus sur la recherche patient
        setTimeout(() => {
            if (this.searchDropdown && this.searchDropdown.input) {
                this.searchDropdown.input.focus();
            }
        }, 100);
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.getElementById('subventions-create-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="create-dossier">
                <div class="create-header">
                    <h2>Créer un nouveau dossier de subvention</h2>
                    <p class="subtitle">Sélectionnez un patient et configurez le type de dossier</p>
                </div>
                
                <form id="create-form" class="create-form">
                    <!-- Section Patient -->
                    <!-- Section Patient -->
                        <div class="form-section">
                            <h3 class="section-title">
                                <span class="section-number">1</span>
                                Patient
                            </h3>
                            
                            <div class="patient-search">
                                <!-- SearchDropdown -->
                                <div class="search-container" id="search-container">
                                    <!-- Le SearchDropdown sera injecté ici -->
                                </div>
                                
                                <!-- Carte patient sélectionné (comme commandes) -->
                                <div class="selected-patient" id="selected-patient" style="display: none;">
                                    <div class="patient-card" style="
                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                        border-radius: 12px;
                                        padding: 20px;
                                        color: white;
                                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                        margin: 20px 0;">
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: start;">
                                            <div class="patient-info">
                                                <h4 id="patient-name" style="margin: 0 0 8px 0; font-size: 1.2rem;"></h4>
                                                <p id="patient-details" style="margin: 0; opacity: 0.9; font-size: 0.9rem;"></p>
                                            </div>
                                            <button type="button" class="btn-change" id="btn-change-patient" 
                                                    style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); 
                                                        color: white; padding: 6px 16px; border-radius: 20px; cursor: pointer;">
                                                Changer
                                            </button>
                                        </div>
                                    </div>
                                    <div class="patient-alert" id="patient-alert"></div>
                                </div>
                            </div>
                            
                            <!-- Option création rapide (style amélioré) -->
                            <div class="quick-create" style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                <span style="color: #999;">OU</span>
                                <button type="button" class="btn btn-outline-primary" id="btn-create-patient" 
                                        style="display: block; margin: 15px auto; padding: 12px 30px; border-radius: 25px;">
                                    ➕ Créer un nouveau patient
                                </button>
                            </div>
                        </div>
                        
                        <!-- Option création rapide -->
                        <div class="quick-create">
                            <p>Patient non trouvé ? 
                                <button type="button" class="btn-link" id="btn-create-patient">
                                    Créer un nouveau patient
                                </button>
                            </p>
                        </div>
                    </div>
                    
                    <!-- Section Type de dossier -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-number">2</span>
                            Type de dossier
                        </h3>
                        
                        <div class="radio-group">
                            <label class="radio-card">
                                <input type="radio" 
                                       name="type" 
                                       value="mdph_agefiph"
                                       checked>
                                <div class="radio-content">
                                    <div class="radio-header">
                                        <span class="radio-icon">📋</span>
                                        <span class="radio-title">MDPH + AGEFIPH</span>
                                    </div>
                                    <p class="radio-description">
                                        Dossier complet avec demande RQTH/PCH et financement AGEFIPH
                                    </p>
                                </div>
                            </label>
                            
                            <label class="radio-card">
                                <input type="radio" 
                                       name="type" 
                                       value="mdph_pch">
                                <div class="radio-content">
                                    <div class="radio-header">
                                        <span class="radio-icon">🏥</span>
                                        <span class="radio-title">MDPH avec PCH uniquement</span>
                                    </div>
                                    <p class="radio-description">
                                        Patient ayant déjà la RQTH, demande PCH uniquement
                                    </p>
                                </div>
                            </label>
                            
                            <label class="radio-card">
                                <input type="radio" 
                                       name="type" 
                                       value="mdph_seul">
                                <div class="radio-content">
                                    <div class="radio-header">
                                        <span class="radio-icon">📄</span>
                                        <span class="radio-title">MDPH seul</span>
                                    </div>
                                    <p class="radio-description">
                                        Uniquement la demande MDPH (sans AGEFIPH)
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Section Informations -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-number">3</span>
                            Informations complémentaires
                        </h3>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="montant">Montant de l'appareil</label>
                                <div class="input-group">
                                    <input type="number" 
                                           id="montant" 
                                           name="montant"
                                           value="${this.formData.montantAppareil / 100}"
                                           min="0"
                                           step="0.01"
                                           class="form-input">
                                    <span class="input-addon">€</span>
                                </div>
                                <small class="form-help">Prix total de l'appareillage</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="situation">Situation professionnelle</label>
                                <select id="situation" 
                                        name="situation" 
                                        class="form-select"
                                        disabled>
                                    <option value="">Sélectionner un patient d'abord</option>
                                </select>
                                <small class="form-help">Détermine les documents requis</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="notes">Notes internes (optionnel)</label>
                            <textarea id="notes" 
                                      name="notes"
                                      rows="3"
                                      class="form-textarea"
                                      placeholder="Informations particulières sur ce dossier..."></textarea>
                        </div>
                    </div>
                    
                    <!-- Récapitulatif -->
                    <div class="form-section" id="recap-section" style="display: none;">
                        <h3 class="section-title">
                            <span class="section-number">✓</span>
                            Récapitulatif
                        </h3>
                        
                        <div class="recap-card">
                            <div class="recap-content" id="recap-content">
                                <!-- Sera rempli dynamiquement -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="form-actions">
                        <button type="button" 
                                class="btn btn-secondary" 
                                onclick="config.modalManager.close('modalCreateSubvention')">
                            Annuler
                        </button>
                        <button type="submit" 
                                class="btn btn-primary" 
                                id="btn-submit"
                                disabled>
                            <span class="btn-text">Créer le dossier</span>
                            <span class="btn-loading" style="display: none;">
                                <i class="icon-loader"></i> Création...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Stocker les références
        this.elements = {
            form: document.getElementById('create-form'),
            searchContainer: document.getElementById('search-container'),
            selectedPatient: document.getElementById('selected-patient'),
            patientName: document.getElementById('patient-name'),
            patientDetails: document.getElementById('patient-details'),
            patientAlert: document.getElementById('patient-alert'),
            situationSelect: document.getElementById('situation'),
            montantInput: document.getElementById('montant'),
            notesTextarea: document.getElementById('notes'),
            recapSection: document.getElementById('recap-section'),
            recapContent: document.getElementById('recap-content'),
            submitBtn: document.getElementById('btn-submit')
        };
        
        // Initialiser la recherche patient
        this.initSearchDropdown();
    }
    
    // ========================================
    // COMPOSANTS
    // ========================================
    
initSearchDropdown() {
    // Détruire l'ancienne instance si elle existe
    if (this.searchDropdown) {
        this.searchDropdown.destroy();
    }
    
    this.searchDropdown = config.createSearchDropdown(this.elements.searchContainer, {
        placeholder: 'Rechercher un patient (nom, prénom, téléphone...)',
        onSearch: async (query) => {
            try {
                const clients = await ClientsService.rechercherClients(query);
                return clients.map(client => ({
                    id: client.id,
                    nom: client.nom,
                    prenom: client.prenom,
                    telephone: client.telephone || '',
                    email: client.email || '',
                    dateNaissance: client.dateNaissance || null,
                    adresse: {
                        rue: client.adresse?.rue || '',
                        codePostal: client.adresse?.codePostal || '',
                        ville: client.adresse?.ville || '',
                        departement: client.adresse?.departement || ''
                    },
                    situation: client.situation || ''
                }));
            } catch (error) {
                console.error('Erreur recherche patient:', error);
                throw error;
            }
        },
        onSelect: (patient) => {
            this.selectPatient(patient);
        },
        renderItem: (patient) => {
            // Template élégant comme dans commandes
            return `
                <div style="padding: 8px;">
                    <strong style="color: #2c3e50;">${patient.nom} ${patient.prenom}</strong>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">
                        ${patient.telephone || 'Pas de téléphone'} 
                        ${patient.email ? '• ' + patient.email : ''}
                    </div>
                </div>
            `;
        }
    });
}
    
    // ========================================
    // GESTION DU PATIENT
    // ========================================
    
async selectPatient(patient) {
    this.selectedPatient = patient;
    
    // Masquer la recherche
    this.elements.searchContainer.style.display = 'none';
    
    // Afficher la carte patient avec animation
    this.elements.selectedPatient.style.display = 'block';
    this.elements.selectedPatient.style.animation = 'fadeInUp 0.3s ease';
    
    // Remplir les infos
    this.elements.patientName.textContent = `${patient.nom} ${patient.prenom}`;
    
    let details = [];
    if (patient.dateNaissance) {
        details.push(`Né(e) le ${this.formatDate(patient.dateNaissance)}`);
    }
    if (patient.telephone) {
        details.push(`📱 ${patient.telephone}`);
    }
    if (patient.email) {
        details.push(`✉️ ${patient.email}`);
    }
    
    this.elements.patientDetails.innerHTML = details.join(' • ');
    
    // Suite du traitement...
    await this.loadPatientSituation(patient);
    this.checkEligibilite();
    this.enableForm();
    this.updateRecap();
}
    
    async loadPatientSituation(patient) {
        if (!patient.adresse) {
            patient.adresse = { departement: '75' };
        }
        
        let situation = patient.situation || '';
        
        // Options de situation en dur pour l'instant
        const situations = [
            { value: 'salarie', label: 'Salarié' },
            { value: 'independant', label: 'Indépendant' },
            { value: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
            { value: 'retraite', label: 'Retraité' },
            { value: 'etudiant', label: 'Étudiant' }
        ];
        
        this.elements.situationSelect.innerHTML = `
            <option value="">-- Sélectionner --</option>
            ${situations.map(opt => `
                <option value="${opt.value}" ${situation === opt.value ? 'selected' : ''}>
                    ${opt.label}
                </option>
            `).join('')}
        `;
        
        this.elements.situationSelect.disabled = false;
        
        if (situation) {
            this.checkEligibilite();
        }
    }
    
    checkEligibilite() {
        const situation = this.elements.situationSelect.value;
        if (!situation) {
            this.elements.patientAlert.innerHTML = '';
            return;
        }
        
        const eligibilite = {
            eligible: situation === 'salarie' || situation === 'independant',
            raison: situation === 'retraite' ? 'Retraité depuis plus de 2 ans' : null,
            conditions: situation === 'demandeur_emploi' ? ['Inscription < 2 ans'] : null
        };
        
        if (!eligibilite.eligible) {
            this.elements.patientAlert.innerHTML = `
                <div class="alert alert-danger">
                    <i class="icon-alert-circle"></i>
                    <strong>Non éligible AGEFIPH :</strong> ${eligibilite.raison}
                    ${eligibilite.alternative ? `<br>Alternative : ${eligibilite.alternative}` : ''}
                </div>
            `;
            
            // Forcer MDPH seul
            document.querySelector('input[name="type"][value="mdph_seul"]').checked = true;
            document.querySelector('input[name="type"][value="mdph_agefiph"]').disabled = true;
            
        } else if (eligibilite.conditions) {
            this.elements.patientAlert.innerHTML = `
                <div class="alert alert-warning">
                    <i class="icon-info"></i>
                    <strong>Éligibilité conditionnelle :</strong>
                    <ul>
                        ${eligibilite.conditions.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            this.elements.patientAlert.innerHTML = `
                <div class="alert alert-success">
                    <i class="icon-check"></i>
                    Éligible MDPH et AGEFIPH
                </div>
            `;
        }
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Changement de patient
        document.getElementById('btn-change-patient')?.addEventListener('click', () => {
            this.resetPatient();
        });
        
        // Créer patient
        document.getElementById('btn-create-patient')?.addEventListener('click', () => {
            this.openCreatePatient();
        });
        
        // Changement de situation
        this.elements.situationSelect?.addEventListener('change', () => {
            this.checkEligibilite();
            this.updateRecap();
        });
        
        // Changements dans le formulaire
        this.elements.form?.addEventListener('change', () => {
            this.updateRecap();
        });
        
        // Soumission
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }
    
    resetPatient() {
        this.selectedPatient = null;
        this.elements.selectedPatient.style.display = 'none';
        this.elements.searchContainer.style.display = 'block';
        
        // Utiliser le searchDropdown stocké
        if (this.searchDropdown) {
            this.searchDropdown.clear();
            if (this.searchDropdown.input) {
                this.searchDropdown.input.focus();
            }
        }
        
        this.elements.situationSelect.disabled = true;
        this.elements.situationSelect.value = '';
        this.elements.patientAlert.innerHTML = '';
        this.disableForm();
    }
    
    openCreatePatient() {
        config.notify.info('Création patient à venir');
    }
    
    // ========================================
    // RÉCAPITULATIF
    // ========================================
    
    updateRecap() {
        if (!this.selectedPatient) {
            this.elements.recapSection.style.display = 'none';
            return;
        }
        
        const type = document.querySelector('input[name="type"]:checked')?.value;
        const situation = this.elements.situationSelect.value;
        const montant = parseFloat(this.elements.montantInput.value) || 0;
        
        const typeLabels = {
            'mdph_agefiph': 'MDPH + AGEFIPH',
            'mdph_pch': 'MDPH avec PCH uniquement',
            'mdph_seul': 'MDPH seul'
        };
        
        this.elements.recapContent.innerHTML = `
            <div class="recap-item">
                <span class="recap-label">Patient :</span>
                <span class="recap-value">${this.selectedPatient.nom} ${this.selectedPatient.prenom}</span>
            </div>
            <div class="recap-item">
                <span class="recap-label">Type de dossier :</span>
                <span class="recap-value">${typeLabels[type] || '-'}</span>
            </div>
            <div class="recap-item">
                <span class="recap-label">Situation :</span>
                <span class="recap-value">${situation ? this.getSituationLabel(situation) : '-'}</span>
            </div>
            <div class="recap-item">
                <span class="recap-label">Montant appareil :</span>
                <span class="recap-value">${this.formatMontant(montant)}</span>
            </div>
        `;
        
        this.elements.recapSection.style.display = 'block';
    }
    
    // ========================================
    // VALIDATION ET SOUMISSION
    // ========================================
    
    enableForm() {
        this.elements.submitBtn.disabled = false;
    }
    
    disableForm() {
        this.elements.submitBtn.disabled = true;
    }
    
    async handleSubmit() {
        if (this.isSubmitting) return;
        
        try {
            // Validation
            if (!this.validateForm()) {
                return;
            }
            
            this.isSubmitting = true;
            this.showLoading();
            
            // Préparer les données
            const data = {
                patient: {
                    id: this.selectedPatient.id,
                    nom: this.selectedPatient.nom,
                    prenom: this.selectedPatient.prenom,
                    dateNaissance: this.selectedPatient.dateNaissance,
                    telephone: this.selectedPatient.telephone,
                    email: this.selectedPatient.email,
                    adresse: this.selectedPatient.adresse,
                    situation: this.elements.situationSelect.value
                },
                type: document.querySelector('input[name="type"]:checked').value,
                montants: {
                    appareil: Math.round(parseFloat(this.elements.montantInput.value) * 100),
                    accordeMDPH: 0,
                    accordeAGEFIPH: 0,
                    mutuelle: 0,
                    resteACharge: Math.round(parseFloat(this.elements.montantInput.value) * 100)
                },
                organisation: {
                    technicien: {
                        id: this.permissions.userId,
                        nom: this.permissions.userName
                    },
                    magasin: this.permissions.magasin,
                    societe: 'BA'
                },
                notes: this.elements.notesTextarea.value
            };
            
            // MOCK pour tester
            const dossier = {
                id: 'test-' + Date.now(),
                numeroDossier: 'SUB-2025-' + Math.floor(Math.random() * 1000),
                ...data
            };
            console.log('📋 Dossier créé (MOCK):', dossier);
            
            // Afficher le succès
            config.notify.success(`Dossier ${dossier.numeroDossier} créé avec succès`);
            
            // Fermer la modal après succès
            setTimeout(() => {
                config.modalManager.close('modalCreateSubvention');
                // Recharger la liste
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Erreur création dossier:', error);
            config.notify.error(error.message || 'Erreur lors de la création du dossier');
            
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }
    
    validateForm() {
        const errors = [];
        
        if (!this.selectedPatient) {
            errors.push('Veuillez sélectionner un patient');
        }
        
        const situation = this.elements.situationSelect.value;
        if (!situation) {
            errors.push('Veuillez indiquer la situation professionnelle');
        }
        
        const montant = parseFloat(this.elements.montantInput.value);
        if (!montant || montant <= 0) {
            errors.push('Veuillez indiquer le montant de l\'appareil');
        }
        
        if (errors.length > 0) {
            config.notify.error(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    showLoading() {
        this.elements.submitBtn.querySelector('.btn-text').style.display = 'none';
        this.elements.submitBtn.querySelector('.btn-loading').style.display = 'inline-flex';
        this.elements.submitBtn.disabled = true;
    }
    
    hideLoading() {
        this.elements.submitBtn.querySelector('.btn-text').style.display = 'inline';
        this.elements.submitBtn.querySelector('.btn-loading').style.display = 'none';
        this.elements.submitBtn.disabled = false;
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    formatDate(date) {
        return new Date(date).toLocaleDateString('fr-FR');
    }
    
    formatMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(montant);
    }
    
    getSituationLabel(value) {
        const labels = {
            'salarie': 'Salarié',
            'independant': 'Indépendant',
            'demandeur_emploi': 'Demandeur d\'emploi',
            'retraite': 'Retraité',
            'etudiant': 'Étudiant'
        };
        return labels[value] || value;
    }
    
    // ========================================
    // NETTOYAGE
    // ========================================
    
    destroy() {
        if (this.searchDropdown && this.searchDropdown.destroy) {
            this.searchDropdown.destroy();
        }
    }
}

// Export de l'instance
export const subventionsCreate = new SubventionsCreate();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsCreate;
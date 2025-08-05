// ========================================
// SUBVENTIONS.CREATE.JS - Création de dossier
// Chemin: modules/subventions/subventions.create.js
//
// DESCRIPTION:
// Orchestrateur pour la création de nouveaux dossiers
// Gère le formulaire, la recherche patient et la validation
// ========================================

import { subventionsConfig } from './subventions.config.js';
import { subventionsFirestore } from './subventions.firestore.js';
import { subventionsService } from './subventions.service.js';
import { patientsService } from '../../services/patients.service.js';

class SubventionsCreate {
    constructor() {
        this.permissions = null;
        this.selectedPatient = null;
        this.formData = {
            type: 'mdph_agefiph',
            montantAppareil: subventionsConfig.business.montantAppareilDefaut,
            notes: ''
        };
        
        this.elements = {};
        this.isSubmitting = false;
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
            this.elements.searchInput?.focus();
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
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-number">1</span>
                            Patient
                        </h3>
                        
                        <div class="patient-search">
                            <div class="search-container" id="search-container">
                                <!-- Le SearchDropdown sera injecté ici -->
                            </div>
                            
                            <div class="selected-patient" id="selected-patient" style="display: none;">
                                <div class="patient-card">
                                    <div class="patient-info">
                                        <h4 id="patient-name"></h4>
                                        <p id="patient-details"></p>
                                    </div>
                                    <button type="button" class="btn-change" id="btn-change-patient">
                                        Changer
                                    </button>
                                </div>
                                <div class="patient-alert" id="patient-alert"></div>
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
                                onclick="window.history.back()">
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
        const searchDropdown = subventionsConfig.factories.SearchDropdown({
            container: this.elements.searchContainer,
            placeholder: 'Rechercher un patient par nom, prénom ou téléphone...',
            searchFunction: async (term) => {
                return await patientsService.searchPatients(term);
            },
            displayFormat: (patient) => {
                return `${patient.nom} ${patient.prenom} - ${patient.telephone || 'Pas de téléphone'}`;
            },
            onSelect: (patient) => {
                this.selectPatient(patient);
            },
            minChars: 2,
            debounceTime: 300
        });
        
        this.elements.searchInput = searchDropdown.getInput();
    }
    
    // ========================================
    // GESTION DU PATIENT
    // ========================================
    
    async selectPatient(patient) {
        this.selectedPatient = patient;
        
        // Afficher les infos patient
        this.elements.patientName.textContent = `${patient.nom} ${patient.prenom}`;
        this.elements.patientDetails.textContent = `
            ${patient.dateNaissance ? `Né(e) le ${this.formatDate(patient.dateNaissance)}` : ''} 
            ${patient.telephone ? `- ${patient.telephone}` : ''}
            ${patient.email ? `- ${patient.email}` : ''}
        `;
        
        // Afficher la carte patient
        this.elements.selectedPatient.style.display = 'block';
        this.elements.searchContainer.style.display = 'none';
        
        // Charger la situation
        await this.loadPatientSituation(patient);
        
        // Vérifier l'éligibilité
        this.checkEligibilite();
        
        // Activer le formulaire
        this.enableForm();
        
        // Mettre à jour le récap
        this.updateRecap();
    }
    
    async loadPatientSituation(patient) {
        // Récupérer les dossiers existants du patient
        const dossiers = await subventionsFirestore.getDossiers({
            patientId: patient.id,
            limit: 1,
            orderBy: ['dates.creation', 'desc']
        });
        
        let situation = patient.situation || '';
        
        // Si dossier existant, récupérer la situation
        if (dossiers.length > 0) {
            situation = dossiers[0].patient.situation || '';
        }
        
        // Remplir le select
        this.elements.situationSelect.innerHTML = `
            <option value="">-- Sélectionner --</option>
            ${subventionsConfig.forms.options.situation.map(opt => `
                <option value="${opt.value}" ${situation === opt.value ? 'selected' : ''}>
                    ${opt.label}
                </option>
            `).join('')}
        `;
        
        this.elements.situationSelect.disabled = false;
        
        // Si situation pré-remplie, vérifier l'éligibilité
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
        
        const eligibilite = subventionsService.checkEligibilite(situation);
        
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
        this.elements.searchInput.value = '';
        this.elements.searchInput.focus();
        this.elements.situationSelect.disabled = true;
        this.elements.situationSelect.value = '';
        this.elements.patientAlert.innerHTML = '';
        this.disableForm();
    }
    
    openCreatePatient() {
        // TODO: Ouvrir modal création patient
        const modal = subventionsConfig.factories.Modal({
            title: 'Créer un nouveau patient',
            content: '<p>Fonctionnalité à venir...</p>'
        });
        modal.open();
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
                    societe: 'BA' // TODO: Récupérer dynamiquement
                },
                notes: this.elements.notesTextarea.value
            };
            
            // Créer le dossier
            const dossier = await subventionsFirestore.createDossier(data);
            
            // Afficher le succès
            const toast = subventionsConfig.factories.Toast({
                type: 'success',
                message: `Dossier ${dossier.numeroDossier} créé avec succès`
            });
            toast.show();
            
            // Rediriger vers le détail
            setTimeout(() => {
                window.location.hash = `#subventions/detail/${dossier.id}`;
            }, 1000);
            
        } catch (error) {
            console.error('Erreur création dossier:', error);
            
            const toast = subventionsConfig.factories.Toast({
                type: 'error',
                message: error.message || 'Erreur lors de la création du dossier'
            });
            toast.show();
            
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
            const toast = subventionsConfig.factories.Toast({
                type: 'error',
                message: errors.join('<br>')
            });
            toast.show();
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
        const option = subventionsConfig.forms.options.situation.find(
            opt => opt.value === value
        );
        return option ? option.label : value;
    }
    
    // ========================================
    // NETTOYAGE
    // ========================================
    
    destroy() {
        // Nettoyer les event listeners si nécessaire
    }
}

// Export de l'instance
export const subventionsCreate = new SubventionsCreate();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsCreate;
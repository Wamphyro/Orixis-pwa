// ========================================
// INTERVENTION.ORCHESTRATOR.JS - 🎯 ORCHESTRATEUR PRINCIPAL
// Chemin: modules/intervention/intervention.orchestrator.js
//
// VERSION AUTONOME - Tout inclus
// ========================================

// Import des widgets
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// Import Firebase
import { initFirebase, db } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION INTERVENTION
// ========================================

const INTERVENTION_CONFIG = {
    STATUTS: {
        'nouvelle': { label: 'Nouvelle', icon: '📄', color: 'secondary', suivant: 'en_cours' },
        'en_cours': { label: 'En cours', icon: '🔧', color: 'warning', suivant: 'terminee' },
        'terminee': { label: 'Terminée', icon: '✅', color: 'success', suivant: null },
        'annulee': { label: 'Annulée', icon: '❌', color: 'danger', suivant: null }
    },
    
    TYPES_APPAREILS: {
        'BTE': { label: 'BTE Classique', icon: '🔵' },
        'RIC': { label: 'RIC/RITE', icon: '🔴' },
        'ITE': { label: 'Intra (ITE/CIC)', icon: '🟢' }
    },
    
    PROBLEMES: {
        'pas_son': { label: 'Pas de son / Muet', icon: '🔇' },
        'son_faible': { label: 'Son faible', icon: '🔉' },
        'sifflement': { label: 'Sifflement (Larsen)', icon: '🔊' },
        'intermittent': { label: 'Son intermittent', icon: '〰️' },
        'gresille': { label: 'Grésille / Parasite', icon: '📡' },
        'humidite': { label: 'Humidité / Condensation', icon: '💧' },
        'inconfort': { label: 'Inconfort / Douleur', icon: '😣' },
        'controle': { label: 'Contrôle routine', icon: '🔧' }
    },
    
    ACTIONS: {
        'pile': { label: 'Pile testée / changée', icon: '🔋' },
        'nettoyage': { label: 'Nettoyage complet', icon: '🧹' },
        'filtre': { label: 'Filtre pare-cérumen changé', icon: '🔄' },
        'dome': { label: 'Dôme remplacé', icon: '🔵' },
        'tube': { label: 'Tube changé', icon: '🔌' },
        'sechage': { label: 'Séchage effectué', icon: '☀️' }
    },
    
    RESULTATS: {
        'Résolu': { label: 'Problème résolu', icon: '✅', color: 'success' },
        'Partiel': { label: 'Amélioration partielle', icon: '⚠️', color: 'warning' },
        'SAV': { label: 'Sans effet - Escalade SAV', icon: '❌', color: 'danger' },
        'OK': { label: 'Contrôle OK', icon: '🔧', color: 'info' }
    }
};

const MARQUES_APPAREILS = [
    'Phonak', 'Oticon', 'Signia', 'Widex', 'Starkey', 
    'Resound', 'Unitron', 'Bernafon', 'Hansaton', 'Autre'
];

// ========================================
// SERVICE INTERVENTION INTÉGRÉ
// ========================================

class InterventionService {
    static genererNumero(magasin = 'MAG') {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INT-${magasin}-${year}${month}${day}-${random}`;
    }
    
    static async getMagasins() {
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const snapshot = await getDocs(collection(db, 'magasins'));
            const magasins = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.actif !== false) {
                    magasins.push({
                        code: data.code || doc.id,
                        nom: data.nom || data.code || doc.id
                    });
                }
            });
            
            return magasins.sort((a, b) => a.nom.localeCompare(b.nom));
            
        } catch (error) {
            console.error('Erreur chargement magasins:', error);
            return [];
        }
    }
    
    static async getInterventions() {
        try {
            const { collection, getDocs, query, orderBy, limit } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'interventions'),
                orderBy('dates.intervention', 'desc'),
                limit(100)
            );
            
            const snapshot = await getDocs(q);
            const interventions = [];
            
            snapshot.forEach(doc => {
                interventions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return interventions;
            
        } catch (error) {
            console.error('Erreur chargement interventions:', error);
            return [];
        }
    }
    
    static async getIntervention(id) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const docRef = doc(db, 'interventions', id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
            
        } catch (error) {
            console.error('Erreur récupération intervention:', error);
            return null;
        }
    }
    
    static async creerIntervention(data) {
        try {
            const { collection, addDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const interventionData = {
                ...data,
                dates: {
                    creation: serverTimestamp(),
                    intervention: serverTimestamp()
                },
                statut: 'nouvelle'
            };
            
            const docRef = await addDoc(collection(db, 'interventions'), interventionData);
            return docRef.id;
            
        } catch (error) {
            console.error('Erreur création intervention:', error);
            throw error;
        }
    }
    
    static async changerStatut(id, nouveauStatut, donnees = {}) {
        try {
            const { doc, updateDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const updates = {
                statut: nouveauStatut,
                ...donnees
            };
            
            if (nouveauStatut === 'en_cours') {
                updates['dates.debut'] = serverTimestamp();
            } else if (nouveauStatut === 'terminee') {
                updates['dates.cloture'] = serverTimestamp();
            } else if (nouveauStatut === 'annulee') {
                updates['dates.annulation'] = serverTimestamp();
            }
            
            const docRef = doc(db, 'interventions', id);
            await updateDoc(docRef, updates);
            
        } catch (error) {
            console.error('Erreur changement statut:', error);
            throw error;
        }
    }
    
    static async envoyerEscaladeSAV(intervention) {
        try {
            // Template pour EmailJS
            const templateParams = {
                to_email: 'sav@audiologie.fr',
                reply_to: 'noreply@orixis.fr',
                
                magasin: intervention.magasin || 'Non spécifié',
                intervenant: intervention.intervenant ? 
                    `${intervention.intervenant.prenom} ${intervention.intervenant.nom}` : 
                    'Non spécifié',
                date: new Date().toLocaleDateString('fr-FR'),
                
                nom_client: `${intervention.client?.prenom} ${intervention.client?.nom}`,
                telephone: intervention.client?.telephone || 'Non renseigné',
                
                numero_intervention: intervention.numeroIntervention,
                type_appareil: intervention.appareil?.type,
                marque: intervention.appareil?.marque,
                modele: intervention.appareil?.modele || 'Non spécifié',
                numero_serie: intervention.appareil?.numeroSerie || 'Non spécifié',
                
                probleme: intervention.problemes?.join(', ') || '-',
                actions: intervention.actions?.join(', ') || 'Aucune action',
                
                resultat: INTERVENTION_CONFIG.RESULTATS[intervention.resultat]?.label || intervention.resultat,
                observations: intervention.observations || 'Aucune observation'
            };
            
            if (window.emailjs) {
                await emailjs.send('service_6juwjvq', 'template_51rhrbr', templateParams);
            }
            
            // Mettre à jour l'intervention
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const docRef = doc(db, 'interventions', intervention.id);
            await updateDoc(docRef, {
                savEnvoye: true,
                dateSavEnvoye: new Date()
            });
            
        } catch (error) {
            console.error('Erreur envoi SAV:', error);
            throw error;
        }
    }
}

// ========================================
// SERVICE CLIENTS INTÉGRÉ
// ========================================

class ClientsService {
    static async rechercherClients(query) {
        try {
            const { collection, getDocs, query: firestoreQuery, orderBy, limit } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = firestoreQuery(
                collection(db, 'clients'),
                orderBy('nom'),
                limit(20)
            );
            
            const snapshot = await getDocs(q);
            const clients = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const fullName = `${data.prenom} ${data.nom}`.toLowerCase();
                const tel = data.telephone?.toLowerCase() || '';
                
                if (fullName.includes(query.toLowerCase()) || tel.includes(query.toLowerCase())) {
                    clients.push({ id: doc.id, ...data });
                }
            });
            
            return clients;
            
        } catch (error) {
            console.error('Erreur recherche clients:', error);
            return [];
        }
    }
    
    static async getClient(id) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const docRef = doc(db, 'clients', id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
            
        } catch (error) {
            console.error('Erreur récupération client:', error);
            return null;
        }
    }
}

// ========================================
// MODAL DE CRÉATION CUSTOM
// ========================================

class InterventionModal {
    constructor(options) {
        this.options = options;
        this.data = {};
        this.currentStep = 1;
        this.totalSteps = 4;
        this.modal = null;
        
        // Exposer globalement pour les onclick
        window.interventionModal = this;
    }
    
    open() {
        // Créer le modal
        this.modal = document.createElement('div');
        this.modal.className = 'modal-backdrop';
        this.modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;
        
        content.innerHTML = this.renderContent();
        this.modal.appendChild(content);
        document.body.appendChild(this.modal);
        
        // Attacher les événements après l'ajout au DOM
        setTimeout(() => this.attachEvents(), 10);
    }
    
    renderContent() {
        return `
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
                    🔧 Nouvelle Intervention SAV
                    <button id="closeModalBtn" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </h2>
            </div>
            
            <div style="padding: 20px;">
                <div class="stepper" style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    ${[1, 2, 3, 4].map(step => `
                        <div class="step ${step === this.currentStep ? 'active' : step < this.currentStep ? 'completed' : ''}" 
                             style="flex: 1; text-align: center;">
                            <div style="width: 40px; height: 40px; margin: 0 auto; border-radius: 50%; 
                                        background: ${step === this.currentStep ? '#667eea' : step < this.currentStep ? '#10b981' : '#e5e7eb'}; 
                                        color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                                ${step}
                            </div>
                            <div style="margin-top: 8px; font-size: 14px; color: ${step === this.currentStep ? '#667eea' : '#6b7280'};">
                                ${['Client', 'Appareil', 'Diagnostic', 'Validation'][step - 1]}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div id="stepContent">
                    ${this.renderStep()}
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
                <button id="btnPrevStep" 
                        ${this.currentStep === 1 ? 'disabled' : ''} 
                        style="padding: 10px 20px; background: ${this.currentStep === 1 ? '#d1d5db' : '#6b7280'}; color: white; border: none; border-radius: 6px; cursor: ${this.currentStep === 1 ? 'not-allowed' : 'pointer'};">
                    ← Précédent
                </button>
                <button id="btnNextStep" 
                        style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ${this.currentStep === 4 ? '✓ Créer l\'intervention' : 'Suivant →'}
                </button>
            </div>
        `;
    }
    
    renderStep() {
        switch(this.currentStep) {
            case 1:
                return this.renderStep1();
            case 2:
                return this.renderStep2();
            case 3:
                return this.renderStep3();
            case 4:
                return this.renderStep4();
        }
    }
    
    renderStep1() {
        return `
            <div>
                <h3>📋 Informations Client</h3>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Rechercher un client *</label>
                    <input type="text" id="clientSearch" placeholder="Nom, prénom, téléphone..." 
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <div id="searchResults" style="position: relative; z-index: 100;"></div>
                </div>
                <div id="selectedClient" style="display: none; padding: 15px; background: #e8f5e9; border-radius: 8px;">
                    <h4>Client sélectionné :</h4>
                    <p id="clientInfo"></p>
                    <button id="btnChangeClient" style="color: #667eea; background: none; border: none; cursor: pointer; text-decoration: underline;">
                        Changer de client
                    </button>
                </div>
            </div>
        `;
    }
    
    renderStep2() {
        return `
            <div>
                <h3>🎧 Type d'Appareil</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                    ${Object.entries(INTERVENTION_CONFIG.TYPES_APPAREILS).map(([key, config]) => `
                        <label class="device-card" style="display: block; padding: 20px; border: 2px solid #e0e0e0; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.3s;">
                            <input type="radio" name="typeAppareil" value="${key}" style="display: none;">
                            <div style="font-size: 32px; margin-bottom: 10px;">${config.icon}</div>
                            <div>${config.label}</div>
                        </label>
                    `).join('')}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Marque *</label>
                    <select id="marqueAppareil" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="">Sélectionner une marque</option>
                        ${MARQUES_APPAREILS.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Modèle</label>
                    <input type="text" id="modele" placeholder="Ex: Audeo Paradise" 
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Numéro de série</label>
                    <input type="text" id="numeroSerie" placeholder="Ex: PH123456789" 
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                </div>
            </div>
        `;
    }
    
    renderStep3() {
        const problemes = Object.entries(INTERVENTION_CONFIG.PROBLEMES);
        const actions = Object.entries(INTERVENTION_CONFIG.ACTIONS);
        const resultats = Object.entries(INTERVENTION_CONFIG.RESULTATS);
        
        return `
            <div>
                <h3>❓ Problème(s) Décrit(s)</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
                    ${problemes.map(([key, config], index) => `
                        <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" id="pb${index}" name="probleme" value="${config.label}" style="width: 20px; height: 20px; margin-right: 10px;">
                            <span>${config.icon} ${config.label}</span>
                        </label>
                    `).join('')}
                </div>
                
                <h3>✅ Actions Réalisées</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
                    ${actions.map(([key, config], index) => `
                        <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer;">
                            <input type="checkbox" id="act${index}" name="action" value="${config.label}" style="width: 20px; height: 20px; margin-right: 10px;">
                            <span>${config.icon} ${config.label}</span>
                        </label>
                    `).join('')}
                </div>
                
                <h3>📊 Résultat</h3>
                <div style="margin-bottom: 20px;">
                    <select id="resultat" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="">Sélectionner le résultat</option>
                        ${resultats.map(([key, config]) => 
                            `<option value="${key}">${config.icon} ${config.label}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">💬 Observations</label>
                    <textarea id="observations" rows="3" placeholder="Commentaires additionnels..." 
                              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;"></textarea>
                </div>
            </div>
        `;
    }
    
    renderStep4() {
        return `
            <div>
                <h3>Récapitulatif de l'intervention</h3>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <h4 style="color: #667eea; margin-bottom: 8px;">Client</h4>
                    <div id="recapClient"></div>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <h4 style="color: #667eea; margin-bottom: 8px;">Appareil</h4>
                    <div id="recapAppareil"></div>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <h4 style="color: #667eea; margin-bottom: 8px;">Diagnostic</h4>
                    <div id="recapDiagnostic"></div>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px;">
                    <h4 style="color: #667eea; margin-bottom: 8px;">Résultat</h4>
                    <div id="recapResultat"></div>
                </div>
            </div>
        `;
    }
    
    attachEvents() {
        // Bouton fermer
        const closeBtn = document.getElementById('closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Boutons navigation
        const prevBtn = document.getElementById('btnPrevStep');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }
        
        const nextBtn = document.getElementById('btnNextStep');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        // Events spécifiques selon l'étape
        if (this.currentStep === 1) {
            // Recherche client
            const searchInput = document.getElementById('clientSearch');
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.searchClients(e.target.value);
                    }, 300);
                });
            }
            
            // Bouton changer client
            const changeBtn = document.getElementById('btnChangeClient');
            if (changeBtn) {
                changeBtn.addEventListener('click', () => this.resetClient());
            }
        }
        
        if (this.currentStep === 2) {
            // Sélection type appareil avec style
            document.querySelectorAll('.device-card').forEach(card => {
                card.addEventListener('click', function() {
                    // Retirer la sélection des autres
                    document.querySelectorAll('.device-card').forEach(c => {
                        c.style.borderColor = '#e0e0e0';
                        c.style.background = 'white';
                    });
                    
                    // Sélectionner celle-ci
                    const input = this.querySelector('input[type="radio"]');
                    if (input) {
                        input.checked = true;
                        this.style.borderColor = '#667eea';
                        this.style.background = '#f0f4ff';
                        
                        // Sauvegarder dans le modal
                        window.interventionModal.data.typeAppareil = input.value;
                    }
                });
            });
            
            // Sélection marque
            const marqueSelect = document.getElementById('marqueAppareil');
            if (marqueSelect) {
                marqueSelect.addEventListener('change', (e) => {
                    this.data.marque = e.target.value;
                });
            }
        }
    }
    
    async searchClients(query) {
        if (!query || query.length < 2) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }
        
        const clients = await ClientsService.rechercherClients(query);
        const resultsDiv = document.getElementById('searchResults');
        
        if (clients.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 10px; background: white; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px;">Aucun client trouvé</div>';
        } else {
            resultsDiv.innerHTML = `
                <div style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    ${clients.map(client => `
                        <div onclick="window.interventionModal.selectClient('${client.id}')" 
                             style="padding: 10px; cursor: pointer; border-bottom: 1px solid #f3f4f6;">
                            <strong>${client.prenom} ${client.nom}</strong>
                            <small style="display: block; color: #6b7280;">${client.telephone || 'Pas de téléphone'}</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    async selectClient(clientId) {
        const client = await ClientsService.getClient(clientId);
        if (!client) return;
        
        this.data.clientId = clientId;
        this.data.client = client;
        
        document.getElementById('clientSearch').style.display = 'none';
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('selectedClient').style.display = 'block';
        document.getElementById('clientInfo').innerHTML = `
            <strong>${client.prenom} ${client.nom}</strong><br>
            ${client.telephone || 'Pas de téléphone'}
        `;
    }
    
    resetClient() {
        this.data.clientId = null;
        this.data.client = null;
        document.getElementById('clientSearch').style.display = 'block';
        document.getElementById('clientSearch').value = '';
        document.getElementById('selectedClient').style.display = 'none';
    }
    
    collectStepData() {
        switch(this.currentStep) {
            case 2:
                const typeAppareil = document.querySelector('input[name="typeAppareil"]:checked');
                this.data.typeAppareil = typeAppareil?.value || this.data.typeAppareil;
                this.data.marque = document.getElementById('marqueAppareil')?.value || this.data.marque;
                this.data.modele = document.getElementById('modele')?.value || '';
                this.data.numeroSerie = document.getElementById('numeroSerie')?.value || '';
                break;
                
            case 3:
                this.data.problemes = Array.from(document.querySelectorAll('input[name="probleme"]:checked'))
                    .map(cb => cb.value);
                this.data.actions = Array.from(document.querySelectorAll('input[name="action"]:checked'))
                    .map(cb => cb.value);
                this.data.resultat = document.getElementById('resultat')?.value || '';
                this.data.observations = document.getElementById('observations')?.value || '';
                break;
        }
    }
    
    validateStep() {
        switch(this.currentStep) {
            case 1:
                if (!this.data.clientId) {
                    toast.warning('Veuillez sélectionner un client');
                    return false;
                }
                break;
            case 2:
                if (!this.data.typeAppareil) {
                    toast.warning('Veuillez sélectionner un type d\'appareil');
                    return false;
                }
                if (!this.data.marque) {
                    toast.warning('Veuillez sélectionner une marque');
                    return false;
                }
                break;
            case 3:
                if (!this.data.problemes || this.data.problemes.length === 0) {
                    toast.warning('Veuillez sélectionner au moins un problème');
                    return false;
                }
                if (!this.data.resultat) {
                    toast.warning('Veuillez sélectionner un résultat');
                    return false;
                }
                break;
        }
        return true;
    }
    
    updateRecap() {
        if (this.currentStep !== 4) return;
        
        const client = this.data.client;
        const typeConfig = INTERVENTION_CONFIG.TYPES_APPAREILS[this.data.typeAppareil];
        const resultatConfig = INTERVENTION_CONFIG.RESULTATS[this.data.resultat];
        
        document.getElementById('recapClient').innerHTML = client ? `
            <p><strong>${client.prenom} ${client.nom}</strong></p>
            <p>Tél: ${client.telephone || '-'}</p>
        ` : '';
        
        document.getElementById('recapAppareil').innerHTML = `
            <p><strong>Type:</strong> ${typeConfig?.icon} ${typeConfig?.label}</p>
            <p><strong>Marque:</strong> ${this.data.marque}</p>
            ${this.data.modele ? `<p><strong>Modèle:</strong> ${this.data.modele}</p>` : ''}
            ${this.data.numeroSerie ? `<p><strong>N° Série:</strong> ${this.data.numeroSerie}</p>` : ''}
        `;
        
        document.getElementById('recapDiagnostic').innerHTML = `
            <div><strong>Problèmes:</strong></div>
            <ul>${(this.data.problemes || []).map(p => `<li>${p}</li>`).join('')}</ul>
            <div><strong>Actions:</strong></div>
            <ul>${(this.data.actions || []).map(a => `<li>${a}</li>`).join('')}</ul>
        `;
        
        document.getElementById('recapResultat').innerHTML = `
            <p><strong>Résultat:</strong> ${resultatConfig?.icon} ${resultatConfig?.label}</p>
            ${this.data.observations ? `<p><strong>Observations:</strong> ${this.data.observations}</p>` : ''}
        `;
    }
    
    async nextStep() {
        if (this.currentStep < 4) {
            this.collectStepData();
            if (!this.validateStep()) return;
        }
        
        if (this.currentStep === 4) {
            // Créer l'intervention
            await this.createIntervention();
        } else {
            this.currentStep++;
            this.render();
            
            if (this.currentStep === 4) {
                this.updateRecap();
            }
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.collectStepData();
            this.currentStep--;
            this.render();
        }
    }
    
    render() {
        const content = this.modal.querySelector('.modal-content');
        content.innerHTML = this.renderContent();
        setTimeout(() => this.attachEvents(), 10);
    }
    
    async createIntervention() {
        try {
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            
            const interventionData = {
                numeroIntervention: InterventionService.genererNumero(auth.magasin),
                clientId: this.data.clientId,
                client: this.data.client,
                appareil: {
                    type: this.data.typeAppareil,
                    marque: this.data.marque,
                    modele: this.data.modele,
                    numeroSerie: this.data.numeroSerie
                },
                problemes: this.data.problemes,
                actions: this.data.actions || [],
                resultat: this.data.resultat,
                observations: this.data.observations,
                magasin: auth.magasin || ''
            };
            
            const interventionId = await InterventionService.creerIntervention(interventionData);
            
            this.close();
            toast.success('Intervention créée avec succès !');
            
            if (this.options.onSuccess) {
                this.options.onSuccess(interventionId, interventionData);
            }
            
            if (confirm('Voulez-vous démarrer l\'intervention maintenant ?')) {
                localStorage.setItem('sav_intervention_data', JSON.stringify({
                    interventionId,
                    ...interventionData
                }));
                
                window.location.href = 'signature-client.html';
            }
            
        } catch (error) {
            toast.error('Erreur création : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        window.interventionModal = null;
    }
}

// Instance globale pour les événements onclick
let interventionModal = null;

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class InterventionOrchestrator {
    constructor() {
        // Widgets
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        
        // Données
        this.interventionsData = [];
        this.filteredData = [];
        this.selectedInterventions = [];
        
        // État des filtres
        this.currentFilters = {
            search: '',
            statuts: [],
            magasin: '',
            periode: 'all',
            statut: '',
            resultat: ''
        };
        
        // Auth
        this.auth = null;
        this.isLoading = false;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation module Interventions SAV...');
            
            // Vérifier l'authentification
            if (!this.checkAuth()) {
                this.showError('Vous devez être connecté');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
                return;
            }
            
            // Initialiser Firebase
            console.log('🔥 Initialisation Firebase...');
            await initFirebase();
            console.log('✅ Firebase initialisé');
            
            // Créer les widgets
            await this.createWidgets();
            
            // Charger les données
            await this.loadData();
            
            this.hideLoader();
            this.showSuccess('Application prête !');
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur initialisation : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        if (!auth) return false;
        
        this.auth = JSON.parse(auth);
        const now = Date.now();
        
        if (now - this.auth.timestamp > this.auth.expiry) {
            localStorage.removeItem('sav_auth');
            return false;
        }
        
        return this.auth.authenticated;
    }
    
    // ========================================
    // CRÉATION DES WIDGETS
    // ========================================
    
    async createWidgets() {
        console.log('🎨 Création des widgets...');
        
        // Header
        this.createHeader();
        
        // Stats Cards
        this.createStatsCards();
        
        // Filtres
        await this.createFilters();
        
        // DataGrid
        this.createDataGrid();
        
        console.log('✅ Widgets créés');
    }
    
    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        this.header = new HeaderWidget({
            // FOND DÉGRADÉ
            pageBackground: 'colorful',
            theme: 'gradient',
            
            // PERSONNALISATION DES BOUTONS - HAUTEURS IDENTIQUES
            buttonStyles: {
                back: {
                    height: '48px',
                    padding: '12px 24px',
                    minWidth: '120px'
                },
                action: {
                    height: '48px',
                    width: '44px'
                },
                notification: {
                    height: '48px',
                    width: '44px'
                },
                userMenu: {
                    height: '48px',
                    padding: '6px 16px 6px 6px',
                    maxWidth: '220px'
                },
                indicator: {
                    height: '48px',
                    padding: '10px 16px',
                    minWidth: 'auto'
                }
            },
            
            // TEXTES
            title: 'Interventions SAV',
            subtitle: '',
            centerTitle: true,  // Activer le titre centré
            
            // LOGO
            showLogo: true,
            logoIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
            
            // NAVIGATION
            showBack: true,
            backText: 'Retour',
            onBack: () => {
                window.location.href = '/modules/home/home.html';
            },
            
            // RECHERCHE
            showSearch: true,
            searchPlaceholder: 'Rechercher client, n° intervention, appareil...',
            searchMaxWidth: '1500px',
            searchHeight: '48px',  // ← IMPORTANT: Même hauteur que factures
            onSearch: (query) => {
                this.currentFilters.search = query;
                this.applyFilters();
            },
            
            // BOUTONS RAPIDES
            showQuickActions: true,
            quickActions: [
                {
                    id: 'new',
                    title: 'Nouvelle intervention',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
                    onClick: () => this.openCreateModal()
                },
                {
                    id: 'export',
                    title: 'Export Excel',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>',
                    onClick: () => this.grid?.export('excel')
                },
                {
                    id: 'reset',
                    title: 'Réinitialiser',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
                    onClick: () => this.resetAllFilters()
                },
                {
                    id: 'refresh',
                    title: 'Actualiser',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
                    onClick: () => {
                        // Force le rechargement complet depuis le serveur (équivalent Cmd+Maj+R)
                        window.location.reload(true);
                    }
                }
            ],
            
            // INDICATEURS
            showIndicators: true,
            indicators: [
                {
                    id: 'status',
                    text: 'Connecté',
                    type: 'success',  // IMPORTANT: doit être 'success' pour le vert
                    animated: true
                }
            ],
            
            // NOTIFICATIONS
            showNotifications: true,
            
            // BREADCRUMBS
            showBreadcrumbs: true,
            breadcrumbs: [
                { text: 'Accueil', url: '/modules/home/home.html' },
                { text: 'SAV', url: '#' },
                { text: 'Interventions' }
            ],
            
            // UTILISATEUR
            showUser: true,
            showUserDropdown: true,
            showMagasin: true,
            showLogout: true
        });
        
        // Mettre à jour les indicateurs après chargement
        // Fonction vide - plus de mise à jour des indicateurs
        this.updateHeaderIndicators = () => {
            // Désactivé - on garde seulement l'indicateur "Connecté"
        };
    }
    
    createStatsCards() {
        this.stats = new StatsCardsWidget({
            container: '.stats-container',
            showWrapper: true,
            wrapperStyle: 'card',
            size: 'md',
            selectionMode: 'multiple',
            animated: true,
            cards: [
                { id: 'nouvelles', label: 'Nouvelles', icon: '📄', value: 0, color: 'secondary' },
                { id: 'en_cours', label: 'En cours', icon: '🔧', value: 0, color: 'warning' },
                { id: 'terminees_jour', label: 'Terminées aujourd\'hui', icon: '✅', value: 0, color: 'success' },
                { id: 'sav_semaine', label: 'SAV cette semaine', icon: '❌', value: 0, color: 'danger' }
            ],
            onSelect: (selectedIds) => {
                const statuts = selectedIds
                    .filter(id => ['nouvelles', 'en_cours'].includes(id))
                    .map(id => id === 'nouvelles' ? 'nouvelle' : id);
                
                this.currentFilters.statuts = statuts;
                
                if (selectedIds.includes('terminees_jour')) {
                    this.currentFilters.periode = 'today';
                    this.currentFilters.statut = 'terminee';
                }
                if (selectedIds.includes('sav_semaine')) {
                    this.currentFilters.periode = 'week';
                    this.currentFilters.resultat = 'SAV';
                }
                
                this.applyFilters();
            }
        });
    }
    
    async createFilters() {
        // Charger les magasins
        const magasins = await InterventionService.getMagasins();
        
        this.filters = new SearchFiltersWidget({
            container: '.filters-container',
            showWrapper: true,
            wrapperStyle: 'card',
            wrapperTitle: 'Filtres',
            resetButton: false,  // ← AJOUTER CETTE LIGNE
            filters: [
                {
                    type: 'select',
                    key: 'magasin',
                    label: 'Magasin',
                    options: [
                        { value: '', label: 'Tous les magasins' },
                        ...magasins.map(m => ({ value: m.code, label: m.nom }))
                    ],
                    searchable: true
                },
                {
                    type: 'select',
                    key: 'periode',
                    label: 'Période',
                    options: [
                        { value: 'all', label: 'Toutes' },
                        { value: 'today', label: 'Aujourd\'hui' },
                        { value: 'week', label: 'Cette semaine' },
                        { value: 'month', label: 'Ce mois' }
                    ]
                },
                {
                    type: 'select',
                    key: 'statut',
                    label: 'Statut',
                    options: [
                        { value: '', label: 'Tous les statuts' },
                        ...Object.entries(INTERVENTION_CONFIG.STATUTS).map(([key, config]) => ({
                            value: key,
                            label: config.label
                        }))
                    ]
                },
                {
                    type: 'select',
                    key: 'resultat',
                    label: 'Résultat',
                    options: [
                        { value: '', label: 'Tous les résultats' },
                        ...Object.entries(INTERVENTION_CONFIG.RESULTATS).map(([key, config]) => ({
                            value: key,
                            label: config.label
                        }))
                    ]
                }
            ],
            onFilter: (values) => {
                this.currentFilters = {
                    ...this.currentFilters,
                    magasin: values.magasin || '',
                    periode: values.periode || 'all',
                    statut: values.statut || '',
                    resultat: values.resultat || '',
                    statuts: this.currentFilters.statuts
                };
                
                this.applyFilters();
            }
        });
    }
    
    createDataGrid() {
        this.grid = new DataGridWidget({
            container: '.table-container',
            showWrapper: true,
            wrapperStyle: 'card',
            columns: [
                {
                    key: 'dates.intervention',
                    label: 'Date',
                    sortable: true,
                    width: 100,
                    formatter: (v) => this.formatDate(v, 'jour')
                },
                {
                    key: 'numeroIntervention',
                    label: 'N° Intervention',
                    sortable: true,
                    width: 150,
                    formatter: (v) => `<code>${v}</code>`
                },
                {
                    key: 'client',
                    label: 'Client',
                    sortable: true,
                    formatter: (client) => {
                        if (!client) return '-';
                        return `
                            <div>
                                <strong>${client.prenom || ''} ${client.nom || ''}</strong>
                                <small style="display: block; color: #666;">${client.telephone || '-'}</small>
                            </div>
                        `;
                    }
                },
                {
                    key: 'appareil',
                    label: 'Appareil',
                    sortable: true,
                    formatter: (appareil) => {
                        if (!appareil) return '-';
                        const type = INTERVENTION_CONFIG.TYPES_APPAREILS[appareil.type];
                        return `
                            <div>
                                <span>${type?.icon || ''} ${appareil.marque || ''}</span>
                                <small style="display: block; color: #666;">${type?.label || appareil.type || ''}</small>
                            </div>
                        `;
                    }
                },
                {
                    key: 'resultat',
                    label: 'Résultat',
                    sortable: true,
                    width: 140,
                    formatter: (v) => {
                        const config = INTERVENTION_CONFIG.RESULTATS[v];
                        if (!config) return v || '-';
                        
                        const badgeClass = `badge badge-${config.color || 'secondary'}`;
                        return `<span class="${badgeClass}">${config.icon} ${config.label}</span>`;
                    }
                },
                {
                    key: 'statut',
                    label: 'Statut',
                    sortable: true,
                    width: 100,
                    formatter: (v) => {
                        const config = INTERVENTION_CONFIG.STATUTS[v];
                        if (!config) return v || '-';
                        
                        return `<span title="${config.label}">${config.icon}</span>`;
                    }
                },
                {
                    type: 'actions',
                    label: 'Actions',
                    width: 80,  // Peut être réduit car une seule action
                    actions: [
                        {
                            type: 'view',
                            title: 'Voir le détail',
                            onClick: (row) => this.openDetailModal(row)
                        }
                    ]
                }
            ],
            data: [],
            features: {
                sort: true,
                export: true,
                selection: true,
                selectionMode: 'multiple',
                pagination: true
            },
            pagination: {
                itemsPerPage: 20,
                pageSizeOptions: [10, 20, 50, 100]
            },
            onSelectionChange: (selectedRows) => {
                this.selectedInterventions = selectedRows;
                console.log(`📋 ${selectedRows.length} intervention(s) sélectionnée(s)`);
            }
        });
    }
    
    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    
    async loadData() {
        try {
            this.showLoader();
            console.log('📊 Chargement des données...');
            
            // Charger les interventions
            this.interventionsData = await InterventionService.getInterventions();
            console.log(`✅ ${this.interventionsData.length} interventions chargées`);
            
            // Mettre à jour les stats
            this.updateStats();
            
            // Appliquer les filtres
            this.applyFilters();
            
            this.hideLoader();
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur chargement données : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    // ========================================
    // CRÉATION D'INTERVENTION
    // ========================================
    
    openCreateModal() {
        interventionModal = new InterventionModal({
            onSuccess: async (interventionId, data) => {
                await this.loadData();
            }
        });
        
        interventionModal.open();
    }
    
    // ========================================
    // DÉTAIL INTERVENTION
    // ========================================
    
    async openDetailModal(row) {
        try {
            const intervention = await InterventionService.getIntervention(row.id);
            if (!intervention) return;
            
            const viewer = new DetailViewerWidget({
                title: `Intervention ${intervention.numeroIntervention}`,
                subtitle: `${intervention.client?.prenom} ${intervention.client?.nom}`,
                data: intervention,
                timeline: this.buildTimeline(intervention),
                sections: this.buildDetailSections(intervention),
                actions: this.buildDetailActions(intervention),
                size: 'large',
                theme: 'default',
                onClose: () => {}
            });
            
        } catch (error) {
            this.showError('Erreur chargement détail : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    buildTimeline(intervention) {
        const statuts = ['nouvelle', 'en_cours', 'terminee'];
        const indexActuel = statuts.indexOf(intervention.statut);
        
        return {
            enabled: true,
            orientation: 'horizontal',
            items: statuts.map((statut, index) => {
                const config = INTERVENTION_CONFIG.STATUTS[statut];
                return {
                    label: config.label,
                    status: index < indexActuel ? 'completed' : 
                            index === indexActuel ? 'active' : 'pending',
                    icon: config.icon,
                    date: this.getDateForStatus(intervention, statut)
                };
            }),
            theme: 'colorful',
            size: 'medium'
        };
    }
    
    getDateForStatus(intervention, statut) {
        switch (statut) {
            case 'nouvelle':
                return this.formatDate(intervention.dates?.creation);
            case 'en_cours':
                return intervention.dates?.debut ? 
                    this.formatDate(intervention.dates.debut) : '';
            case 'terminee':
                return intervention.dates?.cloture ? 
                    this.formatDate(intervention.dates.cloture) : '';
            default:
                return '';
        }
    }
    
    buildDetailSections(intervention) {
        const sections = [];
        
        sections.push({
            id: 'client',
            title: '👤 Informations client',
            fields: [
                { label: 'Nom', value: `${intervention.client?.prenom} ${intervention.client?.nom}` },
                { label: 'Téléphone', value: intervention.client?.telephone || '-' },
                { label: 'Email', value: intervention.client?.email || '-' },
                { label: 'Magasin', value: intervention.magasin || '-' }
            ]
        });
        
        const typeConfig = INTERVENTION_CONFIG.TYPES_APPAREILS[intervention.appareil?.type];
        sections.push({
            id: 'appareil',
            title: '🎧 Appareil',
            fields: [
                { label: 'Type', value: `${typeConfig?.icon} ${typeConfig?.label}` },
                { label: 'Marque', value: intervention.appareil?.marque || '-' },
                { label: 'Modèle', value: intervention.appareil?.modele || '-' },
                { label: 'N° Série', value: intervention.appareil?.numeroSerie || '-' }
            ]
        });
        
        sections.push({
            id: 'diagnostic',
            title: '🔍 Diagnostic & Actions',
            fields: [
                {
                    label: 'Problèmes identifiés',
                    value: intervention.problemes?.map(p => {
                        const config = Object.values(INTERVENTION_CONFIG.PROBLEMES)
                            .find(c => c.label === p);
                        return config ? `${config.icon} ${config.label}` : p;
                    }).join('<br>') || '-',
                    html: true
                },
                {
                    label: 'Actions réalisées',
                    value: intervention.actions?.length > 0 ? 
                        intervention.actions.map(a => {
                            const config = Object.values(INTERVENTION_CONFIG.ACTIONS)
                                .find(c => c.label === a);
                            return config ? `${config.icon} ${config.label}` : a;
                        }).join('<br>') : 'Aucune action',
                    html: true
                }
            ]
        });
        
        const resultatConfig = INTERVENTION_CONFIG.RESULTATS[intervention.resultat];
        sections.push({
            id: 'resultat',
            title: '📊 Résultat',
            fields: [
                { 
                    label: 'Résultat', 
                    value: resultatConfig ? 
                        `<span class="badge badge-${resultatConfig.color}">
                            ${resultatConfig.icon} ${resultatConfig.label}
                        </span>` : intervention.resultat || '-',
                    html: true
                },
                { label: 'Observations', value: intervention.observations || '-' }
            ]
        });
        
        return sections;
    }
    
    buildDetailActions(intervention) {
        const self = this;
        const actions = [];
        
        switch (intervention.statut) {
            case 'nouvelle':
                actions.push({
                    label: '▶️ Démarrer l\'intervention',
                    class: 'btn btn-primary',
                    onClick: async () => {
                        await self.demarrerIntervention(intervention.id);
                        return true;
                    }
                });
                break;
                
            case 'en_cours':
                actions.push({
                    label: '✅ Terminer l\'intervention',
                    class: 'btn btn-success',
                    onClick: async () => {
                        await self.terminerIntervention(intervention);
                        return true;
                    }
                });
                
                if (intervention.resultat === 'SAV') {
                    actions.push({
                        label: '🔧 Envoyer l\'escalade SAV',
                        class: 'btn btn-warning',
                        onClick: async () => {
                            await self.envoyerSAV(intervention);
                            return false;
                        }
                    });
                }
                break;
                
            case 'terminee':
                actions.push({
                    label: '🖨️ Imprimer le rapport',
                    class: 'btn btn-secondary',
                    onClick: async () => {
                        // Importer et utiliser le PrintWidget
                        const { InterventionPrinter } = await import('./print-intervention.js');
                        const printer = new InterventionPrinter();
                        await printer.printIntervention(intervention.id);
                        return false; // Ne pas fermer le modal
                    }
                });
                break;
        }
        
        if (intervention.statut !== 'annulee') {
            actions.push({
                label: '❌ Annuler l\'intervention',
                class: 'btn btn-danger',
                onClick: async () => {
                    await self.annulerIntervention(intervention.id);
                    return true;
                }
            });
        }
        
        return actions;
    }
    
    // ========================================
    // ACTIONS MÉTIER
    // ========================================
    
    async demarrerIntervention(interventionId) {
        try {
            if (!confirm('Confirmer le démarrage de l\'intervention ?')) {
                return;
            }
            
            await InterventionService.changerStatut(interventionId, 'en_cours');
            await this.loadData();
            this.showSuccess('Intervention démarrée');
            
        } catch (error) {
            this.showError('Erreur démarrage : ' + error.message);
        }
    }
    
    async terminerIntervention(intervention) {
        try {
            if (!intervention.resultat) {
                this.showWarning('Veuillez renseigner le résultat avant de terminer');
                return;
            }
            
            if (!confirm('L\'intervention sera marquée comme terminée. Les signatures seront requises.')) {
                return;
            }
            
            localStorage.setItem('sav_intervention_data', JSON.stringify({
                interventionId: intervention.id,
                ...intervention
            }));
            
            window.location.href = 'signature-client.html';
            
        } catch (error) {
            this.showError('Erreur fin intervention : ' + error.message);
        }
    }
    
    async annulerIntervention(interventionId) {
        try {
            const motif = prompt('Motif d\'annulation :');
            if (!motif) return;
            
            await InterventionService.changerStatut(interventionId, 'annulee', {
                motifAnnulation: motif
            });
            
            await this.loadData();
            this.showSuccess('Intervention annulée');
            
        } catch (error) {
            this.showError('Erreur annulation : ' + error.message);
        }
    }
    
    async envoyerSAV(intervention) {
        try {
            if (!confirm('Confirmer l\'envoi de l\'escalade SAV aux assistantes ?')) {
                return;
            }
            
            await InterventionService.envoyerEscaladeSAV(intervention);
            this.showSuccess('✅ Escalade SAV envoyée avec succès !');
            
        } catch (error) {
            this.showError('Erreur envoi SAV : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    // ========================================
    // FILTRAGE ET MISE À JOUR
    // ========================================
    
    applyFilters() {
        console.log('🔍 Application des filtres:', this.currentFilters);
        
        this.filteredData = this.interventionsData.filter(intervention => {
            // Recherche globale
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const clientNom = `${intervention.client?.prenom} ${intervention.client?.nom}`.toLowerCase();
                const numero = intervention.numeroIntervention?.toLowerCase() || '';
                const marque = intervention.appareil?.marque?.toLowerCase() || '';
                
                if (!clientNom.includes(search) && 
                    !numero.includes(search) && 
                    !marque.includes(search)) {
                    return false;
                }
            }
            
            // Filtres
            if (this.currentFilters.magasin && intervention.magasin !== this.currentFilters.magasin) {
                return false;
            }
            
            if (this.currentFilters.statut && intervention.statut !== this.currentFilters.statut) {
                return false;
            }
            
            if (this.currentFilters.statuts.length > 0 && 
                !this.currentFilters.statuts.includes(intervention.statut)) {
                return false;
            }
            
            if (this.currentFilters.resultat && intervention.resultat !== this.currentFilters.resultat) {
                return false;
            }
            
            // Période
            if (this.currentFilters.periode !== 'all') {
                const dateIntervention = intervention.dates?.intervention;
                if (!dateIntervention) return false;
                
                const date = dateIntervention.toDate ? 
                    dateIntervention.toDate() : 
                    new Date(dateIntervention);
                const now = new Date();
                
                switch (this.currentFilters.periode) {
                    case 'today':
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        if (date < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date();
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        if (date < monthAgo) return false;
                        break;
                }
            }
            
            return true;
        });
        
        if (this.grid) {
            this.grid.setData(this.filteredData);
            console.log(`✅ ${this.filteredData.length} interventions affichées`);
        }
    }
    
    updateStats() {
        const stats = {
            nouvelles: 0,
            en_cours: 0,
            terminees_jour: 0,
            sav_semaine: 0
        };
        
        const aujourd_hui = new Date();
        aujourd_hui.setHours(0, 0, 0, 0);
        
        const debutSemaine = new Date();
        debutSemaine.setDate(debutSemaine.getDate() - 7);
        
        this.interventionsData.forEach(intervention => {
            if (intervention.statut === 'nouvelle') stats.nouvelles++;
            else if (intervention.statut === 'en_cours') stats.en_cours++;
            
            if (intervention.statut === 'terminee' && intervention.dates?.cloture) {
                const dateCloture = intervention.dates.cloture.toDate ? 
                    intervention.dates.cloture.toDate() : 
                    new Date(intervention.dates.cloture);
                
                if (dateCloture >= aujourd_hui) {
                    stats.terminees_jour++;
                }
            }
            
            if (intervention.resultat === 'SAV' && intervention.dates?.intervention) {
                const dateIntervention = intervention.dates.intervention.toDate ? 
                    intervention.dates.intervention.toDate() : 
                    new Date(intervention.dates.intervention);
                
                if (dateIntervention >= debutSemaine) {
                    stats.sav_semaine++;
                }
            }
        });
        
        if (this.stats) {
            this.stats.updateAll(stats);
        }
    }
    
    resetAllFilters() {
        console.log('🔄 Réinitialisation de tous les filtres');
        
        this.currentFilters = {
            search: '',
            statuts: [],
            magasin: '',
            periode: 'all',
            statut: '',
            resultat: ''
        };
        
        if (this.stats) {
            this.stats.deselectAll();
        }
        
        if (this.filters) {
            this.filters.reset();
        }
        
        if (this.header && this.header.clearSearch) {
            this.header.clearSearch();
        }
        
        this.applyFilters();
        this.showInfo('Filtres réinitialisés');
    }
    
    // ========================================
    // HELPERS
    // ========================================
    
    formatDate(timestamp, format = 'complet') {
        if (!timestamp) return '-';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        switch (format) {
            case 'jour':
                return date.toLocaleDateString('fr-FR');
            case 'heure':
                return date.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            case 'complet':
            default:
                return date.toLocaleDateString('fr-FR') + ' ' + 
                       date.toLocaleTimeString('fr-FR', { 
                           hour: '2-digit', 
                           minute: '2-digit' 
                       });
        }
    }
    
    // ========================================
    // UI HELPERS
    // ========================================
    
    showLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.remove('hidden');
    }
    
    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('hidden');
    }
    
    showError(message) {
        toast.error(message);
    }
    
    showSuccess(message) {
        toast.success(message);
    }
    
    showWarning(message) {
        toast.warning(message);
    }
    
    showInfo(message) {
        toast.info(message);
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const orchestrator = new InterventionOrchestrator();
export default orchestrator;
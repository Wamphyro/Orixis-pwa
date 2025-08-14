// ========================================
// CONTACTS.ORCHESTRATOR.JS - VERSION AUTONOME COMPLÈTE
// Chemin: modules/contacts/contacts.orchestrator.js
// VERSION: 3.0.0 - SANS DÉPENDANCES EXTERNES
// ========================================

class ContactsOrchestrator {
    constructor() {
        // Données
        this.contacts = [
            {
                id: 'estelle-boulay',
                nom: 'Estelle Boulay',
                role: 'Assistante SAV Audio',
                email: 'boulay@BROKERAUDIOLOGIE88.onmicrosoft.com',
                telephone: '+33759578076',
                telephoneFormat: '07 59 57 80 76',
                avatar: '👩‍🦰',
                departement: 'SAV Audio',
                statut: 'disponible',
                specialites: ['Appareils auditifs', 'Support technique', 'Escalade niveau 2'],
                horaires: 'Lun-Ven: 9h-17h'
            },
            {
                id: 'marie-christine-douare',
                nom: 'Marie Christine Douare',
                role: 'Assistante SAV Audio',
                email: 'douare@BROKERAUDIOLOGIE88.onmicrosoft.com',
                telephone: '+33661761692',
                telephoneFormat: '06 61 76 16 92',
                avatar: '👩🏻‍🦱',
                departement: 'SAV Audio',
                statut: 'disponible',
                specialites: ['Maintenance', 'Formation', 'Support administratif'],
                horaires: 'Lun-Ven: 8h30-16h30'
            }
        ];
        
        this.filteredContacts = [...this.contacts];
        this.currentFilters = {
            search: '',
            departement: '',
            statut: ''
        };
        
        this.viewMode = 'cards'; // 'cards' ou 'list'
        this.selectedContacts = new Set();
    }

    // ========================================
    // INITIALISATION
    // ========================================
    async init() {
        console.log('🚀 Initialisation Contacts...');
        
        // Vérifier l'authentification
        if (!this.checkAuth()) {
            this.showToast('Vous devez être connecté', 'error');
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 2000);
            return;
        }
        
        // Créer l'interface
        this.createUI();
        
        // Attacher les événements
        this.attachEvents();
        
        // Charger les favoris
        this.loadFavorites();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        // Masquer le loader
        this.hideLoader();
        
        this.showToast('Contacts chargés avec succès', 'success');
    }

    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        if (!auth) return false;
        
        const authData = JSON.parse(auth);
        const now = Date.now();
        
        if (now - authData.timestamp > authData.expiry) {
            localStorage.removeItem('sav_auth');
            return false;
        }
        
        return authData.authenticated;
    }

    // ========================================
    // CRÉATION DE L'INTERFACE
    // ========================================
    createUI() {
        // Header
        this.createHeader();
        
        // Stats
        this.createStats();
        
        // Filtres
        this.createFilters();
        
        // Zone d'affichage
        this.createDisplayArea();
        
        // Modal
        this.createModal();
        
        // Toast container
        this.createToastContainer();
    }

    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        const header = document.getElementById('app-header');
        
        header.innerHTML = `
            <div class="header-gradient">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn-back" onclick="window.location.href='../home/home.html'">
                            ← Retour
                        </button>
                    </div>
                    
                    <div class="header-center">
                        <h1>📞 Contacts SAV Audio</h1>
                        <p>Assistance technique et support</p>
                    </div>
                    
                    <div class="header-right">
                        <div class="header-user">
                            <span class="user-avatar">👤</span>
                            <span class="user-name">${auth.userName || 'Utilisateur'}</span>
                            <span class="user-magasin">${auth.storeName || 'Magasin'}</span>
                        </div>
                        <button class="btn-logout" onclick="orchestrator.logout()">
                            Déconnexion
                        </button>
                    </div>
                </div>
                
                <div class="header-search">
                    <input type="text" 
                           id="searchInput" 
                           class="search-input" 
                           placeholder="🔍 Rechercher un contact..."
                           onkeyup="orchestrator.handleSearch(this.value)">
                </div>
                
                <div class="header-actions">
                    <button class="btn-action" onclick="orchestrator.toggleViewMode()" title="Changer vue">
                        <span id="viewModeIcon">📋</span>
                    </button>
                    <button class="btn-action" onclick="orchestrator.addContact()" title="Ajouter">
                        ➕
                    </button>
                    <button class="btn-action" onclick="orchestrator.exportContacts()" title="Exporter">
                        📊
                    </button>
                    <button class="btn-action" onclick="orchestrator.refresh()" title="Actualiser">
                        🔄
                    </button>
                </div>
            </div>
        `;
    }

    createStats() {
        const container = document.getElementById('stats-container');
        container.innerHTML = `
            <div class="stats-cards">
                <div class="stat-card" id="stat-total">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">${this.contacts.length}</div>
                    <div class="stat-label">Total contacts</div>
                </div>
                
                <div class="stat-card" id="stat-disponibles">
                    <div class="stat-icon">🟢</div>
                    <div class="stat-value">${this.contacts.filter(c => c.statut === 'disponible').length}</div>
                    <div class="stat-label">Disponibles</div>
                </div>
                
                <div class="stat-card" id="stat-favoris">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">0</div>
                    <div class="stat-label">Favoris</div>
                </div>
                
                <div class="stat-card" id="stat-urgence">
                    <div class="stat-icon">🚨</div>
                    <div class="stat-value">24/7</div>
                    <div class="stat-label">Urgence</div>
                </div>
            </div>
        `;
    }

    createFilters() {
        const container = document.getElementById('filters-container');
        
        // Extraire les spécialités uniques
        const specialites = new Set();
        this.contacts.forEach(c => c.specialites.forEach(s => specialites.add(s)));
        
        container.innerHTML = `
            <div class="filters-panel">
                <h3>Filtres</h3>
                <div class="filters-row">
                    <select id="filter-departement" onchange="orchestrator.applyFilters()">
                        <option value="">Tous les départements</option>
                        <option value="SAV Audio">SAV Audio</option>
                        <option value="Technique">Technique</option>
                        <option value="Administration">Administration</option>
                    </select>
                    
                    <select id="filter-statut" onchange="orchestrator.applyFilters()">
                        <option value="">Tous les statuts</option>
                        <option value="disponible">🟢 Disponible</option>
                        <option value="occupe">🔴 Occupé</option>
                        <option value="absent">⚫ Absent</option>
                    </select>
                    
                    <select id="filter-specialite" onchange="orchestrator.applyFilters()">
                        <option value="">Toutes les spécialités</option>
                        ${Array.from(specialites).map(s => 
                            `<option value="${s}">${s}</option>`
                        ).join('')}
                    </select>
                    
                    <button class="btn-reset" onclick="orchestrator.resetFilters()">
                        Réinitialiser
                    </button>
                </div>
            </div>
        `;
    }

    createDisplayArea() {
        const container = document.getElementById('display-container');
        container.innerHTML = `
            <div id="contacts-display" class="contacts-display">
                <!-- Les contacts seront affichés ici -->
            </div>
        `;
    }

    createModal() {
        // Modal pour les détails
        const modalHTML = `
            <div id="contactModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modalTitle">Détails du contact</h2>
                        <span class="modal-close" onclick="orchestrator.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body" id="modalBody">
                        <!-- Contenu dynamique -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="orchestrator.closeModal()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    createToastContainer() {
        const toastHTML = `
            <div id="toast-container" class="toast-container"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

    // ========================================
    // AFFICHAGE DES CONTACTS
    // ========================================
    updateDisplay() {
        const display = document.getElementById('contacts-display');
        
        if (this.viewMode === 'cards') {
            this.displayCards(display);
        } else {
            this.displayList(display);
        }
        
        // Mettre à jour les stats
        this.updateStats();
    }

    displayCards(container) {
        container.className = 'contacts-grid';
        container.innerHTML = this.filteredContacts.map(contact => `
            <div class="contact-card" data-id="${contact.id}">
                <div class="contact-header">
                    <span class="contact-avatar">${contact.avatar}</span>
                    <div class="contact-info">
                        <h3>${contact.nom}</h3>
                        <p>${contact.role}</p>
                        <small>${contact.departement}</small>
                    </div>
                    <span class="contact-favoris ${contact.favoris ? 'active' : ''}" 
                          onclick="orchestrator.toggleFavoris('${contact.id}')">
                        ${contact.favoris ? '⭐' : '☆'}
                    </span>
                </div>
                
                <div class="contact-specialites">
                    ${contact.specialites.map(s => `<span class="badge">${s}</span>`).join('')}
                </div>
                
                <div class="contact-details">
                    <div class="detail-item">
                        <span class="detail-icon">📧</span>
                        <span class="detail-text">${contact.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📞</span>
                        <span class="detail-text">${contact.telephoneFormat}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🕐</span>
                        <span class="detail-text">${contact.horaires}</span>
                    </div>
                </div>
                
                <div class="contact-actions">
                    <button onclick="orchestrator.sendEmail('${contact.id}')" title="Email">📧</button>
                    <button onclick="orchestrator.call('${contact.id}')" title="Appeler">📞</button>
                    <button onclick="orchestrator.openTeams('${contact.id}')" title="Teams">💬</button>
                    <button onclick="orchestrator.showDetails('${contact.id}')" title="Détails">ℹ️</button>
                </div>
                
                <div class="contact-status status-${contact.statut}">
                    ${this.getStatusIcon(contact.statut)} ${this.getStatusLabel(contact.statut)}
                </div>
            </div>
        `).join('');
    }

    displayList(container) {
        container.className = 'contacts-list';
        container.innerHTML = `
            <table class="contacts-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Nom</th>
                        <th>Rôle</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Horaires</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredContacts.map(contact => `
                        <tr>
                            <td>${contact.avatar}</td>
                            <td><strong>${contact.nom}</strong></td>
                            <td>${contact.role}</td>
                            <td><a href="mailto:${contact.email}">${contact.email}</a></td>
                            <td><a href="tel:${contact.telephone}">${contact.telephoneFormat}</a></td>
                            <td>${contact.horaires}</td>
                            <td>
                                <span class="badge badge-${contact.statut}">
                                    ${this.getStatusIcon(contact.statut)} ${this.getStatusLabel(contact.statut)}
                                </span>
                            </td>
                            <td class="actions-cell">
                                <button onclick="orchestrator.sendEmail('${contact.id}')" title="Email">📧</button>
                                <button onclick="orchestrator.call('${contact.id}')" title="Appeler">📞</button>
                                <button onclick="orchestrator.showDetails('${contact.id}')" title="Détails">ℹ️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ========================================
    // ACTIONS
    // ========================================
    sendEmail(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        // Ouvrir le modal d'email
        this.showEmailModal(contact);
    }

    showEmailModal(contact) {
        const modal = document.getElementById('contactModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.innerHTML = `📧 Envoyer un email à ${contact.nom}`;
        modalBody.innerHTML = `
            <div class="email-form">
                <div class="form-group">
                    <label>Destinataire:</label>
                    <input type="text" value="${contact.email}" readonly class="form-control">
                </div>
                
                <div class="form-group">
                    <label>Objet:</label>
                    <input type="text" id="emailSubject" placeholder="Objet de votre message" class="form-control">
                </div>
                
                <div class="form-group">
                    <label>Message:</label>
                    <textarea id="emailMessage" rows="8" placeholder="Votre message..." class="form-control"></textarea>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="orchestrator.sendEmailAction('${contact.email}')">
                        Envoyer
                    </button>
                    <button class="btn btn-secondary" onclick="orchestrator.closeModal()">
                        Annuler
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    sendEmailAction(email) {
        const subject = document.getElementById('emailSubject').value;
        const message = document.getElementById('emailMessage').value;
        
        if (!subject || !message) {
            this.showToast('Veuillez remplir tous les champs', 'warning');
            return;
        }
        
        // Utiliser EmailJS si configuré
        if (window.emailjs) {
            emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
                to_email: email,
                subject: subject,
                message: message
            }).then(() => {
                this.showToast('Email envoyé avec succès', 'success');
                this.closeModal();
            }).catch(() => {
                // Fallback to mailto
                window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            });
        } else {
            // Ouvrir le client mail
            window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        }
    }

    call(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        // Copier le numéro
        this.copyToClipboard(contact.telephone);
        this.showToast(`Numéro copié: ${contact.telephoneFormat}`, 'success');
        
        // Sur mobile, ouvrir l'app téléphone
        if (this.isMobile()) {
            window.location.href = `tel:${contact.telephone}`;
        }
    }

    openTeams(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${contact.email}`;
        window.open(teamsUrl, '_blank');
        this.showToast('Ouverture de Teams...', 'info');
    }

    showDetails(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        const modal = document.getElementById('contactModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.innerHTML = `${contact.avatar} ${contact.nom}`;
        modalBody.innerHTML = `
            <div class="contact-details-modal">
                <div class="detail-section">
                    <h3>👤 Informations générales</h3>
                    <p><strong>Nom:</strong> ${contact.nom}</p>
                    <p><strong>Rôle:</strong> ${contact.role}</p>
                    <p><strong>Département:</strong> ${contact.departement}</p>
                    <p><strong>Statut:</strong> ${this.getStatusIcon(contact.statut)} ${this.getStatusLabel(contact.statut)}</p>
                </div>
                
                <div class="detail-section">
                    <h3>📞 Contact</h3>
                    <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
                    <p><strong>Téléphone:</strong> <a href="tel:${contact.telephone}">${contact.telephoneFormat}</a></p>
                    <p><strong>Horaires:</strong> ${contact.horaires}</p>
                </div>
                
                <div class="detail-section">
                    <h3>🎯 Spécialités</h3>
                    <div class="specialites-list">
                        ${contact.specialites.map(s => `<span class="badge badge-info">${s}</span>`).join(' ')}
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="orchestrator.sendEmail('${contact.id}')">
                        📧 Envoyer un email
                    </button>
                    <button class="btn btn-success" onclick="orchestrator.call('${contact.id}')">
                        📞 Appeler
                    </button>
                    <button class="btn btn-info" onclick="orchestrator.openTeams('${contact.id}')">
                        💬 Teams
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    toggleFavoris(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        contact.favoris = !contact.favoris;
        this.saveFavorites();
        this.updateDisplay();
        
        this.showToast(
            contact.favoris ? `${contact.nom} ajouté aux favoris` : `${contact.nom} retiré des favoris`,
            'success'
        );
    }

    // ========================================
    // FILTRAGE
    // ========================================
    handleSearch(query) {
        this.currentFilters.search = query.toLowerCase();
        this.applyFilters();
    }

    applyFilters() {
        const departement = document.getElementById('filter-departement').value;
        const statut = document.getElementById('filter-statut').value;
        const specialite = document.getElementById('filter-specialite').value;
        
        this.currentFilters.departement = departement;
        this.currentFilters.statut = statut;
        this.currentFilters.specialite = specialite;
        
        this.filteredContacts = this.contacts.filter(contact => {
            // Recherche
            if (this.currentFilters.search) {
                const searchIn = [
                    contact.nom,
                    contact.role,
                    contact.email,
                    contact.telephoneFormat,
                    contact.departement,
                    ...contact.specialites
                ].join(' ').toLowerCase();
                
                if (!searchIn.includes(this.currentFilters.search)) {
                    return false;
                }
            }
            
            // Département
            if (departement && contact.departement !== departement) {
                return false;
            }
            
            // Statut
            if (statut && contact.statut !== statut) {
                return false;
            }
            
            // Spécialité
            if (specialite && !contact.specialites.includes(specialite)) {
                return false;
            }
            
            return true;
        });
        
        this.updateDisplay();
    }

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filter-departement').value = '';
        document.getElementById('filter-statut').value = '';
        document.getElementById('filter-specialite').value = '';
        
        this.currentFilters = {
            search: '',
            departement: '',
            statut: '',
            specialite: ''
        };
        
        this.filteredContacts = [...this.contacts];
        this.updateDisplay();
        
        this.showToast('Filtres réinitialisés', 'info');
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    toggleViewMode() {
        this.viewMode = this.viewMode === 'cards' ? 'list' : 'cards';
        document.getElementById('viewModeIcon').textContent = this.viewMode === 'cards' ? '📋' : '📇';
        this.updateDisplay();
        this.showToast(`Mode ${this.viewMode === 'cards' ? 'cartes' : 'liste'} activé`, 'info');
    }

    addContact() {
        this.showToast('Fonctionnalité d\'ajout à venir', 'info');
    }

    exportContacts() {
        const csv = this.convertToCSV(this.filteredContacts);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `contacts_sav_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Contacts exportés avec succès', 'success');
    }

    convertToCSV(data) {
        const headers = ['Nom', 'Rôle', 'Email', 'Téléphone', 'Département', 'Horaires', 'Spécialités'];
        const rows = data.map(c => [
            c.nom,
            c.role,
            c.email,
            c.telephoneFormat,
            c.departement,
            c.horaires,
            c.specialites.join('; ')
        ]);
        
        return [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${v}"`).join(','))
        ].join('\n');
    }

    refresh() {
        location.reload();
    }

    logout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            localStorage.removeItem('sav_auth');
            window.location.href = '../../index.html';
        }
    }

    closeModal() {
        document.getElementById('contactModal').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Suppression après 3 secondes
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.style.display = 'none';
    }

    updateStats() {
        const favoris = this.contacts.filter(c => c.favoris).length;
        document.querySelector('#stat-favoris .stat-value').textContent = favoris;
    }

    saveFavorites() {
        const favoris = this.contacts.filter(c => c.favoris).map(c => c.id);
        localStorage.setItem('contacts_favoris', JSON.stringify(favoris));
    }

    loadFavorites() {
        const favoris = JSON.parse(localStorage.getItem('contacts_favoris') || '[]');
        this.contacts.forEach(c => {
            c.favoris = favoris.includes(c.id);
        });
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        }
    }

    isMobile() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    getStatusIcon(status) {
        const icons = {
            disponible: '🟢',
            occupe: '🔴',
            absent: '⚫',
            pause: '🟡'
        };
        return icons[status] || '⚫';
    }

    getStatusLabel(status) {
        const labels = {
            disponible: 'Disponible',
            occupe: 'Occupé',
            absent: 'Absent',
            pause: 'En pause'
        };
        return labels[status] || status;
    }

    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    attachEvents() {
        // Fermer modal au clic extérieur
        window.onclick = (event) => {
            const modal = document.getElementById('contactModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Ctrl+K : Focus recherche
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // Échap : Fermer modal
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
}

// Créer l'instance et l'exposer globalement
const orchestrator = new ContactsOrchestrator();
window.orchestrator = orchestrator;

// Export pour module
export default orchestrator;
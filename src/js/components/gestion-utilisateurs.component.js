import { chargerTousLesUtilisateurs } from '../services/firebase-auth.js';
import { CompteService } from '../services/compte.service.js';

export class GestionUtilisateursComponent {
    static allUsers = [];
    static filteredUsers = [];
    static currentFilter = 'all';
    
    static render() {
        return `
            <!-- Bouton création en haut -->
            <div class="admin-top-actions">
                <button class="btn-primary" id="btnCreateUser">
                    ➕ Créer un nouveau profil
                </button>
            </div>
            
            <!-- Contrôles de recherche et filtres -->
            <div class="admin-controls">
                <div class="search-bar">
                    <input type="text" 
                           id="searchUser" 
                           placeholder="🔍 Rechercher un utilisateur..." 
                           autocomplete="off">
                </div>
                <div class="filter-buttons">
                    <button class="filter-btn active" data-role="all">Tous</button>
                    <button class="filter-btn" data-role="technicien">🔧 Techniciens</button>
                    <button class="filter-btn" data-role="audioprothesiste">🦻 Audioprothésistes</button>
                    <button class="filter-btn" data-role="assistant">📋 Assistants</button>
                    <button class="filter-btn" data-role="manager">👔 Managers</button>
                    <button class="filter-btn" data-role="admin">👑 Admins</button>
                </div>
            </div>
            
            <!-- Conteneur des cartes utilisateur -->
            <div id="userCardsContainer" class="user-cards-container">
                <div class="loading-message">
                    <div class="spinner"></div>
                    <p>Chargement des utilisateurs...</p>
                </div>
            </div>
            
            <!-- Modal création utilisateur -->
            <div id="createUserModal" class="modal">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h2>➕ Créer un nouveau profil utilisateur</h2>
                        <button class="modal-close" id="closeCreateModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <form id="createUserForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Prénom *</label>
                                    <input type="text" id="newUserPrenom" required>
                                </div>
                                <div class="form-group">
                                    <label>Nom *</label>
                                    <input type="text" id="newUserNom" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Rôle *</label>
                                <select id="newUserRole" required>
                                    <option value="">-- Sélectionner un rôle --</option>
                                    <option value="technicien">🔧 Technicien</option>
                                    <option value="audioprothesiste">🦻 Audioprothésiste</option>
                                    <option value="assistant">📋 Assistant SAV</option>
                                    <option value="manager">👔 Manager</option>
                                    <option value="admin">👑 Administrateur</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Code PIN (4 chiffres) *</label>
                                <input type="password" id="newUserPin" pattern="[0-9]{4}" maxlength="4" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Magasin par défaut</label>
                                <select id="newUserMagasinDefaut">
                                    <option value="">-- Sélectionner --</option>
                                    <option value="9DIJ">9DIJ</option>
                                    <option value="9AVA">9AVA</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Autorisations magasins</label>
                                <div class="magasins-checkboxes">
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="9DIJ" name="magasinAuth">
                                        <span>9DIJ</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="9AVA" name="magasinAuth">
                                        <span>9AVA</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="error-message" id="createUserError"></div>
                            <div class="success-message" id="createUserSuccess"></div>
                            
                            <div class="modal-actions">
                                <button type="button" class="btn-secondary" id="cancelCreate">Annuler</button>
                                <button type="submit" class="btn-primary">Créer le profil</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    static async init() {
        // Charger les utilisateurs
        await this.loadUsers();
        
        // Initialiser les événements
        this.initEventListeners();
    }
    
    static async loadUsers() {
        try {
            this.allUsers = await chargerTousLesUtilisateurs();
            this.filteredUsers = [...this.allUsers];
            this.displayUsers();
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            document.getElementById('userCardsContainer').innerHTML = 
                '<p class="error-message">Erreur lors du chargement des utilisateurs</p>';
        }
    }
    
    static displayUsers() {
        const container = document.getElementById('userCardsContainer');
        
        if (this.filteredUsers.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun utilisateur trouvé</p>';
            return;
        }
        
        container.innerHTML = this.filteredUsers.map(user => 
            CompteService.createUserCard(user, true)
        ).join('');
    }
    
    static initEventListeners() {
        // Recherche
        const searchInput = document.getElementById('searchUser');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterUsers(e.target.value);
            }, 300);
        });
        
        // Filtres par rôle
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.role;
                this.applyFilters();
            });
        });
        
        // Bouton créer utilisateur
        document.getElementById('btnCreateUser').addEventListener('click', () => {
            this.openCreateModal();
        });
        
        // Modal création
        document.getElementById('closeCreateModal').addEventListener('click', () => {
            this.closeCreateModal();
        });
        
        document.getElementById('cancelCreate').addEventListener('click', () => {
            this.closeCreateModal();
        });
        
        // Formulaire création
        document.getElementById('createUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateUser();
        });
    }
    
    static filterUsers(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredUsers = this.allUsers.filter(user => {
            const matchesSearch = !term || 
                user.nom.toLowerCase().includes(term) ||
                user.prenom.toLowerCase().includes(term) ||
                Object.keys(user.autorisations || {}).some(m => m.toLowerCase().includes(term));
            
            const matchesRole = this.currentFilter === 'all' || 
                user.role === this.currentFilter ||
                (this.currentFilter === 'admin' && user.role === 'Administrateur');
            
            return matchesSearch && matchesRole;
        });
        
        this.displayUsers();
    }
    
    static applyFilters() {
        const searchTerm = document.getElementById('searchUser').value;
        this.filterUsers(searchTerm);
    }
    
    static openCreateModal() {
        document.getElementById('createUserModal').classList.add('active');
    }
    
    static closeCreateModal() {
        document.getElementById('createUserModal').classList.remove('active');
        document.getElementById('createUserForm').reset();
        document.getElementById('createUserError').textContent = '';
        document.getElementById('createUserSuccess').textContent = '';
    }
    
    static async handleCreateUser() {
        const prenom = document.getElementById('newUserPrenom').value;
        const nom = document.getElementById('newUserNom').value;
        const role = document.getElementById('newUserRole').value;
        const pin = document.getElementById('newUserPin').value;
        const magasinDefaut = document.getElementById('newUserMagasinDefaut').value;
        
        // Récupérer les magasins autorisés
        const magasinsAuth = Array.from(document.querySelectorAll('input[name="magasinAuth"]:checked'))
            .map(cb => cb.value);
        
        if (magasinsAuth.length === 0) {
            this.showCreateError('Sélectionnez au moins un magasin');
            return;
        }
        
        // Créer l'objet autorisations
        const autorisations = {};
        magasinsAuth.forEach(mag => {
            autorisations[mag] = { acces: true };
        });
        
        // Générer un ID unique
        const userId = `${nom.toLowerCase()}${Date.now().toString().slice(-3)}`;
        
        try {
            // Créer le nouveau profil
            await CompteService.createUser({
                id: userId,
                prenom: prenom,
                nom: nom,
                role: role,
                code: pin,
                actif: true,
                autorisations: autorisations,
                magasinParDefaut: magasinDefaut || magasinsAuth[0],
                dateCreation: new Date().toISOString()
            });
            
            this.showCreateSuccess('Profil créé avec succès !');
            
            // Recharger la liste
            await this.loadUsers();
            
            setTimeout(() => this.closeCreateModal(), 2000);
            
        } catch (error) {
            console.error('Erreur création:', error);
            this.showCreateError('Erreur lors de la création du profil');
        }
    }
    
    static showCreateError(message) {
        document.getElementById('createUserError').textContent = message;
        document.getElementById('createUserSuccess').textContent = '';
    }
    
    static showCreateSuccess(message) {
        document.getElementById('createUserSuccess').textContent = message;
        document.getElementById('createUserError').textContent = '';
    }
}

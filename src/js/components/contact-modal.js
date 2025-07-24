// Gestion du modal de contact
class ContactModal {
    constructor() {
        this.modal = null;
        this.currentRecipient = null;
        this.init();
    }

    init() {
        // Créer le modal dans le DOM
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div class="modal-overlay" id="contactModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📧 Envoyer un message</h2>
                        <button class="modal-close" onclick="contactModal.close()">✕</button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Messages -->
                        <div class="success-message" id="successMessage">
                            ✅ Message envoyé avec succès !
                        </div>
                        <div class="error-message" id="errorMessage">
                            ❌ Erreur lors de l'envoi du message
                        </div>

                        <!-- Destinataire -->
                        <div class="recipient-info">
                            <div class="recipient-avatar" id="recipientAvatar">👤</div>
                            <div class="recipient-details">
                                <h3 id="recipientName">Destinataire</h3>
                                <p id="recipientEmail">email@example.com</p>
                            </div>
                        </div>

                        <form id="contactForm">
                            <!-- Objet -->
                            <div class="form-row">
                                <label for="subject">Objet de la demande *</label>
                                <select id="subject" required onchange="contactModal.handleSubjectChange(this)">
                                    <option value="">-- Sélectionnez un objet --</option>
                                    
                                    <optgroup label="🔧 Assistance technique">
                                        <option value="[Assistance] Problème non résolu après intervention">Problème non résolu après intervention</option>
                                        <option value="[Assistance] Demande de conseil technique">Demande de conseil technique</option>
                                        <option value="[Assistance] Appareil défectueux - besoin d'aide">Appareil défectueux - besoin d'aide</option>
                                        <option value="[Assistance] Question sur une procédure">Question sur une procédure</option>
                                    </optgroup>
                                    
                                    <optgroup label="❓ Questions générales">
                                        <option value="[Question] Information sur les pièces détachées">Information sur les pièces détachées</option>
                                        <option value="[Question] Délais de commande">Délais de commande</option>
                                        <option value="[Question] Disponibilité produits">Disponibilité produits</option>
                                        <option value="[Question] Documentation technique">Documentation technique</option>
                                    </optgroup>
                                    
                                    <optgroup label="🚨 Urgences">
                                        <option value="[URGENT] Client mécontent - Besoin d'aide immédiate">Client mécontent - Besoin d'aide immédiate</option>
                                        <option value="[URGENT] Panne totale - Aucune solution trouvée">Panne totale - Aucune solution trouvée</option>
                                        <option value="[URGENT] Problème de sécurité/garantie">Problème de sécurité/garantie</option>
                                        <option value="[URGENT] Escalade nécessaire">Escalade nécessaire</option>
                                    </optgroup>
                                    
                                    <optgroup label="📦 Commandes/Stock">
                                        <option value="[Commande] Commande de pièces urgente">Commande de pièces urgente</option>
                                        <option value="[Stock] Rupture de stock signalée">Rupture de stock signalée</option>
                                        <option value="[Commande] Erreur de livraison">Erreur de livraison</option>
                                        <option value="[Stock] Demande de réapprovisionnement">Demande de réapprovisionnement</option>
                                    </optgroup>
                                    
                                    <optgroup label="📚 Formation/Support">
                                        <option value="[Formation] Besoin de formation sur un appareil">Besoin de formation sur un appareil</option>
                                        <option value="[Formation] Nouvelle marque non maîtrisée">Nouvelle marque non maîtrisée</option>
                                        <option value="[Support] Demande de documentation">Demande de documentation</option>
                                        <option value="[Support] Partage de bonnes pratiques">Partage de bonnes pratiques</option>
                                    </optgroup>
                                    
                                    <optgroup label="💼 Administratif">
                                        <option value="[Admin] Question sur une facture">Question sur une facture</option>
                                        <option value="[Admin] Problème de garantie">Problème de garantie</option>
                                        <option value="[Admin] Réclamation client">Réclamation client</option>
                                        <option value="[Admin] Suivi d'un dossier">Suivi d'un dossier</option>
                                    </optgroup>
                                    
                                    <optgroup label="🔄 Retour SAV">
                                        <option value="[SAV] Mise à jour sur un appareil en réparation">Mise à jour sur un appareil en réparation</option>
                                        <option value="[SAV] Retour client après intervention">Retour client après intervention</option>
                                        <option value="[SAV] Demande de suivi">Demande de suivi</option>
                                        <option value="[SAV] Résultat d'intervention">Résultat d'intervention</option>
                                    </optgroup>
                                    
                                    <option value="other">➕ Autre (préciser)</option>
                                </select>
                                
                                <div class="subject-other-input" id="subjectOtherDiv">
                                    <input type="text" id="subjectOther" placeholder="Précisez l'objet de votre demande...">
                                </div>
                            </div>

                            <!-- Message -->
                            <div class="form-row">
                                <label for="message">Message *</label>
                                <textarea id="message" required placeholder="Décrivez votre demande en détail..."></textarea>
                            </div>

                            <!-- Priorité -->
                            <div class="form-row">
                                <label>Priorité</label>
                                <div class="priority-select">
                                    <label class="priority-option">
                                        <input type="radio" name="priority" value="normal" checked>
                                        <span>🔵 Normal</span>
                                    </label>
                                    <label class="priority-option urgent">
                                        <input type="radio" name="priority" value="urgent">
                                        <span>🔴 Urgent</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-modal btn-cancel" onclick="contactModal.close()">Annuler</button>
                        <button class="btn-modal btn-send" onclick="contactModal.send()">
                            Envoyer
                            <span class="loading-spinner" id="loadingSpinner"></span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Ajouter au DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('contactModal');
    }

    attachEventListeners() {
        // Fermer en cliquant sur l'overlay
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Gérer les options de priorité
        document.querySelectorAll('.priority-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.priority-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                this.querySelector('input').checked = true;
            });
        });

        // Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open(name, email, avatar) {
        this.currentRecipient = { name, email, avatar };
        
        // Mettre à jour les infos du destinataire
        document.getElementById('recipientName').textContent = name;
        document.getElementById('recipientEmail').textContent = email;
        document.getElementById('recipientAvatar').textContent = avatar;
        
        // Réinitialiser le formulaire
        document.getElementById('contactForm').reset();
        document.getElementById('subjectOtherDiv').classList.remove('show');
        this.hideMessages();
        
        // Afficher le modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.hideMessages();
    }

    handleSubjectChange(select) {
        const otherDiv = document.getElementById('subjectOtherDiv');
        if (select.value === 'other') {
            otherDiv.classList.add('show');
            document.getElementById('subjectOther').required = true;
        } else {
            otherDiv.classList.remove('show');
            document.getElementById('subjectOther').required = false;
        }
    }

    async send() {
        const form = document.getElementById('contactForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Récupérer les données
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        const userInfo = JSON.parse(localStorage.getItem('sav_user_permissions') || '{}');
        
        let subject = document.getElementById('subject').value;
        if (subject === 'other') {
            subject = '[Autre] ' + document.getElementById('subjectOther').value;
        }
        
        const message = document.getElementById('message').value;
        const priority = document.querySelector('input[name="priority"]:checked').value;
        
        // Préparer les paramètres
        const templateParams = {
            to_email: this.currentRecipient.email,
            to_name: this.currentRecipient.name,
            from_name: userInfo.prenom && userInfo.nom ? 
                `${userInfo.prenom} ${userInfo.nom}` : 'Utilisateur SAV',
            from_magasin: auth.magasin || 'Non spécifié',
            subject: subject,
            message: message,
            priority: priority === 'urgent' ? '🔴 URGENT' : '🔵 Normal',
            date: new Date().toLocaleString('fr-FR'),
            reply_to: 'noreply@orixis.fr'
        };

        // Afficher le loader
        const btn = document.querySelector('.btn-send');
        const spinner = document.getElementById('loadingSpinner');
        btn.disabled = true;
        spinner.classList.add('show');

        try {
            // Envoyer l'email
            await emailjs.send('service_6juwjvq', 'template_wbpw2q6', templateParams);
            
            // Succès
            this.showSuccess();
            
            // Sauvegarder dans l'historique local
            this.saveToHistory(templateParams);
            
            // Fermer après 2 secondes
            setTimeout(() => this.close(), 2000);
            
        } catch (error) {
            console.error('Erreur envoi email:', error);
            this.showError();
        } finally {
            btn.disabled = false;
            spinner.classList.remove('show');
        }
    }

    showSuccess() {
        this.hideMessages();
        document.getElementById('successMessage').classList.add('show');
    }

    showError() {
        this.hideMessages();
        document.getElementById('errorMessage').classList.add('show');
    }

    hideMessages() {
        document.getElementById('successMessage').classList.remove('show');
        document.getElementById('errorMessage').classList.remove('show');
    }

    saveToHistory(data) {
        const history = JSON.parse(localStorage.getItem('sav_contact_history') || '[]');
        history.unshift({
            ...data,
            timestamp: Date.now()
        });
        
        // Garder seulement les 10 derniers
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('sav_contact_history', JSON.stringify(history));
    }
}

// Créer l'instance globale
window.contactModal = new ContactModal();

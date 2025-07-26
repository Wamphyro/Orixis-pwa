// ========================================
// COMMANDES.UTILS.JS - Fonctions utilitaires partagées
// ========================================

// ========================================
// FORMATAGE DES DATES
// ========================================

export function formatDate(timestamp, format = 'complet') {
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
            return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
    }
}

// ========================================
// FORMATAGE MONÉTAIRE
// ========================================

export function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// ========================================
// GÉNÉRATION DE NUMÉROS
// ========================================

export function genererNumeroCommande(date = new Date()) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `CMD-${annee}${mois}${jour}-${sequence}`;
}

// ========================================
// VALIDATION
// ========================================

export function validerTelephone(telephone) {
    const regex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return regex.test(telephone.replace(/\s/g, ''));
}

export function validerEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ========================================
// CALCUL DES DÉLAIS
// ========================================

export function calculerDelaiLivraison(urgence = 'normal') {
    const maintenant = new Date();
    const delais = {
        'normal': 5,
        'urgent': 2,
        'tres_urgent': 1
    };
    
    const jours = delais[urgence] || 5;
    maintenant.setDate(maintenant.getDate() + jours);
    
    // Éviter les weekends
    const jourSemaine = maintenant.getDay();
    if (jourSemaine === 0) maintenant.setDate(maintenant.getDate() + 1); // Dimanche -> Lundi
    if (jourSemaine === 6) maintenant.setDate(maintenant.getDate() + 2); // Samedi -> Lundi
    
    return maintenant;
}

// ========================================
// HELPERS POUR LES STATUTS
// ========================================

export function getProchainStatut(statutActuel, config) {
    return config.STATUTS[statutActuel]?.suivant || null;
}

export function peutEtreAnnulee(statut) {
    return !['livree', 'annulee'].includes(statut);
}

// ========================================
// GESTION DES ERREURS
// ========================================

export function logError(context, error) {
    console.error(`[${context}]`, error);
    
    // Ici on pourrait envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
}

// ========================================
// DEBOUNCE
// ========================================

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// HELPERS DOM
// ========================================

export function toggleLoading(elementId, show = true) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (show) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

export function clearElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    formatDate,
    formatMoney,
    genererNumeroCommande,
    validerTelephone,
    validerEmail,
    calculerDelaiLivraison,
    getProchainStatut,
    peutEtreAnnulee,
    logError,
    debounce,
    toggleLoading,
    clearElement
};
// ========================================
// SUBVENTIONS.CONFIG.JS - Configuration minimale
// ========================================

import { AppHeader } from '../../src/components/index.js';

export function createSubventionsHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '📋 Gestion des Subventions',
        subtitle: 'Suivi MDPH et AGEFIPH',
        backUrl: window.location.origin + '/Orixis-pwa/modules/home/home.html',
        user: userData,
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm text-white',
            userSection: 'header-user-section'
        },
        onLogout: async () => {
            localStorage.removeItem('sav_auth');
            window.location.href = '../../index.html';
        }
    });
}

export default {
    createSubventionsHeader
};
// ========================================
// TEST-WIDGETS.JS - Script de test des widgets
// Chemin: modules/test/test-widgets.js
// ========================================

import { HeaderWidget } from '../../widgets/header/header.widget.js';

// ========================================
// VARIABLES GLOBALES
// ========================================

let headerWidget = null;
let progressInterval = null;

// ========================================
// INITIALISATION
// ========================================

window.addEventListener('DOMContentLoaded', () => {
    // Créer un auth factice pour les tests
    createMockAuth();
    
    // Créer le header initial
    createHeader();
    
    // Initialiser les contrôles
    initControls();
    
    addLog('✅ Page de test initialisée', 'success');
});

// ========================================
// CRÉATION DU HEADER
// ========================================

function createHeader() {
    // Si un header existe, le détruire
    if (headerWidget) {
        headerWidget.destroy();
        addLog('🗑️ Header précédent détruit', 'warning');
    }
    
    // Récupérer la config depuis les contrôles
    const config = {
        title: document.getElementById('headerTitle')?.value || '🧪 Test Widgets',
        subtitle: document.getElementById('headerSubtitle')?.value || '',
        icon: '🧪',
        theme: document.querySelector('.theme-active')?.dataset.theme || 'gradient',
        showBack: document.getElementById('showBack')?.checked !== false,
        backUrl: '/modules/home/home.html',
        showUser: document.getElementById('showUser')?.checked !== false,
        showMagasin: document.getElementById('showMagasin')?.checked !== false,
        showLogout: document.getElementById('showLogout')?.checked !== false,
        sticky: document.getElementById('sticky')?.checked !== false,
        autoAuth: true,
        autoRefresh: false,
        
        // Callbacks
        onBack: () => {
            addLog('↩️ Bouton retour cliqué', 'info');
            if (confirm('Retourner à l\'accueil ?')) {
                window.location.href = '/modules/home/home.html';
            }
        },
        
        onLogout: () => {
            addLog('🚪 Déconnexion demandée', 'warning');
            if (confirm('Se déconnecter ?')) {
                localStorage.removeItem('sav_auth');
                addLog('✅ Déconnecté avec succès', 'success');
                createMockAuth(); // Recréer un auth factice
                headerWidget.refresh();
            }
        },
        
        onUserClick: (userData) => {
            addLog(`👤 Clic utilisateur : ${userData.nomComplet}`, 'info');
            alert(`Utilisateur : ${userData.nomComplet}\nMagasin : ${userData.magasin}\nRole : ${userData.role}`);
        }
    };
    
    try {
        // Créer le nouveau header
        headerWidget = new HeaderWidget(config);
        addLog('✅ Header créé avec succès', 'success');
        
        // Logger la config
        console.log('Header config:', config);
        
    } catch (error) {
        addLog(`❌ Erreur : ${error.message}`, 'error');
        console.error(error);
    }
}

// ========================================
// CONTRÔLES DU HEADER
// ========================================

window.changeTheme = function(theme) {
    if (!headerWidget) {
        addLog('⚠️ Aucun header à modifier', 'warning');
        return;
    }
    
    // Mettre à jour la classe du header
    const element = headerWidget.element;
    if (element) {
        element.classList.remove('gradient', 'solid', 'glass');
        element.classList.add(theme);
        
        // Mettre à jour les boutons
        document.querySelectorAll('.button-group button').forEach(btn => {
            btn.classList.remove('theme-active');
        });
        event.target.classList.add('theme-active');
        
        addLog(`🎨 Thème changé : ${theme}`, 'info');
    }
};

window.changeTitle = function() {
    const newTitle = document.getElementById('headerTitle').value;
    if (headerWidget && newTitle) {
        headerWidget.setTitle(newTitle);
        addLog(`📝 Titre changé : ${newTitle}`, 'info');
    }
};

window.changeSubtitle = function() {
    const newSubtitle = document.getElementById('headerSubtitle').value;
    if (headerWidget) {
        headerWidget.setSubtitle(newSubtitle);
        addLog(`📝 Sous-titre changé : ${newSubtitle || '(vide)'}`, 'info');
    }
};

window.toggleProgress = function() {
    if (!headerWidget) return;
    
    const progressInput = document.getElementById('progressValue');
    
    if (progressInterval) {
        // Arrêter la progression
        clearInterval(progressInterval);
        progressInterval = null;
        headerWidget.hideProgress();
        addLog('⏹️ Progression arrêtée', 'info');
    } else {
        // Démarrer la progression
        progressInterval = setInterval(() => {
            const value = parseInt(progressInput.value);
            headerWidget.showProgress(value);
            document.getElementById('progressLabel').textContent = value + '%';
        }, 100);
        addLog('▶️ Progression démarrée', 'info');
    }
};

window.refreshHeader = function() {
    if (headerWidget) {
        headerWidget.refresh();
        addLog('🔄 Header rafraîchi', 'info');
    }
};

window.destroyHeader = function() {
    if (headerWidget) {
        headerWidget.destroy();
        headerWidget = null;
        addLog('🗑️ Header détruit', 'warning');
    }
};

window.recreateHeader = function() {
    createHeader();
};

// ========================================
// CONFIGURATION
// ========================================

window.applyConfig = function() {
    try {
        const configText = document.getElementById('configEditor').value;
        const config = JSON.parse(configText);
        
        // Appliquer la config aux contrôles
        if (config.title) document.getElementById('headerTitle').value = config.title;
        if (config.subtitle) document.getElementById('headerSubtitle').value = config.subtitle;
        if (config.showBack !== undefined) document.getElementById('showBack').checked = config.showBack;
        if (config.showUser !== undefined) document.getElementById('showUser').checked = config.showUser;
        if (config.showMagasin !== undefined) document.getElementById('showMagasin').checked = config.showMagasin;
        if (config.showLogout !== undefined) document.getElementById('showLogout').checked = config.showLogout;
        if (config.sticky !== undefined) document.getElementById('sticky').checked = config.sticky;
        
        // Recréer le header
        createHeader();
        
        addLog('✅ Configuration appliquée', 'success');
        
    } catch (error) {
        addLog(`❌ Erreur JSON : ${error.message}`, 'error');
    }
};

window.loadPreset = function(preset) {
    const presets = {
        minimal: {
            title: 'Minimal',
            icon: '📄',
            theme: 'solid',
            showBack: false,
            showUser: false,
            showMagasin: false,
            showLogout: false,
            sticky: false
        },
        complete: {
            title: 'Configuration Complète',
            subtitle: 'Toutes les options activées',
            icon: '🎯',
            theme: 'gradient',
            showBack: true,
            showUser: true,
            showMagasin: true,
            showLogout: true,
            sticky: true,
            autoAuth: true,
            autoRefresh: true
        },
        noauth: {
            title: 'Sans Authentification',
            subtitle: 'Mode public',
            icon: '🌐',
            theme: 'glass',
            showBack: true,
            showUser: false,
            showMagasin: false,
            showLogout: false,
            sticky: true,
            autoAuth: false
        },
        mobile: {
            title: 'Mobile',
            icon: '📱',
            theme: 'solid',
            showBack: true,
            showUser: true,
            showMagasin: false,
            showLogout: true,
            sticky: true
        }
    };
    
    const config = presets[preset];
    if (config) {
        document.getElementById('configEditor').value = JSON.stringify(config, null, 4);
        addLog(`📋 Preset chargé : ${preset}`, 'info');
    }
};

// ========================================
// UTILITAIRES
// ========================================

function createMockAuth() {
    // Créer une auth factice pour les tests
    const mockAuth = {
        authenticated: true,
        timestamp: Date.now(),
        expiry: 24 * 60 * 60 * 1000, // 24h
        collaborateur: {
            id: 'test-123',
            nom: 'DUPONT',
            prenom: 'Jean',
            email: 'jean.dupont@orixis.fr',
            role: 'technicien',
            magasin: '9PAR'
        },
        magasin: '9PAR',
        societe: 'ORIXIS TEST',
        raisonSociale: 'ORIXIS TEST SAS'
    };
    
    localStorage.setItem('sav_auth', JSON.stringify(mockAuth));
    addLog('🔐 Auth factice créée', 'info');
}

function initControls() {
    // Slider de progression
    const progressInput = document.getElementById('progressValue');
    const progressLabel = document.getElementById('progressLabel');
    
    if (progressInput) {
        progressInput.addEventListener('input', (e) => {
            progressLabel.textContent = e.target.value + '%';
            if (progressInterval && headerWidget) {
                headerWidget.showProgress(parseInt(e.target.value));
            }
        });
    }
}

function addLog(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Limiter à 50 logs
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

window.clearLogs = function() {
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
        logContainer.innerHTML = '<div class="log-entry info">Logs vidés</div>';
    }
};

// ========================================
// EXPORT POUR DEBUG
// ========================================

window.headerWidget = headerWidget;
window.HeaderWidget = HeaderWidget;
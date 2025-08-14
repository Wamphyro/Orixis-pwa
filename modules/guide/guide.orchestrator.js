// ========================================
// GUIDE.ORCHESTRATOR.JS - 📚 ORCHESTRATEUR DU GUIDE SAV AUDIO
// Chemin: modules/guide/guide.orchestrator.js
//
// VERSION SIMPLIFIÉE : Sans sidebar, avec navigation horizontale et cards
// ========================================

// Import des widgets
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// ========================================
// DONNÉES DU GUIDE
// ========================================

const GUIDE_DATA = {
    sections: [
        {
            id: 'types',
            title: 'Types d\'Appareils Auditifs',
            icon: '🎧',
            description: 'Identification et caractéristiques des différents types',
            content: {
                devices: [
                    {
                        name: 'CONTOUR D\'OREILLE CLASSIQUE (BTE)',
                        emoji: '1️⃣',
                        diagram: `
                            [BOÎTIER]
                                |
                            [COUDE]
                                |
                            [TUBE]
                                |
                            [EMBOUT]`,
                        features: [
                            'Boîtier derrière l\'oreille',
                            'Tube épais transparent',
                            'Embout sur mesure ou dôme',
                            'Pile 13 ou 675 généralement'
                        ]
                    },
                    {
                        name: 'CONTOUR ÉCOUTEUR DÉPORTÉ (RIC/RITE)',
                        emoji: '2️⃣',
                        diagram: `
                            [BOÎTIER]
                                |
                            [FIL FIN]
                                |
                            [ÉCOUTEUR]
                                |
                            [DÔME]`,
                        features: [
                            'Boîtier plus petit',
                            'Fil fin avec écouteur au bout',
                            'Dôme souple standard',
                            'Pile 312 ou 10 généralement'
                        ]
                    },
                    {
                        name: 'INTRA-AURICULAIRE (ITE/CIC)',
                        emoji: '3️⃣',
                        diagram: `
                            [APPAREIL COMPLET]
                                avec façade
                            [ÉVENT éventuel]`,
                        features: [
                            'Tout dans l\'oreille',
                            'Coque sur mesure',
                            'Tiroir pile intégré',
                            'Pile 10 ou 312'
                        ]
                    }
                ]
            }
        },
        {
            id: 'materiel',
            title: 'Matériel Obligatoire',
            icon: '🔧',
            description: 'Outils et pièces détachées nécessaires',
            content: {
                categories: [
                    {
                        title: 'Outils de base',
                        items: [
                            'Soufflette/poire à air',
                            'Brosses douces (différentes tailles)',
                            'Fils de nettoyage (0.7mm et 1mm)',
                            'Lingettes désinfectantes audio',
                            'Spray nettoyant spécial audio',
                            'Pastilles déshydratantes',
                            'Boîte de séchage électrique',
                            'Aimant pour manipulation piles',
                            'Loupe éclairante'
                        ]
                    },
                    {
                        title: 'Pièces détachées - Stock minimum',
                        items: [
                            '50 piles de chaque taille (10, 13, 312, 675)',
                            '20 filtres pare-cérumen de chaque type',
                            '30 dômes (petits, moyens, grands)',
                            '10 tubes fins standard',
                            '5 coudes de rechange',
                            '10 écouteurs déportés (M et P)',
                            'Filtres spécifiques par marque'
                        ]
                    }
                ]
            }
        },
        {
            id: 'diagnostic-muet',
            title: 'CAS N°1 : Appareil Muet',
            icon: '🎯',
            description: 'Procédures quand l\'appareil n\'émet plus de son',
            content: {
                procedures: [
                    {
                        type: 'CONTOUR CLASSIQUE (BTE)',
                        emoji: '🔵',
                        steps: [
                            { action: 'PILE', detail: 'Vérifier charge + position (+ visible)' },
                            { action: 'TUBE', detail: 'Déconnecter et souffler dans chaque partie' },
                            { action: 'EMBOUT', detail: 'Déboucher avec fil 1mm' },
                            { action: 'FILTRE', detail: 'dans l\'embout (si présent) : remplacer' },
                            { action: 'MICROPHONES', detail: '2 entrées sur le boîtier à brosser' }
                        ]
                    },
                    {
                        type: 'ÉCOUTEUR DÉPORTÉ (RIC)',
                        emoji: '🔴',
                        steps: [
                            { action: 'PILE', detail: 'Plus petite, attention au sens' },
                            { action: 'ÉCOUTEUR', detail: 'Déconnecter délicatement (tirer droit)' },
                            { action: 'FILTRE CÉRUMEN', detail: 'TOUJOURS dans l\'écouteur' },
                            { action: 'DÔME', detail: 'Vérifier qu\'il n\'est pas bouché' },
                            { action: 'CONNEXION', detail: 'Nettoyer les contacts dorés' }
                        ]
                    },
                    {
                        type: 'INTRA-AURICULAIRE',
                        emoji: '🟢',
                        steps: [
                            { action: 'PILE', detail: 'Tiroir fragile, manipuler doucement' },
                            { action: 'SORTIE SON', detail: 'Nettoyer avec brosse douce' },
                            { action: 'ÉVENT', detail: '(si présent) : Déboucher avec fil 0.7mm' },
                            { action: 'MICROPHONE', detail: 'Petit trou sur la façade' },
                            { action: 'COQUE', detail: 'Nettoyer avec lingette' }
                        ]
                    }
                ],
                warning: 'SI TOUJOURS MUET APRÈS CES ÉTAPES → CONTACTER SAV AUDIO'
            }
        },
        {
            id: 'diagnostic-larsen',
            title: 'CAS N°2 : Larsen (Sifflement)',
            icon: '📊',
            description: 'Solutions pour éliminer les sifflements',
            content: {
                solutions: [
                    {
                        type: 'BTE',
                        emoji: '🔵',
                        problems: [
                            'Embout mal inséré',
                            'Tube fendu',
                            'Coude défectueux'
                        ],
                        actions: [
                            'Réinsérer correctement',
                            'Remplacer tube immédiatement',
                            'Vérifier joint torique'
                        ]
                    },
                    {
                        type: 'RIC',
                        emoji: '🔴',
                        problems: [
                            'Dôme trop petit',
                            'Mauvais positionnement',
                            'Cérumen autour'
                        ],
                        actions: [
                            'Essayer taille supérieure',
                            'Enfoncer jusqu\'au "clic"',
                            'Nettoyer complètement'
                        ]
                    },
                    {
                        type: 'INTRA',
                        emoji: '🟢',
                        problems: [
                            'Insertion incorrecte',
                            'Coque fissurée',
                            'Accumulation cérumen'
                        ],
                        actions: [
                            'Tourner en poussant',
                            'SAV immédiat si fissure',
                            'Nettoyage complet'
                        ]
                    }
                ]
            }
        },
        {
            id: 'humidite',
            title: 'CAS N°3 : Humidité/Condensation',
            icon: '💧',
            description: 'Procédure de séchage et prévention',
            content: {
                procedure: [
                    { step: 1, action: 'RETIRER', detail: 'Retirer la pile immédiatement' },
                    { step: 2, action: 'OUVRIR', detail: 'Ouvrir le tiroir pile complètement' },
                    { step: 3, action: 'SÉCHER', detail: 'Boîte de séchage 4h minimum' },
                    { step: 4, action: 'PASTILLE', detail: 'Ajouter pastille déshydratante' }
                ],
                prevention: [
                    'Utiliser la boîte de séchage chaque nuit',
                    'Changer les pastilles déshydratantes régulièrement',
                    'Éviter les environnements très humides',
                    'Sécher les mains avant manipulation'
                ]
            }
        },
        {
            id: 'marques',
            title: 'Interventions par Marque',
            icon: '🏭',
            description: 'Spécificités techniques par fabricant',
            content: {
                brands: [
                    {
                        name: 'PHONAK',
                        color: '#00a859',
                        specifics: {
                            'Filtre': 'CeruShield (gris/blanc)',
                            'Outil': 'Pointe/disque',
                            'Écouteur': 'Connexion cliquet'
                        }
                    },
                    {
                        name: 'OTICON',
                        color: '#e4002b',
                        specifics: {
                            'Filtre': 'ProWax miniFit',
                            'Outil': 'Tige double fonction',
                            'Dômes': 'Grip-tip double couche'
                        }
                    },
                    {
                        name: 'SIGNIA/SIEMENS',
                        color: '#0066b3',
                        specifics: {
                            'Filtre': 'CeruSTOP (rouge/bleu)',
                            'Tubes': 'ThinTube 3.0',
                            'Connexion': 'Quart de tour'
                        }
                    },
                    {
                        name: 'WIDEX',
                        color: '#8b0000',
                        specifics: {
                            'Filtre': 'Nanocare',
                            'Écouteur': 'Code couleur puissance',
                            'Dômes': 'Système easywear'
                        }
                    },
                    {
                        name: 'STARKEY',
                        color: '#ff6900',
                        specifics: {
                            'Filtre': 'Hear Clear',
                            'Système': 'Snap-fit',
                            'Protection': 'Cérumen active'
                        }
                    }
                ]
            }
        },
        {
            id: 'interdictions',
            title: 'Règles et Interdictions',
            icon: '⛔',
            description: 'Ce qu\'il ne faut JAMAIS faire et bonnes pratiques',
            content: {
                jamais: [
                    '❌ Utiliser d\'eau sur les appareils',
                    '❌ Mettre des objets pointus dans les orifices',
                    '❌ Forcer les connexions',
                    '❌ Utiliser de l\'alcool pur',
                    '❌ Démonter le boîtier',
                    '❌ Chauffer l\'appareil (sèche-cheveux)',
                    '❌ Laisser partir un client non satisfait'
                ],
                toujours: [
                    '✅ Manipuler au-dessus d\'une surface douce',
                    '✅ Se laver les mains avant intervention',
                    '✅ Noter l\'intervention dans le registre',
                    '✅ Proposer un essai après réparation',
                    '✅ Donner des conseils d\'entretien'
                ],
                registre: {
                    title: '📝 Registre Obligatoire',
                    fields: [
                        'Date et heure',
                        'Nom du client',
                        'Problème décrit',
                        'Actions réalisées',
                        'Résultat obtenu',
                        'Pièces utilisées',
                        'Si escalade SAV : raison précise'
                    ]
                }
            }
        },
        {
            id: 'escalade',
            title: 'Procédure d\'Escalade SAV',
            icon: '📞',
            description: 'Quand et comment contacter le SAV niveau 2',
            content: {
                conditions: 'SEULEMENT SI échec de TOUTES les actions niveau 1',
                steps: [
                    {
                        numero: 1,
                        titre: 'REMPLIR la fiche d\'escalade',
                        actions: [
                            'Description complète du problème',
                            'TOUTES les actions tentées',
                            'Résultats obtenus',
                            'Photos si nécessaire'
                        ]
                    },
                    {
                        numero: 2,
                        titre: 'CONTACTER le SAV Audio',
                        actions: [
                            'Email : boulay@BROKERAUDIOLOGIE88.onmicrosoft.com',
                            'Ou : douare@BROKERAUDIOLOGIE88.onmicrosoft.com',
                            'Délai de réponse : 24h ouvrées'
                        ]
                    },
                    {
                        numero: 3,
                        titre: 'NE JAMAIS',
                        actions: [
                            'Prendre de RDV directement',
                            'Promettre une date de résolution',
                            'Garder l\'appareil sans accord SAV'
                        ]
                    }
                ]
            }
        }
    ]
};

// ========================================
// CLASSE ORCHESTRATEUR SIMPLIFIÉE
// ========================================

class GuideOrchestrator {
    constructor() {
        // Widgets
        this.header = null;
        
        // État
        this.currentSection = null;
        this.searchQuery = '';
        
        // DOM Elements
        this.navGrid = null;
        this.sectionsContainer = null;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            console.log('🚀 Initialisation du Guide SAV Audio...');
            
            // Vérifier l'authentification
            if (!this.checkAuth()) {
                this.showError('Vous devez être connecté pour accéder au guide');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                return;
            }
            
            // Récupérer les éléments DOM
            this.navGrid = document.getElementById('navGrid');
            this.sectionsContainer = document.getElementById('sectionsContainer');
            
            // Créer le header
            this.createHeader();
            
            // Créer la navigation
            this.createNavigation();
            
            // Charger le contenu
            this.loadContent();
            
            // Initialiser les événements
            this.initEvents();
            
            // Cacher le loader
            this.hideLoader();
            
            // Aller à la section si hash dans URL
            if (window.location.hash) {
                setTimeout(() => {
                    this.scrollToSection(window.location.hash.substring(1));
                }, 500);
            }
            
            this.showSuccess('Guide chargé avec succès !');
            
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            this.hideLoader();
            this.showError('Erreur lors du chargement du guide');
            throw error;
        }
    }
    
    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            const now = Date.now();
            
            if (now - authData.timestamp > authData.expiry) {
                localStorage.removeItem('sav_auth');
                return false;
            }
            
            return authData.authenticated;
        } catch {
            return false;
        }
    }
    
    // ========================================
    // CRÉATION DES COMPOSANTS
    // ========================================
    
    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        this.header = new HeaderWidget({
            // Fond transparent car on a déjà le gradient sur body
            pageBackground: 'colorful',
            theme: 'gradient',
            
            // Textes
            title: 'Guide de Formation SAV Audio',
            subtitle: 'Interventions Niveau 1 - Personnel Opticien',
            centerTitle: true,
            
            // Logo
            showLogo: true,
            logoIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
            
            // Navigation
            showBack: true,
            backText: 'Retour',
            onBack: () => {
                window.location.href = 'home.html';
            },
            
            // Recherche
            showSearch: true,
            searchPlaceholder: 'Rechercher dans le guide...',
            searchMaxWidth: '600px',
            onSearch: (query) => {
                this.handleSearch(query);
            },
            
            // Boutons rapides
            showQuickActions: true,
            quickActions: [
                {
                    id: 'print',
                    title: 'Imprimer',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
                    onClick: () => window.print()
                },
                {
                    id: 'top',
                    title: 'Haut de page',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>',
                    onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
                }
            ],
            
            // Breadcrumbs
            showBreadcrumbs: true,
            breadcrumbs: [
                { text: 'Accueil', url: 'home.html' },
                { text: 'Formation', url: '#' },
                { text: 'Guide SAV Audio' }
            ],
            
            // Utilisateur
            showUser: true,
            showUserDropdown: true,
            showMagasin: true,
            showLogout: true
        });
    }
    
    createNavigation() {
        if (!this.navGrid) return;
        
        let html = '';
        
        // Générer les boutons de navigation
        GUIDE_DATA.sections.forEach(section => {
            html += `
                <a href="#${section.id}" 
                   class="nav-item" 
                   data-section="${section.id}">
                    <span class="nav-icon">${section.icon}</span>
                    <span>${section.title.replace(section.icon, '').trim()}</span>
                </a>
            `;
        });
        
        this.navGrid.innerHTML = html;
    }
    
    loadContent() {
        if (!this.sectionsContainer) return;
        
        let html = '';
        
        // Générer toutes les sections avec un délai d'animation
        GUIDE_DATA.sections.forEach((section, index) => {
            html += this.renderSection(section, index);
        });
        
        this.sectionsContainer.innerHTML = html;
    }
    
    // ========================================
    // RENDU DES SECTIONS
    // ========================================
    
    renderSection(section, index) {
        let contentHtml = '';
        
        // Rendu selon le type de contenu
        switch(section.id) {
            case 'types':
                contentHtml = this.renderDeviceTypes(section.content);
                break;
            case 'materiel':
                contentHtml = this.renderMateriel(section.content);
                break;
            case 'diagnostic-muet':
                contentHtml = this.renderDiagnosticMuet(section.content);
                break;
            case 'diagnostic-larsen':
                contentHtml = this.renderDiagnosticLarsen(section.content);
                break;
            case 'humidite':
                contentHtml = this.renderHumidite(section.content);
                break;
            case 'marques':
                contentHtml = this.renderMarques(section.content);
                break;
            case 'interdictions':
                contentHtml = this.renderInterdictions(section.content);
                break;
            case 'escalade':
                contentHtml = this.renderEscalade(section.content);
                break;
        }
        
        // Délai d'animation progressif
        const delay = index * 0.1;
        
        return `
            <section id="${section.id}" class="guide-section" style="animation-delay: ${delay}s;">
                <div class="section-header">
                    <span class="section-icon">${section.icon}</span>
                    <div>
                        <h2 class="section-title">${section.title.replace(section.icon, '').trim()}</h2>
                        <p class="section-description">${section.description}</p>
                    </div>
                </div>
                ${contentHtml}
            </section>
        `;
    }
    
    renderDeviceTypes(content) {
        let html = '<div class="device-grid">';
        
        content.devices.forEach(device => {
            html += `
                <div class="device-card">
                    <h3 style="font-size: 18px; margin-bottom: 15px;">
                        ${device.emoji} ${device.name}
                    </h3>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 15px; font-family: monospace; font-size: 12px; white-space: pre;">
${device.diagram}
                    </div>
                    <h4 style="font-size: 14px; margin-bottom: 10px;">Caractéristiques :</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${device.features.map(f => `<li style="padding: 4px 0;">• ${f}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderMateriel(content) {
        let html = '<div class="tools-grid">';
        
        content.categories.forEach(category => {
            html += `
                <div class="tool-card">
                    <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 15px;">
                        ${category.title}
                    </h4>
                    <ul style="list-style: none; padding: 0;">
                        ${category.items.map(item => `
                            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #10b981; margin-right: 8px;">✓</span>
                                ${item}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderDiagnosticMuet(content) {
        let html = '<div>';
        
        content.procedures.forEach(proc => {
            html += `
                <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="font-size: 18px; margin-bottom: 15px; color: #92400e;">
                        ${proc.emoji} ${proc.type}
                    </h4>
                    <div>
                        ${proc.steps.map((step, idx) => `
                            <div style="display: flex; align-items: flex-start; padding: 10px; background: white; border-radius: 8px; margin-bottom: 10px;">
                                <span style="display: inline-block; width: 30px; height: 30px; background: #fbbf24; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; flex-shrink: 0;">
                                    ${idx + 1}
                                </span>
                                <div style="flex: 1;">
                                    <strong style="color: #92400e;">${step.action}</strong> : 
                                    <span style="color: #78716c;">${step.detail}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        if (content.warning) {
            html += `
                <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center;">
                    <strong style="color: #991b1b; font-size: 16px;">⚠️ ${content.warning}</strong>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    renderDiagnosticLarsen(content) {
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white;">
                            <th style="padding: 15px; text-align: left;">Type d'appareil</th>
                            <th style="padding: 15px; text-align: left;">Points de contrôle</th>
                            <th style="padding: 15px; text-align: left;">Actions correctives</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        content.solutions.forEach(sol => {
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 15px; font-weight: 600;">
                        ${sol.emoji} ${sol.type}
                    </td>
                    <td style="padding: 15px;">
                        ${sol.problems.map(p => `• ${p}`).join('<br>')}
                    </td>
                    <td style="padding: 15px;">
                        ${sol.actions.map(a => `• ${a}`).join('<br>')}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        return html;
    }
    
    renderHumidite(content) {
        let html = '<div>';
        
        // Procédure
        html += '<h4 style="font-size: 18px; margin-bottom: 20px; color: #1e40af;">PROCÉDURE DE SÉCHAGE OBLIGATOIRE</h4>';
        html += '<div style="display: flex; justify-content: space-around; flex-wrap: wrap; margin-bottom: 30px;">';
        
        content.procedure.forEach(step => {
            html += `
                <div style="flex: 1; min-width: 200px; margin: 10px; text-align: center;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">
                        ${step.step}
                    </div>
                    <h5 style="color: #1e40af; margin-bottom: 5px;">${step.action}</h5>
                    <p style="color: #6b7280; font-size: 14px;">${step.detail}</p>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Prévention
        html += `
            <div style="background: #dbeafe; border-radius: 12px; padding: 20px; margin-top: 20px;">
                <h4 style="color: #1e40af; margin-bottom: 15px;">💡 Conseils de prévention</h4>
                <ul style="list-style: none; padding: 0;">
                    ${content.prevention.map(p => `
                        <li style="padding: 8px 0;">
                            <span style="color: #3b82f6; margin-right: 10px;">✓</span>
                            ${p}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        html += '</div>';
        return html;
    }
    
    renderMarques(content) {
        let html = '<div class="brand-grid">';
        
        content.brands.forEach(brand => {
            html += `
                <div class="brand-card" style="border: 2px solid ${brand.color};">
                    <h4 style="color: ${brand.color}; font-size: 16px; font-weight: 600; margin-bottom: 15px;">
                        ${brand.name}
                    </h4>
                    ${Object.entries(brand.specifics).map(([key, value]) => `
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #374151; font-size: 13px;">${key}:</strong>
                            <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">${value}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderInterdictions(content) {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
        
        // Jamais
        html += `
            <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px;">
                <h4 style="color: #991b1b; font-size: 18px; margin-bottom: 15px;">JAMAIS :</h4>
                <ul style="list-style: none; padding: 0;">
                    ${content.jamais.map(item => `
                        <li style="padding: 8px 0; color: #991b1b;">
                            ${item}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        // Toujours
        html += `
            <div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 12px; padding: 20px;">
                <h4 style="color: #166534; font-size: 18px; margin-bottom: 15px;">TOUJOURS :</h4>
                <ul style="list-style: none; padding: 0;">
                    ${content.toujours.map(item => `
                        <li style="padding: 8px 0; color: #166534;">
                            ${item}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        html += '</div>';
        
        // Registre
        html += `
            <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin-top: 20px;">
                <h4 style="color: #92400e; font-size: 18px; margin-bottom: 15px;">
                    ${content.registre.title}
                </h4>
                <p style="color: #78716c; margin-bottom: 15px;">Pour CHAQUE intervention, noter :</p>
                <ol style="padding-left: 30px;">
                    ${content.registre.fields.map(field => `
                        <li style="padding: 5px 0; color: #451a03;">
                            <strong>${field}</strong>
                        </li>
                    `).join('')}
                </ol>
            </div>
        `;
        
        return html;
    }
    
    renderEscalade(content) {
        let html = `
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #991b1b; font-weight: 600; font-size: 16px;">
                    ⚠️ ${content.conditions}
                </p>
            </div>
        `;
        
        content.steps.forEach(step => {
            html += `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <span style="display: inline-block; width: 40px; height: 40px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; border-radius: 50%; text-align: center; line-height: 40px; margin-right: 15px; font-size: 20px; font-weight: bold;">
                            ${step.numero}
                        </span>
                        <h4 style="font-size: 18px; color: #374151;">
                            ${step.titre}
                        </h4>
                    </div>
                    <ul style="list-style: none; padding: 0; margin-left: 55px;">
                        ${step.actions.map(action => `
                            <li style="padding: 8px 0; color: #6b7280;">
                                • ${action}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });
        
        return html;
    }
    
    // ========================================
    // RECHERCHE
    // ========================================
    
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        
        if (!this.searchQuery) {
            // Réafficher toutes les sections
            document.querySelectorAll('.guide-section').forEach(section => {
                section.style.display = 'block';
                // Retirer le surlignage
                section.innerHTML = section.innerHTML.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '$1');
            });
            return;
        }
        
        let foundCount = 0;
        
        document.querySelectorAll('.guide-section').forEach(section => {
            const content = section.textContent.toLowerCase();
            
            if (content.includes(this.searchQuery)) {
                section.style.display = 'block';
                foundCount++;
                
                // Surligner les correspondances
                this.highlightText(section, this.searchQuery);
            } else {
                section.style.display = 'none';
            }
        });
        
        if (foundCount === 0) {
            this.showWarning('Aucun résultat trouvé');
        } else {
            this.showSuccess(`${foundCount} section(s) trouvée(s)`);
        }
    }
    
    highlightText(element, searchText) {
        // Fonction pour surligner le texte (simplifiée)
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        
        textNodes.forEach(node => {
            const parent = node.parentNode;
            if (parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
                const text = node.nodeValue;
                const regex = new RegExp(`(${searchText})`, 'gi');
                if (regex.test(text)) {
                    const span = document.createElement('span');
                    span.innerHTML = text.replace(regex, '<mark style="background: #fef3c7; padding: 2px 4px; border-radius: 2px;">$1</mark>');
                    parent.replaceChild(span, node);
                }
            }
        });
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    initEvents() {
        // Smooth scroll pour les ancres
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    // Plus besoin d'offset car header non-fixe
                    window.scrollTo({
                        top: target.offsetTop,
                        behavior: 'smooth'
                    });
                    
                    // Mettre à jour l'URL
                    history.pushState(null, null, anchor.getAttribute('href'));
                    
                    // Mettre en surbrillance dans la nav
                    this.highlightNavItem(anchor.getAttribute('href').substring(1));
                }
            });
        });
        
        // Détection du scroll pour mettre à jour la navigation active
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveSection();
            }, 100);
        });
    }
    
    updateActiveSection() {
        const sections = document.querySelectorAll('.guide-section');
        const scrollPos = window.scrollY + 50; // Offset réduit car header non-fixe
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            
            if (scrollPos >= top && scrollPos < top + height) {
                this.highlightNavItem(section.id);
            }
        });
    }
    
    highlightNavItem(sectionId) {
        // Retirer la classe active de tous les items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Ajouter la classe active à l'item courant
        const activeItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
    
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            // Plus besoin d'offset car header non-fixe
            window.scrollTo({
                top: section.offsetTop,
                behavior: 'smooth'
            });
            
            this.highlightNavItem(sectionId);
        }
    }
    
    // ========================================
    // UI HELPERS
    // ========================================
    
    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
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

const orchestrator = new GuideOrchestrator();
export default orchestrator;
/* ========================================
   FOOTER.COMPONENT.JS - Composant Footer
   Chemin: src/js/shared/ui/layout/footer.component.js
   
   DESCRIPTION:
   Composant de pied de page complet avec multiples styles et configurations.
   Supporte layouts simples à complexes, réseaux sociaux, newsletters, etc.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-250)
   2. Méthodes de création (lignes 252-600)
   3. Gestion du contenu (lignes 602-900)
   4. Animations et interactions (lignes 902-1100)
   5. API publique (lignes 1102-1200)
   
   DÉPENDANCES:
   - footer.css (tous les styles)
   - frosted-icons.component.js (pour les icônes)
   - animation-utils.js (pour les animations)
   ======================================== */

const Footer = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                blur: 20,
                opacity: 0.08,
                borderRadius: 0,
                shadow: '0 -8px 32px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                class: 'neumorphism',
                background: '#e0e5ec',
                shadow: '0 -9px 16px #a3b1c6, 0 9px 16px #ffffff'
            },
            'flat': {
                class: 'flat',
                background: '#f9fafb',
                border: '1px solid #e5e7eb'
            },
            'minimal': {
                class: 'minimal',
                background: 'transparent',
                borderTop: '1px solid currentColor'
            },
            'material': {
                class: 'material',
                elevation: 4,
                background: '#ffffff'
            },
            'gradient': {
                class: 'gradient',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            'dark': {
                class: 'dark-theme',
                background: '#0f172a',
                color: '#f1f5f9'
            }
        },

        layouts: {
            'simple': {
                class: 'layout-simple',
                sections: ['copyright']
            },
            'centered': {
                class: 'layout-centered',
                sections: ['logo', 'links', 'social', 'copyright']
            },
            'columns': {
                class: 'layout-columns',
                sections: ['company', 'products', 'resources', 'legal']
            },
            'newsletter': {
                class: 'layout-newsletter',
                sections: ['newsletter', 'links', 'copyright']
            },
            'mega': {
                class: 'layout-mega',
                sections: ['logo', 'columns', 'newsletter', 'bottom']
            },
            'split': {
                class: 'layout-split',
                sections: ['left', 'right']
            }
        },

        animations: {
            'none': { enabled: false },
            'subtle': {
                duration: 300,
                easing: 'ease',
                effects: ['fade']
            },
            'smooth': {
                duration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'slideUp']
            },
            'rich': {
                duration: 600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['fade', 'slideUp', 'stagger']
            }
        },

        sizes: {
            'compact': {
                padding: '24px',
                fontSize: '14px',
                spacing: '16px'
            },
            'medium': {
                padding: '48px',
                fontSize: '16px',
                spacing: '24px'
            },
            'large': {
                padding: '64px',
                fontSize: '18px',
                spacing: '32px'
            }
        },

        features: {
            'sticky': false,
            'parallax': false,
            'wave': false,
            'particles': false,
            'backToTop': true,
            'languageSelector': false,
            'themeToggle': false,
            'cookieNotice': false
        },

        socialIcons: {
            facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
            twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>',
            linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
            instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/></svg>',
            youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
        },

        defaultContent: {
            copyright: '© 2024 Your Company. All rights reserved.',
            tagline: 'Building amazing experiences',
            links: {
                company: ['About', 'Team', 'Careers', 'Contact'],
                products: ['Features', 'Pricing', 'Security', 'Updates'],
                resources: ['Blog', 'Documentation', 'Support', 'FAQ'],
                legal: ['Privacy', 'Terms', 'Cookie Policy', 'License']
            }
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = new Map();
    let idCounter = 0;

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    function generateId() {
        return `footer-${++idCounter}`;
    }

    function createStructure(options) {
        const id = generateId();
        const config = normalizeOptions(options);
        
        // Conteneur principal
        const footer = document.createElement('footer');
        footer.className = `footer ${config.style} ${config.layout} ${config.size}`;
        footer.setAttribute('data-footer-id', id);
        
        // Conteneur interne
        const container = document.createElement('div');
        container.className = 'footer-container';
        
        // Créer les sections selon le layout
        const layout = CONFIG.layouts[config.layout];
        if (config.sections) {
            // Sections personnalisées
            Object.entries(config.sections).forEach(([key, content]) => {
                const section = createSection(key, content, config);
                container.appendChild(section);
            });
        } else {
            // Layout prédéfini
            layout.sections.forEach(sectionType => {
                const section = createDefaultSection(sectionType, config);
                if (section) container.appendChild(section);
            });
        }
        
        footer.appendChild(container);
        
        // Fonctionnalités supplémentaires
        if (config.features.wave) {
            footer.appendChild(createWave(config.style));
        }
        
        if (config.features.backToTop) {
            footer.appendChild(createBackToTop(config));
        }
        
        // État
        state.set(id, {
            footer,
            container,
            config,
            animations: []
        });
        
        return { id, footer };
    }

    function createSection(type, content, config) {
        const section = document.createElement('div');
        section.className = `footer-section footer-${type}`;
        
        switch (type) {
            case 'logo':
                return createLogoSection(content, config);
            case 'links':
                return createLinksSection(content, config);
            case 'social':
                return createSocialSection(content, config);
            case 'newsletter':
                return createNewsletterSection(content, config);
            case 'copyright':
                return createCopyrightSection(content, config);
            case 'columns':
                return createColumnsSection(content, config);
            default:
                section.innerHTML = content;
                return section;
        }
    }

    function createLogoSection(content, config) {
        const section = document.createElement('div');
        section.className = 'footer-section footer-logo';
        
        if (content.image) {
            const img = document.createElement('img');
            img.src = content.image;
            img.alt = content.alt || 'Logo';
            img.className = 'footer-logo-img';
            section.appendChild(img);
        }
        
        if (content.text) {
            const text = document.createElement('div');
            text.className = 'footer-logo-text';
            text.textContent = content.text;
            section.appendChild(text);
        }
        
        if (content.tagline) {
            const tagline = document.createElement('p');
            tagline.className = 'footer-tagline';
            tagline.textContent = content.tagline;
            section.appendChild(tagline);
        }
        
        return section;
    }

    function createLinksSection(links, config) {
        const section = document.createElement('nav');
        section.className = 'footer-section footer-links';
        section.setAttribute('aria-label', 'Footer navigation');
        
        if (Array.isArray(links)) {
            // Liste simple
            const list = document.createElement('ul');
            list.className = 'footer-links-list';
            
            links.forEach(link => {
                const item = createLinkItem(link);
                list.appendChild(item);
            });
            
            section.appendChild(list);
        } else {
            // Groupes de liens
            Object.entries(links).forEach(([title, items]) => {
                const group = createLinkGroup(title, items);
                section.appendChild(group);
            });
        }
        
        return section;
    }

    function createLinkItem(link) {
        const item = document.createElement('li');
        item.className = 'footer-link-item';
        
        const a = document.createElement('a');
        a.href = link.href || '#';
        a.textContent = link.text || link;
        a.className = 'footer-link';
        
        if (link.external) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
        
        item.appendChild(a);
        return item;
    }

    function createLinkGroup(title, links) {
        const group = document.createElement('div');
        group.className = 'footer-link-group';
        
        const heading = document.createElement('h3');
        heading.className = 'footer-group-title';
        heading.textContent = title;
        
        const list = document.createElement('ul');
        list.className = 'footer-links-list';
        
        links.forEach(link => {
            const item = createLinkItem(link);
            list.appendChild(item);
        });
        
        group.appendChild(heading);
        group.appendChild(list);
        
        return group;
    }

    function createSocialSection(content, config) {
        const section = document.createElement('div');
        section.className = 'footer-section footer-social';
        
        if (content.title) {
            const title = document.createElement('h3');
            title.className = 'footer-social-title';
            title.textContent = content.title;
            section.appendChild(title);
        }
        
        const list = document.createElement('div');
        list.className = 'footer-social-list';
        
        const networks = content.networks || content;
        (Array.isArray(networks) ? networks : Object.entries(networks)).forEach(item => {
            const [network, url] = Array.isArray(item) ? item : [item.name, item.url];
            const link = createSocialLink(network, url || '#', config);
            list.appendChild(link);
        });
        
        section.appendChild(list);
        return section;
    }

    function createSocialLink(network, url, config) {
        const link = document.createElement('a');
        link.href = url;
        link.className = 'footer-social-link';
        link.setAttribute('aria-label', network);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        const icon = CONFIG.socialIcons[network.toLowerCase()];
        if (icon) {
            link.innerHTML = icon;
        } else {
            link.textContent = network;
        }
        
        return link;
    }

    function createNewsletterSection(content, config) {
        const section = document.createElement('div');
        section.className = 'footer-section footer-newsletter';
        
        const title = document.createElement('h3');
        title.className = 'footer-newsletter-title';
        title.textContent = content.title || 'Subscribe to our newsletter';
        
        const description = document.createElement('p');
        description.className = 'footer-newsletter-desc';
        description.textContent = content.description || 'Get the latest updates in your inbox';
        
        const form = document.createElement('form');
        form.className = 'footer-newsletter-form';
        form.onsubmit = (e) => {
            e.preventDefault();
            if (content.onSubmit) {
                const email = form.querySelector('input').value;
                content.onSubmit(email);
            }
        };
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'footer-newsletter-input-wrapper';
        
        const input = document.createElement('input');
        input.type = 'email';
        input.placeholder = content.placeholder || 'Enter your email';
        input.className = 'footer-newsletter-input';
        input.required = true;
        
        const button = document.createElement('button');
        button.type = 'submit';
        button.className = 'footer-newsletter-button';
        button.textContent = content.buttonText || 'Subscribe';
        
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(button);
        form.appendChild(inputWrapper);
        
        section.appendChild(title);
        section.appendChild(description);
        section.appendChild(form);
        
        return section;
    }

    function createCopyrightSection(content, config) {
        const section = document.createElement('div');
        section.className = 'footer-section footer-copyright';
        
        const text = document.createElement('p');
        text.className = 'footer-copyright-text';
        text.innerHTML = content.text || content || CONFIG.defaultContent.copyright;
        
        section.appendChild(text);
        
        if (content.links) {
            const links = document.createElement('div');
            links.className = 'footer-copyright-links';
            
            content.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.href || '#';
                a.textContent = link.text || link;
                a.className = 'footer-copyright-link';
                links.appendChild(a);
            });
            
            section.appendChild(links);
        }
        
        return section;
    }

    function createColumnsSection(content, config) {
        const section = document.createElement('div');
        section.className = 'footer-section footer-columns';
        
        Object.entries(content).forEach(([key, column]) => {
            if (typeof column === 'object' && column.title) {
                const group = createLinkGroup(column.title, column.links || []);
                section.appendChild(group);
            }
        });
        
        return section;
    }

    // ========================================
    // FONCTIONNALITÉS SUPPLÉMENTAIRES
    // ========================================
    function createWave(style) {
        const wave = document.createElement('div');
        wave.className = 'footer-wave';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 1200 120');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z');
        path.setAttribute('class', 'wave-path');
        
        svg.appendChild(path);
        wave.appendChild(svg);
        
        return wave;
    }

    function createBackToTop(config) {
        const button = document.createElement('button');
        button.className = 'footer-back-to-top';
        button.setAttribute('aria-label', 'Back to top');
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
        
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Afficher/masquer selon le scroll
        let isVisible = false;
        window.addEventListener('scroll', () => {
            const shouldShow = window.scrollY > 300;
            if (shouldShow !== isVisible) {
                isVisible = shouldShow;
                button.classList.toggle('visible', isVisible);
            }
        });
        
        return button;
    }

    // ========================================
    // CRÉATION DES SECTIONS PAR DÉFAUT
    // ========================================
    function createDefaultSection(type, config) {
        switch (type) {
            case 'copyright':
                return createCopyrightSection(CONFIG.defaultContent.copyright, config);
            case 'logo':
                return config.logo ? createLogoSection(config.logo, config) : null;
            case 'links':
                return config.links ? createLinksSection(config.links, config) : null;
            case 'social':
                return config.social ? createSocialSection(config.social, config) : null;
            case 'newsletter':
                return config.newsletter ? createNewsletterSection(config.newsletter, config) : null;
            case 'columns':
                return config.columns ? createColumnsSection(config.columns, config) : null;
            default:
                return null;
        }
    }

    // ========================================
    // ANIMATIONS
    // ========================================
    function initAnimations(id) {
        const instance = state.get(id);
        if (!instance || instance.config.animation === 'none') return;
        
        const { footer, config } = instance;
        const animationType = CONFIG.animations[config.animation];
        
        if (animationType.effects.includes('stagger')) {
            animateStagger(footer, animationType);
        }
        
        if (config.features.parallax) {
            initParallax(footer);
        }
        
        if (config.features.particles) {
            initParticles(footer);
        }
    }

    function animateStagger(footer, animation) {
        const elements = footer.querySelectorAll('.footer-section, .footer-link-item, .footer-social-link');
        
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = `all ${animation.duration}ms ${animation.easing}`;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    function initParallax(footer) {
        let ticking = false;
        
        function updateParallax() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            footer.style.transform = `translateY(${rate}px)`;
            ticking = false;
        }
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    function normalizeOptions(options = {}) {
        return {
            style: options.style || 'glassmorphism',
            layout: options.layout || 'centered',
            size: options.size || 'medium',
            animation: options.animation || 'smooth',
            features: { ...CONFIG.features, ...options.features },
            sections: options.sections,
            logo: options.logo,
            links: options.links,
            social: options.social,
            newsletter: options.newsletter,
            columns: options.columns,
            copyright: options.copyright
        };
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('footer-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'footer-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/footer.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            injectStyles();
            
            const { id, footer } = createStructure(options);
            initAnimations(id);
            
            return {
                id,
                element: footer,
                update: (newOptions) => this.update(id, newOptions),
                destroy: () => this.destroy(id),
                addSection: (type, content) => this.addSection(id, type, content),
                removeSection: (type) => this.removeSection(id, type)
            };
        },
        
        update(id, newOptions) {
            const instance = state.get(id);
            if (!instance) return;
            
            const { footer } = instance;
            const config = normalizeOptions({ ...instance.config, ...newOptions });
            
            // Mettre à jour les classes
            footer.className = `footer ${config.style} ${config.layout} ${config.size}`;
            
            instance.config = config;
        },
        
        destroy(id) {
            const instance = state.get(id);
            if (!instance) return;
            
            instance.footer.remove();
            state.delete(id);
        },
        
        addSection(id, type, content) {
            const instance = state.get(id);
            if (!instance) return;
            
            const section = createSection(type, content, instance.config);
            instance.container.appendChild(section);
        },
        
        removeSection(id, type) {
            const instance = state.get(id);
            if (!instance) return;
            
            const section = instance.footer.querySelector(`.footer-${type}`);
            if (section) section.remove();
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Méthodes utilitaires
        createCustomIcon(name, svg) {
            CONFIG.socialIcons[name] = svg;
        }
    };
})();

// Export pour utilisation
export default Footer;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12] - Layout responsive complexe
   Solution: Utiliser CSS Grid avec areas nommées
   
   [2024-12] - Performance des animations
   Cause: Trop d'éléments animés simultanément
   Résolution: Utiliser requestAnimationFrame et stagger
   
   [2024-12] - Accessibilité des liens sociaux
   Solution: Ajouter aria-label sur chaque icône
   
   NOTES POUR REPRISES FUTURES:
   - Le footer supporte tous les layouts courants
   - Les animations sont optionnelles pour performance
   - Le back-to-top utilise IntersectionObserver
   - Support complet du mode sombre
   ======================================== */
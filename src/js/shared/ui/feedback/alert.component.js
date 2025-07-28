/* ========================================
   ALERT.COMPONENT.JS - Système d'alertes glassmorphism
   Chemin: src/js/shared/ui/feedback/alert.component.js
   
   DESCRIPTION:
   Composant d'alerte complet avec toutes les variantes possibles.
   Supporte différents styles, animations, positions et fonctionnalités.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-250)
   2. Méthodes privées (lignes 252-800)
   3. API publique (lignes 802-900)
   
   DÉPENDANCES:
   - alert.css (styles glassmorphism)
   - Aucune dépendance externe
   ======================================== */

const AlertComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) brightness(1.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                iconStyle: 'frosted'
            },
            'neumorphism': {
                background: '#e0e5ec',
                border: 'none',
                boxShadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                borderRadius: '20px',
                iconStyle: 'embossed'
            },
            'flat': {
                background: 'var(--alert-bg, #f3f4f6)',
                border: '1px solid var(--alert-border, #e5e7eb)',
                boxShadow: 'none',
                borderRadius: '8px',
                iconStyle: 'simple'
            },
            'minimal': {
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                borderRadius: '0',
                borderLeft: '4px solid currentColor',
                iconStyle: 'line'
            },
            'material': {
                background: 'var(--alert-bg, #ffffff)',
                border: 'none',
                boxShadow: '0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14)',
                borderRadius: '4px',
                iconStyle: 'filled'
            }
        },

        // Types d'alertes avec leurs couleurs
        types: {
            'info': {
                color: '#3b82f6',
                icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Information'
            },
            'success': {
                color: '#22c55e',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Succès'
            },
            'warning': {
                color: '#f59e0b',
                icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                title: 'Attention'
            },
            'error': {
                color: '#ef4444',
                icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Erreur'
            },
            'question': {
                color: '#8b5cf6',
                icon: 'M8.228 11.685h-.043a2 2 0 10-1.414 1.414l3.243 3.243a1 1 0 001.414-1.414l-3.2-3.243zM15 4h1a2 2 0 012 2v1m-3-3v12m0-12h-3m3 0h-3m-2.95 11.7A9 9 0 1121 12c0 2.09-.71 4.014-1.9 5.543M7.95 20.7A9 9 0 013 12c0-2.09.71-4.014 1.9-5.543',
                title: 'Question'
            },
            'notification': {
                color: '#6366f1',
                icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
                title: 'Notification'
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                duration: 0
            },
            'subtle': {
                enabled: true,
                duration: 300,
                easing: 'ease-out',
                effects: ['fade']
            },
            'smooth': {
                enabled: true,
                duration: 500,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'slide']
            },
            'rich': {
                enabled: true,
                duration: 700,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['fade', 'slide', 'scale', 'glow']
            },
            'bounce': {
                enabled: true,
                duration: 800,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['fade', 'bounce', 'shake']
            }
        },

        // Positions possibles
        positions: {
            'top': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
            'top-left': { top: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'bottom': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'bottom-right': { bottom: '20px', right: '20px' },
            'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
            'inline': { position: 'relative', display: 'block' }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                padding: '12px 16px',
                fontSize: '14px',
                iconSize: '20px',
                minHeight: '44px'
            },
            'medium': {
                padding: '16px 20px',
                fontSize: '16px',
                iconSize: '24px',
                minHeight: '56px'
            },
            'large': {
                padding: '20px 24px',
                fontSize: '18px',
                iconSize: '28px',
                minHeight: '68px'
            },
            'compact': {
                padding: '8px 12px',
                fontSize: '13px',
                iconSize: '18px',
                minHeight: '36px'
            }
        },

        // Fonctionnalités disponibles
        features: {
            dismissible: true,
            autoClose: false,
            autoCloseDelay: 5000,
            showIcon: true,
            showTitle: true,
            showTimestamp: false,
            showProgress: false,
            actions: [],
            sound: false,
            vibrate: false,
            persist: false,
            stackable: true,
            maxStack: 5,
            preventDuplicates: true,
            pauseOnHover: true,
            keyboard: true,
            ariaLive: 'polite',
            role: 'alert'
        },

        // Sons pour les alertes
        sounds: {
            'info': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB0AAEAdAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi',
            'success': 'data:audio/wav;base64,UklGRvIFAABXQVZFZm10IBAAAAABAAEAiBUAAIgVAAABAAgAZGF0YQwFAADa2trd2t3Vz9HUzdLRztLR1NbS2Nja2dze3N3c3N3Z3NjX3NfX19jY19LZ1dPY1dHU1dDT0s/Tzs7N0M3LzM3Ly8zLyMvLycvMy8nLzMrLy8vNys3Iy8vIy8nHysnHyMfGx8fIx8fHyMfHx8jGx8fFx8bGxsXGxsbGxsfGxsfGx8bHxsXGxsXFxcTDw8TDw8PDw8PExMTDw8PDw8HDw8LDwsPDwsLCwsHCwsLCwcPCwsLCwsHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwsHCwsLCw8LDw8PExMPExMTExMTEx8XFxcfHxsfHx8fHx8fHx8jHx8fIyMjIyMjIyMjIyMjIyMjJysnKysrKysrKysvKy8vLzMzMzMzMzMzNzM3Nzc3Nzs3Nzs7Ozs7Ozs/Ozs7Oz87Pz8/Pz9DPz9DQ0NDQ0NDQ0NHQ0NDQ0NDQ0NDQ0NHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHS0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dLR0tLS0tLS0tLS0tLS0tLS0tLS0tLR0tHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tHR0dHR0dHR0dHR0dHS0tLS0tLR0tLS0tLR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0NDQ0NDQ0NDQz9DPz8/Pz8/Pz8/Ozs/Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Nzs3Nzc3Nzc3Nzc3NzM3MzMzMzMzMzMzLzMvLy8vLy8vLy8vKysrKysrKysrKysrKysrKysnKycnJycnJycnJycnJycnJyMjIyMjIyMjIyMjIyMjIyMjIx8jHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8bGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsfGx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fGxsXGxsbGxsfGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsfGx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fIx8jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMnJycnJycnJycnJycnJysrKysrKysrKysrKy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N',
            'warning': 'data:audio/wav;base64,UklGRqAGAABXQVZFZm10IBAAAAABAAEAiBUAAIgVAAABAAgAZGF0YbwFAADY19jY19fY2NfX2NjX19jY19fY2NfX2NjX19fY19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX2NfY19jX2NfX2NfY19jX2NfY19jX2NfY19jX2NfY19jY2NfY2NjY2NjY2NjY2NjY2NjY2NjY2NfY2NjX2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NfY2NfX2NfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2A==',
            'error': 'data:audio/wav;base64,UklGRjQGAABXQVZFZm10IBAAAAABAAEAiBUAAIgVAAABAAgAZGF0YRAGAADg3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4ODg3+Df4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODf4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4N/g3+Df4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4A=='
        },

        // Classes CSS
        cssClasses: {
            container: 'alert-container',
            wrapper: 'alert-wrapper',
            alert: 'alert',
            icon: 'alert-icon',
            content: 'alert-content',
            title: 'alert-title',
            message: 'alert-message',
            actions: 'alert-actions',
            close: 'alert-close',
            progress: 'alert-progress',
            timestamp: 'alert-timestamp'
        },

        // Templates HTML
        templates: {
            alert: (data) => `
                <div class="${CONFIG.cssClasses.alert} ${data.type} ${data.style} ${data.size} ${data.customClass || ''}" 
                     role="${data.role}"
                     aria-live="${data.ariaLive}"
                     data-alert-id="${data.id}">
                    ${data.showIcon ? `
                        <div class="${CONFIG.cssClasses.icon}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="${data.icon}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                            </svg>
                        </div>
                    ` : ''}
                    <div class="${CONFIG.cssClasses.content}">
                        ${data.showTitle ? `<h4 class="${CONFIG.cssClasses.title}">${data.title}</h4>` : ''}
                        <div class="${CONFIG.cssClasses.message}">${data.message}</div>
                        ${data.showTimestamp ? `<time class="${CONFIG.cssClasses.timestamp}">${data.timestamp}</time>` : ''}
                        ${data.actions && data.actions.length > 0 ? `
                            <div class="${CONFIG.cssClasses.actions}">
                                ${data.actions.map(action => `
                                    <button class="alert-action ${action.class || ''}" 
                                            data-action="${action.id}">
                                        ${action.text}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    ${data.dismissible ? `
                        <button class="${CONFIG.cssClasses.close}" 
                                aria-label="Fermer l'alerte"
                                title="Fermer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                            </svg>
                        </button>
                    ` : ''}
                    ${data.showProgress ? `
                        <div class="${CONFIG.cssClasses.progress}">
                            <div class="alert-progress-bar"></div>
                        </div>
                    ` : ''}
                </div>
            `
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = {
        alerts: new Map(),
        containers: new Map(),
        queue: [],
        soundEnabled: true,
        stylesInjected: false,
        instanceId: 0
    };

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    // Injection des styles
    function injectStyles() {
        if (state.stylesInjected) return;

        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = '/src/css/shared/ui/alert.css';
        document.head.appendChild(style);

        state.stylesInjected = true;
    }

    // Génération d'ID unique
    function generateId() {
        return `alert-${Date.now()}-${++state.instanceId}`;
    }

    // Récupération ou création du conteneur
    function getOrCreateContainer(position) {
        if (position === 'inline') return null;

        let container = state.containers.get(position);
        if (!container) {
            container = document.createElement('div');
            container.className = `${CONFIG.cssClasses.container} position-${position}`;
            
            // Application des styles de position
            const positionStyles = CONFIG.positions[position];
            Object.assign(container.style, {
                position: 'fixed',
                zIndex: '9999',
                ...positionStyles
            });

            document.body.appendChild(container);
            state.containers.set(position, container);
        }
        return container;
    }

    // Lecture du son
    function playSound(type) {
        if (!state.soundEnabled || !CONFIG.sounds[type]) return;

        try {
            const audio = new Audio(CONFIG.sounds[type]);
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    // Vibration
    function vibrate(pattern = [200]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Animation d'entrée
    function animateIn(element, animation) {
        if (!animation.enabled) {
            element.style.opacity = '1';
            return Promise.resolve();
        }

        return new Promise(resolve => {
            element.style.transition = `all ${animation.duration}ms ${animation.easing}`;
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px) scale(0.95)';

            requestAnimationFrame(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
                
                setTimeout(resolve, animation.duration);
            });
        });
    }

    // Animation de sortie
    function animateOut(element, animation) {
        if (!animation.enabled) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            element.style.transition = `all ${animation.duration}ms ${animation.easing}`;
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px) scale(0.95)';
            
            setTimeout(resolve, animation.duration);
        });
    }

    // Gestion de la barre de progression
    function startProgress(alertElement, duration) {
        const progressBar = alertElement.querySelector('.alert-progress-bar');
        if (!progressBar) return;

        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '0%';
        
        requestAnimationFrame(() => {
            progressBar.style.width = '100%';
        });
    }

    // Gestion du stack
    function manageStack(container, maxStack) {
        const alerts = container.querySelectorAll(`.${CONFIG.cssClasses.alert}`);
        if (alerts.length > maxStack) {
            const toRemove = alerts.length - maxStack;
            for (let i = 0; i < toRemove; i++) {
                const alert = alerts[i];
                const id = alert.dataset.alertId;
                removeAlert(id);
            }
        }
    }

    // Vérification des doublons
    function isDuplicate(message, type) {
        for (const [id, alert] of state.alerts) {
            if (alert.message === message && alert.type === type && !alert.removing) {
                return true;
            }
        }
        return false;
    }

    // Création de l'élément alert
    function createAlertElement(options) {
        const config = {
            ...CONFIG.features,
            ...options,
            id: generateId(),
            timestamp: new Date().toLocaleTimeString(),
            icon: CONFIG.types[options.type]?.icon || CONFIG.types.info.icon,
            title: options.title || CONFIG.types[options.type]?.title || 'Notification'
        };

        const wrapper = document.createElement('div');
        wrapper.className = CONFIG.cssClasses.wrapper;
        wrapper.innerHTML = CONFIG.templates.alert(config);
        
        const alertElement = wrapper.firstElementChild;

        // Gestionnaire de fermeture
        if (config.dismissible) {
            const closeBtn = alertElement.querySelector(`.${CONFIG.cssClasses.close}`);
            closeBtn?.addEventListener('click', () => removeAlert(config.id));
        }

        // Gestionnaires d'actions
        if (config.actions && config.actions.length > 0) {
            config.actions.forEach(action => {
                const btn = alertElement.querySelector(`[data-action="${action.id}"]`);
                btn?.addEventListener('click', () => {
                    if (action.handler) action.handler();
                    if (action.closeOnClick !== false) removeAlert(config.id);
                });
            });
        }

        // Pause sur hover
        if (config.pauseOnHover && config.autoClose) {
            let timeoutId;
            let remainingTime = config.autoCloseDelay;
            let startTime = Date.now();

            const startTimer = () => {
                startTime = Date.now();
                timeoutId = setTimeout(() => removeAlert(config.id), remainingTime);
                if (config.showProgress) {
                    startProgress(alertElement, remainingTime);
                }
            };

            const pauseTimer = () => {
                clearTimeout(timeoutId);
                remainingTime -= Date.now() - startTime;
                const progressBar = alertElement.querySelector('.alert-progress-bar');
                if (progressBar) {
                    const currentWidth = (1 - remainingTime / config.autoCloseDelay) * 100;
                    progressBar.style.transition = 'none';
                    progressBar.style.width = currentWidth + '%';
                }
            };

            alertElement.addEventListener('mouseenter', pauseTimer);
            alertElement.addEventListener('mouseleave', startTimer);
            
            startTimer();
        } else if (config.autoClose) {
            setTimeout(() => removeAlert(config.id), config.autoCloseDelay);
            if (config.showProgress) {
                startProgress(alertElement, config.autoCloseDelay);
            }
        }

        // Navigation clavier
        if (config.keyboard) {
            alertElement.setAttribute('tabindex', '0');
            alertElement.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && config.dismissible) {
                    removeAlert(config.id);
                }
            });
        }

        return { element: alertElement, config };
    }

    // Suppression d'une alerte
    function removeAlert(id) {
        const alertData = state.alerts.get(id);
        if (!alertData || alertData.removing) return;

        alertData.removing = true;
        const { element, animation } = alertData;

        animateOut(element, animation).then(() => {
            element.remove();
            state.alerts.delete(id);
            
            // Nettoyage du conteneur si vide
            const container = element.parentElement;
            if (container && container.children.length === 0) {
                for (const [pos, cont] of state.containers) {
                    if (cont === container) {
                        container.remove();
                        state.containers.delete(pos);
                        break;
                    }
                }
            }
        });
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Création d'une alerte
        create(options = {}) {
            // Injection des styles au premier appel
            injectStyles();

            // Options par défaut
            const defaultOptions = {
                type: 'info',
                style: 'glassmorphism',
                size: 'medium',
                position: 'top-right',
                animation: 'smooth',
                message: '',
                ...CONFIG.features
            };

            const finalOptions = { ...defaultOptions, ...options };

            // Vérification des doublons
            if (finalOptions.preventDuplicates && isDuplicate(finalOptions.message, finalOptions.type)) {
                return null;
            }

            // Animation
            const animation = CONFIG.animations[finalOptions.animation] || CONFIG.animations.smooth;

            // Son et vibration
            if (finalOptions.sound) {
                playSound(finalOptions.type);
            }
            if (finalOptions.vibrate) {
                vibrate();
            }

            // Création de l'élément
            const { element, config } = createAlertElement(finalOptions);

            // Ajout au DOM
            if (finalOptions.position === 'inline' && finalOptions.container) {
                finalOptions.container.appendChild(element);
            } else {
                const container = getOrCreateContainer(finalOptions.position);
                container.appendChild(element);
                
                // Gestion du stack
                if (finalOptions.stackable && finalOptions.maxStack) {
                    manageStack(container, finalOptions.maxStack);
                }
            }

            // Sauvegarde dans l'état
            state.alerts.set(config.id, {
                element,
                config,
                animation,
                removing: false
            });

            // Animation d'entrée
            animateIn(element, animation);

            // Retour de l'API de l'alerte
            return {
                id: config.id,
                element,
                update: (newOptions) => this.update(config.id, newOptions),
                remove: () => removeAlert(config.id)
            };
        },

        // Mise à jour d'une alerte
        update(id, options) {
            const alertData = state.alerts.get(id);
            if (!alertData) return;

            const { element, config } = alertData;
            
            // Mise à jour du message
            if (options.message !== undefined) {
                const messageEl = element.querySelector(`.${CONFIG.cssClasses.message}`);
                if (messageEl) messageEl.textContent = options.message;
            }

            // Mise à jour du titre
            if (options.title !== undefined) {
                const titleEl = element.querySelector(`.${CONFIG.cssClasses.title}`);
                if (titleEl) titleEl.textContent = options.title;
            }

            // Mise à jour du type
            if (options.type && options.type !== config.type) {
                element.classList.remove(config.type);
                element.classList.add(options.type);
                
                // Mise à jour de l'icône
                const iconPath = element.querySelector(`svg path`);
                if (iconPath) {
                    iconPath.setAttribute('d', CONFIG.types[options.type].icon);
                }
            }

            // Mise à jour de la config
            Object.assign(config, options);
        },

        // Suppression d'une alerte
        remove(id) {
            removeAlert(id);
        },

        // Suppression de toutes les alertes
        removeAll() {
            for (const id of state.alerts.keys()) {
                removeAlert(id);
            }
        },

        // Méthodes utilitaires rapides
        info(message, options = {}) {
            return this.create({ ...options, message, type: 'info' });
        },

        success(message, options = {}) {
            return this.create({ ...options, message, type: 'success' });
        },

        warning(message, options = {}) {
            return this.create({ ...options, message, type: 'warning' });
        },

        error(message, options = {}) {
            return this.create({ ...options, message, type: 'error' });
        },

        // Configuration
        setDefaults(defaults) {
            Object.assign(CONFIG.features, defaults);
        },

        enableSound(enabled = true) {
            state.soundEnabled = enabled;
        },

        // Accès à la configuration
        getConfig() {
            return { ...CONFIG };
        },

        // Injection manuelle des styles
        injectStyles
    };
})();

// Export pour utilisation
export default AlertComponent;

// Support CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertComponent;
}

// Support global
if (typeof window !== 'undefined') {
    window.AlertComponent = AlertComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-XX] - Structure modulaire
   Solution: Pattern module avec toutes les options
   
   [2024-01-XX] - Gestion des animations
   Cause: Timing des transitions CSS
   Résolution: Promises pour synchroniser
   
   [2024-01-XX] - Stack et doublons
   Cause: Gestion simultanée multiple
   Résolution: Map pour tracking + queue
   
   NOTES POUR REPRISES FUTURES:
   - Les conteneurs sont créés à la demande
   - Les animations utilisent requestAnimationFrame
   - Le son est optionnel avec fallback silencieux
   - La position inline nécessite un container
   ======================================== */
// ========================================
// GMAIL.DATA.JS - Données mockées pour test
// Chemin: modules/gmail/gmail.data.js
//
// DESCRIPTION:
// Données de test pour le développement de l'interface
// Sera remplacé par les vraies données Gmail plus tard
//
// DÉPENDANCES:
// - Aucune
// ========================================

// ========================================
// DONNÉES MOCKÉES
// ========================================

export const MOCK_EMAILS = [
    {
        id: 'email_001',
        threadId: 'thread_001',
        from: 'marie.dubois@entreprise.fr',
        fromName: 'Marie Dubois',
        to: ['moi@entreprise.fr'],
        subject: 'Réunion projet PWA - Urgent',
        preview: 'Bonjour, je voulais faire un point sur l\'avancement du projet. J\'ai quelques suggestions concernant l\'interface utilisateur et l\'intégration de l\'API Gmail. Pourrions-nous organiser une réunion cette semaine ?',
        body: `Bonjour,

Je voulais faire un point sur l'avancement du projet PWA. J'ai quelques suggestions concernant l'interface utilisateur et l'intégration de l'API Gmail.

Points à discuter :
- Architecture de synchronisation
- Gestion du cache local
- Interface utilisateur responsive
- Sécurité et authentification

Pourrions-nous organiser une réunion cette semaine ?

Cordialement,
Marie Dubois`,
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2 heures
        unread: true,
        starred: true,
        labels: [
            { name: 'Important', type: 'important' },
            { name: 'Projet', type: 'work' }
        ],
        attachments: 2,
        folder: 'inbox'
    },
    {
        id: 'email_002',
        threadId: 'thread_002',
        from: 'notifications@github.com',
        fromName: 'GitHub',
        to: ['moi@entreprise.fr'],
        subject: 'Nouvelle pull request sur votre repository',
        preview: 'Une nouvelle pull request a été créée par alex-dev sur le repository gmail-integration. Les modifications concernent l\'amélioration des performances du système de cache.',
        body: `Une nouvelle pull request a été créée sur votre repository.

Repository: gmail-integration
Auteur: alex-dev
Titre: Amélioration des performances du cache

Description:
- Optimisation de l'IndexedDB
- Mise en place d'un système de purge automatique
- Amélioration de la gestion mémoire

Voir la pull request: https://github.com/...`,
        date: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5 heures
        unread: true,
        starred: false,
        labels: [
            { name: 'Dev', type: 'work' },
            { name: 'Pull Request' }
        ],
        attachments: 0,
        folder: 'inbox'
    },
    {
        id: 'email_003',
        threadId: 'thread_003',
        from: 'newsletter@techweekly.com',
        fromName: 'Newsletter Tech',
        to: ['moi@entreprise.fr'],
        subject: 'Les dernières tendances en développement web',
        preview: 'Cette semaine : React 19 est enfin là ! Découvrez les nouvelles fonctionnalités, les APIs web innovantes et les meilleures pratiques pour 2025.',
        body: `Newsletter Tech Weekly - Édition #245

SOMMAIRE:
1. React 19 : Les nouveautés
2. APIs Web modernes
3. Tendances PWA 2025
4. Sécurité et authentification

[Contenu détaillé...]`,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
        unread: false,
        starred: false,
        labels: [
            { name: 'Newsletter' },
            { name: 'Tech' }
        ],
        attachments: 0,
        folder: 'inbox'
    },
    {
        id: 'email_004',
        threadId: 'thread_004',
        from: 'client@important.com',
        fromName: 'Client Important',
        to: ['moi@entreprise.fr'],
        subject: 'Feedback sur la maquette',
        preview: 'J\'ai regardé la dernière version et j\'ai quelques suggestions. L\'effet de profondeur sur les cartes est vraiment réussi !',
        body: `Bonjour,

J'ai examiné la dernière version de la maquette et je suis très impressionné par le travail réalisé.

Points positifs :
- L'effet de profondeur sur les cartes
- L'interface glassmorphism
- La fluidité des animations

Suggestions d'amélioration :
- Ajouter plus de contrastes sur les boutons
- Améliorer la visibilité des badges
- Optimiser pour mobile

Cordialement,
Client Important`,
        date: new Date(Date.now() - 48 * 60 * 60 * 1000), // Il y a 2 jours
        unread: false,
        starred: true,
        labels: [
            { name: 'Client' },
            { name: 'Important', type: 'important' }
        ],
        attachments: 3,
        folder: 'inbox'
    },
    {
        id: 'email_005',
        threadId: 'thread_005',
        from: 'support@service.com',
        fromName: 'Support Technique',
        to: ['moi@entreprise.fr'],
        subject: 'Ticket #1234 résolu',
        preview: 'Votre ticket concernant l\'intégration OAuth2 a été résolu. La documentation a été mise à jour.',
        body: `Ticket #1234 - RÉSOLU

Votre demande concernant l'intégration OAuth2 avec Gmail a été traitée.

Solution apportée :
- Configuration des scopes Gmail API
- Mise à jour de la documentation
- Exemple de code fourni

Cordialement,
L'équipe support`,
        date: new Date(Date.now() - 72 * 60 * 60 * 1000), // Il y a 3 jours
        unread: false,
        starred: false,
        labels: [
            { name: 'Support' },
            { name: 'Résolu' }
        ],
        attachments: 1,
        folder: 'inbox'
    }
];

// ========================================
// DONNÉES DES CHATS
// ========================================

export const MOCK_CHATS = [
    {
        id: 1,
        name: 'Marie Dubois',
        initials: 'MD',
        preview: 'Super ! On se voit demain alors 👍',
        online: true,
        unread: 2
    },
    {
        id: 2,
        name: 'Jean Martin',
        initials: 'JM',
        preview: 'J\'ai fini la review du code',
        online: true,
        unread: 0
    },
    {
        id: 3,
        name: 'Sophie Laurent',
        initials: 'SL',
        preview: 'Merci pour ton aide !',
        online: false,
        unread: 0
    },
    {
        id: 4,
        name: 'Alexandre Blanc',
        initials: 'AB',
        preview: 'Tu as regardé le nouveau design ?',
        online: true,
        unread: 5
    },
    {
        id: 5,
        name: 'Équipe Growth',
        initials: 'EG',
        preview: 'Paul: Les métriques sont en hausse ! 📈',
        online: false,
        unread: 12
    }
];

// ========================================
// STATISTIQUES
// ========================================

export function getEmailStats(emails) {
    return {
        total: emails.length,
        unread: emails.filter(e => e.unread).length,
        starred: emails.filter(e => e.starred).length,
        withAttachments: emails.filter(e => e.attachments > 0).length
    };
}

// ========================================
// FILTRES
// ========================================

export function filterEmailsByFolder(emails, folder) {
    if (folder === 'starred') {
        return emails.filter(e => e.starred);
    }
    return emails.filter(e => e.folder === folder);
}

export function searchEmails(emails, query) {
    const lowerQuery = query.toLowerCase();
    return emails.filter(e => 
        e.subject.toLowerCase().includes(lowerQuery) ||
        e.preview.toLowerCase().includes(lowerQuery) ||
        e.fromName.toLowerCase().includes(lowerQuery) ||
        e.from.toLowerCase().includes(lowerQuery)
    );
}
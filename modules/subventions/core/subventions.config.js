// ========================================
// SUBVENTIONS.CONFIG.JS - Configuration UI locale
// Chemin: modules/subventions/subventions.config.js
//
// DESCRIPTION:
// Configuration locale du module subventions
// Définit les factories et paramètres UI
// ========================================

import { 
    Button, 
    Modal, 
    DataTable, 
    SearchDropdown,
    Badge,
    Card,
    Toast,
    Dialog,
    ProgressTimeline,
    ProgressOverview,
    DelayTracker,
    SignatureModal
} from '../../../src/components/index.js';

export const subventionsConfig = {
    // ========================================
    // FACTORIES DE COMPOSANTS
    // ========================================
    
    factories: {
        // Composants génériques
        Button: (config) => new Button({
            variant: 'primary',
            size: 'md',
            ...config
        }),
        
        Modal: (config) => new Modal({
            size: 'lg',
            closeOnOverlay: false,
            ...config
        }),
        
        DataTable: (config) => new DataTable({
            striped: true,
            hover: true,
            sortable: true,
            ...config
        }),
        
        SearchDropdown: (config) => new SearchDropdown({
            placeholder: 'Rechercher un patient...',
            searchFields: ['nom', 'prenom', 'telephone'],
            displayFormat: (item) => `${item.nom} ${item.prenom}`,
            ...config
        }),
        
        Badge: (config) => new Badge({
            variant: 'info',
            ...config
        }),
        
        Card: (config) => new Card({
            shadow: true,
            padding: 'md',
            ...config
        }),
        
        Toast: (config) => new Toast({
            position: 'top-right',
            duration: 5000,
            ...config
        }),
        
        Dialog: (config) => new Dialog({
            type: 'confirm',
            ...config
        }),
        
        // Composants spécifiques subventions
        ProgressTimeline: (config) => new ProgressTimeline({
            title: 'PROGRESSION GLOBALE',
            animated: true,
            showDates: true,
            ...config
        }),
        
        ProgressOverview: (config) => new ProgressOverview({
            title: 'VUE D\'ENSEMBLE DU PARCOURS',
            showStatus: true,
            showPercentage: true,
            ...config
        }),
        
        DelayTracker: (config) => new DelayTracker({
            showAlert: true,
            animated: true,
            warningDays: 60,
            criticalDays: 75,
            ...config
        }),
        
        SignatureModal: (config) => new SignatureModal({
            buttonFactory: Button,
            requireSignature: true,
            showTimestamp: true,
            ...config
        })
    },
    
    // ========================================
    // CONFIGURATION UI
    // ========================================
    
    ui: {
        // Couleurs du module
        colors: {
            mdph: '#3b82f6',      // Bleu
            agefiph: '#f97316',   // Orange
            success: '#10b981',   // Vert
            warning: '#f59e0b',   // Jaune
            danger: '#ef4444',    // Rouge
            info: '#6b7280'       // Gris
        },
        
        // Icônes des statuts
        statusIcons: {
            nouveau: '📝',
            documents: '📄',
            formulaire: '✍️',
            depot: '📮',
            recepisse: '📋',
            accord: '✅',
            refus: '❌',
            attente: '⏸️',
            finalisation: '📋',
            soumis: '📮',
            decision: '✅'
        },
        
        // Configuration des tableaux
        table: {
            itemsPerPage: 20,
            paginationOptions: [10, 20, 50, 100],
            defaultSort: { field: 'dates.modification', order: 'desc' }
        },
        
        // Configuration des notifications
        notifications: {
            position: 'top-right',
            duration: 5000,
            showProgress: true
        }
    },
    
    // ========================================
    // PARAMÈTRES MÉTIER
    // ========================================
    
    business: {
        // Montant standard appareil
        montantAppareilDefaut: 35000, // en centimes
        
        // Durées de validité (en jours)
        validite: {
            attestationEmployeur: 30,
            justificatifDomicile: 90,
            kbis: 90,
            certificatMedical: 365
        },
        
        // Délais d'alerte (en jours)
        alertes: {
            documentsManquants: 7,
            relanceDocuments: 14,
            abandonDossier: 21,
            attestationAvantExpiration: 5,
            recepisseMDPHAvant: 15
        },
        
        // Formats de fichiers acceptés
        formats: {
            documents: ['.pdf', '.jpg', '.jpeg', '.png'],
            maxSize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 5 // par type de document
        }
    },
    
    // ========================================
    // TEMPLATES ET MESSAGES
    // ========================================
    
    templates: {
        // Messages d'alerte
        alertMessages: {
            attestationExpire: (jours) => `Attestation employeur expire dans ${jours} jour${jours > 1 ? 's' : ''}`,
            recepisseRecu: 'Récépissé reçu → Demander attestation employeur MAINTENANT',
            documentsManquants: (count) => `${count} document${count > 1 ? 's' : ''} manquant${count > 1 ? 's' : ''}`,
            relanceMDPH: (jours) => `Relance MDPH recommandée (J+${jours})`,
            retardCritique: (jours) => `RETARD CRITIQUE : ${jours} jours de retard`
        },
        
        // Messages de confirmation
        confirmMessages: {
            deleteDocument: 'Êtes-vous sûr de vouloir supprimer ce document ?',
            cancelDossier: 'Êtes-vous sûr de vouloir annuler ce dossier ?',
            validateDocument: 'Confirmer la validation de ce document ?'
        },
        
        // Messages de succès
        successMessages: {
            dossierCree: 'Dossier créé avec succès',
            documentAjoute: 'Document ajouté avec succès',
            dossierMisAJour: 'Dossier mis à jour',
            emailEnvoye: 'Email envoyé au patient'
        },
        
        // Messages d'erreur
        errorMessages: {
            documentManquant: 'Veuillez ajouter tous les documents requis',
            formatInvalide: 'Format de fichier non supporté',
            tailleExcedee: 'La taille du fichier dépasse la limite autorisée',
            erreurServeur: 'Une erreur est survenue, veuillez réessayer'
        }
    },
    
    // ========================================
    // CONFIGURATION DES FORMULAIRES
    // ========================================
    
    forms: {
        // Validation des champs
        validation: {
            telephone: /^0[1-9]\d{8}$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            codePostal: /^\d{5}$/,
            numeroSecu: /^[12]\d{2}(0[1-9]|1[0-2])\d{2}\d{3}\d{3}\d{2}$/
        },
        
        // Options des selects
        options: {
            typeContrat: [
                { value: 'cdi', label: 'CDI' },
                { value: 'cdd', label: 'CDD' },
                { value: 'interim', label: 'Intérim' },
                { value: 'alternance', label: 'Alternance' }
            ],
            
            situation: [
                { value: 'salarie', label: 'Salarié' },
                { value: 'independant', label: 'Indépendant' },
                { value: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
                { value: 'retraite', label: 'Retraité' }
            ]
        }
    },
    
    // ========================================
    // EXPORTS ET IMPRESSION
    // ========================================
    
    export: {
        // Formats d'export disponibles
        formats: ['xlsx', 'csv', 'pdf'],
        
        // Colonnes à exporter
        columns: [
            'numeroDossier',
            'patient.nom',
            'patient.prenom',
            'workflow.mdph.statut',
            'workflow.agefiph.statut',
            'montants.appareil',
            'dates.creation'
        ]
    },
    
    // ========================================
    // HELPERS
    // ========================================
    
    helpers: {
        // Formater un montant
        formatMontant: (centimes) => {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(centimes / 100);
        },
        
        // Formater une date
        formatDate: (date) => {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('fr-FR');
        },
        
        // Calculer le pourcentage global
        calculateGlobalProgress: (mdph, agefiph) => {
            return Math.round((mdph.progression + agefiph.progression) / 2);
        },
        
        // Générer un code d'accès
        generateAccessCode: (nom, annee) => {
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `${nom.toUpperCase()}-${annee}-${random}`;
        }
    }
};

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsConfig;
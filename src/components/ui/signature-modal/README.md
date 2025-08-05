// Import
import { SignatureModal } from '/src/components/ui/signature-modal/signature-modal.component.js';

// Création
const signatureModal = new SignatureModal({
    title: 'Signature du formulaire MDPH',
    subtitle: 'En signant, vous certifiez l\'exactitude des informations',
    onSign: (signature) => {
        console.log('Signature capturée:', signature);
        // signature.data = image en base64
        // signature.timestamp = date/heure
        // signature.context = contexte passé à open()
        
        // Sauvegarder en base
        saveSignature(signature);
    },
    onCancel: () => {
        console.log('Signature annulée');
    }
});

// Ouverture avec contexte
signatureModal.open({
    documentType: 'formulaire_mdph',
    patientId: '123'
});
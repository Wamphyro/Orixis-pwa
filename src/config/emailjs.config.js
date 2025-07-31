// Configuration EmailJS
export const EMAILJS_CONFIG = {
    serviceId: 'service_6juwjvq',
    templateId: 'template_51rhrbr',
    publicKey: 'wJtv5MrJPzvMuGSyL'
};

// Initialisation EmailJS
export function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init(EMAILJS_CONFIG.publicKey);
            console.log("EmailJS initialisé avec succès");
            return true;
        } catch (error) {
            console.error("Erreur initialisation EmailJS:", error);
            return false;
        }
    } else {
        console.error("EmailJS n'est pas chargé");
        return false;
    }
}
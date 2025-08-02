const {onRequest} = require("firebase-functions/v2/https");
const cors = require("cors")({origin: true});

exports.analyzeDecompte = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 300,
    memory: "1GiB"
  },
  (request, response) => {
    cors(request, response, async () => {
      try {
        if (request.method !== "POST") {
          return response.status(405).json({ error: "Method not allowed" });
        }

        const { images } = request.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
          return response.status(400).json({ error: "Images requises" });
        }

        const mockData = {
          client: {
            nom: "TEST",
            prenom: "Demo",
            numeroSecuriteSociale: "1234567890123"
          },
          mutuelle: "Mutuelle Test",
          montantRemboursementClient: 100.50,
          montantVirement: 100.50
        };

        return response.status(200).json({
          success: true,
          data: mockData,
          message: "Fonction déployée avec succès!"
        });

      } catch (error) {
        console.error("Erreur:", error);
        return response.status(500).json({ 
          error: "Erreur serveur",
          message: error.message 
        });
      }
    });
  }
);
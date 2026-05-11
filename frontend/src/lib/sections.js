// AFRIBOX — configuration des sections qui pilotent les portails de casiers
// cinématiques. Chaque entrée correspond à un casier sur le mur (col, row)
// et définit le contenu révélé lorsque le casier s'ouvre.

export const SECTIONS = [
  {
    id: "how-it-works",
    code: "FN-01",
    label: "Fonctionnement",
    eyebrow: "Opération 01",
    locker: { col: 1, row: 0 },
    title: "Trois mouvements. Zéro friction.",
    body:
      "Un colis arrive au nœud AFRIBOX le plus proche. Le casier authentifie le coursier, ouvre le bon compartiment et notifie le destinataire — en moins de neuf secondes.",
    bullets: [
      { k: "01", t: "Déposer", d: "Le coursier scanne, le compartiment intelligent est sélectionné automatiquement." },
      { k: "02", t: "Notifier", d: "Le destinataire reçoit un code à usage unique par app ou SMS." },
      { k: "03", t: "Récupérer", d: "Un tap, le casier s'ouvre, les capteurs confirment le retrait." },
    ],
  },
  {
    id: "mobile-app",
    code: "AM-02",
    label: "Application Mobile",
    eyebrow: "Interface 02",
    locker: { col: 3, row: 0 },
    title: "Une app qui s'efface quand vous n'en avez pas besoin.",
    body:
      "Suivez chaque colis, partagez l'accès avec votre famille et déverrouillez n'importe quel compartiment d'un regard. Pensée pour l'usage à une main, optimisée pour les environnements à faible débit.",
    bullets: [
      { k: "•", t: "Suivi en direct", d: "Statut en temps réel des colis en transit et stockés." },
      { k: "•", t: "Accès partagé", d: "Déléguez le retrait à la famille ou à des coursiers de confiance." },
      { k: "•", t: "Codes hors-ligne", d: "Les codes générés fonctionnent sans connexion data." },
    ],
  },
  {
    id: "security",
    code: "SC-03",
    label: "Sécurité",
    eyebrow: "Confiance 03",
    locker: { col: 0, row: 1 },
    title: "Conçu pour n'être ouvert que par la bonne main.",
    body:
      "Chaque compartiment est protégé par des capteurs anti-effraction, des transferts chiffrés et des clés rotatives à usage unique. La sécurité n'est pas une fonctionnalité — c'est la structure.",
    bullets: [
      { k: "AES-256", t: "Chiffrement de bout en bout", d: "Du dépôt par le coursier au retrait par le destinataire." },
      { k: "ISO-27001", t: "Infrastructure auditée", d: "Journaux d'altération matérielle, mises à jour firmware signées." },
      { k: "MFA", t: "Déverrouillage multi-facteurs", d: "Biométrie + code à usage unique pour les colis sensibles." },
    ],
  },
  {
    id: "smart-city",
    code: "SCI-04",
    label: "Intégration Smart City",
    eyebrow: "Réseau 04",
    locker: { col: 4, row: 1 },
    title: "Une infrastructure qui dialogue avec la ville.",
    body:
      "Les nœuds AFRIBOX se connectent aux données de trafic municipal, aux horaires de transport et aux réseaux d'énergie. Les casiers acheminent les colis sur le couloir de livraison le plus efficace en temps réel.",
    bullets: [
      { k: "API", t: "Flux de données ouverts", d: "Transports publics, trafic, qualité de l'air, micro-mobilité." },
      { k: "RÉSEAU", t: "Conscient de l'énergie", d: "Panneaux solaires + délestage intelligent aux heures de pointe." },
      { k: "OPS", t: "Console opérateur", d: "Carte de capacité en direct pour les équipes logistiques." },
    ],
  },
  {
    id: "features",
    code: "FT-05",
    label: "Fonctionnalités",
    eyebrow: "Capacité 05",
    locker: { col: 2, row: 2 },
    title: "Matériel industriel. Expérience cinématique.",
    body:
      "Compartiments réfrigérés, colis volumineux, retours, paiement sans contact — chaque flux est intégré au châssis. Conçu pour le climat africain, optimisé pour la logistique mondiale.",
    bullets: [
      { k: "Froid", t: "Compartiments réfrigérés", d: "Pharmacie, produits frais et échantillons de laboratoire." },
      { k: "XL", t: "Colis volumineux", d: "Compartiments jusqu'à 800L pour les dépôts en vrac." },
      { k: "Pay", t: "Paiement sans contact", d: "Cartes, mobile money, paiement biométrique." },
    ],
  },
  {
    id: "contact",
    code: "CT-06",
    label: "Contact",
    eyebrow: "Connexion 06",
    locker: { col: 2, row: 3 },
    title: "Implantez AFRIBOX dans votre ville.",
    body:
      "Opérateurs, municipalités et partenaires logistiques — ouvrez le canal. Nous nous déployons ville par ville.",
    bullets: [],
  },
];

export const SECTION_COUNT = SECTIONS.length;

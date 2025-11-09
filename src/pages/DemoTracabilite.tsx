import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import { Shield, Anchor, Fish, ArrowLeft, Download } from "lucide-react";

const DemoTracabilite = () => {
  const [species, setSpecies] = useState("Bar de ligne");
  const [scientificName, setScientificName] = useState("Dicentrarchus labrax");
  const [weight, setWeight] = useState("2.5");
  const [size, setSize] = useState("45");
  const [minSize, setMinSize] = useState("42");
  const [faoZone, setFaoZone] = useState("27.VIIIa");
  const [boatName, setBoatName] = useState("L'Océane");
  const [boatImmat, setBoatImmat] = useState("LR 123456");
  const [fisherName, setFisherName] = useState("Jean Dupont");
  const [port, setPort] = useState("La Rochelle");
  const [fishingMethod, setFishingMethod] = useState("Ligne");
  
  const currentDate = new Date().toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  const currentTime = new Date().toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const lotNumber = `${currentDate.replace(/\//g, '')}-${boatImmat.replace(/\s/g, '')}`;

  const handleDownload = () => {
    // Simulate PDF download
    alert("En production, ceci téléchargerait un PDF de l'étiquette réglementaire");
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto mb-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Démonstration interactive</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Traçabilité automatique
            <span className="block text-primary mt-2">100% réglementaire</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Modifiez les informations ci-dessous et voyez l'étiquette se générer automatiquement. 
            Conforme aux exigences FAO, sanitaires et de traçabilité.
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Left: Input Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                Informations de vente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="species">Espèce</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bar de ligne">Bar de ligne</SelectItem>
                    <SelectItem value="Sole commune">Sole commune</SelectItem>
                    <SelectItem value="Daurade royale">Daurade royale</SelectItem>
                    <SelectItem value="Saint-Pierre">Saint-Pierre</SelectItem>
                    <SelectItem value="Turbot">Turbot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientificName">Nom scientifique</Label>
                <Input
                  id="scientificName"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Taille (cm)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minSize">Taille min. réglementaire (cm)</Label>
                  <Input
                    id="minSize"
                    type="number"
                    value={minSize}
                    onChange={(e) => setMinSize(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faoZone">Zone FAO</Label>
                  <Input
                    id="faoZone"
                    value={faoZone}
                    onChange={(e) => setFaoZone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fishingMethod">Méthode de pêche</Label>
                <Select value={fishingMethod} onValueChange={setFishingMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ligne">Ligne</SelectItem>
                    <SelectItem value="Casier">Casier</SelectItem>
                    <SelectItem value="Filet">Filet</SelectItem>
                    <SelectItem value="Chalut">Chalut</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-primary" />
                  Informations du navire
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="boatName">Nom du bateau</Label>
                    <Input
                      id="boatName"
                      value={boatName}
                      onChange={(e) => setBoatName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boatImmat">Immatriculation</Label>
                    <Input
                      id="boatImmat"
                      value={boatImmat}
                      onChange={(e) => setBoatImmat(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fisherName">Nom du pêcheur</Label>
                    <Input
                      id="fisherName"
                      value={fisherName}
                      onChange={(e) => setFisherName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port de débarquement</Label>
                    <Input
                      id="port"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Generated Label Preview */}
          <div className="space-y-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  Étiquette de traçabilité générée
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Main Info */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-foreground">{species}</h3>
                  <p className="text-sm italic text-muted-foreground">{scientificName}</p>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-xs text-muted-foreground">Poids net</p>
                    <p className="text-lg font-semibold text-foreground">{weight} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taille</p>
                    <p className="text-lg font-semibold text-foreground">{size} cm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taille min. réglementaire</p>
                    <p className="text-sm font-medium text-muted-foreground">{minSize} cm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Zone FAO</p>
                    <p className="text-sm font-medium text-muted-foreground">{faoZone}</p>
                  </div>
                </div>

                {/* Size Compliance */}
                <div className={`p-3 rounded-lg ${Number(size) >= Number(minSize) ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className={`text-sm font-medium ${Number(size) >= Number(minSize) ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {Number(size) >= Number(minSize) 
                      ? '✓ Conforme - Taille réglementaire respectée'
                      : '✗ Non conforme - Taille insuffisante'}
                  </p>
                </div>

                {/* Traceability Info */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Numéro de lot</p>
                      <p className="text-sm font-mono font-medium text-foreground">{lotNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Anchor className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Navire</p>
                      <p className="text-sm font-medium text-foreground">{boatName} - {boatImmat}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Fish className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pêcheur</p>
                      <p className="text-sm font-medium text-foreground">{fisherName}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t text-xs">
                  <div>
                    <p className="text-muted-foreground">Méthode de pêche</p>
                    <p className="font-medium text-foreground">{fishingMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Port</p>
                    <p className="font-medium text-foreground">{port}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date de débarquement</p>
                    <p className="font-medium text-foreground">{currentDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Heure</p>
                    <p className="font-medium text-foreground">{currentTime}</p>
                  </div>
                </div>

                {/* Footer Legal */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Conforme aux règlements CE 1379/2013 et CE 1169/2011 relatifs à l'information 
                    des consommateurs sur les produits de la pêche. Produit frais à conserver entre 0°C et +4°C.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Download Button */}
            <Button 
              onClick={handleDownload} 
              className="w-full gap-2 bg-gradient-ocean hover:opacity-90"
              size="lg"
            >
              <Download className="h-5 w-5" />
              Télécharger l'étiquette (PDF)
            </Button>

            {/* Benefits */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Avantages de la traçabilité automatique
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Génération automatique conforme aux normes FAO et CE</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Vérification automatique des tailles minimales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Numéro de lot unique pour traçabilité totale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Gain de temps : 30 secondes vs 5 minutes manuellement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Zéro erreur, protection juridique complète</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-12 text-center space-y-6 p-8 rounded-lg bg-gradient-ocean/10 border border-primary/20">
          <h2 className="text-3xl font-bold text-foreground">
            Intéressé par QuaiDirect ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Rejoignez plus de 150 pêcheurs qui ont simplifié leur gestion administrative 
            et augmenté leurs ventes directes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pecheur/onboarding">
              <Button size="lg" className="gap-2 bg-gradient-ocean hover:opacity-90">
                <Anchor className="h-5 w-5" />
                Devenir pêcheur partenaire
              </Button>
            </Link>
            <Link to="/carte">
              <Button size="lg" variant="outline" className="gap-2">
                Voir les arrivages
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoTracabilite;
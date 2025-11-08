import { useState } from "react";
import Header from "@/components/Header";
import DropCard from "@/components/DropCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, MapPin } from "lucide-react";

// Mock data
const mockDrops = [
  {
    id: "1",
    species: "Bar de ligne",
    scientificName: "Dicentrarchus labrax",
    port: "Port-en-Bessin",
    eta: new Date(Date.now() + 2 * 60 * 60 * 1000),
    pricePerPiece: 12.50,
    quantity: 25,
    isPremium: true,
    fisherman: {
      name: "Jean Leblanc",
      boat: "L'Espérance"
    }
  },
  {
    id: "2",
    species: "Sole",
    scientificName: "Solea solea",
    port: "Grandcamp-Maisy",
    eta: new Date(Date.now() + 4 * 60 * 60 * 1000),
    pricePerPiece: 18.00,
    quantity: 15,
    isPremium: false,
    fisherman: {
      name: "Pierre Martin",
      boat: "Vent de mer"
    }
  },
  {
    id: "3",
    species: "Lieu jaune",
    scientificName: "Pollachius pollachius",
    port: "Port-en-Bessin",
    eta: new Date(Date.now() + 1 * 60 * 60 * 1000),
    pricePerPiece: 8.50,
    quantity: 40,
    isPremium: true,
    fisherman: {
      name: "Jacques Durand",
      boat: "La Mouette"
    }
  },
  {
    id: "4",
    species: "Saint-Pierre",
    scientificName: "Zeus faber",
    port: "Courseulles-sur-Mer",
    eta: new Date(Date.now() + 3 * 60 * 60 * 1000),
    pricePerPiece: 15.00,
    quantity: 12,
    isPremium: false,
    fisherman: {
      name: "Michel Rousseau",
      boat: "Le Corsaire"
    }
  },
  {
    id: "5",
    species: "Turbot",
    scientificName: "Scophthalmus maximus",
    port: "Grandcamp-Maisy",
    eta: new Date(Date.now() + 5 * 60 * 60 * 1000),
    pricePerPiece: 25.00,
    quantity: 8,
    isPremium: true,
    fisherman: {
      name: "François Dubois",
      boat: "L'Horizon"
    }
  }
];

const ports = ["Port-en-Bessin", "Grandcamp-Maisy", "Courseulles-sur-Mer"];

const Carte = () => {
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDrops = mockDrops.filter(drop => {
    const matchesPort = !selectedPort || drop.port === selectedPort;
    const matchesSearch = !searchQuery || 
      drop.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drop.port.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPort && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Arrivages du jour
            </h1>
            <p className="text-lg text-muted-foreground">
              {filteredDrops.length} arrivages disponibles
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une espèce ou un port..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>

          {/* Port filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedPort === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedPort(null)}
            >
              Tous les ports
            </Badge>
            {ports.map(port => (
              <Badge
                key={port}
                variant={selectedPort === port ? "default" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => setSelectedPort(port)}
              >
                <MapPin className="h-3 w-3" />
                {port}
              </Badge>
            ))}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mb-8 aspect-video md:aspect-[21/9] rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <p className="text-muted-foreground">Carte interactive MapLibre</p>
            <p className="text-sm text-muted-foreground/70">À venir dans la prochaine version</p>
          </div>
        </div>

        {/* Drops grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrops.map(drop => (
            <DropCard key={drop.id} {...drop} />
          ))}
        </div>

        {filteredDrops.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              Aucun arrivage ne correspond à votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carte;

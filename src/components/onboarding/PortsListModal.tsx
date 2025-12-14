import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Search, MapPin, Loader2, ExternalLink } from 'lucide-react';
import type { FishingBasin } from '@/lib/ports';

interface Port {
  id: string;
  name: string;
  city: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
}

interface PortsListModalProps {
  basin: FishingBasin;
}

// Map departments to basins for filtering
const basinDepartments: Record<FishingBasin, string[]> = {
  MEDITERRANEE: ['06', '11', '13', '30', '34', '66', '83', '2A', '2B'],
  MANCHE: ['14', '22', '29', '35', '50', '56', '76'],
  ATLANTIQUE: ['17', '29', '33', '40', '44', '56', '64'],
};

const basinLabels: Record<FishingBasin, string> = {
  MEDITERRANEE: 'Méditerranée',
  MANCHE: 'Manche',
  ATLANTIQUE: 'Atlantique',
};

export const PortsListModal = ({ basin }: PortsListModalProps) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: ports = [], isLoading } = useQuery({
    queryKey: ['ports', basin],
    queryFn: async () => {
      // Get departments for this basin
      const departments = basinDepartments[basin] || [];
      
      // If no specific departments, get all ports
      if (departments.length === 0) {
        const { data, error } = await supabase
          .from('ports')
          .select('id, name, city, postal_code, latitude, longitude')
          .order('name');
        
        if (error) throw error;
        return data as Port[];
      }

      // Filter ports by postal code department
      const { data, error } = await supabase
        .from('ports')
        .select('id, name, city, postal_code, latitude, longitude')
        .order('name');
      
      if (error) throw error;
      
      // Filter by department prefix
      return (data as Port[]).filter(port => {
        if (!port.postal_code) return true; // Include ports without postal code
        const dept = port.postal_code.substring(0, 2);
        return departments.includes(dept);
      });
    },
    enabled: isOpen,
  });

  const filteredPorts = useMemo(() => {
    if (!search.trim()) return ports;
    const searchLower = search.toLowerCase();
    return ports.filter(
      port =>
        port.name.toLowerCase().includes(searchLower) ||
        port.city.toLowerCase().includes(searchLower) ||
        (port.postal_code && port.postal_code.includes(search))
    );
  }, [ports, search]);

  const handleDownloadCSV = () => {
    const headers = ['Nom', 'Ville', 'Code Postal', 'Latitude', 'Longitude'];
    const csvContent = [
      headers.join(';'),
      ...ports.map(port =>
        [port.name, port.city, port.postal_code || '', port.latitude, port.longitude].join(';')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ports-${basin.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-primary underline text-sm p-0 h-auto">
          <ExternalLink className="h-3 w-3 mr-1" />
          Voir la liste des ports ({basinLabels[basin]})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Ports disponibles - {basinLabels[basin]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un port, une ville..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleDownloadCSV} title="Télécharger en CSV">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Chargement des ports...</span>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              {filteredPorts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun port trouvé pour cette recherche.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    {filteredPorts.length} port{filteredPorts.length > 1 ? 's' : ''} trouvé
                    {filteredPorts.length > 1 ? 's' : ''}
                  </p>
                  {filteredPorts.map(port => (
                    <div
                      key={port.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{port.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {port.city}
                          {port.postal_code && ` (${port.postal_code})`}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {port.latitude.toFixed(4)}, {port.longitude.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

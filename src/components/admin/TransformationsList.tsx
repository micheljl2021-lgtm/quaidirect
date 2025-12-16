import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CHANGELOG, 
  TransformationPriority, 
  generateContentFromSelection 
} from "@/config/changelog";
import { FileText, Filter } from "lucide-react";

interface TransformationsListProps {
  onGenerateEmail: (content: string, title: string) => void;
}

const priorityConfig: Record<TransformationPriority, { label: string; color: string; bgColor: string }> = {
  major: { label: "Majeur", color: "text-red-700", bgColor: "bg-red-100 hover:bg-red-200 border-red-300" },
  useful: { label: "Utile", color: "text-green-700", bgColor: "bg-green-100 hover:bg-green-200 border-green-300" },
  minor: { label: "Mineur", color: "text-orange-700", bgColor: "bg-orange-100 hover:bg-orange-200 border-orange-300" },
};

interface SelectedItem {
  key: string;
  category: string;
  icon: string;
  text: string;
}

export const TransformationsList = ({ onGenerateEmail }: TransformationsListProps) => {
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [filterPriority, setFilterPriority] = useState<TransformationPriority | 'all'>('all');

  // Flatten all transformations with unique keys
  const allTransformations = useMemo(() => {
    const items: {
      key: string;
      version: string;
      date: string;
      category: string;
      icon: string;
      text: string;
      priority: TransformationPriority;
    }[] = [];

    CHANGELOG.forEach((entry, entryIdx) => {
      entry.categories.forEach((category, catIdx) => {
        category.items.forEach((item, itemIdx) => {
          items.push({
            key: `${entryIdx}-${catIdx}-${itemIdx}`,
            version: entry.version,
            date: entry.date,
            category: category.name,
            icon: category.icon,
            text: item.text,
            priority: item.priority,
          });
        });
      });
    });

    return items;
  }, []);

  // Filter transformations
  const filteredTransformations = useMemo(() => {
    if (filterPriority === 'all') return allTransformations;
    return allTransformations.filter(t => t.priority === filterPriority);
  }, [allTransformations, filterPriority]);

  // Group by version then category
  const groupedByVersion = useMemo(() => {
    const grouped: Record<string, {
      version: string;
      date: string;
      categories: Record<string, {
        icon: string;
        items: typeof filteredTransformations;
      }>;
    }> = {};

    filteredTransformations.forEach(item => {
      if (!grouped[item.version]) {
        grouped[item.version] = {
          version: item.version,
          date: item.date,
          categories: {},
        };
      }
      if (!grouped[item.version].categories[item.category]) {
        grouped[item.version].categories[item.category] = {
          icon: item.icon,
          items: [],
        };
      }
      grouped[item.version].categories[item.category].items.push(item);
    });

    return grouped;
  }, [filteredTransformations]);

  const toggleItem = (item: typeof allTransformations[0]) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.key)) {
      newSelected.delete(item.key);
    } else {
      newSelected.set(item.key, {
        key: item.key,
        category: item.category,
        icon: item.icon,
        text: item.text,
      });
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Map<string, SelectedItem>();
    filteredTransformations.forEach(item => {
      newSelected.set(item.key, {
        key: item.key,
        category: item.category,
        icon: item.icon,
        text: item.text,
      });
    });
    setSelectedItems(newSelected);
  };

  const clearSelection = () => {
    setSelectedItems(new Map());
  };

  const handleGenerateEmail = () => {
    const items = Array.from(selectedItems.values());
    const content = generateContentFromSelection(items);
    const title = `Mise à jour QuaiDirect - ${new Date().toLocaleDateString('fr-FR')}`;
    onGenerateEmail(content, title);
  };

  const stats = useMemo(() => ({
    major: allTransformations.filter(t => t.priority === 'major').length,
    useful: allTransformations.filter(t => t.priority === 'useful').length,
    minor: allTransformations.filter(t => t.priority === 'minor').length,
    total: allTransformations.length,
  }), [allTransformations]);

  return (
    <div className="flex flex-col h-full">
      {/* Header avec stats */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">📋 Cahier des Transformations</h3>
          <Badge variant="outline">{stats.total} transformations</Badge>
        </div>
        
        {/* Stats par priorité */}
        <div className="flex gap-2">
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border border-red-300">
            🔴 {stats.major} Majeurs
          </Badge>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border border-green-300">
            🟢 {stats.useful} Utiles
          </Badge>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300">
            🟠 {stats.minor} Mineurs
          </Badge>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrer:</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filterPriority === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('all')}
            >
              Tout
            </Button>
            <Button
              size="sm"
              variant={filterPriority === 'major' ? 'default' : 'outline'}
              className={filterPriority === 'major' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => setFilterPriority('major')}
            >
              Majeur
            </Button>
            <Button
              size="sm"
              variant={filterPriority === 'useful' ? 'default' : 'outline'}
              className={filterPriority === 'useful' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setFilterPriority('useful')}
            >
              Utile
            </Button>
            <Button
              size="sm"
              variant={filterPriority === 'minor' ? 'default' : 'outline'}
              className={filterPriority === 'minor' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              onClick={() => setFilterPriority('minor')}
            >
              Mineur
            </Button>
          </div>
        </div>

        {/* Actions de sélection */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Effacer
            </Button>
          </div>
          <Badge variant="secondary">
            {selectedItems.size} sélectionné{selectedItems.size > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Liste scrollable */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {Object.entries(groupedByVersion).map(([version, versionData]) => (
            <div key={version} className="space-y-4">
              <div className="sticky top-0 bg-background z-10 py-2">
                <h4 className="font-semibold text-primary">
                  v{version} — {new Date(versionData.date).toLocaleDateString('fr-FR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h4>
              </div>

              {Object.entries(versionData.categories).map(([categoryName, categoryData]) => (
                <div key={categoryName} className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">
                    {categoryData.icon} {categoryName}
                  </h5>
                  <div className="space-y-1">
                    {categoryData.items.map(item => {
                      const config = priorityConfig[item.priority];
                      const isSelected = selectedItems.has(item.key);

                      return (
                        <div
                          key={item.key}
                          className={`flex items-start gap-3 p-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-primary/10 border-primary' 
                              : 'hover:bg-muted/50 border-transparent'
                          }`}
                          onClick={() => toggleItem(item)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(item)}
                            className="mt-0.5"
                          />
                          <Badge className={`${config.bgColor} ${config.color} text-xs shrink-0`}>
                            {config.label}
                          </Badge>
                          <span className="text-sm flex-1">{item.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer avec action */}
      <div className="p-4 border-t bg-muted/30">
        <Button 
          className="w-full" 
          onClick={handleGenerateEmail}
          disabled={selectedItems.size === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Utiliser la sélection pour le mail ({selectedItems.size})
        </Button>
      </div>
    </div>
  );
};

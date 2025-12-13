import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SmsHistoryFilters, SmsHistoryResponse } from '@/types/sms-analytics';
import { getStatusLabel, getTypeLabel } from '@/lib/sms-analytics';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SmsHistoryTableProps {
  history: SmsHistoryResponse | undefined;
  loading?: boolean;
  onFilterChange: (filters: SmsHistoryFilters) => void;
  filters: SmsHistoryFilters;
}

export function SmsHistoryTable({ history, loading, onFilterChange, filters }: SmsHistoryTableProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [phoneInput, setPhoneInput] = useState(filters.phone || '');

  const handleSearch = () => {
    onFilterChange({ ...filters, search: searchInput, phone: phoneInput, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value as any, page: 1 });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({ ...filters, type: value as any, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    onFilterChange({ ...filters, page: newPage });
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des SMS</CardTitle>
        <CardDescription>
          Liste détaillée de tous les messages envoyés avec filtres et recherche
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher dans le message..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Filtrer par téléphone..."
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="sent">Envoyé</SelectItem>
              <SelectItem value="delivered">Livré</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type || 'all'} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="invitation">Invitation</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="promotion">Promotion</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Rechercher
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Coût</TableHead>
                <TableHead className="text-center">Réessais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              )}
              {!loading && (!history || history.messages.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun message trouvé
                  </TableCell>
                </TableRow>
              )}
              {!loading && history && history.messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="whitespace-nowrap">
                    {message.sent_at
                      ? format(new Date(message.sent_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{message.contact_phone}</TableCell>
                  <TableCell className="max-w-xs truncate" title={message.message}>
                    {message.message}
                  </TableCell>
                  <TableCell>{getTypeLabel(message.type)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(message.status)}>
                      {getStatusLabel(message.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {(message.cost_cents / 100).toFixed(2)}€
                  </TableCell>
                  <TableCell className="text-center">
                    {message.retries > 0 ? (
                      <Badge variant="outline">{message.retries}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {history && history.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {history.page} sur {history.totalPages} ({history.total} messages)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(history.page - 1)}
                disabled={history.page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(history.page + 1)}
                disabled={history.page >= history.totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

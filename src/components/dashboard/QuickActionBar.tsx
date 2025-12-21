import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, FileText, Edit } from 'lucide-react';
import { QuickDropModal } from './QuickDropModal';
import { TemplatePickerModal } from './TemplatePickerModal';
import { useQuickDrop } from '@/hooks/useQuickDrop';

interface QuickActionBarProps {
  fishermanId: string | null;
  onDropCreated?: () => void;
}

export function QuickActionBar({ fishermanId, onDropCreated }: QuickActionBarProps) {
  const navigate = useNavigate();
  const [showQuickDropModal, setShowQuickDropModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  const { canUseQuickDrop, templates, isLoading } = useQuickDrop();

  // Don't show if fisherman has no sale points configured
  if (!fishermanId || isLoading || !canUseQuickDrop) {
    return null;
  }

  const hasTemplates = templates.length > 0;

  return (
    <>
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold text-foreground">Actions rapides</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Primary: Express Drop */}
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white min-h-[52px] flex-1 sm:flex-none"
            onClick={() => setShowQuickDropModal(true)}
          >
            <Zap className="h-5 w-5" aria-hidden="true" />
            <span className="text-base font-semibold">Arrivage Express</span>
            <span className="text-xs opacity-80 hidden sm:inline">(30s)</span>
          </Button>

          {/* Secondary: From Template */}
          {hasTemplates && (
            <Button
              size="lg"
              variant="outline"
              className="gap-2 min-h-[52px] flex-1 sm:flex-none"
              onClick={() => setShowTemplateModal(true)}
            >
              <FileText className="h-5 w-5" aria-hidden="true" />
              <span>Depuis un modèle</span>
            </Button>
          )}

          {/* Tertiary: Full Wizard */}
          <Button
            size="lg"
            variant="ghost"
            className="gap-2 min-h-[52px] text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/pecheur/nouvel-arrivage')}
          >
            <Edit className="h-5 w-5" aria-hidden="true" />
            <span>Création détaillée</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <QuickDropModal
        open={showQuickDropModal}
        onOpenChange={setShowQuickDropModal}
        onSuccess={() => {
          setShowQuickDropModal(false);
          onDropCreated?.();
        }}
      />

      <TemplatePickerModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        onSuccess={() => {
          setShowTemplateModal(false);
          onDropCreated?.();
        }}
      />
    </>
  );
}

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhotoUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
}

export const PhotoUpload = ({ label, value, onChange, bucket = 'receipts' }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `fishermen/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Photo téléchargée avec succès');
    } catch (error) {
      toast.error('Erreur lors du téléchargement de la photo');
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt={label}
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <input
            type="file"
            id={`upload-${label}`}
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor={`upload-${label}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading ? 'Téléchargement...' : 'Cliquer pour télécharger'}
            </span>
          </label>
        </div>
      )}
    </div>
  );
};

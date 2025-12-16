import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Plus, CheckCircle2, Clock, Users, Sparkles, BookOpen } from "lucide-react";
import { getLatestChangelog, generateUpdateContent } from "@/config/changelog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransformationsList } from "./TransformationsList";

interface PlatformUpdate {
  id: string;
  title: string;
  content: string;
  version: string | null;
  created_at: string;
  sent_at: string | null;
  sent_by: string | null;
  recipient_count: number;
}

export const PlatformUpdatesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showTransformations, setShowTransformations] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("");
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null);

  // Handler pour générer email depuis les transformations sélectionnées
  const handleGenerateFromSelection = (selectedContent: string, selectedTitle: string) => {
    setTitle(selectedTitle);
    setContent(selectedContent);
    setVersion("");
    setShowTransformations(false);
    setShowForm(true);
    toast({
      title: "Sélection appliquée",
      description: "Le formulaire a été pré-rempli avec vos transformations",
    });
  };

  // Fetch platform updates
  const { data: updates, isLoading } = useQuery({
    queryKey: ["platform-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_updates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PlatformUpdate[];
    },
  });

  // Fetch verified fishermen count
  const { data: fishermenCount } = useQuery({
    queryKey: ["verified-fishermen-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("fishermen")
        .select("*", { count: "exact", head: true })
        .not("verified_at", "is", null)
        .not("email", "is", null);
      if (error) throw error;
      return count || 0;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("platform_updates")
        .insert({
          title,
          content,
          version: version || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Mise à jour créée",
        description: "Vous pouvez maintenant l'envoyer aux pêcheurs",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-updates"] });
      setShowForm(false);
      setTitle("");
      setContent("");
      setVersion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-platform-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ updateId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Envoi réussi",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["platform-updates"] });
      setConfirmSendId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message,
        variant: "destructive",
      });
      setConfirmSendId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mises à jour plateforme</h2>
          <p className="text-muted-foreground">
            Informez les pêcheurs des nouveautés
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            {fishermenCount} pêcheurs vérifiés
          </Badge>
          <Button
            variant="outline"
            onClick={() => setShowTransformations(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Voir transformations
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const latest = getLatestChangelog();
              if (latest) {
                setTitle(latest.title);
                setVersion(latest.version);
                setContent(generateUpdateContent(latest));
                setShowForm(true);
                toast({
                  title: "Suggestion chargée",
                  description: `Mise à jour ${latest.version} pré-remplie`,
                });
              }
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Suggestion auto
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle mise à jour
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une mise à jour</CardTitle>
            <CardDescription>
              Rédigez le contenu de la mise à jour à envoyer aux pêcheurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Nouveau module de caisse disponible"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version (optionnel)</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="Ex: 1.5.0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Contenu *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Décrivez les nouveautés, améliorations, ou corrections..."
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!title || !content || createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Créer la mise à jour
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Updates List */}
      <div className="grid gap-4">
        {updates?.map((update) => (
          <Card key={update.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{update.title}</h3>
                    {update.version && (
                      <Badge variant="secondary">v{update.version}</Badge>
                    )}
                    {update.sent_at ? (
                      <Badge className="gap-1 bg-green-500">
                        <CheckCircle2 className="h-3 w-3" />
                        Envoyé
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Brouillon
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm whitespace-pre-line line-clamp-3">
                    {update.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      Créé le {new Date(update.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    {update.sent_at && (
                      <>
                        <span>•</span>
                        <span>
                          Envoyé le {new Date(update.sent_at).toLocaleDateString("fr-FR")} à {update.recipient_count} pêcheur(s)
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {!update.sent_at && (
                  <Button
                    onClick={() => setConfirmSendId(update.id)}
                    disabled={sendMutation.isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {updates?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucune mise à jour créée</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Send Dialog */}
      <AlertDialog open={!!confirmSendId} onOpenChange={() => setConfirmSendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'envoi</AlertDialogTitle>
            <AlertDialogDescription>
              Cette mise à jour sera envoyée à <strong>{fishermenCount} pêcheurs vérifiés</strong> par email.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmSendId && sendMutation.mutate(confirmSendId)}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer maintenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transformations Dialog */}
      <Dialog open={showTransformations} onOpenChange={setShowTransformations}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Cahier des Transformations</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <TransformationsList onGenerateEmail={handleGenerateFromSelection} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const categoryLabels = {
  profile_modification: "Modification du profil initial",
  technical: "Problème technique",
  commercial: "Question commerciale",
  other: "Autre demande"
};

const statusLabels = {
  pending: "En attente",
  in_progress: "En cours",
  resolved: "Résolue",
  rejected: "Refusée"
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  resolved: CheckCircle,
  rejected: XCircle
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

export default function PecheurSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Fetch fisherman ID
  const { data: fishermanData } = useQuery({
    queryKey: ["fisherman-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("fishermen")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch support requests
  const { data: requests } = useQuery({
    queryKey: ["support-requests", fishermanData?.id],
    queryFn: async () => {
      if (!fishermanData?.id) return [];
      const { data } = await supabase
        .from("support_requests")
        .select("*")
        .eq("fisherman_id", fishermanData.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!fishermanData?.id
  });

  const createRequestMutation = useMutation({
    mutationFn: async (newRequest: { category: string; subject: string; message: string }) => {
      if (!fishermanData?.id) throw new Error("Fisherman ID not found");
      
      const { error } = await supabase.from("support_requests").insert([{
        fisherman_id: fishermanData.id,
        category: newRequest.category as any,
        subject: newRequest.subject,
        message: newRequest.message
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-requests"] });
      toast.success("Demande envoyée avec succès");
      setCategory("");
      setSubject("");
      setMessage("");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la demande");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subject.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    createRequestMutation.mutate({ category, subject, message });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/pecheur/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au dashboard
        </Button>

        <div className="space-y-8">
          {/* Form section */}
          <Card>
            <CardHeader>
              <CardTitle>Contacter l'administrateur</CardTitle>
              <CardDescription>
                Envoyez une demande à l'équipe QuaiDirect. Nous vous répondrons dans les plus brefs délais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Type de demande
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type de demande" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sujet
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Sujet de votre demande"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Message
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre demande en détail..."
                    rows={6}
                    maxLength={1000}
                  />
                </div>

                <Button type="submit" disabled={createRequestMutation.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer la demande
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Requests history */}
          <Card>
            <CardHeader>
              <CardTitle>Historique de vos demandes</CardTitle>
              <CardDescription>
                Consultez le statut de vos demandes précédentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!requests || requests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune demande pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request: any) => {
                    const StatusIcon = statusIcons[request.status as keyof typeof statusIcons];
                    return (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">
                                  {categoryLabels[request.category as keyof typeof categoryLabels]}
                                </Badge>
                                <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {statusLabels[request.status as keyof typeof statusLabels]}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-lg mb-2">{request.subject}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{request.message}</p>
                              <p className="text-xs text-muted-foreground">
                                Envoyé le {new Date(request.created_at).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {request.admin_response && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-2">Réponse de l'administrateur :</p>
                              <p className="text-sm">{request.admin_response}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

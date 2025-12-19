import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Send, Loader2 } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide").max(255),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
});

interface ContactFishermanDialogProps {
  fishermanId: string;
  fishermanUserId: string;
  boatName: string;
  children?: React.ReactNode;
}

export function ContactFishermanDialog({ 
  fishermanId, 
  fishermanUserId, 
  boatName,
  children 
}: ContactFishermanDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs
      const validation = contactSchema.safeParse({ name, email, message });
      if (!validation.success) {
        const fieldErrors: { name?: string; email?: string; message?: string } = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
        throw new Error("Validation failed");
      }
      setErrors({});

      // Insert message into database
      const { error } = await supabase.from("messages").insert({
        sender_id: user?.id || fishermanUserId, // Use fisherman as placeholder if no user
        recipient_id: fishermanUserId,
        sender_email: email,
        sender_name: name,
        subject: `Message de ${name} via QuaiDirect`,
        body: message,
        message_type: "public_inquiry",
      });

      if (error) throw error;

      // Send email notification to fisherman
      await supabase.functions.invoke("send-public-message-notification", {
        body: {
          fishermanUserId,
          fishermanId,
          senderName: name,
          senderEmail: email,
          message,
        },
      });
    },
    onSuccess: () => {
      toast.success("Message envoyé ! Le pêcheur vous répondra par email.");
      setOpen(false);
      setName("");
      setEmail("");
      setMessage("");
    },
    onError: (error: any) => {
      if (error.message !== "Validation failed") {
        toast.error("Erreur lors de l'envoi du message");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Contacter ce pêcheur
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contacter {boatName}
          </DialogTitle>
          <DialogDescription>
            Envoyez un message au pêcheur. Il vous répondra directement par email.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Votre nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Votre email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@exemple.fr"
              maxLength={255}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Nécessaire pour recevoir la réponse du pêcheur
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Votre message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour, je souhaiterais savoir..."
              className="min-h-[120px]"
              maxLength={2000}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sendMessageMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={() => sendMessageMutation.mutate()}
            disabled={sendMessageMutation.isPending || !name || !email || !message}
            className="gap-2"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

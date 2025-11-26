import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const MentionsLegales = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="prose prose-blue max-w-none">
          <h1>Mentions Légales</h1>

          <h2>1. Éditeur du site</h2>
          <p>
            Le site QuaiDirect.fr est édité par :
            <br />
            <strong>Jean-Louis Michel</strong>
            <br />
            Email : <a href="mailto:CEO@quaidirect.fr">CEO@quaidirect.fr</a>
          </p>

          <h2>2. Hébergement</h2>
          <p>
            Le site QuaiDirect.fr est hébergé par :
            <br />
            <strong>Lovable</strong>
            <br />
            Service cloud moderne de développement et d'hébergement web
          </p>

          <h2>3. Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est protégé par le droit d'auteur.
            Toute reproduction, même partielle, est interdite sans autorisation préalable.
          </p>

          <h2>4. Données personnelles</h2>
          <p>
            Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au Règlement Général sur la
            Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition
            aux données personnelles vous concernant.
          </p>
          <p>
            Pour exercer ces droits, contactez-nous à : <a href="mailto:CEO@quaidirect.fr">CEO@quaidirect.fr</a>
          </p>

          <h2>5. Cookies</h2>
          <p>
            Le site QuaiDirect.fr utilise des cookies pour améliorer l'expérience utilisateur et analyser le trafic.
            Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </p>

          <h2>6. Responsabilité</h2>
          <p>
            L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site.
            Toutefois, il ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
          </p>

          <h2>7. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français
            seront seuls compétents.
          </p>

          <h2>8. Contact</h2>
          <p>
            Pour toute question concernant le site ou ces mentions légales, contactez-nous :
            <br />
            <strong>CEO@quaidirect.fr</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;

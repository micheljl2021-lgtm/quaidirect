import { Link } from 'react-router-dom';
import { Fish, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary/5 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Fish className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold">QuaiDirect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plateforme de vente directe pour marins-pêcheurs artisanaux français.
              Du port à votre assiette.
            </p>
            <p className="text-xs text-muted-foreground italic">
              By Jean-Louis Michel
            </p>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-semibold mb-4">Découvrir</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/comment-ca-marche" className="text-muted-foreground hover:text-primary transition-colors">
                  Comment ça marche ?
                </Link>
              </li>
              <li>
                <Link to="/devenir-pecheur" className="text-muted-foreground hover:text-primary transition-colors">
                  Devenir pêcheur
                </Link>
              </li>
              <li>
                <Link to="/arrivages" className="text-muted-foreground hover:text-primary transition-colors">
                  Arrivages
                </Link>
              </li>
              <li>
                <Link to="/carte" className="text-muted-foreground hover:text-primary transition-colors">
                  Carte des points de vente
                </Link>
              </li>
              <li>
                <Link to="/poisson-frais-hyeres" className="text-muted-foreground hover:text-primary transition-colors">
                  Poisson frais Hyères
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/cgv" className="text-muted-foreground hover:text-primary transition-colors">
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors">
                  Mentions Légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <a 
                href="mailto:CEO@quaidirect.fr" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                aria-label="Envoyer un email à CEO@quaidirect.fr"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                CEO@quaidirect.fr
              </a>
              <p className="text-xs text-muted-foreground">
                Pour toute question sur la plateforme, les abonnements ou les fonctionnalités.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} QuaiDirect. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

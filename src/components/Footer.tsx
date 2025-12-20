import { Link } from 'react-router-dom';
import { Fish, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary/5 border-t mt-auto">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <Fish className="h-5 w-5 md:h-6 md:w-6 text-primary" aria-hidden="true" />
              <span className="text-lg md:text-xl font-bold">QuaiDirect</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Plateforme de vente directe pour marins-pêcheurs artisanaux français.
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground italic">
              By Jean-Louis Michel
            </p>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-4">Découvrir</h3>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
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
                  Carte
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-4">Légal</h3>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link to="/cgv" className="text-muted-foreground hover:text-primary transition-colors">
                  CGV
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
            <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-4">Contact</h3>
            <div className="space-y-2 md:space-y-3">
              <a 
                href="mailto:CEO@quaidirect.fr" 
                className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors break-all"
                aria-label="Envoyer un email à CEO@quaidirect.fr"
              >
                <Mail className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">CEO@quaidirect.fr</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t text-center text-xs md:text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} QuaiDirect. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

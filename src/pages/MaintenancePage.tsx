import { useState } from "react";
import { Anchor, Fish, Waves, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MaintenancePageProps {
  showAdminLink?: boolean;
}

export default function MaintenancePage({ showAdminLink = true }: MaintenancePageProps) {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowAdminButton(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Vagues animées en arrière-plan */}
      <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-32 text-sky-200/50"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;M0,128L48,154.7C96,181,192,235,288,234.7C384,235,480,181,576,181.3C672,181,768,235,864,250.7C960,267,1056,245,1152,229.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </path>
        </svg>
        <svg
          className="absolute bottom-0 w-full h-24 text-sky-300/40"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,208C672,235,768,277,864,277.3C960,277,1056,235,1152,213.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,208C672,235,768,277,864,277.3C960,277,1056,235,1152,213.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;M0,192L48,192C96,192,192,192,288,213.3C384,235,480,277,576,277.3C672,277,768,235,864,208C960,181,1056,171,1152,181.3C1248,192,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,208C672,235,768,277,864,277.3C960,277,1056,235,1152,213.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </path>
        </svg>
      </div>

      {/* Icônes flottantes */}
      <div className="absolute top-20 left-10 animate-bounce" style={{ animationDuration: "3s" }}>
        <Fish className="w-8 h-8 text-sky-400/40" />
      </div>
      <div className="absolute top-32 right-16 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
        <Anchor className="w-10 h-10 text-sky-400/30" />
      </div>
      <div className="absolute bottom-48 left-20 animate-bounce" style={{ animationDuration: "5s", animationDelay: "0.5s" }}>
        <Ship className="w-12 h-12 text-sky-400/25" />
      </div>
      <div className="absolute top-48 right-32 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "2s" }}>
        <Waves className="w-8 h-8 text-sky-400/35" />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 text-center max-w-xl mx-auto">
        {/* Logo cliquable pour révéler le bouton admin */}
        <div
          className="mb-8 cursor-pointer select-none"
          onClick={handleLogoClick}
          title="QuaiDirect"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl mb-4">
            <Fish className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-sky-900">QuaiDirect</h1>
        </div>

        {/* Message principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-sky-100">
          <h2 className="text-2xl font-semibold text-sky-800 mb-4">
            🚧 Site en construction
          </h2>
          <p className="text-sky-700 mb-6 leading-relaxed">
            Nous préparons quelque chose de frais pour vous !
            <br />
            Notre plateforme de vente directe de poisson frais arrive bientôt.
          </p>

          <div className="flex items-center justify-center gap-2 text-sky-600 text-sm">
            <Anchor className="w-4 h-4" />
            <span>Du bateau à votre assiette, sans intermédiaire</span>
          </div>
        </div>

        {/* Bouton admin caché (révélé après 5 clics) */}
        {showAdminLink && showAdminButton && (
          <div className="mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-sky-600 border-sky-300 hover:bg-sky-50"
            >
              Connexion Admin
            </Button>
          </div>
        )}
      </div>

      {/* Footer discret */}
      <div className="absolute bottom-4 text-center text-sky-400 text-xs">
        © {new Date().getFullYear()} QuaiDirect - Pêche artisanale en circuit court
      </div>
    </div>
  );
}

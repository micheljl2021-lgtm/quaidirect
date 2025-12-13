import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const CGV = () => {
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
          <h1>Conditions Générales de Vente et d'Utilisation</h1>
          <p className="text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <h2>1. Préambule</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre QuaiDirect.fr,
            plateforme de mise en relation entre marins-pêcheurs professionnels et consommateurs, et ses utilisateurs.
          </p>

          <h2>2. Cadre légal de la pêche maritime professionnelle</h2>
          <h3>2.1 Statut des marins-pêcheurs</h3>
          <p>
            Les marins-pêcheurs présents sur la plateforme QuaiDirect sont des professionnels immatriculés disposant :
          </p>
          <ul>
            <li>D'un navire de pêche enregistré auprès des Affaires Maritimes</li>
            <li>D'un numéro SIRET valide</li>
            <li>Des licences et autorisations de pêche nécessaires</li>
            <li>Du respect des quotas et réglementations en vigueur</li>
          </ul>

          <h3>2.2 Traçabilité et qualité</h3>
          <p>
            Conformément à la réglementation européenne (Règlement CE n°178/2002), chaque lot de poisson commercialisé
            est accompagné d'informations de traçabilité incluant :
          </p>
          <ul>
            <li>La zone de capture (zone FAO)</li>
            <li>La méthode de pêche utilisée</li>
            <li>Le nom commercial et scientifique de l'espèce</li>
            <li>La date de débarquement</li>
          </ul>

          <h2>3. Vente en circuit court</h2>
          <h3>3.1 Principe du circuit court</h3>
          <p>
            QuaiDirect favorise la vente en circuit court, permettant aux pêcheurs de vendre directement leur production
            aux consommateurs, sans intermédiaire. Cette pratique garantit :
          </p>
          <ul>
            <li>Une rémunération équitable des pêcheurs</li>
            <li>Des produits ultra-frais</li>
            <li>Une transparence totale sur l'origine des produits</li>
            <li>Un lien direct producteur-consommateur</li>
          </ul>

          <h3>3.2 Points de vente et retrait</h3>
          <p>
            Les produits sont vendus et retirés directement sur les quais ou aux points de vente désignés par les pêcheurs.
            Les horaires et lieux de retrait sont précisés dans chaque annonce d'arrivage.
          </p>

          <h2>4. Vente à distance</h2>
          <h3>4.1 Commandes en ligne</h3>
          <p>
            Les commandes passées via QuaiDirect constituent des précommandes fermes. Le client s'engage à retirer
            sa commande au lieu et à l'heure convenus.
          </p>

          <h3>4.2 Droit de rétractation</h3>
          <p>
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas
            aux denrées périssables, dont font partie les produits de la mer frais.
          </p>

          <h2>5. Produits frais - Règles spécifiques</h2>
          <h3>5.1 Nature des produits</h3>
          <p>
            Les produits commercialisés sont des produits de la mer ultra-frais, pêchés le jour même ou la veille.
            Leur conservation optimale nécessite le respect de la chaîne du froid.
          </p>

          <h3>5.2 Conservation</h3>
          <p>
            Le client est responsable de la conservation des produits dès le retrait. Il est recommandé de :
          </p>
          <ul>
            <li>Venir avec un contenant isotherme</li>
            <li>Consommer les produits dans les 24-48h suivant le retrait</li>
            <li>Conserver les produits entre 0°C et 4°C</li>
          </ul>

          <h3>5.3 Poids et quantités</h3>
          <p>
            Les quantités indiquées sont approximatives et peuvent varier de +/- 10% en fonction de la pêche réelle.
            Le prix final est calculé sur le poids exact au moment du retrait.
          </p>

          <h2>6. Prix et paiement</h2>
          <h3>6.1 Prix</h3>
          <p>
            Les prix sont indiqués en euros TTC. Ils peuvent varier en fonction de la disponibilité et de la qualité des produits.
          </p>

          <h3>6.2 Modalités de paiement</h3>
          <p>
            Le paiement s'effectue :
          </p>
          <ul>
            <li>En ligne lors de la précommande (pour les utilisateurs Premium)</li>
            <li>Sur place au moment du retrait (espèces, carte bancaire selon les pêcheurs)</li>
          </ul>

          <h2>7. Abonnements Premium</h2>
          <h3>7.1 Offres Premium</h3>
          <p>
            L'abonnement Premium offre :
          </p>
          <ul>
            <li>Des alertes personnalisées sur les espèces favorites</li>
            <li>Des notifications prioritaires pour les nouveaux points de vente</li>
            <li>Un badge Premium</li>
            <li>Le soutien aux pêcheurs artisanaux français</li>
          </ul>

          <h3>7.2 Facturation</h3>
          <p>
            L'abonnement est facturé immédiatement lors de la souscription. Il est automatiquement
            renouvelé à chaque échéance sauf résiliation.
          </p>

          <h3>7.3 Résiliation</h3>
          <p>
            L'abonnement est résiliable à tout moment depuis l'espace client. La résiliation prend effet à la fin de la période
            de facturation en cours.
          </p>

          <h2>8. Responsabilités</h2>
          <h3>8.1 Responsabilité de QuaiDirect</h3>
          <p>
            QuaiDirect est une plateforme de mise en relation. La responsabilité de la qualité, de la fraîcheur et de la
            conformité des produits incombe aux pêcheurs vendeurs.
          </p>

          <h3>8.2 Responsabilité du pêcheur</h3>
          <p>
            Le pêcheur s'engage à respecter toutes les normes sanitaires et réglementaires en vigueur. Il est responsable
            de la qualité et de la conformité des produits vendus.
          </p>

          <h3>8.3 Responsabilité du client</h3>
          <p>
            Le client s'engage à retirer sa commande dans les délais convenus et à respecter la chaîne du froid.
          </p>

          <h2>9. Données personnelles</h2>
          <p>
            Les données personnelles collectées sont traitées conformément au RGPD. Pour plus d'informations, consultez
            notre Politique de Confidentialité.
          </p>

          <h2>10. Litiges</h2>
          <p>
            En cas de litige, le client peut recourir à une médiation de la consommation ou saisir les juridictions compétentes.
          </p>

          <h2>11. Contact</h2>
          <p>
            Pour toute question relative aux présentes CGV, vous pouvez nous contacter à :
            <br />
            <strong>CEO@quaidirect.fr</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CGV;

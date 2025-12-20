import { Helmet } from 'react-helmet';

interface OrganizationSchemaProps {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
}

interface LocalBusinessSchemaProps {
  name: string;
  description?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  openingHours?: string[];
  priceRange?: string;
}

interface ProductSchemaProps {
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  offers?: {
    price: number;
    priceCurrency?: string;
    availability?: string;
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

// Schema Organisation pour QuaiDirect
export function OrganizationSchema({
  name = 'QuaiDirect',
  description = 'Achetez du poisson frais directement auprès des marins-pêcheurs artisanaux. Circuit ultra-court, 100% traçable, prix justes.',
  url = 'https://quaidirect.fr',
  logo = 'https://quaidirect.fr/logo-quaidirect.png'
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description,
    url,
    logo,
    sameAs: [
      'https://www.facebook.com/quaidirect',
      'https://www.instagram.com/quaidirect'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@quaidirect.fr',
      contactType: 'customer service',
      availableLanguage: 'French'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Schema WebSite avec SearchAction
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'QuaiDirect',
    url: 'https://quaidirect.fr',
    description: 'Plateforme de vente directe de poisson frais par les marins-pêcheurs artisanaux',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://quaidirect.fr/arrivages?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Schema LocalBusiness pour les pêcheurs
export function LocalBusinessSchema({
  name,
  description,
  address,
  geo,
  telephone,
  openingHours,
  priceRange = '€€'
}: LocalBusinessSchemaProps) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://quaidirect.fr/pecheur/${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    description,
    priceRange,
    image: 'https://quaidirect.fr/logo-quaidirect.png'
  };

  if (address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      addressRegion: address.addressRegion,
      postalCode: address.postalCode,
      addressCountry: address.addressCountry || 'FR'
    };
  }

  if (geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude
    };
  }

  if (telephone) {
    schema.telephone = telephone;
  }

  if (openingHours && openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours
    }));
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Schema Product pour les offres de poisson
export function ProductSchema({
  name,
  description,
  image,
  brand = 'QuaiDirect',
  offers
}: ProductSchemaProps) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    brand: {
      '@type': 'Brand',
      name: brand
    },
    category: 'Poisson frais'
  };

  if (image) {
    schema.image = image;
  }

  if (offers) {
    schema.offers = {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency || 'EUR',
      availability: offers.availability || 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'QuaiDirect'
      }
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Schema Breadcrumb pour la navigation
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Schema FAQPage pour les pages FAQ
export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

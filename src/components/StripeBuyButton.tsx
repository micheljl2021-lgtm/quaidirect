import { useEffect, useRef } from "react";

// TypeScript declaration for Stripe Buy Button web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': {
        'buy-button-id': string;
        'publishable-key': string;
      };
    }
  }
}

interface StripeBuyButtonProps {
  buyButtonId: string;
  publishableKey: string;
}

export const StripeBuyButton = ({ buyButtonId, publishableKey }: StripeBuyButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the script is loaded before rendering
    const script = document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]');
    if (!script) {
      console.warn('Stripe Buy Button script not loaded');
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <stripe-buy-button
        buy-button-id={buyButtonId}
        publishable-key={publishableKey}
      />
    </div>
  );
};

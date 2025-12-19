import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[WEBHOOK-DIAGNOSTIC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Diagnostic started");

    // Check environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const diagnostics: {
      timestamp: string;
      environment: Record<string, string>;
      stripe: {
        connected: boolean;
        webhooks: Array<{
          id: string;
          url: string;
          status: string;
          enabled_events: string[];
          livemode: boolean;
        }>;
        recentEvents: Array<{
          id: string;
          type: string;
          created: string;
          livemode: boolean;
        }>;
      };
      database: {
        connected: boolean;
        recentPayments: unknown[];
        recentFishermen: unknown[];
      };
      webhookUrl: string;
    } = {
      timestamp: new Date().toISOString(),
      environment: {
        STRIPE_SECRET_KEY: stripeSecretKey ? "✅ Set" : "❌ Missing",
        STRIPE_WEBHOOK_SECRET: stripeWebhookSecret ? "✅ Set" : "❌ Missing",
        SUPABASE_URL: supabaseUrl ? "✅ Set" : "❌ Missing",
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "✅ Set" : "❌ Missing",
      },
      stripe: {
        connected: false,
        webhooks: [],
        recentEvents: [],
      },
      database: {
        connected: false,
        recentPayments: [],
        recentFishermen: [],
      },
      webhookUrl: `${supabaseUrl}/functions/v1/stripe-webhook`,
    };

    // Test Stripe connection
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
        
        // List webhooks
        const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
        diagnostics.stripe.connected = true;
        diagnostics.stripe.webhooks = webhooks.data.map((wh: Stripe.WebhookEndpoint) => ({
          id: wh.id,
          url: wh.url,
          status: wh.status || "unknown",
          enabled_events: wh.enabled_events,
          livemode: wh.livemode,
        }));

        // Get recent events
        const events = await stripe.events.list({ limit: 10 });
        diagnostics.stripe.recentEvents = events.data.map((evt: Stripe.Event) => ({
          id: evt.id,
          type: evt.type,
          created: new Date(evt.created * 1000).toISOString(),
          livemode: evt.livemode,
        }));

        logStep("Stripe connected", { webhooksCount: webhooks.data.length, eventsCount: events.data.length });
      } catch (stripeError: unknown) {
        const errorMessage = stripeError instanceof Error ? stripeError.message : "Unknown error";
        logStep("Stripe error", { error: errorMessage });
        diagnostics.stripe.connected = false;
      }
    }

    // Test Supabase connection
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Recent payments
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select("id, user_id, plan, status, stripe_subscription_id, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (!paymentsError) {
          diagnostics.database.connected = true;
          diagnostics.database.recentPayments = payments || [];
        }

        // Recent fishermen with payment status
        const { data: fishermen, error: fishermenError } = await supabase
          .from("fishermen")
          .select("id, email, onboarding_payment_status, onboarding_payment_id, onboarding_paid_at, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (!fishermenError) {
          diagnostics.database.recentFishermen = fishermen || [];
        }

        logStep("Database connected", { 
          paymentsCount: payments?.length || 0, 
          fishermenCount: fishermen?.length || 0 
        });
      } catch (dbError: unknown) {
        const errorMessage = dbError instanceof Error ? dbError.message : "Unknown error";
        logStep("Database error", { error: errorMessage });
        diagnostics.database.connected = false;
      }
    }

    logStep("Diagnostic completed");

    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Diagnostic error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

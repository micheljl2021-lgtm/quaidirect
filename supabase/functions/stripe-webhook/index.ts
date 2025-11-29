import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    logStep('ERROR: No stripe signature header');
    return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    logStep('ERROR: STRIPE_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2025-08-27.basil',
  });

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep('Webhook event received', { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep('Checkout session completed', { sessionId: session.id });

        const userId = session.metadata?.user_id;
        const paymentType = session.metadata?.payment_type;
        
        if (!userId) {
          logStep('ERROR: Missing user_id in metadata');
          break;
        }

        // Handle SMS pack purchase
        if (paymentType === 'sms_pack') {
          logStep('Processing SMS pack purchase', { userId });
          
          const fishermanId = session.metadata?.fisherman_id;
          const packType = session.metadata?.pack_type;
          const smsQuantity = parseInt(session.metadata?.sms_quantity || '0');
          
          if (!fishermanId || !smsQuantity) {
            logStep('ERROR: Missing SMS pack data in metadata');
            break;
          }

          // Record SMS pack purchase
          const { error: packError } = await supabaseClient
            .from('fishermen_sms_packs')
            .insert({
              fisherman_id: fishermanId,
              pack_type: packType,
              sms_quantity: smsQuantity,
              price_paid: session.amount_total ? session.amount_total / 100 : 0,
              stripe_payment_intent_id: session.payment_intent as string,
            });

          if (packError) {
            logStep('ERROR inserting SMS pack', { error: packError });
          } else {
            logStep('SMS pack recorded successfully');
          }

          // Update SMS balance
          const currentMonth = new Date().toISOString().slice(0, 7);
          const { data: usage } = await supabaseClient
            .from('fishermen_sms_usage')
            .select('*')
            .eq('fisherman_id', fishermanId)
            .eq('month_year', currentMonth)
            .maybeSingle();

          if (usage) {
            const { error: updateError } = await supabaseClient
              .from('fishermen_sms_usage')
              .update({
                paid_sms_balance: (usage.paid_sms_balance || 0) + smsQuantity,
              })
              .eq('id', usage.id);

            if (updateError) {
              logStep('ERROR updating SMS balance', { error: updateError });
            } else {
              logStep('SMS balance updated successfully');
            }
          } else {
            const { error: createError } = await supabaseClient
              .from('fishermen_sms_usage')
              .insert({
                fisherman_id: fishermanId,
                month_year: currentMonth,
                paid_sms_balance: smsQuantity,
                free_sms_used: 0,
              });

            if (createError) {
              logStep('ERROR creating SMS usage record', { error: createError });
            } else {
              logStep('SMS usage record created successfully');
            }
          }
          break;
        }

        // Handle basket order purchase
        const basketId = session.metadata?.basket_id;
        if (basketId && session.mode === 'payment') {
          logStep('Processing basket order', { userId, basketId });
          
          const fishermanId = session.metadata?.fisherman_id || null;
          const dropId = session.metadata?.drop_id || null;
          
          // Create basket order record
          const { error: orderError } = await supabaseClient
            .from('basket_orders')
            .insert({
              user_id: userId,
              basket_id: basketId,
              fisherman_id: fishermanId,
              drop_id: dropId,
              total_price_cents: session.amount_total || 0,
              stripe_payment_id: session.payment_intent as string,
              status: 'pending',
            });

          if (orderError) {
            logStep('ERROR creating basket order', { error: orderError });
          } else {
            logStep('Basket order created successfully', { basketId, fishermanId, dropId });
          }
          break;
        }

        // Handle fisherman onboarding payment (recurring subscription)
        if (paymentType === 'fisherman_onboarding') {
          logStep('Processing fisherman onboarding subscription', { userId });
          
          const planType = session.metadata?.plan_type || 'basic';
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Create/update fisherman record
          const { data: existingFisherman } = await supabaseClient
            .from('fishermen')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (existingFisherman) {
            const { error: updateError } = await supabaseClient
              .from('fishermen')
              .update({
                onboarding_payment_status: 'paid',
                onboarding_payment_id: session.payment_intent as string,
                onboarding_paid_at: new Date().toISOString(),
              })
              .eq('user_id', userId);

            if (updateError) {
              logStep('ERROR updating fisherman payment status', { error: updateError });
            } else {
              logStep('Fisherman payment status updated successfully');
            }
          } else {
            const { error: insertError } = await supabaseClient
              .from('fishermen')
              .insert({
                user_id: userId,
                boat_name: 'À compléter',
                boat_registration: 'À compléter',
                siret: 'À compléter',
                onboarding_payment_status: 'paid',
                onboarding_payment_id: session.payment_intent as string,
                onboarding_paid_at: new Date().toISOString(),
              });

            if (insertError) {
              logStep('ERROR creating fisherman record', { error: insertError });
            } else {
              logStep('Fisherman record created with payment successfully');
            }
          }

          // Create subscription payment record with plan type
          const { error: paymentError } = await supabaseClient
            .from('payments')
            .upsert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              plan: `fisherman_${planType}`,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            }, {
              onConflict: 'stripe_subscription_id'
            });

          if (paymentError) {
            logStep('ERROR creating fisherman subscription payment', { error: paymentError });
          } else {
            logStep('Fisherman subscription payment record created', { planType });
          }

          // Add fisherman role to user
          const { error: roleError } = await supabaseClient
            .from('user_roles')
            .upsert({
              user_id: userId,
              role: 'fisherman'
            }, {
              onConflict: 'user_id,role',
              ignoreDuplicates: true
            });

          if (roleError) {
            logStep('ERROR adding fisherman role', { error: roleError });
          } else {
            logStep('Fisherman role added successfully');
          }
          break;
        }

        // Handle premium subscription payment
        const plan = session.metadata?.plan;
        if (!plan) {
          logStep('ERROR: Missing plan in metadata');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Insert or update payment record
        const { error: upsertError } = await supabaseClient
          .from('payments')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            plan: plan,
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (upsertError) {
          logStep('ERROR upserting payment', { error: upsertError });
        } else {
          logStep('Payment record created/updated successfully');
        }

        // Add premium role to user
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'premium'
          }, {
            onConflict: 'user_id,role',
            ignoreDuplicates: true
          });

        if (roleError) {
          logStep('ERROR adding premium role', { error: roleError });
        } else {
          logStep('Premium role added successfully');
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep('Invoice paid', { invoiceId: invoice.id });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          const { error } = await supabaseClient
            .from('payments')
            .update({
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            logStep('ERROR updating payment status', { error });
          } else {
            logStep('Payment status updated to active');
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep('Invoice payment failed', { invoiceId: invoice.id });

        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from('payments')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string);

          if (error) {
            logStep('ERROR updating payment to past_due', { error });
          } else {
            logStep('Payment status updated to past_due');
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep('Subscription deleted', { subscriptionId: subscription.id });

        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          logStep('ERROR updating canceled subscription', { error: updateError });
        } else {
          logStep('Subscription marked as canceled');
        }

        // Get payment data to determine subscription type
        const { data: paymentData } = await supabaseClient
          .from('payments')
          .select('user_id, plan')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (paymentData) {
          // Remove role based on subscription plan
          const roleToRemove = paymentData.plan === 'fisherman_annual' ? 'fisherman' : 'premium';
          
          const { error: roleError } = await supabaseClient
            .from('user_roles')
            .delete()
            .eq('user_id', paymentData.user_id)
            .eq('role', roleToRemove);

          if (roleError) {
            logStep(`ERROR removing ${roleToRemove} role`, { error: roleError });
          } else {
            logStep(`${roleToRemove} role removed successfully`);
          }

          // Update fisherman status if it's a fisherman subscription
          if (paymentData.plan === 'fisherman_annual') {
            const { error: fisherError } = await supabaseClient
              .from('fishermen')
              .update({
                onboarding_payment_status: 'canceled',
              })
              .eq('user_id', paymentData.user_id);

            if (fisherError) {
              logStep('ERROR updating fisherman status', { error: fisherError });
            } else {
              logStep('Fisherman subscription canceled');
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep('Subscription updated', { subscriptionId: subscription.id });

        const { error } = await supabaseClient
          .from('payments')
          .update({
            status: subscription.status === 'active' ? 'active' : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logStep('ERROR updating subscription', { error });
        } else {
          logStep('Subscription updated successfully');
        }
        break;
      }

      default:
        logStep('Unhandled event type', { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR processing webhook', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

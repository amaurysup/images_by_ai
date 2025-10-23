import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { headers } from 'next/headers'

// Configuration pour le webhook Stripe (requis pour accéder au raw body)
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('❌ No Stripe signature')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    console.log('✅ Webhook reçu:', event.type)

    // Client Supabase avec Service Role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )

    // Gérer l'événement checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const projectId = session.metadata?.project_id
      const userId = session.metadata?.user_id

      if (!projectId) {
        console.error('❌ No project_id in metadata')
        return NextResponse.json({ error: 'No project_id' }, { status: 400 })
      }

      console.log('💳 Paiement complété pour projet:', projectId)

      // Mettre à jour le projet
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          payment_status: 'paid',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('id', projectId)
        .eq('user_id', userId) // Sécurité: vérifier que ça appartient au bon user

      if (updateError) {
        console.error('❌ Erreur update projet:', updateError)
        throw updateError
      }

      console.log('✅ Projet mis à jour avec payment_status=paid')
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('❌ Erreur webhook:', err)
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}

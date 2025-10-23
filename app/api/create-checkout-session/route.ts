import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(req: Request) {
  try {
    // Vérifier l'auth
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Client avec Service Role
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

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const prompt = formData.get('prompt') as string | null

    if (!file || !prompt) {
      return NextResponse.json({ error: 'Missing image or prompt' }, { status: 400 })
    }

    // Upload l'image dans Supabase avant le paiement
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = `input-${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_INPUT_BUCKET!)
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_INPUT_BUCKET!)
      .getPublicUrl(uploadData.path)
    
    const inputImageUrl = publicUrlData.publicUrl

    // Créer le projet avec status pending
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        input_image_url: inputImageUrl,
        prompt,
        status: 'pending',
        payment_status: 'pending',
        payment_amount: 2.00,
      })
      .select()
      .single()

    if (projectError) throw projectError

    console.log('✅ Projet créé:', project.id)

    // Créer la Checkout Session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Génération d\'image IA',
              description: prompt.substring(0, 100),
            },
            unit_amount: 200, // 2.00 EUR en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
      metadata: {
        project_id: project.id,
        user_id: user.id,
      },
      client_reference_id: user.id,
    })

    console.log('✅ Stripe session créée:', session.id)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    console.error('❌ Erreur create-checkout-session:', err)
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}

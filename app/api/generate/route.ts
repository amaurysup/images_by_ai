import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Replicate from 'replicate'

export async function POST(req: Request) {
  try {
    // Client pour vérifier l'auth (avec cookies)
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

    // Check authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Client avec Service Role pour bypass RLS
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

    const body = await req.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // Récupérer le projet et vérifier le paiement
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // SÉCURITÉ: Vérifier que le paiement est complété
    if (project.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // Vérifier que la génération n'a pas déjà été faite
    if (project.status === 'completed') {
      return NextResponse.json({ error: 'Already generated' }, { status: 400 })
    }

    console.log('🎨 Démarrage génération pour projet:', projectId)

    const inputImageUrl = project.input_image_url
    const prompt = project.prompt

    console.log('📸 Image déjà uploadée:', inputImageUrl)

    // Mettre à jour le status du projet à 'processing'
    await supabase
      .from('projects')
      .update({ status: 'processing' })
      .eq('id', projectId)

    // Call Replicate with nano-banana model
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const input = {
      prompt: prompt,
      image_input: [inputImageUrl]  // nano-banana expects an array of image URLs
    }

    console.log('🤖 Appel Replicate avec:', input)

    // Use replicate.run() instead of predictions.create() for nano-banana
    const output = await replicate.run("google/nano-banana", { input })

    console.log('✅ Output reçu:', output)

    // Extract the URL from the output
    let outputUrl: string | null = null
    if (output && typeof output === 'object' && 'url' in output) {
      outputUrl = (output as any).url()
    } else if (Array.isArray(output) && output.length > 0) {
      outputUrl = output[0]
    } else if (typeof output === 'string') {
      outputUrl = output
    }

    if (!outputUrl) {
      console.error('❌ Format de output inattendu:', output)
      throw new Error('No valid output URL from Replicate')
    }

    console.log('🎨 URL de l\'image générée:', outputUrl)

    // Download generated image
    const res = await fetch(outputUrl)
    const outBuffer = Buffer.from(await res.arrayBuffer())
    const outFilename = `output-${Date.now()}.png`

    const { data: upOut, error: upOutErr } = await supabase.storage
      .from(process.env.SUPABASE_OUTPUT_BUCKET!)
      .upload(outFilename, outBuffer, { contentType: 'image/png' })

    if (upOutErr) throw upOutErr

    const { data: outPublicData } = supabase.storage.from(process.env.SUPABASE_OUTPUT_BUCKET!).getPublicUrl(upOut.path)
    const outPublic = outPublicData.publicUrl

    // Mettre à jour le projet avec l'image générée
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        output_image_url: outPublic, 
        status: 'completed' 
      })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating project:', updateError)
      throw updateError
    }

    console.log('✅ Génération terminée pour projet:', projectId)

    return NextResponse.json({ output_image_url: outPublic, project_id: projectId })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}

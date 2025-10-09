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

    const form = await req.formData()
    const file = form.get('image') as File | null
    const prompt = form.get('prompt') as string | null

    if (!file || !prompt) return NextResponse.json({ error: 'Missing image or prompt' }, { status: 400 })

    // Upload to input-images bucket
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = `input-${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_INPUT_BUCKET!)
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from(process.env.SUPABASE_INPUT_BUCKET!).getPublicUrl(uploadData.path)
    const publicUrl = publicUrlData.publicUrl

    console.log('📸 Image uploadée:', publicUrl)

    // Call Replicate with nano-banana model
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const input = {
      prompt: prompt,
      image_input: [publicUrl]  // nano-banana expects an array of image URLs
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

    // Save to projects table with user_id
    const { data: insertData, error: insertError } = await supabase.from('projects').insert({ 
      user_id: user.id,
      input_image_url: publicUrl, 
      output_image_url: outPublic, 
      prompt, 
      status: 'completed' 
    })

    if (insertError) {
      console.error('Error inserting into projects table:', insertError)
      throw insertError
    }

    return NextResponse.json({ output_image_url: outPublic })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}

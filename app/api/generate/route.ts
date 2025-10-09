import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'
import Replicate from 'replicate'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('image') as File | null
    const prompt = form.get('prompt') as string | null

    if (!file || !prompt) return NextResponse.json({ error: 'Missing image or prompt' }, { status: 400 })

    // Upload to input-images bucket
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = `input-${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from(process.env.SUPABASE_INPUT_BUCKET!)
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabaseServer.storage.from(process.env.SUPABASE_INPUT_BUCKET!).getPublicUrl(uploadData.path)
    const publicUrl = publicUrlData.publicUrl

    // Call Replicate
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const model = process.env.REPLICATE_MODEL || 'google/nano-banana'

    // The actual Replicate model input shape depends on model; here we assume an input image URL and prompt field
    const prediction = await replicate.predictions.create({
      version: model,
      input: {
        image: publicUrl,
        prompt
      }
    })

    // Poll prediction until completed
    let outputUrl: string | null = null
    if (prediction && prediction.output && prediction.output.length) {
      outputUrl = prediction.output[0]
    } else if (prediction && prediction.status !== 'succeeded') {
      // simple polling
      let p = prediction
      while (p.status !== 'succeeded' && p.status !== 'failed') {
        await new Promise((r) => setTimeout(r, 1500))
        p = await replicate.predictions.get(p.id)
      }
      if (p.status === 'succeeded') outputUrl = Array.isArray(p.output) ? p.output[0] : p.output
    }

    if (!outputUrl) throw new Error('No output from Replicate')

    // Download generated image
    const res = await fetch(outputUrl)
    const outBuffer = Buffer.from(await res.arrayBuffer())
    const outFilename = `output-${Date.now()}.png`

    const { data: upOut, error: upOutErr } = await supabaseServer.storage
      .from(process.env.SUPABASE_OUTPUT_BUCKET!)
      .upload(outFilename, outBuffer, { contentType: 'image/png' })

    if (upOutErr) throw upOutErr

    const { data: outPublicData } = supabaseServer.storage.from(process.env.SUPABASE_OUTPUT_BUCKET!).getPublicUrl(upOut.path)
    const outPublic = outPublicData.publicUrl

    // Save to projects table
    const { data: insertData, error: insertError } = await supabaseServer.from('projects').insert({ 
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

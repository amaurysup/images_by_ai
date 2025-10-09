import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function DELETE(req: Request) {
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

    // Check auth
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

    const { projectId } = await req.json()

    // Get project to verify ownership and get image URLs
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete images from buckets
    const inputPath = project.input_image_url.split('/').pop()
    const outputPath = project.output_image_url.split('/').pop()

    if (inputPath) {
      await supabase.storage.from(process.env.SUPABASE_INPUT_BUCKET!).remove([inputPath])
    }
    if (outputPath) {
      await supabase.storage.from(process.env.SUPABASE_OUTPUT_BUCKET!).remove([outputPath])
    }

    // Delete project from DB
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}

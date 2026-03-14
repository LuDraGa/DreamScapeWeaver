import { NextRequest, NextResponse } from 'next/server'
import { reviewAdapter } from '@/lib/adapters/openai-review'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import type { ReviewOutputParams } from '@/lib/types'

/**
 * POST /api/outputs/review
 * AI-powered quality review of generated output (admin-only)
 * Uses GPT-5.4 for the most capable analytical review
 */
export async function POST(request: NextRequest) {
  try {
    // Auth + admin check
    if (env.features.enableAuth) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'auth_required' },
          { status: 401 }
        )
      }

      // Check admin/dev role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'dev')) {
        return NextResponse.json(
          { error: 'Admin access required', code: 'forbidden' },
          { status: 403 }
        )
      }
    }

    const params: ReviewOutputParams = await request.json()

    if (!params.outputText || !params.dreamscapeText) {
      return NextResponse.json(
        { error: 'Missing required fields: outputText, dreamscapeText' },
        { status: 400 }
      )
    }

    const review = await reviewAdapter.reviewOutput(params)

    return NextResponse.json({ review })
  } catch (error) {
    console.error('API error reviewing output:', error)
    return NextResponse.json(
      { error: 'Failed to review output' },
      { status: 500 }
    )
  }
}

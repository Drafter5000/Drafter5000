import { getServerSupabaseClient } from '@/lib/supabase-client';
import type {
  ArticleStyle,
  CreateArticleStyleInput,
  UpdateArticleStyleInput,
  ArticleStyleDraft,
} from '@/lib/types';

export async function listArticleStyles(userId: string): Promise<ArticleStyle[]> {
  const supabase = await getServerSupabaseClient();

  const { data, error } = await supabase
    .from('article_styles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getArticleStyle(id: string, userId: string): Promise<ArticleStyle | null> {
  const supabase = await getServerSupabaseClient();

  const { data, error } = await supabase
    .from('article_styles')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

export async function createArticleStyle(input: CreateArticleStyleInput): Promise<ArticleStyle> {
  const supabase = await getServerSupabaseClient();

  const { data, error } = await supabase
    .from('article_styles')
    .insert({
      user_id: input.user_id,
      name: input.name,
      style_samples: input.style_samples,
      subjects: input.subjects,
      email: input.email || null,
      display_name: input.display_name || null,
      preferred_language: input.preferred_language || 'en',
      delivery_days: input.delivery_days || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateArticleStyle(
  id: string,
  userId: string,
  input: UpdateArticleStyleInput
): Promise<ArticleStyle> {
  const supabase = await getServerSupabaseClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.style_samples !== undefined) updateData.style_samples = input.style_samples;
  if (input.subjects !== undefined) updateData.subjects = input.subjects;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.display_name !== undefined) updateData.display_name = input.display_name;
  if (input.preferred_language !== undefined)
    updateData.preferred_language = input.preferred_language;
  if (input.delivery_days !== undefined) updateData.delivery_days = input.delivery_days;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('article_styles')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteArticleStyle(id: string, userId: string): Promise<void> {
  const supabase = await getServerSupabaseClient();

  const { error } = await supabase
    .from('article_styles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// Draft management for step-based creation
export async function saveDraft(draft: ArticleStyleDraft): Promise<string> {
  const supabase = await getServerSupabaseClient();

  if (draft.id) {
    // Update existing draft
    const { error } = await supabase
      .from('article_styles')
      .update({
        style_samples: draft.style_samples,
        subjects: draft.subjects,
        name: draft.name,
        email: draft.email,
        display_name: draft.display_name,
        preferred_language: draft.preferred_language,
        delivery_days: draft.delivery_days,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id)
      .eq('user_id', draft.user_id);

    if (error) throw new Error(error.message);
    return draft.id;
  }

  // Create new draft
  const { data, error } = await supabase
    .from('article_styles')
    .insert({
      user_id: draft.user_id,
      name: draft.name || 'Untitled Style',
      style_samples: draft.style_samples || [],
      subjects: draft.subjects || [],
      email: draft.email || null,
      display_name: draft.display_name || null,
      preferred_language: draft.preferred_language || 'en',
      delivery_days: draft.delivery_days || [],
      is_active: false, // Draft is not active until completed
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function completeDraft(id: string, userId: string): Promise<ArticleStyle> {
  const supabase = await getServerSupabaseClient();

  const { data, error } = await supabase
    .from('article_styles')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDraft(userId: string): Promise<ArticleStyle | null> {
  const supabase = await getServerSupabaseClient();

  const { data, error } = await supabase
    .from('article_styles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

import { createClient } from './supabase-browser';

export interface SavedProperty {
  id: string;
  user_id: string;
  listing_id: string;
  listing_type: 'mls' | 'off_market';
  created_at: string;
}

export async function saveProperty(
  listingId: string,
  listingType: 'mls' | 'off_market' = 'mls'
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Must be logged in to save properties') };
  }

  const { error } = await supabase
    .from('saved_properties')
    .insert({
      user_id: user.id,
      listing_id: listingId,
      listing_type: listingType,
    });

  if (error) {
    // Ignore duplicate key errors (property already saved)
    if (error.code === '23505') {
      return { error: null };
    }
    return { error: new Error(error.message) };
  }

  return { error: null };
}

export async function unsaveProperty(
  listingId: string,
  listingType: 'mls' | 'off_market' = 'mls'
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Must be logged in to unsave properties') };
  }

  const { error } = await supabase
    .from('saved_properties')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .eq('listing_type', listingType);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

export async function isPropertySaved(
  listingId: string,
  listingType: 'mls' | 'off_market' = 'mls'
): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('saved_properties')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .eq('listing_type', listingType)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function getSavedPropertyIds(
  listingType?: 'mls' | 'off_market'
): Promise<string[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  let query = supabase
    .from('saved_properties')
    .select('listing_id')
    .eq('user_id', user.id);

  if (listingType) {
    query = query.eq('listing_type', listingType);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((item) => item.listing_id);
}

export async function getSavedProperties(): Promise<SavedProperty[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('saved_properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as SavedProperty[];
}

export async function toggleSaveProperty(
  listingId: string,
  listingType: 'mls' | 'off_market' = 'mls'
): Promise<{ saved: boolean; error: Error | null }> {
  const isSaved = await isPropertySaved(listingId, listingType);

  if (isSaved) {
    const { error } = await unsaveProperty(listingId, listingType);
    return { saved: false, error };
  } else {
    const { error } = await saveProperty(listingId, listingType);
    return { saved: true, error };
  }
}

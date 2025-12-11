import { supabase } from './supabase';
import { getSession } from './customAuth';

export async function requestRide(params: {
  origin_address?: string;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_address?: string;
  destination_lat?: number | null;
  destination_lng?: number | null;
  vehicle_type?: string | null;
  scheduled_at?: string | null; // ISO string or null
}) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  // Match the exact parameter order from the SQL function definition
  const rpcParams = {
    p_rider_id: session.userId,
    p_origin_address: params.origin_address ?? null,
    p_origin_lat: params.origin_lat ?? null,
    p_origin_lng: params.origin_lng ?? null,
    p_destination_address: params.destination_address ?? null,
    p_destination_lat: params.destination_lat ?? null,
    p_destination_lng: params.destination_lng ?? null,
    p_scheduled_at: params.scheduled_at ?? null,
    p_vehicle_type: params.vehicle_type ?? null,
    p_metadata: {},
  };

  try {
    const { data, error } = await supabase.rpc('create_ride', rpcParams);
    
    if (error) {
      console.error('RPC error:', error);
      throw new Error(error.message || 'Failed to create ride');
    }
    
    // Handle response - data is an array with one object containing id
    if (!data || data.length === 0) {
      throw new Error('No ride created - empty response from database');
    }
    
    const rideId = data[0]?.id;
    if (!rideId) {
      throw new Error('No ride ID returned from database');
    }
    
    return rideId;
  } catch (err: any) {
    console.error('RequestRide error:', err);
    throw err;
  }
}

export async function getRide(rideId: string) {
  const { data, error } = await supabase.from('rides').select('*').eq('id', rideId).single();
  if (error) throw error;
  return data;
}

export async function cancelRide(rideId: string) {
  // use update_ride_status RPC
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { data, error } = await supabase.rpc('update_ride_status', {
    p_ride_id: rideId,
    p_new_status: 'cancelled',
    p_actor_id: session.userId,
    p_note: 'Cancelled by rider',
  });
  if (error) throw error;
  return data;
}

export async function getDriverProfile(driverId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', driverId).single();
  if (error) return null;
  return data;
}

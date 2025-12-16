import { supabase } from './supabase';
import { getSession } from './customAuth';

export interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  status: 'requested' | 'scheduled' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  vehicle_type: string;
  requested_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula (in kilometers)
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', driverId).single();
    if (error) {
      console.error('Error fetching driver profile:', error);
      return null;
    }
    console.log('Driver profile fetched:', data);
    return data;
  } catch (err) {
    console.error('Exception fetching driver profile:', err);
    return null;
  }
}

export async function getRidesForRider(): Promise<Ride[]> {
  const session = await getSession();
  if (!session) {
    console.warn('getRidesForRider called without session - returning empty list');
    return [];
  }

  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('rider_id', session.userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rides for rider:', error);
    throw error;
  }
  return data || [];
}

export async function updateRideStatus(rideId: string, newStatus: Ride['status']): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('update_ride_status', {
    p_ride_id: rideId,
    p_new_status: newStatus,
    p_actor_id: session.userId,
    p_note: `Status updated to ${newStatus}`,
  });

  if (error) throw error;
}

/**
 * Fetch all pending ride requests with optional distance filtering
 * @param driverLat - Driver's current latitude
 * @param driverLng - Driver's current longitude
 * @param radiusKm - Search radius in kilometers (default: 10km)
 */
export async function getNearbyRides(driverLat: number, driverLng: number, radiusKm: number = 10): Promise<Ride[]> {
  try {
    // Fetch all pending/requested rides
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'requested')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter by distance on client side
    const nearbyRides = (data || []).filter(ride => {
      if (!ride.origin_lat || !ride.origin_lng) return false;
      const distance = calculateDistance(driverLat, driverLng, ride.origin_lat, ride.origin_lng);
      return distance <= radiusKm;
    });

    return nearbyRides;
  } catch (err) {
    console.error('Error fetching nearby rides:', err);
    throw err;
  }
}


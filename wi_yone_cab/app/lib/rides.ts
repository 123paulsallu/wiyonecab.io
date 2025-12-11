import { supabase } from './supabase';
import { getSession } from './customAuth';

export interface RideRequest {
  origin_address: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  vehicle_type: string;
  scheduled_at: string | null;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  origin_address: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  vehicle_type: string;
  status: 'pending' | 'picked_up' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request a new ride
 */
export async function requestRide(request: RideRequest): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('rides')
    .insert({
      rider_id: session.userId,
      origin_address: request.origin_address,
      origin_lat: request.origin_lat,
      origin_lng: request.origin_lng,
      destination_address: request.destination_address,
      destination_lat: request.destination_lat,
      destination_lng: request.destination_lng,
      vehicle_type: request.vehicle_type,
      status: 'pending',
      scheduled_at: request.scheduled_at,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

/**
 * Get rides for the current rider
 */
export async function getRidesForRider(): Promise<Ride[]> {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('rider_id', session.userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Update ride status
 */
export async function updateRideStatus(rideId: string, status: Ride['status']): Promise<void> {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('rides')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', rideId)
    .eq('rider_id', session.userId); // Ensure only rider can update their own rides

  if (error) {
    throw new Error(error.message);
  }
}

// Placeholder so Expo Router doesn't treat this helper file as a missing-route component.
export default function _RidesPlaceholder() {
  return null;
}

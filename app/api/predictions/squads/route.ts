/**
 * Squad Markets API
 *
 * Private group predictions for friend groups
 *
 * Features:
 * - Create squads with invite codes
 * - Custom markets within squads
 * - Pool betting with payout distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// SQUAD MANAGEMENT
// ============================================================================

/**
 * POST - Create a new squad
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, name, description, isPrivate = true } = await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name required' },
        { status: 400 }
      );
    }

    // Generate invite code
    const inviteCode = nanoid(8).toUpperCase();

    // Create squad
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .insert({
        name,
        description,
        creator_id: userId,
        invite_code: inviteCode,
        is_private: isPrivate,
      })
      .select()
      .single();

    if (squadError) {
      console.error('Error creating squad:', squadError);
      return NextResponse.json(
        { error: 'Failed to create squad' },
        { status: 500 }
      );
    }

    // Add creator as admin member
    await supabase.from('squad_members').insert({
      squad_id: squad.id,
      user_id: userId,
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      squad,
      inviteCode,
    });

  } catch (error) {
    console.error('Create squad error:', error);
    return NextResponse.json(
      { error: 'Failed to create squad' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get squads for a user or by invite code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const inviteCode = searchParams.get('inviteCode');
    const squadId = searchParams.get('squadId');

    // Get squad by invite code
    if (inviteCode) {
      const { data: squad, error } = await supabase
        .from('squads')
        .select(`
          *,
          creator:users!squads_creator_id_fkey(id, username, avatar_url),
          members:squad_members(
            user:users(id, username, avatar_url),
            role
          )
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (error || !squad) {
        return NextResponse.json(
          { error: 'Squad not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ squad });
    }

    // Get specific squad
    if (squadId) {
      const { data: squad, error } = await supabase
        .from('squads')
        .select(`
          *,
          creator:users!squads_creator_id_fkey(id, username, avatar_url),
          members:squad_members(
            user:users(id, username, avatar_url),
            role
          ),
          markets:squad_markets(
            *,
            creator:users!squad_markets_creator_id_fkey(id, username, avatar_url)
          )
        `)
        .eq('id', squadId)
        .single();

      if (error || !squad) {
        return NextResponse.json(
          { error: 'Squad not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ squad });
    }

    // Get user's squads
    if (!userId) {
      return NextResponse.json(
        { error: 'userId, inviteCode, or squadId required' },
        { status: 400 }
      );
    }

    const { data: memberships } = await supabase
      .from('squad_members')
      .select('squad_id, role')
      .eq('user_id', userId);

    if (!memberships?.length) {
      return NextResponse.json({ squads: [] });
    }

    const squadIds = memberships.map(m => m.squad_id);

    const { data: squads, error } = await supabase
      .from('squads')
      .select(`
        *,
        creator:users!squads_creator_id_fkey(id, username, avatar_url),
        members:squad_members(count)
      `)
      .in('id', squadIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching squads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch squads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ squads });

  } catch (error) {
    console.error('Get squads error:', error);
    return NextResponse.json(
      { error: 'Failed to get squads' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Join squad or update settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const { action, userId, squadId, inviteCode, ...data } = await request.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'action and userId required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'join': {
        if (!inviteCode) {
          return NextResponse.json(
            { error: 'inviteCode required' },
            { status: 400 }
          );
        }

        // Find squad by invite code
        const { data: squad } = await supabase
          .from('squads')
          .select('id, max_members')
          .eq('invite_code', inviteCode.toUpperCase())
          .single();

        if (!squad) {
          return NextResponse.json(
            { error: 'Invalid invite code' },
            { status: 404 }
          );
        }

        // Check member count
        const { count } = await supabase
          .from('squad_members')
          .select('*', { count: 'exact' })
          .eq('squad_id', squad.id);

        if (count && count >= squad.max_members) {
          return NextResponse.json(
            { error: 'Squad is full' },
            { status: 400 }
          );
        }

        // Check if already member
        const { data: existing } = await supabase
          .from('squad_members')
          .select('id')
          .eq('squad_id', squad.id)
          .eq('user_id', userId)
          .single();

        if (existing) {
          return NextResponse.json(
            { error: 'Already a member' },
            { status: 400 }
          );
        }

        // Join squad
        await supabase.from('squad_members').insert({
          squad_id: squad.id,
          user_id: userId,
          role: 'member',
        });

        return NextResponse.json({ success: true, squadId: squad.id });
      }

      case 'leave': {
        if (!squadId) {
          return NextResponse.json(
            { error: 'squadId required' },
            { status: 400 }
          );
        }

        // Check if admin (can't leave if only admin)
        const { data: member } = await supabase
          .from('squad_members')
          .select('role')
          .eq('squad_id', squadId)
          .eq('user_id', userId)
          .single();

        if (member?.role === 'admin') {
          const { count } = await supabase
            .from('squad_members')
            .select('*', { count: 'exact' })
            .eq('squad_id', squadId)
            .eq('role', 'admin');

          if (count === 1) {
            return NextResponse.json(
              { error: 'Must transfer admin before leaving' },
              { status: 400 }
            );
          }
        }

        await supabase
          .from('squad_members')
          .delete()
          .eq('squad_id', squadId)
          .eq('user_id', userId);

        return NextResponse.json({ success: true });
      }

      case 'update': {
        if (!squadId) {
          return NextResponse.json(
            { error: 'squadId required' },
            { status: 400 }
          );
        }

        // Verify admin
        const { data: member } = await supabase
          .from('squad_members')
          .select('role')
          .eq('squad_id', squadId)
          .eq('user_id', userId)
          .single();

        if (member?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can update squad' },
            { status: 403 }
          );
        }

        const { data: updated, error } = await supabase
          .from('squads')
          .update({
            name: data.name,
            description: data.description,
          })
          .eq('id', squadId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return NextResponse.json({ success: true, squad: updated });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Update squad error:', error);
    return NextResponse.json(
      { error: 'Failed to update squad' },
      { status: 500 }
    );
  }
}

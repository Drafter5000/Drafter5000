import { getSupabaseAdmin } from '../supabase-admin';
import type { AdminAction, AuditLogEntry } from '../types';

export interface CreateAuditLogInput {
  admin_id: string;
  action: AdminAction;
  target_type: 'user' | 'organization';
  target_id: string | null;
  details?: Record<string, unknown>;
  ip_address?: string | null;
}

/**
 * Creates an audit log entry for admin actions
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogEntry | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      admin_id: input.admin_id,
      action: input.action,
      target_type: input.target_type,
      target_id: input.target_id,
      details: input.details || {},
      ip_address: input.ip_address || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }

  return data as AuditLogEntry;
}

/**
 * Gets audit logs with optional filtering
 */
export async function getAuditLogs(params?: {
  admin_id?: string;
  action?: AdminAction;
  target_type?: 'user' | 'organization';
  target_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

  if (params?.admin_id) {
    query = query.eq('admin_id', params.admin_id);
  }
  if (params?.action) {
    query = query.eq('action', params.action);
  }
  if (params?.target_type) {
    query = query.eq('target_type', params.target_type);
  }
  if (params?.target_id) {
    query = query.eq('target_id', params.target_id);
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }

  return data as AuditLogEntry[];
}

/**
 * Gets recent audit logs for dashboard display
 */
export async function getRecentAuditLogs(limit: number = 10): Promise<AuditLogEntry[]> {
  return getAuditLogs({ limit });
}

import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
 private readonly client: SupabaseClient | null;
 constructor(config: ConfigService) {
  const url = config.get<string>("SUPABASE_URL");
  const key = config.get<string>("SUPABASE_ANON_KEY");
  this.client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
 }
 get db(): SupabaseClient {
  if (!this.client) throw new ServiceUnavailableException("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  return this.client;
 }
}

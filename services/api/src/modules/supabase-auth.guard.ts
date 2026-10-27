import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
 constructor(private readonly supabase: SupabaseService) {}
 async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<any>();
  const header = request.headers.authorization as string | undefined;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new UnauthorizedException("Bearer access token required");
  const { data, error } = await this.supabase.db.auth.getUser(token);
  if (error || !data.user) throw new UnauthorizedException("Invalid or expired access token");
  request.user = { id: data.user.id, email: data.user.email };
  return true;
 }
}

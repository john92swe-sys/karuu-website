import { api, sameOrigin } from '@/lib/server/http';
import { requireAdmin } from '@/lib/server/auth';
import { uploadPrivateAsset } from '@/lib/server/private-upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request, context: { params: Promise<{ assetId: string }> }) {
  return api(async () => {
    sameOrigin(request);
    const user = await requireAdmin();
    return uploadPrivateAsset(user, (await context.params).assetId, request);
  });
}

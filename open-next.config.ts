import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Current content and commerce are dynamic. No R2/ISR cache is provisioned.
export default defineCloudflareConfig();

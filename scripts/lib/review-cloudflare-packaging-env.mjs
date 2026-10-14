// OpenNext starts a local platform proxy while packaging/deploying. It needs a
// Hyperdrive emulator string even though these commands never query a local DB.
// This loopback-only placeholder is not a runtime credential or remote origin.
export function reviewCloudflarePackagingEnv(target, inherited = process.env) {
  const env = { ...inherited, WRANGLER_SEND_METRICS: 'false' };
  const variable = 'CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_COMMERCE';
  if (target.hyperdrive?.some(binding => binding.binding === 'HYPERDRIVE_COMMERCE') && !env[variable]) {
    env[variable] = 'postgres://karuu_packaging:packaging_only@127.0.0.1:1/karuu_packaging';
  }
  return env;
}

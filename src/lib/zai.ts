import ZAI, { type ZAIConfig } from "z-ai-web-dev-sdk";

let _zaiInstance: ZAI | null = null;

/**
 * Creates a ZAI SDK instance.
 *
 * Priority:
 * 1. Tries the default `ZAI.create()` which reads from `.z-ai-config` file
 * 2. Falls back to environment variables: ZAI_BASE_URL + ZAI_API_KEY
 *
 * For Vercel deployment, set these env vars:
 * - ZAI_BASE_URL  (required)
 * - ZAI_API_KEY   (required)
 * - ZAI_CHAT_ID   (optional)
 * - ZAI_USER_ID   (optional)
 * - ZAI_TOKEN     (optional)
 */
export async function getZAI(): Promise<ZAI> {
  if (_zaiInstance) return _zaiInstance;

  // Try the default way first (reads from .z-ai-config file)
  try {
    _zaiInstance = await ZAI.create();
    return _zaiInstance;
  } catch {
    // Config file not found — fall through to env vars
  }

  const baseUrl = process.env.ZAI_BASE_URL;
  const apiKey = process.env.ZAI_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "ZAI configuration not found. Set ZAI_BASE_URL and ZAI_API_KEY environment variables, or create a .z-ai-config file."
    );
  }

  const config: ZAIConfig = {
    baseUrl,
    apiKey,
    chatId: process.env.ZAI_CHAT_ID,
    userId: process.env.ZAI_USER_ID,
    token: process.env.ZAI_TOKEN,
  };

  // Bypass private constructor — the SDK only exposes ZAI.create() which
  // requires a config file, but the constructor itself accepts a config object.
  const ZAIClass = ZAI as unknown as { new (config: ZAIConfig): ZAI };
  _zaiInstance = new ZAIClass(config);
  return _zaiInstance;
}

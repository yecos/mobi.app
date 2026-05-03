import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export function getOpenAI(): OpenAI {
  if (!globalForOpenAI.openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Add it in Vercel → Settings → Environment Variables."
      );
    }
    globalForOpenAI.openai = new OpenAI({ apiKey });
  }
  return globalForOpenAI.openai;
}

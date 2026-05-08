import { z } from "zod";

export const REPO_URL = __REPO_URL__;
export const PAYPAL_URL = __PAYPAL_URL__;

const BuildInfoSchema = z.object({
  version: z.string(),
  commit: z.string(),
  builtAt: z.string(),
  repoUrl: z.string().url(),
  paypalUrl: z.string().url()
});

export type BuildInfo = z.infer<typeof BuildInfoSchema>;

export const fallbackBuildInfo: BuildInfo = {
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  builtAt: new Date(0).toISOString(),
  repoUrl: REPO_URL,
  paypalUrl: PAYPAL_URL
};

export async function fetchBuildInfo(): Promise<BuildInfo> {
  const response = await fetch(`${import.meta.env.BASE_URL}build-info.json`, {
    cache: "no-store"
  });

  if (!response.ok) {
    return fallbackBuildInfo;
  }

  const parsed = BuildInfoSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : fallbackBuildInfo;
}

/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Set by `.env.artifact` for the hosted, sandboxed preview build. */
  readonly VITE_ARTIFACT?: string;
  /** Optional api.nasa.gov key for the DONKI space-weather feed (falls back to DEMO_KEY). */
  readonly VITE_NASA_API_KEY?: string;
}

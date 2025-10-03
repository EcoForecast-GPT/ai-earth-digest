/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG?: string;
  readonly VITE_PREDICTION_TIMER_MS?: string;
  readonly NEXT_PUBLIC_DEBUG?: string;
  readonly NEXT_PUBLIC_PREDICTION_TIMER_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
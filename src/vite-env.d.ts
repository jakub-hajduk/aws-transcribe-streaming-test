/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ACCESS_KEY_ID: string
  readonly SECRET_ACCESS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

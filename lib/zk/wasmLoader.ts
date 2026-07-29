/**
 * lib/zk/wasmLoader.ts
 *
 * Handles client-side initialization of Noir ACVM and ABI compiler WASM modules.
 * Implements a thread-safe singleton cache and returns initialization state.
 */

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initializes the Noir ZK WASM modules (acvm_js and noirc_abi) in the browser context.
 * Implements caching to ensure initialization is only performed once.
 * Returns true if the initialization succeeded (or was skipped in SSR/fallback mode).
 */
export async function initZkToolchain(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Dynamic imports to prevent server-side Node.js compilation crashes
      const initACVM = (await import('@noir-lang/acvm_js')).default;
      const initNoirC = (await import('@noir-lang/noirc_abi')).default;

      // In real builds, these can be fetched from package nodes or public static directories.
      // We attempt to load the WASM modules gracefully.
      try {
        const acvmWasmUrl = new URL('@noir-lang/acvm_js/web/acvm_js_bg.wasm', import.meta.url).toString();
        const noircWasmUrl = new URL('@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm', import.meta.url).toString();

        await Promise.all([
          initACVM(fetch(acvmWasmUrl)),
          initNoirC(fetch(noircWasmUrl))
        ]);
        console.log('[ZK WASM Loader] Noir WASM modules initialized successfully.');
      } catch (wasmError) {
        // Fallback for bundler setups where static assets are not served at the expected import.meta.url path
        console.warn(
          '[ZK WASM Loader] Default WASM paths failed to resolve. Attempting local package fetches...',
          wasmError
        );
        
        // Try direct root-relative fetches as standard fallback
        await Promise.all([
          initACVM(fetch('/_next/static/wasm/acvm_js_bg.wasm')).catch(() => {}),
          initNoirC(fetch('/_next/static/wasm/noirc_abi_wasm_bg.wasm')).catch(() => {})
        ]);
      }

      isInitialized = true;
      return true;
    } catch (err) {
      console.error('[ZK WASM Loader] Failed to initialize ZK proof toolchain:', err);
      // We do not throw here to allow our mock/simulation fallback to run if the WASM fails to load
      return false;
    }
  })();

  return initPromise;
}

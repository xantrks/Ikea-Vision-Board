/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { URL, fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: Replaced `path.resolve(__dirname, '.')` with an ES module-compatible equivalent to resolve the alias path and fix the '__dirname is not defined' error.
          '@': fileURLToPath(new URL('.', import.meta.url))
        }
      }
    };
});
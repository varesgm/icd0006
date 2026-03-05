/// <reference types="vite/client" />
import { TaskManager } from './app';
import { seedDatabase, clearSeedData } from './seed';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new TaskManager();
  await app.init();

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).seed = async () => {
      await seedDatabase(app.storage);
      location.reload();
    };
    (window as unknown as Record<string, unknown>).clearSeed = async () => {
      await clearSeedData(app.storage);
      location.reload();
    };
    console.log('[Dev] Seed helpers ready: window.seed() / window.clearSeed()');
  }
});

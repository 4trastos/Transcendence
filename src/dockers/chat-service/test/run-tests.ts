import { readdirSync, statSync } from 'fs';
import { join, resolve  } from 'path';

async function runTests(dir: string) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      await runTests(path);
    } else if (entry.endsWith('.test.ts')) {
      const absolutePath = resolve(path);

      console.log(`Running test: ${path}`);
      await import( absolutePath);
    }
  }
}

runTests('./test')
  .catch((err) => {
    console.error('❌ Error running tests:', err);
    process.exit(1);
  });

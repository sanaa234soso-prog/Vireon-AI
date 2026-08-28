import fs from 'fs';
import path from 'path';

/**
 * Returns a writable directory for state persistence.
 * Checks local `./data` directory first; falls back to `/tmp/vireon_data` if read-only (e.g. Vercel serverless / Lambda).
 */
export function getStorageDirectory(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join('/tmp', 'vireon_data');
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch (err) {
        console.warn('Could not create /tmp/vireon_data:', err);
      }
    }
    return tmpDir;
  }

  const localDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch (err) {
    console.warn('Local data directory not writable, using /tmp/vireon_data fallback:', err);
    const tmpDir = path.join('/tmp', 'vireon_data');
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return tmpDir;
  }
}

export function getStorageFilePath(filename: string): string {
  const dir = getStorageDirectory();
  return path.join(dir, filename);
}

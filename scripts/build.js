import { copyFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
  const rootDir = join(__dirname, '..');
  const buildDir = join(rootDir, 'docs');

  try {
    // Create build directory
    await mkdir(buildDir, { recursive: true });

    // Copy static files
    await copyFile(
      join(rootDir, 'public', 'index.html'),
      join(buildDir, 'index.html')
    );

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 
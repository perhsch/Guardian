import { glob } from 'glob';

export async function loadFiles(dirName: string): Promise<string[]> {
    const pattern = `${process.cwd().replace(/\\/g, '/')}/${dirName}/**/*.{js,ts}`;
    const files = await glob(pattern);
    return files.map(file => file.replace(/\\/g, '/'));
}

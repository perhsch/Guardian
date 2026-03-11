import glob from 'glob';

export async function loadFiles(dirName: string): Promise<string[]> {
    const pattern = `${process.cwd().replace(/\\/g, '/')}/${dirName}/**/*.{js,ts}`;
    return new Promise((resolve, reject) => {
        glob(pattern, (err: Error | null, files: string[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(files.map((file: string) => file.replace(/\\/g, '/')));
            }
        });
    });
}

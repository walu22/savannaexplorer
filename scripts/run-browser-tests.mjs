import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const playwrightCli = path.join(projectRoot, 'node_modules', '@playwright', 'test', 'cli.js');

function waitForExit(child) {
    if (child.exitCode !== null) return Promise.resolve(child.exitCode);
    return new Promise(resolve => child.once('exit', resolve));
}

async function waitForPreview(child) {
    const deadline = Date.now() + 30_000;

    while (Date.now() < deadline) {
        if (child.exitCode !== null) throw new Error(`Preview server exited with code ${child.exitCode}`);

        try {
            const response = await fetch('http://127.0.0.1:4173', {
                signal: AbortSignal.timeout(1_000),
            });
            if (response.ok) return;
        } catch {
            // The preview server may still be starting.
        }

        await new Promise(resolve => setTimeout(resolve, 250));
    }

    throw new Error('Timed out waiting for the preview server on port 4173');
}

const preview = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: projectRoot,
    stdio: 'inherit',
});

try {
    await waitForPreview(preview);

    const tests = spawn(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
        cwd: projectRoot,
        stdio: 'inherit',
    });
    const exitCode = await waitForExit(tests);
    process.exitCode = exitCode ?? 1;
} finally {
    preview.kill();

    const stopped = await Promise.race([
        waitForExit(preview).then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 2_000)),
    ]);

    if (!stopped && process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' });
    } else if (!stopped) {
        preview.kill('SIGKILL');
    }
}

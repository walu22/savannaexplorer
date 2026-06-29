/**
 * One-time Google Search Console API setup helper.
 *
 * Usage:
 *   node scripts/setup-gsc-api.mjs --file ./gsc-key.json
 *   node scripts/setup-gsc-api.mjs --file ./gsc-key.json --github-secret
 *   GSC_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' node scripts/setup-gsc-api.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
    getGoogleAccessToken,
    getGoogleSitemap,
    listSearchConsoleSites,
    parseServiceAccount,
    siteHasAccess,
    submitGoogleSitemap,
} from './lib/gsc-api.mjs';

const SITE_ORIGIN = (process.env.VITE_SITE_URL || 'https://savannaexplorer.com').replace(/\/$/, '');
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;

function printUsage() {
    console.log(`Google Search Console API setup

Steps (one-time):
  1. Google Cloud Console → enable "Google Search Console API"
  2. Create a service account → download JSON key
  3. Search Console → Settings → Users → add service account email as Owner
  4. Run this script with the JSON key to verify and store the GitHub secret

Usage:
  node scripts/setup-gsc-api.mjs --file ./gsc-key.json [--github-secret]
  node scripts/setup-gsc-api.mjs --help

Options:
  --file PATH          Path to service account JSON key file
  --github-secret      Store JSON in GitHub secret GSC_SERVICE_ACCOUNT_JSON (needs gh auth)
  --skip-submit        Verify access only; do not resubmit sitemap
  --help               Show this message
`);
}

function parseArgs(argv) {
    const options = {
        file: null,
        githubSecret: false,
        skipSubmit: false,
        help: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--file') {
            options.file = argv[++i];
        } else if (arg === '--github-secret') {
            options.githubSecret = true;
        } else if (arg === '--skip-submit') {
            options.skipSubmit = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return options;
}

function loadServiceAccountJson(options) {
    if (process.env.GSC_SERVICE_ACCOUNT_JSON?.trim()) {
        return process.env.GSC_SERVICE_ACCOUNT_JSON.trim();
    }

    if (options.file) {
        return readFileSync(resolve(process.cwd(), options.file), 'utf8').trim();
    }

    throw new Error('Provide --file path/to/key.json or set GSC_SERVICE_ACCOUNT_JSON');
}

function storeGithubSecret(json) {
    const result = spawnSync('gh', ['secret', 'set', 'GSC_SERVICE_ACCOUNT_JSON'], {
        input: json,
        encoding: 'utf8',
    });

    if (result.status !== 0) {
        const message = (result.stderr || result.stdout || '').trim();
        console.error('\nCould not set GitHub secret automatically.');
        if (message) console.error(message);
        console.error('\nAdd it manually in GitHub → Settings → Secrets → Actions:');
        console.error('  Name: GSC_SERVICE_ACCOUNT_JSON');
        console.error('  Value: paste the full JSON file contents');
        console.error('\nOr run locally (with repo admin access):');
        console.error('  gh secret set GSC_SERVICE_ACCOUNT_JSON < path/to/gsc-key.json');
        return false;
    }

    console.log('GitHub secret GSC_SERVICE_ACCOUNT_JSON saved.');
    return true;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printUsage();
        return;
    }

    const rawJson = loadServiceAccountJson(options);
    const serviceAccount = parseServiceAccount(rawJson);

    console.log(`Service account: ${serviceAccount.client_email}`);
    console.log(`Site: ${SITE_ORIGIN}`);

    const token = await getGoogleAccessToken(serviceAccount);
    console.log('Google OAuth token: OK');

    const sites = await listSearchConsoleSites(token);
    if (!siteHasAccess(sites, SITE_ORIGIN)) {
        console.error('\nThis service account cannot access the Search Console property yet.');
        console.error('Add this email as Owner in Search Console → Settings → Users and permissions:');
        console.error(`  ${serviceAccount.client_email}`);
        console.error('\nThen re-run this script.');
        process.exit(1);
    }

    console.log('Search Console property access: OK');

    if (!options.skipSubmit) {
        const submit = await submitGoogleSitemap(SITE_ORIGIN, SITEMAP_URL, token);
        console.log(`Sitemap resubmitted → HTTP ${submit.status}`);

        try {
            const info = await getGoogleSitemap(SITE_ORIGIN, SITEMAP_URL, token);
            if (info.lastSubmitted) {
                console.log(`  lastSubmitted: ${info.lastSubmitted}`);
            }
            if (info.isPending !== undefined) {
                console.log(`  isPending: ${info.isPending}`);
            }
        } catch {
            // optional status read
        }
    }

    if (options.githubSecret) {
        storeGithubSecret(rawJson);
    } else {
        console.log('\nNext: store the JSON key as GitHub secret GSC_SERVICE_ACCOUNT_JSON');
        console.log('  gh secret set GSC_SERVICE_ACCOUNT_JSON < path/to/gsc-key.json');
        console.log('Or re-run with --github-secret after gh auth login.');
    }

    console.log('\nGSC API setup verified.');
}

main().catch(error => {
    console.error(error.message || error);
    process.exit(1);
});

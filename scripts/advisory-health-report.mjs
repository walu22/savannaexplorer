import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runAdvisoryHealthCheck } from '../api/_lib/advisory-health.js';

const advisoryData = JSON.parse(await readFile(resolve(process.cwd(), 'data/travel-advisories.json'), 'utf8'));
const report = await runAdvisoryHealthCheck(advisoryData);
const outputDir = resolve(process.cwd(), '.reports');
const outputFile = resolve(outputDir, 'advisory-health.json');

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Advisory health: ${report.summary.healthy} healthy, ${report.summary.guarded} guarded, ${report.summary.failed} failed (${report.summary.sources} sources).`);
console.log(`Human review: ${report.summary.overdue} overdue, ${report.summary.dueSoon} due soon (${report.summary.countries} countries).`);
console.log(`Report: ${outputFile}`);

if (!report.ok) process.exitCode = 1;

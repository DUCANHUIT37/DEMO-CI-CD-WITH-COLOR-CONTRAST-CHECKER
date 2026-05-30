#!/usr/bin/env node
/**
 * ai-fix.js — AI Auto-Fix Bot for MHHCHECKER CI
 *
 * Flow:
 *   1. Read the Jest failure log captured by GitHub Actions
 *   2. Read all relevant backend source files
 *   3. Call Claude API with the context
 *   4. Parse the structured response to extract file patches
 *   5. Write patched files to disk (GitHub Actions will commit them)
 *
 * Requires env:
 *   ANTHROPIC_API_KEY  — Claude API key (GitHub Secret)
 *   TEST_LOG_PATH      — path to the captured Jest output file
 */

'use strict';

const https   = require('https');
const fs      = require('fs');
const path    = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const API_KEY      = process.env.ANTHROPIC_API_KEY;
const TEST_LOG     = process.env.TEST_LOG_PATH || '/tmp/ci-logs/test-output.txt';
const PROJECT_ROOT = path.resolve(__dirname, '../../');

/** Source files the AI is allowed to read AND patch. */
const CANDIDATE_FILES = [
  'backend/src/utils/contrastCalculator.ts',
  'backend/src/controllers/contrastController.ts',
  'backend/src/routes/contrast.ts',
];

/** Test files the AI may read for context but must NOT patch. */
const TEST_FILES = [
  'backend/tests/contrast.test.ts',
];

// ─── Validation ──────────────────────────────────────────────────────────────

if (!API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set. Add it to GitHub Secrets.');
  process.exit(1);
}

if (!fs.existsSync(TEST_LOG)) {
  console.error(`❌  Test log not found at: ${TEST_LOG}`);
  process.exit(1);
}

// ─── Read files ───────────────────────────────────────────────────────────────

function readFile(relPath) {
  try {
    return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

const testLog = fs.readFileSync(TEST_LOG, 'utf8');

const sourceSection = CANDIDATE_FILES
  .map(p => {
    const content = readFile(p);
    return content ? `### ${p}\n\`\`\`typescript\n${content}\n\`\`\`` : null;
  })
  .filter(Boolean)
  .join('\n\n');

const testSection = TEST_FILES
  .map(p => {
    const content = readFile(p);
    return content ? `### ${p} (READ-ONLY — do not modify)\n\`\`\`typescript\n${content}\n\`\`\`` : null;
  })
  .filter(Boolean)
  .join('\n\n');

// ─── Prompt ───────────────────────────────────────────────────────────────────

const PROMPT = `You are an expert TypeScript developer acting as an automated CI repair bot.
Backend Jest tests are failing. Your job: analyse the failure, fix the implementation files, and return the corrected file contents.

## Jest failure log
\`\`\`
${testLog}
\`\`\`

## Implementation files (you MAY edit these)
${sourceSection}

## Test files (READ-ONLY — never change these)
${testSection}

## Rules
1. Fix only implementation files, never the test files.
2. Keep the full file content intact — do not omit any unchanged parts.
3. Do not introduce new external dependencies.
4. Return each fixed file in this EXACT XML format (one block per file):

<file_fix>
<path>backend/src/utils/contrastCalculator.ts</path>
<content>
// … complete file content …
</content>
</file_fix>

If you cannot determine a safe fix, return an empty response — do not guess.
`;

// ─── Claude API call ──────────────────────────────────────────────────────────

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      'claude-opus-4-5',
      max_tokens: 4096,
      messages:   [{ role: 'user', content: prompt }],
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path:     '/v1/messages',
        method:   'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         API_KEY,
          'anthropic-version': '2023-06-01',
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse API response: ${data.slice(0, 300)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Parse response ───────────────────────────────────────────────────────────

function parseFileFixes(text) {
  const fixes   = [];
  const pattern = /<file_fix>\s*<path>(.*?)<\/path>\s*<content>([\s\S]*?)<\/content>\s*<\/file_fix>/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const filePath = match[1].trim();
    const content  = match[2].replace(/^\n/, '').replace(/\n$/, '');

    // Safety: never allow AI to overwrite test files
    if (TEST_FILES.includes(filePath)) {
      console.warn(`⚠️  AI tried to modify test file "${filePath}" — skipped.`);
      continue;
    }
    fixes.push({ path: filePath, content });
  }
  return fixes;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🤖  Sending failure context to Claude AI…');

  const response = await callClaude(PROMPT);

  if (response.error) {
    console.error('❌  Claude API error:', JSON.stringify(response.error));
    process.exit(1);
  }

  const text  = response.content?.[0]?.text ?? '';
  const fixes = parseFileFixes(text);

  if (fixes.length === 0) {
    console.log('⚠️  Claude found no fixable issues — no files changed.');
    process.exit(1);          // signals GitHub Actions: nothing to commit
  }

  // Apply patches
  for (const fix of fixes) {
    const fullPath = path.join(PROJECT_ROOT, fix.path);
    fs.writeFileSync(fullPath, fix.content + '\n', 'utf8');
    console.log(`✅  Patched: ${fix.path}`);
  }

  console.log(`\n🎉  ${fixes.length} file(s) patched — ready to commit.`);
}

main().catch(err => {
  console.error('❌  Unhandled error:', err.message || err);
  process.exit(1);
});

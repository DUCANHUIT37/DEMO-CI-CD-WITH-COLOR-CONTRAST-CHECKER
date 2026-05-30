#!/usr/bin/env node
/**
 * ai-optimize-pipeline.js — Level 4: Claude tự tối ưu ci-cd.yml
 *
 * Chạy sau khi CI thành công. Claude đọc toàn bộ workflow, phân tích
 * và đề xuất (hoặc tự apply) các tối ưu:
 *   - Path filters: không chạy backend test khi chỉ frontend thay đổi
 *   - Caching tốt hơn
 *   - Tái sử dụng artifacts giữa các jobs
 *   - Loại bỏ bước thừa
 *   - Kiểm tra security headers
 */

'use strict';

const https    = require('https');
const fs       = require('fs');
const path     = require('path');

const API_KEY      = process.env.ANTHROPIC_API_KEY;
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const WORKFLOW_PATH = '.github/workflows/ci-cd.yml';

if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

// ─── Read current workflow ────────────────────────────────────────────────────

const workflowContent = fs.readFileSync(
  path.join(PROJECT_ROOT, WORKFLOW_PATH), 'utf8'
);

// ─── Build optimization prompt ────────────────────────────────────────────────

const PROMPT = `You are a senior DevOps engineer and CI/CD expert. Analyse this GitHub Actions workflow and produce an optimized version.

## Current workflow (${WORKFLOW_PATH})
\`\`\`yaml
${workflowContent}
\`\`\`

## Project context
- Monorepo: Node.js/TypeScript backend (Express + Jest) + React/Vite frontend
- Deploy target: Vercel
- Branch strategy: push to main = deploy, PRs = test only
- The ai-auto-fix and ai-agent-fix jobs already handle code repair

## Optimizations to consider (apply ALL that are relevant)

### 1. Path-based filtering
Add \`paths\` triggers so backend tests only run when backend files change and frontend build only runs when frontend files change. This saves significant runner minutes.

### 2. Caching improvements  
The current workflow caches npm but npm ci still re-downloads in each job. Consider:
- Using \`cache-dependency-path\` to scope caches per workspace
- Caching the \`node_modules\` directory between runs

### 3. Concurrency control
Add \`concurrency\` groups to cancel outdated runs when a new push arrives.

### 4. Fail-fast
Add \`continue-on-error: false\` and \`timeout-minutes\` to prevent hung jobs consuming runner quota.

### 5. Security: permissions hardening
Add minimal \`permissions:\` blocks at job level (principle of least privilege).

### 6. Dependency review (PRs only)
Add a \`dependency-review\` job using \`actions/dependency-review-action\` that runs on pull requests to catch vulnerable dependencies before merge.

## Instructions
Return the complete optimized workflow in this EXACT format:

<optimized_workflow>
<content>
# complete yaml here
</content>
</optimized_workflow>

Also return a short explanation:

<optimization_summary>
- bullet list of what you changed and why
</optimization_summary>

Important: Keep the ai-agent-fix and deploy jobs exactly as they are. Only optimize the test/build/infrastructure parts.`;

// ─── Call Claude ──────────────────────────────────────────────────────────────

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
        res.on('data', c => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`Parse error: ${data.slice(0, 200)}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Parse response ───────────────────────────────────────────────────────────

function extractBlock(text, tag) {
  const m = text.match(new RegExp(`<${tag}>[\\s\\S]*?<content>([\\s\\S]*?)<\\/content>[\\s\\S]*?<\\/${tag}>`));
  return m ? m[1].replace(/^\n/, '') : null;
}

function extractSummary(text) {
  const m = text.match(/<optimization_summary>([\s\S]*?)<\/optimization_summary>/);
  return m ? m[1].trim() : '(no summary)';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🤖  Asking Claude to optimise the CI/CD pipeline…\n');

  const response = await callClaude(PROMPT);

  if (response.error) {
    console.error('❌ API error:', JSON.stringify(response.error));
    process.exit(1);
  }

  const text = response.content?.[0]?.text ?? '';

  const optimizedYaml = extractBlock(text, 'optimized_workflow');
  const summary       = extractSummary(text);

  if (!optimizedYaml) {
    console.log('⚠️  Claude found no improvements — workflow is already optimal.');
    process.exit(0);
  }

  // Write the optimized workflow
  const fullPath = path.join(PROJECT_ROOT, WORKFLOW_PATH);
  fs.writeFileSync(fullPath, optimizedYaml, 'utf8');

  // Write summary to a file so the workflow step can use it in the PR body
  fs.writeFileSync('/tmp/optimization-summary.txt', summary, 'utf8');

  console.log('✅  Optimized workflow written to', WORKFLOW_PATH);
  console.log('\n📋  Changes made:\n', summary);
}

main().catch(err => {
  console.error('❌', err.message || err);
  process.exit(1);
});

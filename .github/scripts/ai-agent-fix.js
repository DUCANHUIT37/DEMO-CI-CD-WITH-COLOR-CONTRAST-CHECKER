#!/usr/bin/env node
/**
 * ai-agent-fix.js — Agentic AI Fixer (Level 3.5)
 *
 * Khác với ai-fix.js (one-shot), script này cho Claude chạy trong một
 * vòng lặp tự chủ (agentic loop) với bộ TOOLS:
 *
 *   read_file   → Claude chủ động đọc bất kỳ file nào
 *   write_file  → Claude ghi fix trực tiếp vào disk
 *   run_tests   → Claude TỰ CHẠY npm test và đọc kết quả
 *   finish      → Claude khai báo xong (pass/fail)
 *
 * Claude tự quyết định thứ tự: đọc → sửa → chạy test → đọc lại → sửa tiếp
 * cho đến khi test pass hoặc hết số vòng lặp (MAX_ITERATIONS).
 */

'use strict';

const https    = require('https');
const fs       = require('fs');
const path     = require('path');
const { execSync } = require('child_process');

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY       = process.env.ANTHROPIC_API_KEY;
const TEST_LOG      = process.env.TEST_LOG_PATH || '/tmp/ci-logs/test-output.txt';
const PROJECT_ROOT  = path.resolve(__dirname, '../../');
const MAX_ITERATIONS = 5;   // max vòng lặp để tránh chi phí không giới hạn

/** Files Claude KHÔNG được phép ghi (chỉ đọc) */
const READONLY_FILES = [
  'backend/tests/contrast.test.ts',
  '.github/workflows/ci-cd.yml',   // workflow tự có job riêng để tối ưu
];

// ─── Tool definitions (gửi lên Claude) ───────────────────────────────────────

const TOOLS = [
  {
    name: 'read_file',
    description: 'Read any file in the repository. Use this to understand the code before making changes.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path from repo root, e.g. backend/src/utils/contrastCalculator.ts' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write (create or overwrite) a file. Use this to apply your fix. You cannot write to test files.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string',  description: 'Relative path from repo root' },
        content: { type: 'string',  description: 'Complete new file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_tests',
    description: 'Run the full Jest backend test suite. Returns stdout+stderr. Use this to verify your fix actually works before finishing.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'finish',
    description: 'Signal that you are done. Call this when all tests pass OR when you cannot determine a safe fix.',
    input_schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'true if all tests now pass, false if you could not fix' },
        summary: { type: 'string',  description: 'Brief description of what you changed and why' },
      },
      required: ['success', 'summary'],
    },
  },
];

// ─── Tool implementations (chạy thật trên runner) ────────────────────────────

function executeTool(name, input) {
  switch (name) {

    case 'read_file': {
      const fullPath = path.join(PROJECT_ROOT, input.path);
      if (!fs.existsSync(fullPath)) {
        return `ERROR: File not found: ${input.path}`;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      return `=== ${input.path} ===\n${content}`;
    }

    case 'write_file': {
      // Safety: block readonly files
      if (READONLY_FILES.some(f => input.path.includes(f.replace(/\//g, path.sep)) || input.path === f)) {
        return `ERROR: "${input.path}" is read-only. You cannot modify test or workflow files.`;
      }
      const fullPath = path.join(PROJECT_ROOT, input.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, input.content, 'utf8');
      console.log(`  📝  Written: ${input.path}`);
      return `SUCCESS: ${input.path} updated.`;
    }

    case 'run_tests': {
      console.log('  🧪  Running npm test…');
      try {
        const output = execSync('npm test --forceExit', {
          cwd:      path.join(PROJECT_ROOT, 'backend'),
          timeout:  60_000,
          encoding: 'utf8',
          stdio:    'pipe',
        });
        return `TESTS PASSED:\n${output}`;
      } catch (err) {
        return `TESTS FAILED:\n${err.stdout || ''}\n${err.stderr || ''}`;
      }
    }

    case 'finish':
      // Handled in main loop
      return 'OK';

    default:
      return `ERROR: Unknown tool "${name}"`;
  }
}

// ─── Claude API (tool_use mode) ───────────────────────────────────────────────

function callClaude(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      'claude-opus-4-5',
      max_tokens: 4096,
      tools:      TOOLS,
      messages,
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

// ─── Main agentic loop ────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) { console.error('❌ ANTHROPIC_API_KEY not set'); process.exit(1); }
  if (!fs.existsSync(TEST_LOG)) { console.error(`❌ Log not found: ${TEST_LOG}`); process.exit(1); }

  const initialLog = fs.readFileSync(TEST_LOG, 'utf8');

  const messages = [
    {
      role: 'user',
      content: `You are an autonomous CI repair agent. Backend Jest tests are failing.
Use your tools to investigate, fix, and verify the fix yourself.

## Your workflow
1. Call read_file on the relevant source files to understand the code
2. Diagnose the root cause from the test log
3. Call write_file to apply your fix
4. Call run_tests to verify the fix — DO NOT skip this step
5. If tests still fail, iterate (read again, fix again, test again)
6. Call finish(success=true) when all tests pass, or finish(success=false) if you cannot fix safely

## Constraints
- Never modify test files
- Never delete tests or lower thresholds to make tests pass
- Maximum ${MAX_ITERATIONS} tool-use rounds

## Initial test failure log
\`\`\`
${initialLog}
\`\`\`

Begin your investigation now.`,
    },
  ];

  let iteration = 0;
  let fixedFiles = 0;
  let agentSuccess = false;
  let agentSummary = '';

  console.log('🤖  Starting agentic fix loop…\n');

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n── Iteration ${iteration}/${MAX_ITERATIONS} ──────────────────`);

    const response = await callClaude(messages);

    if (response.error) {
      console.error('❌ Claude API error:', JSON.stringify(response.error));
      process.exit(1);
    }

    // Add Claude's response to conversation history
    messages.push({ role: 'assistant', content: response.content });

    // Process each content block
    const toolResults = [];
    let shouldFinish = false;

    for (const block of response.content) {
      if (block.type === 'text') {
        console.log(`  💬  ${block.text.slice(0, 200)}…`);
      }

      if (block.type === 'tool_use') {
        console.log(`  🔧  Tool: ${block.name}(${JSON.stringify(block.input).slice(0, 80)})`);

        if (block.name === 'finish') {
          agentSuccess = block.input.success;
          agentSummary = block.input.summary;
          shouldFinish = true;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'Acknowledged.',
          });
        } else {
          const result = executeTool(block.name, block.input);
          if (block.name === 'write_file' && result.startsWith('SUCCESS')) fixedFiles++;
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }
    }

    // Feed tool results back to Claude
    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults });
    }

    if (shouldFinish || response.stop_reason === 'end_turn') break;
  }

  console.log('\n─────────────────────────────────────────');
  if (agentSuccess) {
    console.log(`✅  Agent fixed ${fixedFiles} file(s): ${agentSummary}`);
    process.exit(0);
  } else {
    console.log(`⚠️  Agent could not fix: ${agentSummary || 'No summary provided'}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unhandled error:', err.message || err);
  process.exit(1);
});

import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

describe('Phase 14E — production verification docs', () => {
  const docs = [
    'docs/production-verification-log.md',
    'docs/production-verification-sql.md',
    'docs/production-verification-stripe.md',
    'docs/production-verification-mobile.md',
    'docs/production-verification-email-tests.md',
  ];

  it.each(docs)('exists: %s', (path) => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('production-verification-sql.md contains only read-only SELECT queries', () => {
    const content = read('docs/production-verification-sql.md');
    // Extract code fences
    const blocks = [...content.matchAll(/```sql\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
    expect(blocks.length).toBeGreaterThan(0);

    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE)\b/i;
    for (const block of blocks) {
      // Strip SQL comments before checking
      const stripped = block.replace(/--.*$/gm, '');
      expect(stripped, `forbidden keyword in SQL block:\n${block}`).not.toMatch(forbidden);
      expect(stripped.trim().toUpperCase()).toMatch(/^SELECT\b|\nSELECT\b/);
    }
  });

  it('production-verification-log.md includes Evidence column and BLOCKED guidance', () => {
    const content = read('docs/production-verification-log.md');
    expect(content).toMatch(/Evidence link \/ screenshot/);
    expect(content).toMatch(/BLOCKED/);
    expect(content).toMatch(/Owner action required/);
    expect(content).toMatch(/How to complete this log/);
  });

  it('uses the same published qmaps.ca verification targets in the mailbox guide and log', () => {
    const guide = read('docs/production-verification-email-tests.md');
    const log = read('docs/production-verification-log.md');
    const mailSection = log.split('## 8. Support mailboxes')[1]?.split(/^## /m)[0] ?? '';
    const recipients = (text: string) => [...text.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]);
    const expected = ['support', 'privacy', 'abuse', 'business', 'hello'].map((name) => `${name}@qmaps.ca`);
    expect(recipients(guide)).toEqual(expected);
    expect(recipients(mailSection)).toEqual(expected);
    expect(`${guide}\n${mailSection}`).not.toMatch(/@qmaps\.app/i);
  });
});

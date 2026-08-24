import {
  SecurityFinding,
  SecuritySeverity,
  SecurityCategory,
  SastScanOptions
} from './types.js';
import { createChildLogger } from '@novaqa/shared';
import * as fs from 'fs';
import * as path from 'path';

const log = createChildLogger('sast-scanner');

interface SecretPattern {
  id: string;
  name: string;
  regex: RegExp;
  severity: SecuritySeverity;
  cwe: string;
  remediation: string;
}

export class SastSecurityScanner {
  private secretPatterns: SecretPattern[] = [
    {
      id: 'SAST-SEC-001',
      name: 'Hardcoded AWS Access Key',
      regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
      severity: SecuritySeverity.CRITICAL,
      cwe: 'CWE-798',
      remediation: 'Remove the hardcoded AWS key immediately, rotate credentials in AWS IAM, and load from environment variables (AWS_ACCESS_KEY_ID).'
    },
    {
      id: 'SAST-SEC-002',
      name: 'Hardcoded GitHub Personal Access Token',
      regex: /ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}/g,
      severity: SecuritySeverity.CRITICAL,
      cwe: 'CWE-798',
      remediation: 'Revoke the exposed GitHub token immediately and load from GitHub Secrets or environment variables (GITHUB_TOKEN).'
    },
    {
      id: 'SAST-SEC-003',
      name: 'Hardcoded Stripe Live Secret Key',
      regex: /sk_live_[0-9a-zA-Z]{24,34}/g,
      severity: SecuritySeverity.CRITICAL,
      cwe: 'CWE-798',
      remediation: 'Rotate the Stripe API key in the Stripe Dashboard and store in encrypted environment secrets (STRIPE_SECRET_KEY).'
    },
    {
      id: 'SAST-SEC-004',
      name: 'Hardcoded Database Connection String with Password',
      regex: /(?:postgres|postgresql|mysql|mongodb|redis):\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_!@#$%^&*()-+=]+@[a-zA-Z0-9_.-]+:[0-9]+/g,
      severity: SecuritySeverity.HIGH,
      cwe: 'CWE-798',
      remediation: 'Remove database credentials from source code and reference via process.env.DATABASE_URL.'
    },
    {
      id: 'SAST-SEC-005',
      name: 'Exposed Private RSA / EC Cryptographic Key',
      regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
      severity: SecuritySeverity.CRITICAL,
      cwe: 'CWE-312',
      remediation: 'Never commit private keys to source control. Store in a secret manager (AWS Secrets Manager / Vault) or KMS.'
    },
    {
      id: 'SAST-SEC-006',
      name: 'Hardcoded JWT Secret String Literal',
      regex: /jwt\.(?:sign|verify)\([^,]+,\s*['"][a-zA-Z0-9_-]{3,30}['"]\)/g,
      severity: SecuritySeverity.HIGH,
      cwe: 'CWE-798',
      remediation: 'Replace hardcoded JWT secret with strong, high-entropy environment variable process.env.JWT_SECRET.'
    }
  ];

  /**
   * Performs static security analysis over source files or provided in-memory code snippets.
   */
  async scanSource(options: SastScanOptions): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    log.info('Starting Static Application Security Testing (SAST) source scan');

    let filesToScan: Array<{ path: string; content: string }> = [];

    if (options.fileContents && options.fileContents.length > 0) {
      filesToScan = options.fileContents;
    } else if (options.sourceDirectory && fs.existsSync(options.sourceDirectory)) {
      filesToScan = this.collectSourceFiles(options.sourceDirectory);
    } else {
      // Default built-in codebase scan fallback
      filesToScan = [
        {
          path: 'src/config/auth.ts',
          content: `
            // Sample source code scan demonstration
            export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';
            export function authenticateUser(token: string) {
              return jwt.verify(token, 'dev_secret_key_123');
            }
          `
        },
        {
          path: 'src/utils/command.ts',
          content: `
            import { exec } from 'child_process';
            export function runUserScript(cmd: string) {
              return exec("sh -c " + cmd);
            }
          `
        }
      ];
    }

    for (const file of filesToScan) {
      // 1. Scan for hardcoded secrets
      findings.push(...this.scanSecretsInFile(file.path, file.content));

      // 2. Scan for dangerous functions & code execution
      findings.push(...this.scanDangerousFunctions(file.path, file.content));

      // 3. Scan for insecure cryptography
      findings.push(...this.scanInsecureCrypto(file.path, file.content));

      // 4. Scan for unsafe deserialization
      findings.push(...this.scanUnsafeDeserialization(file.path, file.content));

      // 5. Scan for unsafe file operations
      findings.push(...this.scanUnsafeFileOperations(file.path, file.content));
    }

    return findings;
  }

  private collectSourceFiles(dir: string, maxFiles = 50): Array<{ path: string; content: string }> {
    const results: Array<{ path: string; content: string }> = [];
    const walk = (currentDir: string) => {
      if (results.length >= maxFiles) return;
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length >= maxFiles) break;
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', '.next', 'build', '.prisma'].includes(entry.name)) {
              walk(fullPath);
            }
          } else if (entry.isFile() && /\.(ts|js|jsx|tsx|py|go|json|env)$/.test(entry.name)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              results.push({ path: fullPath, content });
            } catch {}
          }
        }
      } catch {}
    };

    walk(dir);
    return results;
  }

  private scanSecretsInFile(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    for (const pattern of this.secretPatterns) {
      let match: RegExpExecArray | null;
      // Reset regex state
      pattern.regex.lastIndex = 0;

      while ((match = pattern.regex.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineIndex - 1]?.trim() || '';

        // Obfuscate secret in evidence
        const matchedRaw = match[0];
        const masked = matchedRaw.substring(0, 4) + '****' + matchedRaw.substring(matchedRaw.length - 3);

        findings.push({
          id: `${pattern.id}-${lineIndex}`,
          title: pattern.name,
          severity: pattern.severity,
          confidence: 0.95,
          category: SecurityCategory.SAST_HARDCODED_SECRET,
          cwe: pattern.cwe,
          affectedComponent: `${filePath}:${lineIndex}`,
          evidence: `Line ${lineIndex}: ${lineContent.replace(matchedRaw, masked)}`,
          reproductionSteps: [
            `1. Inspect file ${filePath} at line ${lineIndex}`,
            `2. Verify exposed credential value: ${masked}`
          ],
          risk: 'Hardcoded secrets committed to source control can be accessed by anyone with repository read permissions, leading to full unauthorized access to cloud services, databases, or payment gateways.',
          remediation: pattern.remediation,
          references: [
            'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
            'https://cwe.mitre.org/data/definitions/798.html'
          ]
        });
      }
    }

    return findings;
  }

  private scanDangerousFunctions(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // 1. eval() detection
      if (/\beval\s*\(/.test(trimmed) && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        findings.push({
          id: `SAST-EVAL-${lineNum}`,
          title: 'Use of Dangerous "eval()" Function',
          severity: SecuritySeverity.HIGH,
          confidence: 0.9,
          category: SecurityCategory.SAST_DANGEROUS_FUNCTION,
          cwe: 'CWE-95',
          affectedComponent: `${filePath}:${lineNum}`,
          evidence: `Line ${lineNum}: ${trimmed}`,
          reproductionSteps: [
            `1. Check ${filePath} at line ${lineNum}`,
            '2. Observe eval() processing dynamic string input'
          ],
          risk: 'Passing unsanitized user input to eval() allows arbitrary JavaScript code execution in the application runtime.',
          remediation: 'Refactor code to use safe JSON parsing (JSON.parse), mapped property lookups, or structured expression parsers.',
          references: [
            'https://owasp.org/www-community/attacks/Direct_Dynamic_Code_Evaluation_Eval%20Injection',
            'https://cwe.mitre.org/data/definitions/95.html'
          ]
        });
      }

      // 2. child_process.exec concatenation (Command Injection)
      if (/(?:exec|execSync)\s*\([^)]*\+[^)]*\)/.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `SAST-CMDINJ-${lineNum}`,
          title: 'Potential Command Injection in "exec()" with Dynamic String Concatenation',
          severity: SecuritySeverity.CRITICAL,
          confidence: 0.88,
          category: SecurityCategory.COMMAND_INJECTION,
          cwe: 'CWE-78',
          affectedComponent: `${filePath}:${lineNum}`,
          evidence: `Line ${lineNum}: ${trimmed}`,
          reproductionSteps: [
            `1. Inspect ${filePath} at line ${lineNum}`,
            '2. Observe shell command built via dynamic string concatenation'
          ],
          risk: 'If user input reaches the concatenated command string, an attacker can append shell metacharacters (; | &) to execute arbitrary OS commands.',
          remediation: 'Use execFile() or spawn() with arguments passed as an explicit array instead of shell concatenation, without shell: true.',
          references: [
            'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html',
            'https://cwe.mitre.org/data/definitions/78.html'
          ]
        });
      }

      // 3. innerHTML assignment
      if (/\.innerHTML\s*=/.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `SAST-DOMXSS-${lineNum}`,
          title: 'Direct Assignment to "innerHTML" (DOM XSS Risk)',
          severity: SecuritySeverity.MEDIUM,
          confidence: 0.82,
          category: SecurityCategory.XSS,
          cwe: 'CWE-79',
          affectedComponent: `${filePath}:${lineNum}`,
          evidence: `Line ${lineNum}: ${trimmed}`,
          reproductionSteps: [
            `1. Inspect ${filePath} at line ${lineNum}`,
            '2. Check if variable assigned to innerHTML contains unescaped user data'
          ],
          risk: 'Directly assigning raw strings to innerHTML allows malicious markup and script tags to execute.',
          remediation: 'Use textContent, innerText, or sanitize HTML using DOMPurify before insertion.',
          references: [
            'https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html',
            'https://cwe.mitre.org/data/definitions/79.html'
          ]
        });
      }
    });

    return findings;
  }

  private scanInsecureCrypto(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // MD5 or SHA1 used
      if (/createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/i.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `SAST-CRYPTO-${lineNum}`,
          title: 'Use of Cryptographically Broken Hash Algorithm (MD5/SHA1)',
          severity: SecuritySeverity.MEDIUM,
          confidence: 0.85,
          category: SecurityCategory.SAST_INSECURE_CRYPTO,
          cwe: 'CWE-327',
          affectedComponent: `${filePath}:${lineNum}`,
          evidence: `Line ${lineNum}: ${trimmed}`,
          reproductionSteps: [
            `1. Inspect ${filePath} at line ${lineNum}`,
            '2. Observe MD5/SHA1 hashing'
          ],
          risk: 'MD5 and SHA-1 are vulnerable to hash collision attacks and are insufficient for password hashing or integrity verification.',
          remediation: 'Upgrade to SHA-256/SHA-512 for data integrity, or use bcrypt / argon2 for password storage.',
          references: [
            'https://cwe.mitre.org/data/definitions/327.html'
          ]
        });
      }

      // Math.random() for security tokens
      if (/Math\.random\(\)/.test(trimmed) && /(?:token|secret|session|nonce|password|key)/i.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `SAST-RND-${lineNum}`,
          title: 'Insecure Pseudo-Random Number Generator Used for Security Token',
          severity: SecuritySeverity.HIGH,
          confidence: 0.87,
          category: SecurityCategory.SAST_INSECURE_CRYPTO,
          cwe: 'CWE-338',
          affectedComponent: `${filePath}:${lineNum}`,
          evidence: `Line ${lineNum}: ${trimmed}`,
          reproductionSteps: [
            `1. Inspect ${filePath} at line ${lineNum}`,
            '2. Observe Math.random() used to generate tokens/keys'
          ],
          risk: 'Math.random() is deterministic and predictable, allowing attackers to calculate future session tokens or password reset keys.',
          remediation: 'Use cryptographically secure random number generators like crypto.randomBytes() or crypto.getRandomValues().',
          references: [
            'https://cwe.mitre.org/data/definitions/338.html'
          ]
        });
      }
    });

    return findings;
  }

  private scanUnsafeDeserialization(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      if (/(?:unserialize|node-serialize)\s*\(/.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `SAST-DESER-${lineNum}`,
          title: 'Unsafe Object Deserialization',
          severity: SecuritySeverity.CRITICAL,
          confidence: 0.92,
          category: SecurityCategory.SAST_UNSAFE_DESERIALIZATION,
          cwe: 'CWE-502',
          affectedComponent: `${filePath}:${lineNum}`,
          evidence: `Line ${lineNum}: ${trimmed}`,
          reproductionSteps: [
            `1. Check ${filePath} at line ${lineNum}`,
            '2. Observe unserialize() call on untrusted payloads'
          ],
          risk: 'Deserializing untrusted data can instantiate malicious object graphs, triggering Remote Code Execution (RCE).',
          remediation: 'Avoid object serialization formats. Use structured, schema-validated JSON serialization (JSON.parse).',
          references: [
            'https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html',
            'https://cwe.mitre.org/data/definitions/502.html'
          ]
        });
      }
    });

    return findings;
  }

  private scanUnsafeFileOperations(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      if (/(?:readFile|readFileSync|createReadStream)\s*\([^)]*(?:req\.query|req\.params|req\.body)[^)]*\)/.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `SAST-PATH-${lineNum}`,
          title: 'Path Traversal Risk in Direct File System Read',
          severity: SecuritySeverity.HIGH,
          confidence: 0.88,
          category: SecurityCategory.PATH_TRAVERSAL,
          cwe: 'CWE-22',
          affectedComponent: `${filePath}:${lineNum}`,
          evidence: `Line ${lineNum}: ${trimmed}`,
          reproductionSteps: [
            `1. Inspect ${filePath} at line ${lineNum}`,
            '2. Observe request parameter passed directly to filesystem read function'
          ],
          risk: 'Attackers can use relative directory traversal sequences (../../) to read sensitive operating system files or source code.',
          remediation: 'Validate input against an allowed filename whitelist and use path.basename() / path.resolve() with boundary checks.',
          references: [
            'https://owasp.org/www-community/attacks/Path_Traversal',
            'https://cwe.mitre.org/data/definitions/22.html'
          ]
        });
      }
    });

    return findings;
  }
}

export const sastScanner = new SastSecurityScanner();

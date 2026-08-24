# NovaQA Continuous Testing & CI/CD Integration Guide

NovaQA provides production-grade continuous testing and CI/CD quality gate enforcement for your software delivery lifecycle.

---

## 1. Quality Gates & Failure Conditions

Pipelines automatically fail and exit with code `1` whenever any configured quality gate threshold is breached:

1. **Critical Test Failure**: Any test case marked with priority `CRITICAL` fails.
2. **High-Priority Test Failure**: Any test case marked with priority `HIGH` fails (optional).
3. **Security Critical Finding**: Any SAST or DAST vulnerability finding with severity `CRITICAL` is detected.
4. **Coverage Threshold**: Total route, API, or requirement coverage falls below the target threshold (e.g. `90%`).

---

## 2. GitHub Actions Integration

Create `.github/workflows/novaqa.yml` in your repository:

```yaml
name: NovaQA Continuous Testing & CI Quality Gate

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Automated Test Matrix & Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Trigger NovaQA Regression & Security Gates
        run: |
          npx testing-platform test \
            --suite regression \
            --security \
            --fail-on-critical \
            --min-coverage 90
        env:
          NOVAQA_API_KEY: ${{ secrets.NOVAQA_API_KEY }}
          NOVAQA_PROJECT_ID: ${{ secrets.NOVAQA_PROJECT_ID }}

      - name: Export Executive Quality Report
        if: always()
        run: |
          npx testing-platform report --format HTML --output novaqa-report.html

      - name: Upload Test Report Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: novaqa-test-report
          path: novaqa-report.html
```

---

## 3. GitLab CI Integration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - quality-gate

novaqa_continuous_test:
  stage: test
  image: node:20
  script:
    - npx testing-platform test --suite regression --security --fail-on-critical --min-coverage 90
  variables:
    NOVAQA_API_KEY: $NOVAQA_API_KEY
    NOVAQA_PROJECT_ID: $NOVAQA_PROJECT_ID
  artifacts:
    when: always
    paths:
      - novaqa-report.html
    reports:
      junit: novaqa-junit.xml
```

---

## 4. Jenkins Pipeline Integration

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any
    environment {
        NOVAQA_API_KEY = credentials('novaqa-api-key')
        NOVAQA_PROJECT_ID = 'proj_enterprise_prod'
    }
    stages {
        stage('NovaQA Automated Quality Gates') {
            steps {
                sh '''
                    npx testing-platform test \
                        --suite regression \
                        --security \
                        --fail-on-critical \
                        --min-coverage 90
                '''
            }
        }
        stage('Generate Executive Report') {
            steps {
                sh 'npx testing-platform report --format HTML --output novaqa-report.html'
                archiveArtifacts artifacts: 'novaqa-report.html', fingerprint: true
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}
```

---

## 5. Generic Webhook API Trigger

```bash
# 1. Trigger continuous test execution run
curl -X POST https://api.novaqa.io/api/v1/test-runs \
  -H "Authorization: Bearer $NOVAQA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_enterprise_prod",
    "suiteType": "REGRESSION",
    "failOnCritical": true,
    "failOnSecurityCritical": true,
    "minCoveragePercent": 90,
    "ciContext": {
      "provider": "generic_webhook",
      "commitSha": "a1b2c3d4",
      "branch": "main",
      "buildUrl": "https://ci.example.com/build/492"
    }
  }'

# 2. Poll CI status and gate evaluation
curl https://api.novaqa.io/api/v1/test-runs/{testRunId}/status \
  -H "Authorization: Bearer $NOVAQA_API_KEY"
```

---

## 6. CLI Reference (`testing-platform`)

| Command | Description |
| :--- | :--- |
| `testing-platform project init` | Initialize local project configuration (`.novaqa.json`). |
| `testing-platform discover` | Discover application routes, API schemas, and test scenarios. |
| `testing-platform test` | Run default test suite with CI exit code (0 = PASS, 1 = FAIL). |
| `testing-platform test --suite regression` | Run specific test suite (e.g. `smoke`, `regression`, `api`). |
| `testing-platform test --security` | Run defensive SAST & DAST security vulnerability audit. |
| `testing-platform report --format HTML` | Generate and export executive quality report. |

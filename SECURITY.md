# Security Policy

## Supported version

Security fixes are applied to the latest revision of the `main` branch.

## Reporting a vulnerability

Please do not open a public issue for vulnerabilities, exposed credentials, or privacy-sensitive reports. Use GitHub's private vulnerability reporting feature when it is available for this repository. If private reporting is unavailable, contact the maintainer through the address listed on the maintainer's GitHub profile.

Include the affected route or component, reproduction steps, expected impact, and any suggested mitigation. Do not access data that is not your own, run denial-of-service tests, or incur third-party API costs while validating a report.

## Deployment guidance

- Keep all provider, database, and scheduler credentials in deployment secrets. Never use secret or service-role keys in `NEXT_PUBLIC_` variables.
- Set `CORTEX_OPERATOR_EMAILS` for production. Cost-bearing collection and model-health routes deny non-operator accounts by default.
- Leave `CORTEX_ALLOW_PUBLIC_COSTLY_ACTIONS=false` unless a deployment-wide quota and abuse monitoring are also in place.
- Use narrowly scoped Cloudflare D1 credentials and rotate any credential that may have been exposed.
- Protect the default branch and require reviewed pull requests before merging deployment changes.

# Security Policy

## Supported Versions

We provide security updates for the following versions of ttx-wasm:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

We take the security of ttx-wasm seriously. If you discover a security vulnerability, please follow these guidelines:

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send details to [security@lagrandeur.com](mailto:security@lagrandeur.com)
2. **GitHub Security Advisories**: Use GitHub's [private vulnerability reporting](https://github.com/mattlag/ttx-wasm/security/advisories/new)

### What to Include

Please include as much of the following information as possible:

- **Type of issue** (e.g., buffer overflow, injection, cross-site scripting, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Special configuration required** to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it

### Response Timeline

- **Initial response**: Within 48 hours of receiving the report
- **Status update**: Within 7 days with either a fix timeline or request for more information
- **Resolution**: Depends on severity and complexity, but we aim for:
  - **Critical**: Within 7 days
  - **High**: Within 14 days  
  - **Medium**: Within 30 days
  - **Low**: Within 90 days

### Disclosure Policy

We follow responsible disclosure principles:

1. **Acknowledgment**: We'll acknowledge receipt of your vulnerability report
2. **Investigation**: We'll investigate and validate the reported vulnerability
3. **Fix Development**: We'll develop and test a fix
4. **Coordinated Disclosure**: We'll work with you on disclosure timing
5. **Public Disclosure**: After a fix is available, we'll publicly disclose the vulnerability

### Security Considerations

ttx-wasm processes potentially untrusted font files, which presents several security considerations:

#### Font File Processing
- **Malformed fonts**: We validate font file structure to prevent buffer overflows
- **Large files**: We implement size limits to prevent denial of service
- **Memory safety**: WebAssembly provides memory isolation, but we still validate all inputs

#### WebAssembly Security
- **Memory bounds**: All memory access is bounds-checked by the WebAssembly runtime
- **No direct file access**: The WASM module cannot access the file system directly
- **Sandboxed execution**: WebAssembly runs in a sandboxed environment

#### JavaScript API Security
- **Input validation**: All API inputs are validated before being passed to WASM
- **Output sanitization**: All outputs from WASM are validated before being returned
- **Error handling**: Errors are caught and sanitized to prevent information leakage

### Known Security Limitations

1. **Font complexity**: Some malformed fonts might cause excessive processing time
2. **Memory usage**: Large or complex fonts may consume significant memory
3. **Integer overflow**: Large font files might trigger integer overflow in calculations

### Security Best Practices for Users

When using ttx-wasm in your applications:

1. **Validate inputs**: Always validate font files before processing
2. **Set limits**: Implement file size and processing time limits
3. **Handle errors**: Properly handle and log errors without exposing sensitive information
4. **Update regularly**: Keep ttx-wasm updated to the latest version
5. **Monitor usage**: Monitor for unusual processing patterns or resource usage

### Security Updates

Security updates will be released as patch versions and will be clearly marked in:
- **Release notes** with "Security" label
- **CHANGELOG.md** in the "Security" section
- **GitHub Security Advisories** for critical vulnerabilities

### Bug Bounty

Currently, we do not offer a formal bug bounty program, but we deeply appreciate security researchers who responsibly disclose vulnerabilities. We will acknowledge your contributions in our security advisories and release notes (with your permission).

### Questions

If you have questions about this security policy, please contact us at [security@lagrandeur.com](mailto:security@lagrandeur.com).

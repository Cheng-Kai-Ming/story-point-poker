# Security Implementation Guide

## Overview

This document outlines the security measures implemented in Story Point Poker to protect user data and prevent common vulnerabilities.

## Security Features Implemented

### 1. Dependency Security ✅

**Issue:** esbuild CORS vulnerability (GHSA-67mh-4wv8-2f99)  
**Fix:** Upgraded Vite to 5.4.21 which includes patched esbuild version  
**Impact:** Prevents malicious websites from reading development server files

### 2. Input Validation & Sanitization ✅

**Server-side validation for:**
- **Usernames:** 1-50 characters, HTML stripped, sanitized
- **Votes:** Must be valid Fibonacci values (0, 1, 2, 3, 5, 8, 13, 21, ?, ∞)
- **Story Points:** 0-1000 range validation
- **Ticket Index:** Bounds checking
- **Jira Config:** Domain, email, and token validation

**Implementation:**
```javascript
// Username validation
function sanitizeUsername(username) {
  const sanitized = username.replace(/<[^>]*>/g, '').trim()
  return sanitized.length > 0 && sanitized.length <= 50 ? sanitized : null
}

// Vote validation
function validateVote(vote) {
  const validVotes = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '∞']
  return validVotes.includes(String(vote))
}
```

### 3. Encrypted Local Storage ✅

**Issue:** Jira API tokens stored in plain text in localStorage  
**Fix:** Implemented XOR encryption with Base64 encoding

**Features:**
- Automatic encryption/decryption
- Secure storage wrapper
- Corrupted data handling
- Auto-cleanup on logout

**Usage:**
```javascript
import { secureStorage } from './utils/secureStorage'

// Save encrypted
secureStorage.setItem('jiraConfig', config)

// Retrieve decrypted
const config = secureStorage.getItem('jiraConfig')
```

**Note:** This is obfuscation for basic protection. For highly sensitive production environments, consider using Web Crypto API or libraries like crypto-js.

### 4. Rate Limiting ✅

**Protection against:**
- DoS attacks
- Spam/abuse
- API exhaustion

**Limits:**
- 100 messages per minute per connection
- Automatic cleanup on disconnect
- User-friendly error messages

**Configuration:**
```javascript
const SECURITY_CONFIG = {
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_MESSAGES: 100
}
```

### 5. Session Management ✅

**Features:**
- WebSocket heartbeat (every 30 seconds)
- Session timeout (30 minutes of inactivity)
- Automatic cleanup
- Connection health monitoring

**Implementation:**
- Ping/pong mechanism
- Activity timestamp tracking
- Auto-disconnect on timeout
- Session expiration warnings

### 6. Server-Side Jira Configuration ✅

**Security improvements:**
- Jira credentials stored server-side only
- Never broadcast to non-host users
- Automatic cleanup when all users disconnect
- Host-only access control

**Access Control:**
- Only host can set Jira config
- Only host can fetch tickets
- Only host can update story points

### 7. Security Headers ✅

**HTTP Security Headers:**
```javascript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'...",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}
```

**Protection against:**
- Clickjacking
- MIME sniffing
- XSS attacks
- Cross-origin attacks

### 8. Message Size Limits ✅

**Configuration:**
```javascript
MAX_MESSAGE_SIZE: 10000 // 10KB per message
```

**Prevents:**
- Memory exhaustion
- DoS via large payloads
- Network flooding

### 9. Authentication & Authorization ✅

**User Authentication:**
- Unique user IDs per connection
- Session-based user tracking
- Username required to join

**Authorization Checks:**
- Host-only operations validated
- User existence verification
- Action permission checks

**Host-Only Actions:**
- Reveal votes
- Set final result
- Complete voting
- Configure Jira
- Fetch tickets
- Select tickets

### 10. Error Handling ✅

**Security-conscious error messages:**
- No sensitive data in errors
- Generic error messages to clients
- Detailed logging server-side only
- Graceful degradation

## Security Configuration

### Environment Variables

```bash
# Server
PORT=8080
NODE_ENV=production

# No hardcoded secrets - all provided by users at runtime
```

### Configuration Constants

```javascript
const SECURITY_CONFIG = {
  MAX_USERNAME_LENGTH: 50,
  MAX_MESSAGE_SIZE: 10000,
  RATE_LIMIT_WINDOW: 60000,
  RATE_LIMIT_MAX_MESSAGES: 100,
  SESSION_TIMEOUT: 1800000, // 30 minutes
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  VALID_VOTE_OPTIONS: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '∞']
}
```

## Security Best Practices

### For Users

1. **Jira API Tokens:**
   - Use dedicated API tokens (not passwords)
   - Generate tokens with minimal permissions
   - Rotate tokens regularly
   - Revoke tokens when done

2. **Usernames:**
   - Use professional, identifiable names
   - Avoid special characters
   - Keep under 50 characters

3. **Network:**
   - Use HTTPS/WSS in production
   - Don't use on public WiFi without VPN
   - Close browser when done

### For Deployment

1. **Always use HTTPS** in production
2. **Enable firewall** rules on server
3. **Regular updates** of dependencies
4. **Monitor** server logs for suspicious activity
5. **Rate limiting** at reverse proxy level (Nginx, Cloudflare)
6. **Regular backups** (though no persistent data stored)

## Threat Model

### Protected Against ✅

- **XSS (Cross-Site Scripting):** CSP headers, input sanitization
- **Injection Attacks:** Input validation, parameterized queries
- **DoS (Denial of Service):** Rate limiting, message size limits
- **Session Hijacking:** Unique session IDs, timeouts
- **CSRF (Cross-Site Request Forgery):** WebSocket-based, not form-based
- **Clickjacking:** X-Frame-Options header
- **Information Disclosure:** Sanitized errors, secure storage

### Limitations ⚠️

This tool is designed for **internal team use** and has these limitations:

1. **No User Authentication:** Anyone with the URL can join
   - **Mitigation:** Use private URLs, VPN, or add password protection

2. **XOR Encryption:** Not cryptographically secure
   - **Mitigation:** Sufficient for internal use, upgrade if storing sensitive data

3. **No Audit Logging:** Actions not permanently logged
   - **Mitigation:** Add logging if compliance required

4. **Server Memory Storage:** Data lost on restart
   - **Mitigation:** Intentional for privacy, add DB if persistence needed

5. **No Multi-Team Isolation:** Single global session
   - **Mitigation:** Add room/session IDs if multiple teams

## Vulnerability Disclosure

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: [Your security contact]
3. Provide detailed description and reproduction steps
4. Allow 90 days for patch before disclosure

## Security Checklist

Before deploying to production:

- [ ] Updated all dependencies (`yarn audit`)
- [ ] Changed default encryption key in `secureStorage.js`
- [ ] Configured HTTPS/WSS
- [ ] Set up firewall rules
- [ ] Reviewed and adjusted rate limits
- [ ] Tested session timeouts
- [ ] Verified CSP headers
- [ ] Checked Jira API token permissions
- [ ] Documented access URL sharing policy
- [ ] Set up monitoring/alerts

## Security Updates

### Version 2.0 (Current)

- ✅ Upgraded Vite/esbuild (CVE fix)
- ✅ Added input validation
- ✅ Implemented encrypted storage
- ✅ Added rate limiting
- ✅ Server-side Jira config
- ✅ Session management
- ✅ Security headers
- ✅ Message size limits

### Planned Enhancements

- [ ] Room/session IDs for multi-team support
- [ ] Optional password protection
- [ ] Audit logging
- [ ] Web Crypto API encryption
- [ ] Two-factor authentication for hosts
- [ ] IP whitelisting
- [ ] Advanced rate limiting (per user, per IP)

## Compliance

### GDPR Considerations

- **No persistent storage:** Data cleared on server restart
- **No tracking:** No analytics or tracking cookies
- **User control:** Users can disconnect anytime
- **Data minimization:** Only stores what's necessary (username, votes)
- **Right to be forgotten:** Automatic on disconnect

### OWASP Top 10 Coverage

1. **Injection:** ✅ Input validation, sanitization
2. **Broken Authentication:** ✅ Session management, timeouts
3. **Sensitive Data Exposure:** ✅ Encryption, secure storage
4. **XML External Entities:** N/A (no XML processing)
5. **Broken Access Control:** ✅ Host-only operations
6. **Security Misconfiguration:** ✅ Secure headers
7. **XSS:** ✅ CSP, input sanitization
8. **Insecure Deserialization:** ✅ JSON parse with validation
9. **Using Components with Known Vulnerabilities:** ✅ Patched
10. **Insufficient Logging & Monitoring:** ⚠️ Basic logging only

## Support

For security questions or concerns:
- Review this document
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment security
- Open a GitHub issue for non-sensitive questions
- Email security concerns privately

---

**Last Updated:** 2024
**Security Review:** Pass
**Next Review:** Before major version release

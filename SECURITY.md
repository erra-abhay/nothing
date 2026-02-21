# Comprehensive Security Documentation

## 🔒 Overview

This Question Paper Repository System implements **enterprise-grade security** with multiple layers of protection against all major attack vectors including SQL injection, XSS, CSRF, brute force, DDoS, file upload attacks, session hijacking, and more.

---

## 🛡️ Security Features Implemented

### 1. **Helmet.js - Advanced Security Headers**

Comprehensive HTTP security headers to protect against common web vulnerabilities:

- **Content-Security-Policy (CSP)**: Prevents XSS attacks by controlling resource loading
- **X-Frame-Options**: DENY - Prevents clickjacking attacks
- **X-Content-Type-Options**: nosniff - Prevents MIME type sniffing
- **X-XSS-Protection**: Enabled with blocking mode
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Disables unnecessary browser features (geolocation, microphone, camera)
- **X-Powered-By**: Disabled to hide server technology

### 2. **Advanced Rate Limiting**

Multi-tier rate limiting to prevent brute force and DDoS attacks:

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|--------|---------|
| Global | 1000 requests | 15 minutes | Overall protection |
| API Endpoints | 100 requests | 1 minute | API abuse prevention |
| Login Endpoints | 10 attempts | 15 minutes | Brute force protection |
| Download Endpoint | 20 downloads | 1 minute | Bandwidth protection |

**Features:**
- Automatic IP-based tracking
- Standardized rate limit headers
- Custom error messages
- Security event logging

### 3. **Brute Force Protection**

Advanced login attempt tracking and account lockout:

- **Max Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **IP + Email Tracking**: Prevents distributed attacks
- **Automatic Cleanup**: Old attempts removed automatically
- **Security Logging**: All attempts logged with details

### 4. **Input Validation & Sanitization**

Comprehensive validation using `express-validator`:

**Login Validation:**
- Email format and normalization
- Password length validation
- Field sanitization

**Password Strength Requirements:**
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

**Data Validation:**
- Department/Subject names: 2-255 characters, alphanumeric with allowed symbols
- Codes: Uppercase letters and numbers only
- Semester: 1-8 range
- Year: 2000 to current year + 1
- Paper type: Whitelist validation (MSE, ESE, Assignment, Tutorial, Other)

**XSS Prevention:**
- HTML entity encoding
- Special character sanitization
- Input length limits

### 5. **Enhanced File Upload Security**

Multi-layer file validation:

**Layer 1 - Extension Validation:**
- Allowed: `.pdf`, `.docx`, `.doc`
- Blocks executable extensions

**Layer 2 - MIME Type Validation:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/msword`

**Layer 3 - Magic Number Validation:**
- PDF: `%PDF` (0x25504446)
- DOCX: `PK..` (0x504B0304) - ZIP format
- DOC: `ÐÏ..` (0xD0CF11E0)

**Layer 4 - Suspicious Pattern Detection:**
- Blocks files with executable patterns (`.exe`, `.sh`, `.bat`, `.cmd`, `.php`, `.js`, etc.)
- Prevents double extensions
- Detects renamed malicious files

**Additional Security:**
- Filename sanitization (removes special characters)
- Filename length limit (200 characters)
- Random string in filename to prevent collisions
- File size limit: 10MB
- Single file per upload
- Automatic file deletion on validation failure
- Comprehensive upload logging

### 6. **Session Security**

Advanced session management with device fingerprinting:

**Device Fingerprinting:**
- User-Agent tracking
- Accept-Language tracking
- Accept-Encoding tracking
- SHA-256 hash generation

**Session Features:**
- Maximum 3 concurrent sessions per user
- Session hijacking detection
- Automatic session cleanup (30-minute timeout)
- Session token validation
- Device mismatch detection

**Session Invalidation:**
- Login from new device invalidates oldest session
- Logout clears specific session
- Admin can force logout all sessions

### 7. **Comprehensive Security Logging**

All security events logged to daily log files in `/logs/` directory:

**Logged Events:**
- Login success/failure
- Account lockout
- Rate limit violations
- Invalid/expired tokens
- Unauthorized access attempts
- File uploads (success/failure)
- Suspicious activities
- SQL injection attempts
- XSS attempts
- Path traversal attempts
- Data modifications/deletions
- Session violations
- Errors

**Log Format:**
```json
{
  "timestamp": "2026-01-26T08:46:53.000Z",
  "type": "LOGIN_FAILED",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "reason": "Invalid password",
  "attemptCount": 3
}
```

### 8. **NoSQL Injection Prevention**

Using `express-mongo-sanitize`:
- Removes `$` and `.` from user input
- Prevents MongoDB operator injection
- Logs sanitization attempts
- Replaces dangerous characters with `_`

### 9. **HTTP Parameter Pollution (HPP) Protection**

Using `hpp` middleware:
- Prevents duplicate parameter attacks
- Protects against query string manipulation
- Ensures single value for parameters

### 10. **SQL Injection Prevention**

- **Parameterized Queries**: All database queries use placeholders
- **Input Validation**: All inputs validated before queries
- **Type Checking**: Strict type validation for IDs and numbers
- **No Dynamic SQL**: No string concatenation in queries

### 11. **Path Traversal Protection**

- Blocks `..` in paths
- Blocks `~` in paths
- URL decoding before validation
- Logs all attempts
- Returns 403 Forbidden

### 12. **JWT Security**

- Strong 128-character secret key
- 30-minute token expiry
- Session token validation
- Expiry detection with specific errors
- Role-based access control
- Token stored in Authorization header only

### 13. **Error Handling**

- No sensitive data in production errors
- Detailed logging for debugging
- Specific error messages for file uploads
- Generic errors for security issues
- Stack traces only in development

---

## 📊 Security Monitoring

### Real-time Monitoring

The system tracks and logs:
- Failed login attempts per IP/email
- Rate limit violations
- File upload attempts
- Session anomalies
- Unauthorized access attempts

### Log Files

Located in `/logs/` directory:
- `security-YYYY-MM-DD.log` - Daily security event logs
- JSON format for easy parsing
- Automatic rotation (new file per day)

### Viewing Logs

```bash
# View today's security log
tail -f logs/security-$(date +%Y-%m-%d).log

# Search for failed logins
grep "LOGIN_FAILED" logs/security-*.log

# Search for rate limit violations
grep "RATE_LIMIT_EXCEEDED" logs/security-*.log
```

---

## 🔍 Security Testing

### 1. Test Brute Force Protection

```bash
# Attempt multiple failed logins (should lock after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/faculty/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

**Expected Result:** 6th attempt returns 429 with lockout message

### 2. Test Rate Limiting

```bash
# Test API rate limit (should block after 100 requests)
for i in {1..105}; do
  curl -s http://localhost:3000/api/public/stats > /dev/null
  echo "Request $i"
done
```

**Expected Result:** Requests 101-105 return 429

### 3. Test File Upload Security

```bash
# Test with renamed executable (should fail)
cp /bin/ls malicious.pdf
curl -X POST http://localhost:3000/api/faculty/papers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@malicious.pdf" \
  -F "subject_id=1" \
  -F "semester=1" \
  -F "paper_type=MSE" \
  -F "year=2024"
```

**Expected Result:** 400 error - "File content validation failed"

### 4. Test Input Validation

```bash
# Test SQL injection attempt
curl -X POST http://localhost:3000/api/faculty/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com'\'' OR 1=1--","password":"test"}'
```

**Expected Result:** 400 error - "Validation failed"

### 5. Test XSS Prevention

```bash
# Test script injection in department name
curl -X POST http://localhost:3000/api/admin/departments \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","code":"TEST"}'
```

**Expected Result:** 400 error - "Validation failed"

### 6. Test Path Traversal

```bash
# Attempt to access system files
curl http://localhost:3000/../../../etc/passwd
curl http://localhost:3000/~/secret
```

**Expected Result:** 403 Forbidden

---

## 🚀 Production Deployment Checklist

### Before Deployment

- [ ] **Update JWT Secret**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  # Update .env: JWT_SECRET=<generated_secret>
  ```

- [ ] **Set Strong Database Password**
  ```bash
  sudo mysql -u root
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'strong_password_here';
  FLUSH PRIVILEGES;
  # Update .env: DB_PASSWORD=strong_password_here
  ```

- [ ] **Configure Production Environment**
  ```bash
  # In .env file
  NODE_ENV=production
  ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  ```

- [ ] **Enable HTTPS**
  - Use reverse proxy (nginx/Apache)
  - Install SSL certificate (Let's Encrypt)
  - Redirect HTTP to HTTPS
  - Update CSP for HTTPS

- [ ] **Set File Permissions**
  ```bash
  chmod 755 uploads/
  chmod 644 uploads/papers/**/*
  chmod 700 logs/
  ```

- [ ] **Run Security Audit**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Test All Security Features**
  - Run all security tests above
  - Verify rate limiting works
  - Test brute force protection
  - Verify file upload validation

### After Deployment

- [ ] Monitor security logs daily
- [ ] Set up log rotation
- [ ] Configure automated backups
- [ ] Set up intrusion detection alerts
- [ ] Schedule regular security audits

---

## 🔐 Admin Credentials

**Default Admin Account:**
- **Email**: `admin@kitsw.ac.in`
- **Password**: `admin123`

> [!CAUTION]
> **CRITICAL**: Change the admin password immediately after first login in production!

**Change Admin Password:**
```bash
# Generate new password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('new_secure_password', 10).then(console.log);"

# Update in database
mysql -u root question_paper_repo
UPDATE users SET password='<new_hash>' WHERE email='admin@kitsw.ac.in';
```

---

## 📋 Security Best Practices

### For Administrators

1. **Regular Updates**
   - Weekly: Check `npm audit` for vulnerabilities
   - Monthly: Update all dependencies
   - Quarterly: Full security review

2. **Monitor Logs**
   - Review security logs daily
   - Investigate suspicious patterns
   - Track failed login attempts
   - Monitor rate limit violations

3. **User Management**
   - Enforce strong passwords
   - Disable inactive accounts
   - Review user permissions regularly
   - Audit admin actions

4. **Backup Strategy**
   - Daily database backups
   - Weekly full system backups
   - Test restore procedures
   - Secure backup storage

### For Developers

1. **Code Security**
   - Always use parameterized queries
   - Validate all user inputs
   - Sanitize outputs
   - Never log sensitive data

2. **Dependency Management**
   - Keep dependencies updated
   - Review security advisories
   - Use `npm audit` before deployment
   - Pin dependency versions

3. **Testing**
   - Test all security features
   - Perform penetration testing
   - Use security scanning tools
   - Test error handling

---

## ⚠️ Incident Response

### If Security Breach Detected

1. **Immediate Actions**
   - Isolate affected systems
   - Change all passwords
   - Revoke all active sessions
   - Review security logs

2. **Investigation**
   - Identify attack vector
   - Assess damage
   - Document findings
   - Preserve evidence

3. **Remediation**
   - Patch vulnerabilities
   - Update security measures
   - Restore from clean backups
   - Notify affected users

4. **Prevention**
   - Update security policies
   - Implement additional controls
   - Train users
   - Schedule security audit

---

## 📞 Security Contact

For security issues or vulnerabilities, please contact:
- **Email**: security@kitsw.ac.in
- **Response Time**: Within 24 hours

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

## 🔄 Security Update History

### Version 2.0 - January 2026
- ✅ Implemented Helmet.js for comprehensive security headers
- ✅ Added advanced multi-tier rate limiting
- ✅ Implemented brute force protection with account lockout
- ✅ Added comprehensive input validation with express-validator
- ✅ Enhanced file upload security with magic number validation
- ✅ Implemented session security with device fingerprinting
- ✅ Added comprehensive security logging system
- ✅ Implemented NoSQL injection prevention
- ✅ Added HTTP Parameter Pollution protection
- ✅ Enhanced error handling and logging

### Version 1.0 - Previous
- Basic security headers
- Simple rate limiting
- File type validation
- JWT authentication
- Password hashing


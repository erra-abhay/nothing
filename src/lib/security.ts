import fs from "fs";
import path from "path";

// Security event types
export const EventTypes = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_UPLOAD_REJECTED: "FILE_UPLOAD_REJECTED",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  SQL_INJECTION_ATTEMPT: "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT: "XSS_ATTEMPT",
  PATH_TRAVERSAL_ATTEMPT: "PATH_TRAVERSAL_ATTEMPT",
  CSRF_VIOLATION: "CSRF_VIOLATION",
  DATA_MODIFICATION: "DATA_MODIFICATION",
  DATA_DELETION: "DATA_DELETION",
};

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log file path for today
const getLogFilePath = () => {
  const date = new Date().toISOString().split("T")[0];
  return path.join(logsDir, `security-${date}.log`);
};

// Format log entry
const formatLogEntry = (event: any) => {
  return (
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...event,
    }) + "\n"
  );
};

// Write log entry
const writeLog = (event: any) => {
  const logEntry = formatLogEntry(event);
  const logFile = getLogFilePath();

  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error("Failed to write security log:", err);
    }
  });
};

// Log security event
export const logSecurityEvent = (type: string, details: any = {}) => {
  const event = {
    type,
    ...details,
  };

  writeLog(event);

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[SECURITY] ${type}:`, details);
  }
};

// Brute force protection state
// Note: In a production serverless environment, this should be in Redis.
// But for a containerized standalone app, an in-memory map works for the single instance.
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const trackLoginAttempt = (email: string, success: boolean, ip: string, details: any = {}) => {
  const key = `${email}:${ip}`;

  if (success) {
    // Clear failed attempts on successful login
    loginAttempts.delete(key);
    logSecurityEvent(EventTypes.LOGIN_SUCCESS, {
      email,
      ip,
      ...details,
    });
  } else {
    // Track failed attempt
    const attempts = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now(), lastAttempt: Date.now() };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(key, attempts);

    logSecurityEvent(EventTypes.LOGIN_FAILED, {
      email,
      ip,
      attemptCount: attempts.count,
      ...details,
    });

    // Check if account should be locked
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      logSecurityEvent(EventTypes.ACCOUNT_LOCKED, {
        email,
        ip,
        attemptCount: attempts.count,
        lockoutDuration: LOCKOUT_DURATION,
      });
    }
  }
};

export const isAccountLocked = (email: string, ip: string) => {
  const key = `${email}:${ip}`;
  const attempts = loginAttempts.get(key);

  if (!attempts || attempts.count < MAX_LOGIN_ATTEMPTS) {
    return false;
  }

  // Check if lockout period has expired
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(key);
    return false;
  }

  return true;
};

export const getRemainingLockoutTime = (email: string, ip: string) => {
  const key = `${email}:${ip}`;
  const attempts = loginAttempts.get(key);

  if (!attempts) return 0;

  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
  const remaining = LOCKOUT_DURATION - timeSinceLastAttempt;

  return remaining > 0 ? Math.ceil(remaining / 1000 / 60) : 0; // Return minutes
};

# Validation Requirements - Updated

All validation requirements have been relaxed for easier use while maintaining security.

---

## ✅ Faculty User Creation

**Password Requirements:**
- Minimum 6 characters
- At least one letter (any case)
- At least one number

**Examples:** `faculty1`, `test123`, `admin1`

---

## ✅ Department Creation

**Name Requirements:**
- 2-255 characters
- Letters, spaces, &, (), - allowed

**Code Requirements:**
- 2-20 characters
- Letters and numbers (any case)
- **No longer requires uppercase only**

**Examples:**
- Name: `Computer Science`, Code: `CS` or `cs` ✓
- Name: `IT & Engineering`, Code: `ITE` or `ite` ✓

---

## ✅ Subject Creation

**Name Requirements:**
- 2-255 characters
- Any characters allowed

**Code Requirements:**
- 2-20 characters
- Letters, numbers, and hyphens (any case)
- **No longer requires uppercase only**

**Examples:**
- Name: `Data Structures`, Code: `DS101` or `ds-101` ✓
- Name: `Web Development`, Code: `WEB-201` or `web201` ✓

---

## Summary of Changes

| Field | Old Requirement | New Requirement |
|-------|----------------|-----------------|
| Faculty Password | 8 chars + upper + lower + number | 6 chars + letter + number |
| Department Code | UPPERCASE only | Any case |
| Subject Code | UPPERCASE only | Any case |

All validation is now more flexible and user-friendly!

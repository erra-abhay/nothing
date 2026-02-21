# 📚 PaperVault by BRIKIEN LABS

## College Question Paper Repository - Quick Reference

### Admin Access
- **URL**: http://localhost:3000/admin-login.html
- **Email**: `admin@kitsw.ac.in`
- **Password**: `admin123`

> **⚠️ IMPORTANT**: Change the admin password after first login!

### Faculty Access
Faculty accounts must be created by admin first.
- **URL**: http://localhost:3000/faculty-login.html

## 🌐 Application URLs

- **Homepage**: http://localhost:3000
- **Browse Papers**: http://localhost:3000/browse.html
- **Faculty Login**: http://localhost:3000/faculty-login.html
- **Faculty Portal**: http://localhost:3000/faculty-portal.html
- **Admin Login**: http://localhost:3000/admin-login.html
- **Admin Panel**: http://localhost:3000/admin-panel.html

## 🗄️ Database Info

- **Database Name**: `question_paper_repo`
- **MySQL User**: `root`
- **MySQL Password**: (empty for local development)

## 🚀 Running the Application

```bash
# Start the server
cd /home/abhay/folder
npm start

# Server will run on http://localhost:3000
```

## 🔒 Security Features

✅ **Enhanced Security Headers** - XSS, Clickjacking, MIME sniffing protection  
✅ **Rate Limiting** - 100 requests per minute per IP  
✅ **File Upload Validation** - PDF and DOCX only with MIME type checking  
✅ **Input Sanitization** - Path traversal and injection protection  
✅ **JWT Authentication** - Secure token-based auth with 24h expiry  
✅ **CORS Configuration** - Restricted origins in production  
✅ **Error Handling** - Secure error messages, detailed logging  

See [SECURITY.md](file:///home/abhay/folder/SECURITY.md) for complete security documentation.

## 📄 Supported File Types

- **PDF** (.pdf) - Standard question papers
- **DOCX** (.docx, .doc) - Editable question papers
- **Max Size**: 10MB per file

## 📝 Sample Data

**Departments (5):**
- Computer Science (CS)
- Information Technology (IT)
- Electronics and Communication (EC)
- Mechanical Engineering (ME)
- Civil Engineering (CE)

**Subjects (8):**
- Data Structures, DBMS, OS, Computer Networks (CS)
- PPSC, Web Technologies, Software Engineering (IT)
- PPSC is available in both CS and IT departments

## 🎯 Quick Start Guide

1. **Access Admin Panel**: http://localhost:3000/admin-login.html
2. **Create Faculty Account**: Use admin panel → Faculty tab → Add Faculty
3. **Upload Papers**: Faculty logs in → Upload form → Select subject, semester, type, year, and PDF/DOCX
4. **Public Access**: Students visit homepage → Search or browse → Download papers

## 📚 Documentation

- [SECURITY.md](file:///home/abhay/folder/SECURITY.md) - Complete security documentation
- [Walkthrough](file:///home/abhay/.gemini/antigravity/brain/1d1671c1-9fba-4b92-949d-3f45f2b31075/walkthrough.md) - Detailed system walkthrough

Enjoy your secure question paper repository! 📚🔒

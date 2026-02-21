const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileTypeFromBuffer } = require('file-type');
const { logFileUpload } = require('./securityLogger');

// Ensure upload directory exists
const uploadDir = './uploads/papers';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types for PDF and DOCX
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword' // .doc (legacy)
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

// Magic number signatures for allowed file types
const MAGIC_NUMBERS = {
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    docx: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP format)
    doc: [0xD0, 0xCF, 0x11, 0xE0] // ....
};

// Verify file magic number
const verifyMagicNumber = async (filePath) => {
    try {
        // Read first 4 bytes
        const buffer = Buffer.alloc(4);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);

        // Check against known magic numbers
        const isPdf = buffer[0] === MAGIC_NUMBERS.pdf[0] &&
            buffer[1] === MAGIC_NUMBERS.pdf[1] &&
            buffer[2] === MAGIC_NUMBERS.pdf[2] &&
            buffer[3] === MAGIC_NUMBERS.pdf[3];

        const isDocx = buffer[0] === MAGIC_NUMBERS.docx[0] &&
            buffer[1] === MAGIC_NUMBERS.docx[1] &&
            buffer[2] === MAGIC_NUMBERS.docx[2] &&
            buffer[3] === MAGIC_NUMBERS.docx[3];

        const isDoc = buffer[0] === MAGIC_NUMBERS.doc[0] &&
            buffer[1] === MAGIC_NUMBERS.doc[1] &&
            buffer[2] === MAGIC_NUMBERS.doc[2] &&
            buffer[3] === MAGIC_NUMBERS.doc[3];

        return isPdf || isDocx || isDoc;
    } catch (error) {
        console.error('Magic number verification error:', error);
        return false;
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const year = new Date().getFullYear();
        const yearDir = path.join(uploadDir, year.toString());

        // Create year directory if it doesn't exist
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir, { recursive: true });
        }

        cb(null, yearDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename - remove special characters and limit length
        const sanitizedOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 200); // Limit filename length

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(sanitizedOriginalName);
        const basename = path.basename(sanitizedOriginalName, ext);
        const filename = `${basename}_${timestamp}_${randomString}${ext}`;

        cb(null, filename);
    }
});

// Enhanced file filter - validate both MIME type and extension
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    // Check file extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        logFileUpload(false, {
            reason: 'Invalid extension',
            extension: ext,
            filename: file.originalname,
            ip: req.ip,
            userId: req.user ? req.user.id : null
        });
        return cb(new Error(`Only PDF and DOCX files are allowed. Received: ${ext}`), false);
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        logFileUpload(false, {
            reason: 'Invalid MIME type',
            mimeType: mimeType,
            filename: file.originalname,
            ip: req.ip,
            userId: req.user ? req.user.id : null
        });
        return cb(new Error(`Invalid file type. Only PDF and DOCX files are allowed. Received MIME: ${mimeType}`), false);
    }

    // Additional security: Check filename for suspicious patterns
    const filename = file.originalname.toLowerCase();
    const suspiciousPatterns = ['.exe', '.sh', '.bat', '.cmd', '.php', '.js', '.html', '.htm', '.asp', '.jsp', '.py', '.rb'];
    for (const pattern of suspiciousPatterns) {
        if (filename.includes(pattern)) {
            logFileUpload(false, {
                reason: 'Suspicious pattern detected',
                pattern: pattern,
                filename: file.originalname,
                ip: req.ip,
                userId: req.user ? req.user.id : null
            });
            return cb(new Error('Suspicious file detected'), false);
        }
    }

    // Check for double extensions
    const parts = filename.split('.');
    if (parts.length > 2) {
        logFileUpload(false, {
            reason: 'Multiple extensions detected',
            filename: file.originalname,
            ip: req.ip,
            userId: req.user ? req.user.id : null
        });
        return cb(new Error('Files with multiple extensions are not allowed'), false);
    }

    cb(null, true);
};

// Configure multer with enhanced security
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
        files: 1, // Only allow 1 file per upload
        fields: 10, // Limit number of fields
        fieldNameSize: 100, // Limit field name size
        fieldSize: 1024 * 1024 // Limit field value size to 1MB
    }
});

// Middleware to verify file content after upload
const verifyFileContent = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        // Verify magic number
        const isValid = await verifyMagicNumber(req.file.path);

        if (!isValid) {
            // Delete the file
            fs.unlinkSync(req.file.path);

            logFileUpload(false, {
                reason: 'Invalid file content (magic number mismatch)',
                filename: req.file.originalname,
                ip: req.ip,
                userId: req.user ? req.user.id : null
            });

            return res.status(400).json({
                error: 'File content validation failed. The file may be corrupted or is not a valid PDF/DOCX file.'
            });
        }

        // Log successful upload
        logFileUpload(true, {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            ip: req.ip,
            userId: req.user ? req.user.id : null
        });

        next();
    } catch (error) {
        console.error('File verification error:', error);

        // Delete the file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            error: 'File verification failed'
        });
    }
};

module.exports = upload;
module.exports.verifyFileContent = verifyFileContent;


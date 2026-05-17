-- College Question Paper Repository Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS PVBL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE PVBL;

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_department (department_id),
    INDEX idx_code (code),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table (Faculty & Admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('faculty', 'admin') NOT NULL,
    department_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    session_token VARCHAR(255) NULL,
    session_created_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department_id),
    INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Papers Table
CREATE TABLE IF NOT EXISTS papers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    department_id INT NOT NULL,
    semester INT NOT NULL,
    paper_type ENUM('MSE-1', 'MSE-2', 'ESE', 'Quiz', 'Assignment', 'Other') NOT NULL,
    year INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    uploaded_by INT NOT NULL,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_subject (subject_id),
    INDEX idx_department (department_id),
    INDEX idx_semester (semester),
    INDEX idx_type (paper_type),
    INDEX idx_year (year),
    INDEX idx_downloads (download_count),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (name, email, password, role, department_id, is_active) 
VALUES ('System Admin', 'admin@kitsw.ac.in', '$2b$10$aRuIACovohHsKay4GmrAY.fSEOgWm1AUcdLGML8VuivFhw8Bp7e/O', 'admin', NULL, TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample departments
INSERT INTO departments (name, code) VALUES 
    ('Computer Science', 'CS'),
    ('Information Technology', 'IT'),
    ('Electronics and Communication', 'EC'),
    ('Mechanical Engineering', 'ME'),
    ('Civil Engineering', 'CE')
ON DUPLICATE KEY UPDATE code=code;

-- Insert sample subjects for Computer Science
INSERT INTO subjects (name, code, department_id) VALUES 
    ('Data Structures', 'CS201', (SELECT id FROM departments WHERE code = 'CS')),
    ('Database Management Systems', 'CS301', (SELECT id FROM departments WHERE code = 'CS')),
    ('Operating Systems', 'CS302', (SELECT id FROM departments WHERE code = 'CS')),
    ('Computer Networks', 'CS401', (SELECT id FROM departments WHERE code = 'CS')),
    ('Programming Paradigms and Practical Concepts', 'PPSC', (SELECT id FROM departments WHERE code = 'CS'))
ON DUPLICATE KEY UPDATE code=code;

-- Insert sample subjects for IT
INSERT INTO subjects (name, code, department_id) VALUES 
    ('Programming Paradigms and Practical Concepts', 'PPSC', (SELECT id FROM departments WHERE code = 'IT')),
    ('Web Technologies', 'IT301', (SELECT id FROM departments WHERE code = 'IT')),
    ('Software Engineering', 'IT302', (SELECT id FROM departments WHERE code = 'IT'))
ON DUPLICATE KEY UPDATE code=code;

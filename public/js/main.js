// Main JavaScript for Question Paper Repository

// API Base URL
const API_BASE = '/api';

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Utility function to show error
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.textContent = message;
    document.body.insertBefore(alertDiv, document.body.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Utility function to show success
function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success';
    alertDiv.textContent = message;
    document.body.insertBefore(alertDiv, document.body.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Display papers in a container
function displayPapers(papers, containerId) {
    const container = document.getElementById(containerId);

    if (!papers || papers.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No papers found</p>';
        return;
    }

    container.innerHTML = papers.map(paper => `
        <div class="paper-card">
            <div class="paper-header">
                <h3 class="paper-title">${paper.subject_name}</h3>
                <span class="paper-badge">${paper.paper_type}</span>
            </div>
            <div class="paper-meta">
                <div class="paper-meta-item">
                    <span>🏛️</span>
                    <span>${paper.department_name}</span>
                </div>
                <div class="paper-meta-item">
                    <span>📅</span>
                    <span>Sem ${paper.semester} - ${paper.year}</span>
                </div>
                ${paper.download_count !== undefined ? `
                <div class="paper-meta-item">
                    <span>⬇️</span>
                    <span>${paper.download_count} downloads</span>
                </div>
                ` : ''}
            </div>
            ${paper.uploaded_by ? `
            <p class="text-muted" style="font-size: 0.875rem;">Uploaded by: ${paper.uploaded_by}</p>
            ` : ''}
            <div class="paper-footer">
                <span class="text-muted">${paper.created_at ? formatDate(paper.created_at) : ''}</span>
                <button class="btn btn-primary btn-sm" onclick="downloadPaper(${paper.id}, '${paper.subject_name}')">
                    Download PDF
                </button>
            </div>
        </div>
    `).join('');
}

// Download paper
async function downloadPaper(paperId, subjectName) {
    try {
        window.location.href = `${API_BASE}/public/papers/${paperId}/download`;
        showSuccess(`Downloading ${subjectName}...`);
    } catch (error) {
        console.error('Download error:', error);
        showError('Failed to download paper');
    }
}

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        search: params.get('search') || '',
        department: params.get('department') || '',
        subject: params.get('subject') || '',
        semester: params.get('semester') || '',
        type: params.get('type') || '',
        year: params.get('year') || ''
    };
}

// Build query string from filters
function buildQueryString(filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
        if (filters[key]) {
            params.append(key, filters[key]);
        }
    });
    return params.toString();
}

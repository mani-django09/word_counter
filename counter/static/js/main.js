// Main JavaScript for Word Counter Application
(function() {
    'use strict';

    // Theme Management
    class ThemeManager {
        constructor() {
            this.themeToggle = document.getElementById('theme-toggle');
            this.init();
        }

        init() {
            this.loadTheme();
            this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        }

        loadTheme() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                document.documentElement.classList.add('dark');
            }
        }

        toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }
    }

    // Toast Notification System
    class ToastManager {
        constructor() {
            this.toast = document.getElementById('toast');
            this.message = document.getElementById('toast-message');
        }

        show(message, type = 'success', duration = 3000) {
            if (!this.toast || !this.message) return;

            this.message.textContent = message;
            
            // Update colors based on type
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500',
                warning: 'bg-yellow-500'
            };

            this.toast.querySelector('div').className = `${colors[type]} text-white px-4 py-3 rounded-md shadow-lg flex items-center space-x-2`;
            
            this.toast.classList.remove('hidden');
            this.toast.classList.add('toast-enter');
            
            setTimeout(() => {
                this.hide();
            }, duration);
        }

        hide() {
            if (!this.toast) return;
            
            this.toast.classList.add('toast-exit');
            setTimeout(() => {
                this.toast.classList.add('hidden');
                this.toast.classList.remove('toast-enter', 'toast-exit');
            }, 300);
        }
    }

    // Mobile Menu Handler
    class MobileMenu {
        constructor() {
            this.button = document.getElementById('mobile-menu-button');
            this.menu = document.getElementById('mobile-menu');
            this.init();
        }

        init() {
            this.button?.addEventListener('click', () => this.toggle());
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.button?.contains(e.target) && !this.menu?.contains(e.target)) {
                    this.close();
                }
            });
        }

        toggle() {
            if (!this.menu) return;
            this.menu.classList.toggle('hidden');
        }

        close() {
            if (!this.menu) return;
            this.menu.classList.add('hidden');
        }
    }

    // FAQ Accordion
    class FAQAccordion {
        constructor() {
            this.items = document.querySelectorAll('.faq-item');
            this.init();
        }

        init() {
            this.items.forEach(item => {
                const question = item.querySelector('.faq-question');
                const answer = item.querySelector('.faq-answer');
                
                question?.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    
                    // Close all other items
                    this.items.forEach(otherItem => {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-answer')?.classList.remove('show');
                    });
                    
                    // Toggle current item
                    if (!isActive) {
                        item.classList.add('active');
                        answer?.classList.add('show');
                    }
                });
            });
        }
    }

    // Auto-expand textarea
    class TextareaAutoExpand {
        constructor(element) {
            this.element = element;
            this.init();
        }

        init() {
            if (!this.element) return;
            
            this.element.addEventListener('input', () => this.adjust());
            this.adjust(); // Initial adjustment
        }

        adjust() {
            this.element.style.height = 'auto';
            this.element.style.height = Math.min(this.element.scrollHeight, 400) + 'px';
        }
    }

    // File Upload Handler
    class FileUploadHandler {
        constructor() {
            this.fileInput = document.getElementById('file-upload');
            this.dropZone = this.fileInput?.closest('.border-dashed');
            this.toast = new ToastManager();
            this.init();
        }

        init() {
            if (!this.fileInput || !this.dropZone) return;

            // File input change
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

            // Drag and drop
            this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        handleDragOver(e) {
            e.preventDefault();
            this.dropZone.classList.add('file-upload-hover');
        }

        handleDragLeave(e) {
            e.preventDefault();
            if (!this.dropZone.contains(e.relatedTarget)) {
                this.dropZone.classList.remove('file-upload-hover');
            }
        }

        handleDrop(e) {
            e.preventDefault();
            this.dropZone.classList.remove('file-upload-hover');
            this.handleFileSelect(e.dataTransfer.files);
        }

        handleFileSelect(files) {
            if (!files || files.length === 0) return;

            const file = files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];

            // Validate file size
            if (file.size > maxSize) {
                this.toast.show('File too large. Maximum size is 5MB.', 'error');
                return;
            }

            // Validate file type
            if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|docx|pdf)$/i)) {
                this.toast.show('Unsupported file type. Use TXT, DOCX, or PDF files.', 'error');
                return;
            }

            this.uploadFile(file);
        }

        uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            // Show loading state
            const originalText = this.dropZone.innerHTML;
            this.dropZone.innerHTML = '<div class="text-center p-4"><div class="spinner mx-auto mb-2"></div><div class="text-sm text-gray-500">Processing file...</div></div>';

            fetch('/api/process-file/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update textarea with extracted text
                    const textarea = document.getElementById('text-input');
                    if (textarea) {
                        textarea.value = data.text;
                        textarea.dispatchEvent(new Event('input'));
                    }
                    this.toast.show(`File "${data.filename}" processed successfully!`, 'success');
                } else {
                    this.toast.show(data.error || 'File processing failed.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.toast.show('Network error. Please try again.', 'error');
            })
            .finally(() => {
                this.dropZone.innerHTML = originalText;
            });
        }

        getCSRFToken() {
            return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
        }
    }

    // Copy to clipboard utility
    class ClipboardManager {
        static async copy(text) {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'absolute';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        return successful;
                    } catch (err) {
                        document.body.removeChild(textArea);
                        return false;
                    }
                }
            } catch (err) {
                return false;
            }
        }
    }

    // Download utility
    class DownloadManager {
        static downloadText(text, filename) {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        static downloadCSV(data, filename) {
            const csv = this.convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        static convertToCSV(data) {
            if (!Array.isArray(data) || data.length === 0) return '';
            
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => 
                    headers.map(header => 
                        typeof row[header] === 'string' && row[header].includes(',') 
                            ? `"${row[header]}"` 
                            : row[header]
                    ).join(',')
                )
            ].join('\n');
            
            return csvContent;
        }
    }

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize core components
        new ThemeManager();
        new MobileMenu();
        new FAQAccordion();
        new FileUploadHandler();

        // Initialize auto-expanding textareas
        document.querySelectorAll('textarea').forEach(textarea => {
            new TextareaAutoExpand(textarea);
        });

        // Make utilities globally available
        window.ClipboardManager = ClipboardManager;
        window.DownloadManager = DownloadManager;
        window.ToastManager = ToastManager;
    });

})();
(function() {
    'use strict';

    class HomepageWordCounter {
        constructor() {
            this.textarea = document.getElementById('main-textarea');
            this.fileInput = document.getElementById('file-input');
            this.fileDropZone = document.querySelector('.file-drop-zone');
            this.toast = new window.ToastManager();
            
            this.debounceTimer = null;
            this.currentStats = {};
            
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.setupFileUpload();
            this.setupActionButtons();
            this.setupFAQ();
            
            // Initial analysis if there's text
            if (this.textarea?.value.trim()) {
                this.analyzeText();
            }
        }

        setupEventListeners() {
            if (!this.textarea) return;

            // Text input events
            this.textarea.addEventListener('input', () => this.debounceAnalysis());
            this.textarea.addEventListener('paste', () => {
                setTimeout(() => this.debounceAnalysis(), 10);
            });

            // Show/hide clear button
            this.textarea.addEventListener('input', () => this.toggleClearButton());
            
            // Auto-resize textarea
            this.textarea.addEventListener('input', () => this.autoResizeTextarea());
        }

        setupFileUpload() {
            if (!this.fileInput || !this.fileDropZone) return;

            // File input change
            this.fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files);
            });

            // Drag and drop events
            this.fileDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.fileDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.fileDropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        setupActionButtons() {
            // Copy text
            const copyBtn = document.getElementById('copy-text-btn');
            copyBtn?.addEventListener('click', () => this.copyText());

            // Download TXT
            const downloadTxtBtn = document.getElementById('download-txt-btn');
            downloadTxtBtn?.addEventListener('click', () => this.downloadTxt());

            // Download PDF
            const downloadPdfBtn = document.getElementById('download-pdf-btn');
            downloadPdfBtn?.addEventListener('click', () => this.downloadPdf());

            // Print
            const printBtn = document.getElementById('print-btn');
            printBtn?.addEventListener('click', () => this.printText());

            // Clear text
            const clearBtn = document.getElementById('clear-text');
            clearBtn?.addEventListener('click', () => this.clearText());
        }

        setupFAQ() {
            const faqItems = document.querySelectorAll('.faq-item');
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                const answer = item.querySelector('.faq-answer');
                
                question?.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    
                    // Close all other FAQ items
                    faqItems.forEach(otherItem => {
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

        debounceAnalysis() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.analyzeText(), 200);
        }

        analyzeText() {
            const text = this.textarea?.value || '';
            
            // Update stat numbers with animation
            this.animateStatUpdate(() => {
                this.updateBasicStats(text);
                this.updateExtendedStats(text);
                this.updateKeywordDensity(text);
            });
        }

        animateStatUpdate(callback) {
            const statNumbers = document.querySelectorAll('.stat-number');
            
            // Add updating class
            statNumbers.forEach(stat => {
                stat.classList.add('updating');
            });
            
            // Execute the update
            callback();
            
            // Remove updating class after animation
            setTimeout(() => {
                statNumbers.forEach(stat => {
                    stat.classList.remove('updating');
                });
            }, 300);
        }

        updateBasicStats(text) {
            const stats = this.calculateStats(text);
            
            this.updateElement('word-count', stats.words.toLocaleString());
            this.updateElement('character-count', stats.characters.toLocaleString());
            this.updateElement('sentence-count', stats.sentences.toLocaleString());
            this.updateElement('paragraph-count', stats.paragraphs.toLocaleString());
            
            this.currentStats = stats;
        }

        updateExtendedStats(text) {
            if (!text.trim()) {
                document.getElementById('extended-stats')?.classList.add('hidden');
                return;
            }

            const stats = this.currentStats;
            
            // Reading times
            const readingSlow = this.formatTime(Math.ceil(stats.words / 125));
            const readingAvg = this.formatTime(Math.ceil(stats.words / 225));
            const readingFast = this.formatTime(Math.ceil(stats.words / 350));
            
            // Speaking times
            const speakingSlow = this.formatTime(Math.ceil(stats.words / 100));
            const speakingAvg = this.formatTime(Math.ceil(stats.words / 160));
            const speakingFast = this.formatTime(Math.ceil(stats.words / 200));
            
            this.updateElement('reading-time-slow', readingSlow);
            this.updateElement('reading-time-avg', readingAvg);
            this.updateElement('reading-time-fast', readingFast);
            this.updateElement('speaking-time-slow', speakingSlow);
            this.updateElement('speaking-time-avg', speakingAvg);
            this.updateElement('speaking-time-fast', speakingFast);
            
            // Additional details
            this.updateElement('character-count-no-spaces', stats.charactersNoSpaces.toLocaleString());
            this.updateElement('line-count', stats.lines.toLocaleString());
            this.updateElement('avg-words-sentence', stats.avgWordsPerSentence.toFixed(1));
            
            document.getElementById('extended-stats')?.classList.remove('hidden');
        }

        updateKeywordDensity(text) {
            const keywords = this.calculateKeywordDensity(text);
            const keywordSection = document.getElementById('keyword-section');
            const keywordTable = document.getElementById('keyword-table');
            
            if (!keywords.length) {
                keywordSection?.classList.add('hidden');
                return;
            }
            
            const tableHTML = keywords.map(keyword => `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        ${this.escapeHtml(keyword.word)}
                    </td>
                    <td class="py-3 px-4 text-gray-600 dark:text-gray-300">
                        ${keyword.count}
                    </td>
                    <td class="py-3 px-4 text-gray-600 dark:text-gray-300">
                        ${keyword.density.toFixed(2)}%
                    </td>
                </tr>
            `).join('');
            
            if (keywordTable) {
                keywordTable.innerHTML = tableHTML;
            }
            
            keywordSection?.classList.remove('hidden');
        }

        calculateStats(text) {
            if (!text.trim()) {
                return {
                    words: 0,
                    characters: 0,
                    charactersNoSpaces: 0,
                    sentences: 0,
                    paragraphs: 0,
                    lines: 0,
                    avgWordsPerSentence: 0
                };
            }

            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
            const lines = text.split('\n').filter(line => line.trim().length > 0);

            return {
                words: words.length,
                characters: text.length,
                charactersNoSpaces: text.replace(/\s/g, '').length,
                sentences: sentences.length,
                paragraphs: paragraphs.length,
                lines: lines.length,
                avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0
            };
        }

        calculateKeywordDensity(text) {
            if (!text.trim()) return [];

            const stopwords = new Set([
                'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
                'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
                'to', 'was', 'were', 'will', 'with', 'would', 'could', 'should',
                'this', 'but', 'they', 'have', 'had', 'what', 'said', 'each',
                'which', 'she', 'do', 'how', 'their', 'if', 'up', 'out', 'many'
            ]);

            const words = text.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => 
                    word.length >= 3 && 
                    !stopwords.has(word) && 
                    !word.match(/^\d+$/)
                );

            if (!words.length) return [];

            const wordCount = {};
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });

            return Object.entries(wordCount)
                .map(([word, count]) => ({
                    word,
                    count,
                    density: (count / words.length) * 100
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        }

        formatTime(minutes) {
            if (minutes < 1) return '< 1 min';
            if (minutes === 1) return '1 min';
            if (minutes < 60) return `${minutes} min`;
            
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            
            if (mins === 0) return `${hours} hr`;
            return `${hours} hr ${mins} min`;
        }

        toggleClearButton() {
            const clearBtn = document.getElementById('clear-text');
            const hasText = this.textarea?.value.trim().length > 0;
            
            if (clearBtn) {
                clearBtn.parentElement.style.opacity = hasText ? '1' : '0';
            }
        }

        autoResizeTextarea() {
            if (!this.textarea) return;
            
            this.textarea.style.height = 'auto';
            const maxHeight = 600;
            const newHeight = Math.min(this.textarea.scrollHeight, maxHeight);
            this.textarea.style.height = newHeight + 'px';
        }

        // File handling methods
        handleDragOver(e) {
            e.preventDefault();
            this.fileDropZone?.classList.add('drag-over');
        }

        handleDragLeave(e) {
            e.preventDefault();
            if (!this.fileDropZone?.contains(e.relatedTarget)) {
                this.fileDropZone?.classList.remove('drag-over');
            }
        }

        handleDrop(e) {
            e.preventDefault();
            this.fileDropZone?.classList.remove('drag-over');
            this.handleFileSelect(e.dataTransfer.files);
        }

        handleFileSelect(files) {
            if (!files?.length) return;

            const file = files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (file.size > maxSize) {
                this.toast.show('File too large. Maximum size is 5MB.', 'error');
                return;
            }

            const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                this.toast.show('Unsupported file type. Please use TXT, DOCX, or PDF files.', 'error');
                return;
            }

            this.processFile(file);
        }

        async processFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                // Show loading state
                this.showFileProcessingState();

                const response = await fetch('/api/process-file/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });

                const data = await response.json();

                if (data.success) {
                    if (this.textarea) {
                        this.textarea.value = data.text;
                        this.autoResizeTextarea();
                        this.analyzeText();
                    }
                    this.toast.show(`File "${file.name}" processed successfully!`, 'success');
                } else {
                    this.toast.show(data.error || 'File processing failed.', 'error');
                }
            } catch (error) {
                console.error('File processing error:', error);
                this.toast.show('Network error. Please try again.', 'error');
            } finally {
                this.hideFileProcessingState();
            }
        }

        showFileProcessingState() {
            const dropZone = this.fileDropZone;
            if (!dropZone) return;

            dropZone.innerHTML = `
                <div class="flex flex-col items-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Processing file...</span>
                </div>
            `;
        }

        hideFileProcessingState() {
            const dropZone = this.fileDropZone;
            if (!dropZone) return;

            dropZone.innerHTML = `
                <label for="file-input" class="cursor-pointer">
                    <div class="flex flex-col items-center">
                        <svg class="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Drop files here or click to upload
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Supports TXT, DOCX, PDF (max 5MB)
                        </span>
                    </div>
                </label>
            `;
            }

        // Action methods
        async copyText() {
            const text = this.textarea?.value;
            if (!text?.trim()) {
                this.toast.show('No text to copy.', 'warning');
                return;
            }

            try {
                await navigator.clipboard.writeText(text);
                this.toast.show('Text copied to clipboard!', 'success');
            } catch (error) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    this.toast.show('Text copied to clipboard!', 'success');
                } catch (err) {
                    this.toast.show('Failed to copy text.', 'error');
                }
                
                document.body.removeChild(textArea);
            }
        }

        downloadTxt() {
            const text = this.textarea?.value;
            if (!text?.trim()) {
                this.toast.show('No text to download.', 'warning');
                return;
            }

            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `document-${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.toast.show('Text file downloaded!', 'success');
        }

        downloadPdf() {
            // This would require a PDF library like jsPDF
            // For now, we'll show a message about the feature
            this.toast.show('PDF download coming soon! Use "Save as TXT" for now.', 'info');
        }

        printText() {
            const text = this.textarea?.value;
            if (!text?.trim()) {
                this.toast.show('No text to print.', 'warning');
                return;
            }

            const printWindow = window.open('', '_blank');
            const stats = this.currentStats;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Document - Word Counter</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                        .header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px; }
                        .stats { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                        .stat-item { text-align: center; }
                        .stat-number { font-size: 24px; font-weight: bold; color: #3b82f6; }
                        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
                        .content { white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Document Analysis</h1>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="stats">
                        <h2>Statistics</h2>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-number">${(stats.words || 0).toLocaleString()}</div>
                                <div class="stat-label">Words</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${(stats.characters || 0).toLocaleString()}</div>
                                <div class="stat-label">Characters</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${(stats.sentences || 0).toLocaleString()}</div>
                                <div class="stat-label">Sentences</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${(stats.paragraphs || 0).toLocaleString()}</div>
                                <div class="stat-label">Paragraphs</div>
                            </div>
                        </div>
                    </div>
                    <div class="content">${this.escapeHtml(text)}</div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Wait for content to load, then print
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }

        clearText() {
            if (this.textarea) {
                this.textarea.value = '';
                this.autoResizeTextarea();
                this.analyzeText();
                this.textarea.focus();
            }
            this.toast.show('Text cleared.', 'info');
        }

        // Utility methods
        updateElement(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        getCSRFToken() {
            return document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                   document.querySelector('meta[name=csrf-token]')?.content || '';
        }
    }

    // Smooth scroll for anchor links
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute('href'));
                    
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
    }

    // Intersection Observer for animations
    class ScrollAnimations {
        constructor() {
            this.observer = null;
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver(
                    (entries) => this.handleIntersection(entries),
                    {
                        threshold: 0.1,
                        rootMargin: '0px 0px -50px 0px'
                    }
                );

                this.observeElements();
            }
        }

        observeElements() {
            const elements = document.querySelectorAll([
                '.other-tools-section .tool-card',
                '.content-section',
                '.faq-section'
            ].join(','));

            elements.forEach(el => this.observer?.observe(el));
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    this.observer?.unobserve(entry.target);
                }
            });
        }
    }

    // Performance monitoring
    class PerformanceMonitor {
        constructor() {
            this.init();
        }

        init() {
            // Monitor Core Web Vitals
            this.measureCLS();
            this.measureFID();
            this.measureLCP();
        }

        measureCLS() {
            if ('LayoutShift' in window) {
                let clsValue = 0;
                let clsEntries = [];

                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            clsEntries.push(entry);
                        }
                    }
                });

                observer.observe({ type: 'layout-shift', buffered: true });

                // Report CLS when page is hidden
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') {
                        console.log('CLS:', clsValue);
                    }
                });
            }
        }

        measureFID() {
            if ('PerformanceEventTiming' in window) {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.processingStart - entry.startTime > 100) {
                            console.log('FID:', entry.processingStart - entry.startTime);
                        }
                    }
                });

                observer.observe({ type: 'first-input', buffered: true });
            }
        }

        measureLCP() {
            if ('LargestContentfulPaint' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.startTime);
                });

                observer.observe({ type: 'largest-contentful-paint', buffered: true });
            }
        }
    }

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        new HomepageWordCounter();
        new SmoothScroll();
        new ScrollAnimations();
        
        // Only initialize performance monitoring in production
        if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            new PerformanceMonitor();
        }
    });

})();
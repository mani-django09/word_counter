// Word Counter specific functionality
(function() {
    'use strict';

    class WordCounterApp {
        constructor() {
            this.textInput = document.getElementById('text-input');
            this.toast = new window.ToastManager();
            this.debounceTimer = null;
            this.currentStats = null;
            
            this.init();
        }

        init() {
            if (!this.textInput) return;

            // Listen for text changes
            this.textInput.addEventListener('input', () => this.debounceAnalysis());
            this.textInput.addEventListener('paste', () => {
                setTimeout(() => this.debounceAnalysis(), 10);
            });

            // Set up action buttons
            this.setupActionButtons();

            // Initial analysis if there's existing text
            if (this.textInput.value.trim()) {
                this.analyzeText();
            }
        }

        debounceAnalysis() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.analyzeText(), 300);
        }

        analyzeText() {
            const text = this.textInput.value;
            
            if (!text.trim()) {
                this.clearStats();
                return;
            }

            // Show loading state
            this.showLoadingState();

            // Send to API for analysis
            fetch('/api/analyze-text/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ text: text })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateStats(data.stats);
                    this.updateSocialMediaLimits(text.length);
                    this.currentStats = data.stats;
                } else {
                    this.toast.show(data.error || 'Analysis failed.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.toast.show('Network error. Please try again.', 'error');
            })
            .finally(() => {
                this.hideLoadingState();
            });
        }

        updateStats(stats) {
            // Update basic stats
            this.updateElement('word-count', stats.word_count.toLocaleString());
            this.updateElement('char-count', stats.character_count.toLocaleString());
            this.updateElement('char-count-no-spaces', stats.character_count_no_spaces.toLocaleString());
            this.updateElement('sentence-count', stats.sentence_count.toLocaleString());
            this.updateElement('paragraph-count', stats.paragraph_count.toLocaleString());

            // Update reading and speaking time
            const readingTime = this.formatTime(stats.reading_time);
            const speakingTime = this.formatTime(stats.speaking_time);
            this.updateElement('reading-time', readingTime);
            this.updateElement('speaking-time', speakingTime);

            // Show detailed stats
            const detailedStats = document.getElementById('detailed-stats');
            if (detailedStats) {
                detailedStats.classList.remove('hidden');
            }

            // Update keyword density
            this.updateKeywordDensity(stats.keyword_density);
        }

        updateElement(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }

        formatTime(timeObj) {
            if (timeObj.minutes === 0) {
                return `${timeObj.seconds} sec`;
            } else if (timeObj.seconds === 0) {
                return `${timeObj.minutes} min`;
            } else {
                return `${timeObj.minutes} min ${timeObj.seconds} sec`;
            }
        }

        updateKeywordDensity(keywords) {
            const section = document.getElementById('keyword-density-section');
            const tbody = document.getElementById('keyword-table');
            
            if (!section || !tbody) return;

            if (keywords.length === 0) {
                section.classList.add('hidden');
                return;
            }

            tbody.innerHTML = keywords.map(keyword => `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${this.escapeHtml(keyword.word)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${keyword.count}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${keyword.density}%
                    </td>
                </tr>
            `).join('');

            section.classList.remove('hidden');
        }

        updateSocialMediaLimits(charCount) {
            const limits = {
                twitter: { limit: 280, element: 'twitter-remaining' },
                instagram: { limit: 2200, element: 'instagram-remaining' },
                facebook: { limit: 63206, element: 'facebook-remaining' }
            };

            Object.entries(limits).forEach(([platform, config]) => {
                const remaining = config.limit - charCount;
                const element = document.getElementById(config.element);
                
                if (element) {
                    if (remaining >= 0) {
                        element.textContent = `${remaining.toLocaleString()} remaining`;
                        element.className = 'text-sm text-gray-600 dark:text-gray-400';
                    } else {
                        element.textContent = `${Math.abs(remaining).toLocaleString()} over limit`;
                        element.className = 'text-sm text-red-600 dark:text-red-400';
                    }
                }
            });
        }

        setupActionButtons() {
            // Copy text button
            const copyBtn = document.getElementById('copy-text');
            copyBtn?.addEventListener('click', () => this.copyText());

            // Download TXT button
            const downloadTxtBtn = document.getElementById('download-txt');
            downloadTxtBtn?.addEventListener('click', () => this.downloadTxt());

            // Download CSV button
            const downloadCsvBtn = document.getElementById('download-csv');
            downloadCsvBtn?.addEventListener('click', () => this.downloadCsv());
        }

        async copyText() {
            const text = this.textInput.value;
            if (!text.trim()) {
                this.toast.show('No text to copy.', 'warning');
                return;
            }

            const success = await window.ClipboardManager.copy(text);
            if (success) {
                this.toast.show('Text copied to clipboard!', 'success');
            } else {
                this.toast.show('Failed to copy text.', 'error');
            }
        }

        downloadTxt() {
            const text = this.textInput.value;
            if (!text.trim()) {
                this.toast.show('No text to download.', 'warning');
                return;
            }

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            window.DownloadManager.downloadText(text, `text-${timestamp}.txt`);
            this.toast.show('Text file downloaded!', 'success');
        }

        downloadCsv() {
            if (!this.currentStats) {
                this.toast.show('No statistics to download.', 'warning');
                return;
            }

            const csvData = [
                { metric: 'Words', value: this.currentStats.word_count },
                { metric: 'Characters', value: this.currentStats.character_count },
                { metric: 'Characters (no spaces)', value: this.currentStats.character_count_no_spaces },
                { metric: 'Sentences', value: this.currentStats.sentence_count },
                { metric: 'Paragraphs', value: this.currentStats.paragraph_count },
                { metric: 'Reading time (minutes)', value: this.currentStats.reading_time.minutes },
                { metric: 'Speaking time (minutes)', value: this.currentStats.speaking_time.minutes }
            ];

            // Add keyword density data
            if (this.currentStats.keyword_density && this.currentStats.keyword_density.length > 0) {
                csvData.push({ metric: '', value: '' }); // Empty row
                csvData.push({ metric: 'Top Keywords', value: '' });
                this.currentStats.keyword_density.forEach(keyword => {
                    csvData.push({
                        metric: keyword.word,
                        value: `${keyword.count} (${keyword.density}%)`
                    });
                });
            }

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            window.DownloadManager.downloadCSV(csvData, `word-counter-stats-${timestamp}.csv`);
            this.toast.show('Statistics CSV downloaded!', 'success');
        }

        clearStats() {
            // Clear all stat displays
            ['word-count', 'char-count', 'char-count-no-spaces', 'sentence-count', 'paragraph-count'].forEach(id => {
                this.updateElement(id, '0');
            });

            this.updateElement('reading-time', '0 min');
            this.updateElement('speaking-time', '0 min');

            // Hide detailed sections
            const detailedStats = document.getElementById('detailed-stats');
            const keywordSection = document.getElementById('keyword-density-section');
            
            detailedStats?.classList.add('hidden');
            keywordSection?.classList.add('hidden');

            // Reset social media limits
            this.updateSocialMediaLimits(0);

            this.currentStats = null;
        }

        showLoadingState() {
            // Add subtle loading indicators
            document.querySelectorAll('.stat-card .text-2xl').forEach(el => {
                el.classList.add('animate-pulse');
            });
        }

        hideLoadingState() {
            document.querySelectorAll('.stat-card .text-2xl').forEach(el => {
                el.classList.remove('animate-pulse');
            });
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

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        new WordCounterApp();
    });

})();
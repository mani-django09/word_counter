import json
import csv
import io
from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django_ratelimit.decorators import ratelimit
from django.contrib import messages
from .utils import TextAnalyzer, FileProcessor, TextCleaner, CaseConverter

class BaseToolView(TemplateView):
    """Base view for all counter tools with common SEO and caching"""
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(self.get_seo_context())
        return context
    
    def get_seo_context(self):
        """Override in subclasses to provide SEO data"""
        return {}

class WordCounterView(BaseToolView):
    template_name = 'counter/word_counter.html'
    
    def get_seo_context(self):
        return {
            'page_title': 'Free Online Word Counter - Count Words, Characters & More',
            'meta_description': 'Free online word counter tool. Count words, characters, sentences, paragraphs. Calculate reading time, keyword density. Support for TXT, DOCX files. Mobile-friendly.',
            'canonical_url': self.request.build_absolute_uri('/'),
            'og_title': 'Free Online Word Counter Tool',
            'og_description': 'Count words and characters instantly. Features reading time calculator, keyword density analysis, and file upload support.',
            'schema_data': self.get_schema_data(),
            'is_main_page': True,
        }
    
    def get_schema_data(self):
        return {
            "@context": "https://schema.org",
            "@type": ["SoftwareApplication", "WebApplication"],
            "name": "Word Counter Tool",
            "description": "Free online word and character counter with reading time calculation and keyword density analysis",
            "url": self.request.build_absolute_uri('/'),
            "applicationCategory": "Utility",
            "operatingSystem": "Any",
            "browserRequirements": "Any modern web browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "creator": {
                "@type": "Organization",
                "name": "Word Counter"
            }
        }

class CharacterCounterView(BaseToolView):
    template_name = 'counter/character_counter.html'
    
    def get_seo_context(self):
        return {
            'page_title': 'Character Counter - Count Characters Online Free',
            'meta_description': 'Free character counter tool. Count characters with and without spaces, words, sentences. Perfect for social media posts, essays, and content creation.',
            'canonical_url': self.request.build_absolute_uri('/character-counter/'),
            'og_title': 'Free Character Counter Tool',
            'og_description': 'Count characters instantly for social media, essays, and more. Includes spaces and no-spaces count.',
        }

class ReadingTimeView(BaseToolView):
    template_name = 'counter/reading_time.html'
    
    def get_seo_context(self):
        return {
            'page_title': 'Reading Time Calculator - Estimate Reading Duration',
            'meta_description': 'Calculate reading time for any text. Estimate how long it takes to read articles, books, documents. Based on average reading speeds.',
            'canonical_url': self.request.build_absolute_uri('/reading-time-calculator/'),
            'og_title': 'Reading Time Calculator',
            'og_description': 'Estimate reading time for any text based on average reading speeds.',
        }

class SpaceCleanerView(BaseToolView):
    template_name = 'counter/space_cleaner.html'
    
    def get_seo_context(self):
        return {
            'page_title': 'Space Remover - Clean Extra Spaces Online',
            'meta_description': 'Remove extra spaces, duplicate spaces, and clean up text formatting. Free online space cleaner tool for better text formatting.',
            'canonical_url': self.request.build_absolute_uri('/space-cleaner/'),
            'og_title': 'Space Remover Tool',
            'og_description': 'Clean up text by removing extra spaces and formatting issues.',
        }

class CaseConverterView(BaseToolView):
    template_name = 'counter/case_converter.html'
    
    def get_seo_context(self):
        return {
            'page_title': 'Case Converter - Change Text Case Online',
            'meta_description': 'Convert text case online. Change to UPPERCASE, lowercase, Title Case, or Sentence case. Free text case conversion tool.',
            'canonical_url': self.request.build_absolute_uri('/case-converter/'),
            'og_title': 'Text Case Converter',
            'og_description': 'Convert text to different cases: upper, lower, title, and sentence case.',
        }

class PrivacyView(TemplateView):
    template_name = 'counter/privacy.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Privacy Policy - Word Counter'
        return context

@require_http_methods(["POST"])
@csrf_exempt
def analyze_text_api(request):
    """API endpoint for text analysis"""
    try:
        data = json.loads(request.body)
        text = data.get('text', '').strip()
        
        if not text:
            return JsonResponse({'error': 'No text provided'}, status=400)
        
        if len(text) > 50000:  # Limit text length
            return JsonResponse({'error': 'Text too long (max 50,000 characters)'}, status=400)
        
        analyzer = TextAnalyzer(text)
        stats = analyzer.get_stats()
        
        return JsonResponse({'success': True, 'stats': stats})
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
@ratelimit(key='ip', rate='10/m', method='POST')
def process_file_api(request):
    """API endpoint for file processing"""
    try:
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file uploaded'}, status=400)
        
        file = request.FILES['file']
        
        # Check file size (5MB limit)
        if file.size > 5 * 1024 * 1024:
            return JsonResponse({'error': 'File too large (max 5MB)'}, status=400)
        
        # Extract text based on file type
        file_extension = file.name.lower().split('.')[-1]
        
        try:
            if file_extension == 'txt':
                text = FileProcessor.extract_text_from_txt(file)
            elif file_extension == 'docx':
                text = FileProcessor.extract_text_from_docx(file)
            elif file_extension == 'pdf':
                text = FileProcessor.extract_text_from_pdf(file)
            else:
                return JsonResponse({'error': 'Unsupported file type. Use TXT, DOCX, or PDF'}, status=400)
            
            if not text.strip():
                return JsonResponse({'error': 'No text found in file'}, status=400)
            
            # Analyze the extracted text
            analyzer = TextAnalyzer(text)
            stats = analyzer.get_stats()
            
            return JsonResponse({
                'success': True,
                'text': text[:10000],  # Return first 10k chars for preview
                'stats': stats,
                'filename': file.name
            })
            
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=400)
        
    except Exception as e:
        return JsonResponse({'error': 'File processing failed'}, status=500)
    

class TermsView(TemplateView):
    template_name = 'counter/terms.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Terms of Service - Word Counter Pro'
        context['meta_description'] = 'Terms of service and usage conditions for Word Counter Pro text analysis tools.'
        return context

class AboutView(TemplateView):
    template_name = 'counter/about.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'About Word Counter Pro - Professional Text Analysis Tools'
        context['meta_description'] = 'Learn about Word Counter Pro, our mission to provide fast, accurate, and privacy-focused text analysis tools for writers worldwide.'
        return context

class ContactView(TemplateView):
    template_name = 'counter/contact.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Contact Us - Word Counter Pro Support'
        context['meta_description'] = 'Get in touch with Word Counter Pro for support, feature requests, bug reports, and general inquiries.'
        return context
    
from django.http import HttpResponse
from django.template import loader
from django.urls import reverse

def sitemap_view(request):
    template = loader.get_template('sitemap.xml')
    context = {
        'domain': 'https://wordcounter3.com',
        'urls': [
            {'loc': '/', 'priority': '1.0', 'changefreq': 'monthly'},
            {'loc': '/character-counter/', 'priority': '0.9', 'changefreq': 'monthly'},
            {'loc': '/reading-time-calculator/', 'priority': '0.9', 'changefreq': 'monthly'},
            {'loc': '/space-cleaner/', 'priority': '0.8', 'changefreq': 'monthly'},
            {'loc': '/case-converter/', 'priority': '0.8', 'changefreq': 'monthly'},
            {'loc': '/about/', 'priority': '0.6', 'changefreq': 'yearly'},
            {'loc': '/contact/', 'priority': '0.6', 'changefreq': 'yearly'},
            {'loc': '/privacy/', 'priority': '0.5', 'changefreq': 'yearly'},
            {'loc': '/terms/', 'priority': '0.5', 'changefreq': 'yearly'},
        ]
    }
    return HttpResponse(template.render(context, request), content_type='application/xml')

def robots_view(request):
    content = """User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://wordcounter3.com/sitemap.xml
Crawl-delay: 1"""
    return HttpResponse(content, content_type='text/plain')
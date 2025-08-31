from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime

def sitemap_view(request):
    """Generate sitemap XML directly"""
    today = timezone.now().strftime('%Y-%m-%d')
    
    sitemap_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://wordcounter3.com/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/character-counter/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/reading-time-calculator/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/space-cleaner/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/case-converter/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/about/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/contact/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/privacy/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://wordcounter3.com/terms/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>"""
    
    return HttpResponse(sitemap_content, content_type='application/xml')

def robots_view(request):
    content = """User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://wordcounter3.com/sitemap.xml
Crawl-delay: 1"""
    return HttpResponse(content, content_type='text/plain')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('counter.urls')),
    path('sitemap.xml/', sitemap_view, name='sitemap'),
    path('robots.txt/', robots_view, name='robots'),
]
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

class StaticViewSitemap(Sitemap):
    priority = 0.8
    changefreq = 'weekly'
    
    def items(self):
        return [
            'counter:word_counter',
            'counter:character_counter', 
            'counter:reading_time',
            'counter:space_cleaner',
            'counter:case_converter',
            'counter:privacy'
        ]
    
    def location(self, item):
        return reverse(item)
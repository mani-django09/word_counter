from django.urls import path
from . import views

app_name = 'counter'

urlpatterns = [
    path('', views.WordCounterView.as_view(), name='word_counter'),
    path('character-counter/', views.CharacterCounterView.as_view(), name='character_counter'),
    path('reading-time-calculator/', views.ReadingTimeView.as_view(), name='reading_time'),
    path('space-cleaner/', views.SpaceCleanerView.as_view(), name='space_cleaner'),
    path('case-converter/', views.CaseConverterView.as_view(), name='case_converter'),
    path('api/analyze-text/', views.analyze_text_api, name='analyze_text_api'),
    path('api/process-file/', views.process_file_api, name='process_file_api'),
    path('privacy/', views.PrivacyView.as_view(), name='privacy'),
    path('terms/', views.TermsView.as_view(), name='terms'),
    path('about/', views.AboutView.as_view(), name='about'),
    path('contact/', views.ContactView.as_view(), name='contact'),
]
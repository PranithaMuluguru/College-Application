# import google.generativeai as genai

# # Replace with your actual API key
# API_KEY = "AIzaSyBvPeQk5pGSatlEfl5Kr39rmpU5cyWj7x8"

# def test_gemini():
#     try:
#         genai.configure(api_key=API_KEY)
        
#         print("=== Testing Gemini API ===")
        
#         # List all models
#         print("\nAll available models:")
#         for i, model in enumerate(genai.list_models()):
#             print(f"{i+1}. {model.name}")
#             print(f"   Supported methods: {model.supported_generation_methods}")
        
#         # Filter models that support generateContent
#         print("\nModels supporting generateContent:")
#         generate_content_models = []
#         for model in genai.list_models():
#             if 'generateContent' in model.supported_generation_methods:
#                 generate_content_models.append(model.name)
# #                 print(f"✅ {model.name}")
        
# #         if generate_content_models:
# #             print(f"\n✅ Found {len(generate_content_models)} models that support generateContent")
# #             # Test the first one
# #             model_name = generate_content_models[0]
# #             print(f"\nTesting with model: {model_name}")
            
# #             model = genai.GenerativeModel(model_name)
# #             response = model.generate_content("Hello, say 'Gemini is working!'")
# #             print(f"Response: {response.text}")
            
# #         else:
# #             print("\n❌ No models found that support generateContent")
            
# #     except Exception as e:
# #         print(f"❌ Error: {e}")

# # if __name__ == "__main__":
# #     test_gemini()


# import requests
# from bs4 import BeautifulSoup
# from urllib.parse import urljoin

# url = "https://iitpkd.ac.in"
# response = requests.get(url)
# soup = BeautifulSoup(response.content, 'html.parser')

# all_links = []
# for link in soup.find_all('a', href=True):
#     full_url = urljoin(url, link['href'])
#     if 'iitpkd.ac.in' in full_url and not any(skip in full_url for skip in ['.pdf', '.jpg', '.png']):
#         clean_url = full_url.split('#')[0].split('?')[0].rstrip('/')
#         if clean_url not in all_links:
#             all_links.append(clean_url)

# print(f"Found {len(all_links)} links:")
# for link in sorted(all_links):
#     print(link)


#set up for web scraping
from newapp.web_scraper import scrape_iitpkd_website
from newapp.database import get_db

# Run scraper to populate knowledge base
db = next(get_db())
scrape_iitpkd_website(db)
# newapp/web_scraper.py

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from typing import Set, List, Dict
import re
from sqlalchemy.orm import Session
from newapp import models
import PyPDF2
import io

class IITPKDWebScraper:
    def __init__(self, base_url: str = "https://iitpkd.ac.in"):
        self.base_url = base_url
        self.visited_urls: Set[str] = set()
        self.scraped_content: List[Dict] = []
        self.max_depth = 4  # Increased depth to get more pages (was 3)
        self.errors_count = 0  # Track errors
        self.success_count = 0  # Track successes
        
    def is_valid_url(self, url: str) -> bool:
        """Check if URL belongs to IIT Palakkad domain and is valid"""
        try:
            parsed = urlparse(url)
            
            # Skip mailto, tel, javascript links
            if parsed.scheme in ['mailto', 'tel', 'javascript', 'data']:
                return False
            
            # Skip anchors and fragments
            if url.startswith('#'):
                return False
            
            # Must be http or https
            if parsed.scheme and parsed.scheme not in ['http', 'https']:
                return False
            
            # Check domain
            return parsed.netloc in ['iitpkd.ac.in', 'www.iitpkd.ac.in'] or parsed.netloc == ''
        except Exception:
            return False
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?@\-:()]', '', text)
        return text.strip()
    
    def extract_contact_info(self, soup: BeautifulSoup, url: str) -> List[Dict]:
        """Extract emails, phone numbers, and contacts"""
        contacts = []
        text = soup.get_text()
        
        # Extract emails
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@iitpkd\.ac\.in', text)
        for email in set(emails):
            contacts.append({
                'type': 'email',
                'value': email,
                'source_url': url,
                'context': self._get_context_around_email(text, email)
            })
        
        # Extract phone numbers (Indian format)
        phones = re.findall(r'(?:\+91[-\s]?)?[6-9]\d{9}', text)
        for phone in set(phones):
            contacts.append({
                'type': 'phone',
                'value': phone,
                'source_url': url
            })
        
        return contacts
    
    def _get_context_around_email(self, text: str, email: str) -> str:
        """Get 100 characters context around email"""
        idx = text.find(email)
        if idx == -1:
            return ""
        start = max(0, idx - 50)
        end = min(len(text), idx + len(email) + 50)
        return text[start:end].strip()
    
    def extract_structured_data(self, soup: BeautifulSoup, url: str) -> List[Dict]:
        """Extract structured information like tables, lists, etc."""
        structured_data = []
        
        # Extract tables
        tables = soup.find_all('table')
        for i, table in enumerate(tables):
            rows = []
            for tr in table.find_all('tr'):
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if cells:
                    rows.append(cells)
            
            if rows:
                structured_data.append({
                    'type': 'table',
                    'data': rows,
                    'source_url': url,
                    'table_index': i
                })
        
        # Extract definition lists (often used for FAQs)
        dl_lists = soup.find_all('dl')
        for dl in dl_lists:
            qa_pairs = []
            dts = dl.find_all('dt')
            dds = dl.find_all('dd')
            
            for dt, dd in zip(dts, dds):
                qa_pairs.append({
                    'question': dt.get_text(strip=True),
                    'answer': dd.get_text(strip=True)
                })
            
            if qa_pairs:
                structured_data.append({
                    'type': 'faq',
                    'data': qa_pairs,
                    'source_url': url
                })
        
        return structured_data
    
    def scrape_pdf(self, pdf_url: str) -> str:
        """Download and extract text from PDF"""
        try:
            response = requests.get(pdf_url, timeout=30)
            pdf_file = io.BytesIO(response.content)
            
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return self.clean_text(text)
        except Exception as e:
            print(f"Error scraping PDF {pdf_url}: {e}")
            return ""
    
    def scrape_page(self, url: str, depth: int = 0) -> Dict:
        """Scrape a single page and extract all useful information"""
        if depth > self.max_depth or url in self.visited_urls:
            return None
        
        # Skip invalid URLs
        if not self.is_valid_url(url):
            return None
        
        self.visited_urls.add(url)
        
        try:
            print(f"Scraping: {url} (depth: {depth})")
            response = requests.get(url, timeout=15, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            # Handle HTTP errors gracefully
            if response.status_code == 403:
                print(f"  ⚠️  Access forbidden (403) - skipping")
                self.errors_count += 1
                return None
            elif response.status_code == 404:
                print(f"  ⚠️  Page not found (404) - skipping")
                self.errors_count += 1
                return None
            elif response.status_code >= 400:
                print(f"  ⚠️  HTTP {response.status_code} - skipping")
                self.errors_count += 1
                return None
            
            response.raise_for_status()
            self.success_count += 1
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script, style, and navigation elements
            for element in soup(['script', 'style', 'nav', 'footer', 'header']):
                element.decompose()
            
            # Extract page title
            title = soup.find('title')
            title_text = title.get_text(strip=True) if title else url
            
            # Extract main content
            main_content = ""
            
            # Try to find main content area
            main_areas = soup.find_all(['main', 'article', 'section'])
            if main_areas:
                for area in main_areas:
                    main_content += area.get_text(separator=' ', strip=True) + " "
            else:
                # Fallback: get all paragraph text
                paragraphs = soup.find_all(['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    if len(text) > 20:  # Only meaningful text
                        main_content += text + " "
            
            main_content = self.clean_text(main_content)
            
            # Extract meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc['content'] if meta_desc and 'content' in meta_desc.attrs else ""
            
            # Extract contacts
            contacts = self.extract_contact_info(soup, url)
            
            # Extract structured data
            structured_data = self.extract_structured_data(soup, url)
            
            # Extract all links for further scraping
            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                # Skip empty or anchor links
                if not href or href.startswith('#') or href.startswith('javascript:'):
                    continue
                
                absolute_url = urljoin(url, href)
                
                # Clean URL (remove fragments)
                absolute_url = absolute_url.split('#')[0]
                
                if self.is_valid_url(absolute_url) and absolute_url not in self.visited_urls:
                    # Check if it's a PDF
                    if absolute_url.lower().endswith('.pdf'):
                        links.append({'url': absolute_url, 'type': 'pdf'})
                    else:
                        links.append({'url': absolute_url, 'type': 'page'})
            
            page_data = {
                'url': url,
                'title': title_text,
                'description': description,
                'content': main_content,
                'contacts': contacts,
                'structured_data': structured_data,
                'links': links,
                'depth': depth
            }
            
            self.scraped_content.append(page_data)
            
            # Recursively scrape linked pages
            time.sleep(0.5)  # Be polite to the server
            
            # SCRAPE ALL LINKS - no limitations!
            for link_info in links:  # No limit - scrape everything
                if link_info['type'] == 'pdf':
                    pdf_text = self.scrape_pdf(link_info['url'])
                    if pdf_text:
                        self.scraped_content.append({
                            'url': link_info['url'],
                            'title': f"PDF: {link_info['url'].split('/')[-1]}",
                            'content': pdf_text,
                            'type': 'pdf',
                            'depth': depth + 1
                        })
                else:
                    # Only stop if we've gone too deep or already visited
                    if depth < self.max_depth:
                        self.scrape_page(link_info['url'], depth + 1)
            
            return page_data
            
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Request error: {str(e)[:100]}")
            self.errors_count += 1
            return None
        except Exception as e:
            print(f"  ❌ Error: {str(e)[:100]}")
            self.errors_count += 1
            return None
    
    def start_scraping(self):
        """Start the scraping process from homepage - SCRAPE EVERYTHING!"""
        print("\n" + "="*70)
        print("🚀 Starting COMPREHENSIVE scrape of IIT Palakkad website")
        print("   This will scrape ALL pages, following every valid link!")
        print("="*70 + "\n")
        
        # Start from homepage - it will discover everything else
        self.scrape_page(self.base_url, depth=0)
        
        print("\n" + "="*70)
        print("✅ Scraping complete!")
        print(f"   📄 Total URLs visited: {len(self.visited_urls)}")
        print(f"   ✓ Successfully scraped: {self.success_count}")
        print(f"   ✗ Errors/Skipped: {self.errors_count}")
        print(f"   💾 Content blocks extracted: {len(self.scraped_content)}")
        print("="*70 + "\n")
        
        return self.scraped_content


def save_to_database(scraped_data: List[Dict], db: Session):
    """Save scraped data to knowledge base"""
    
    print("Saving to database...")
    saved_count = 0
    
    for item in scraped_data:
        # Save main content
        if item.get('content') and len(item['content']) > 100:
            # Split long content into chunks
            content_chunks = split_into_chunks(item['content'], max_length=2000)
            
            for i, chunk in enumerate(content_chunks):
                kb_entry = models.KnowledgeBase(
                    category=categorize_content(item['title'], chunk),
                    content=chunk,
                    title=f"{item['title']} (Part {i+1})" if len(content_chunks) > 1 else item['title'],
                    source_url=item['url'],
                    keywords=extract_keywords(chunk)
                )
                db.add(kb_entry)
                saved_count += 1
        
        # Save contacts
        for contact in item.get('contacts', []):
            contact_text = f"{contact['type'].upper()}: {contact['value']}"
            if contact.get('context'):
                contact_text += f"\nContext: {contact['context']}"
            
            kb_entry = models.KnowledgeBase(
                category='contacts',
                content=contact_text,
                title=f"Contact: {contact['value']}",
                source_url=item['url'],
                keywords=contact['value']
            )
            db.add(kb_entry)
            saved_count += 1
        
        # Save structured data (FAQs, tables)
        for struct in item.get('structured_data', []):
            if struct['type'] == 'faq':
                for qa in struct['data']:
                    kb_entry = models.KnowledgeBase(
                        category='faq',
                        content=f"Q: {qa['question']}\n\nA: {qa['answer']}",
                        title=qa['question'][:100],
                        source_url=item['url'],
                        keywords=extract_keywords(qa['question'])
                    )
                    db.add(kb_entry)
                    saved_count += 1
            
            elif struct['type'] == 'table':
                # Convert table to text format
                table_text = "\n".join([" | ".join(row) for row in struct['data']])
                kb_entry = models.KnowledgeBase(
                    category='structured_data',
                    content=table_text,
                    title=f"Table from {item['title']}",
                    source_url=item['url'],
                    keywords=extract_keywords(table_text)
                )
                db.add(kb_entry)
                saved_count += 1
    
    db.commit()
    print(f"Saved {saved_count} entries to knowledge base!")


def split_into_chunks(text: str, max_length: int = 2000) -> List[str]:
    """Split long text into manageable chunks"""
    sentences = text.split('. ')
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_length:
            current_chunk += sentence + ". "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks


def categorize_content(title: str, content: str) -> str:
    """Auto-categorize content based on URL and title - NO LIMITATIONS"""
    title_lower = title.lower()
    content_lower = content.lower()
    
    # Extract category from title/content naturally
    # Look for the main topic in the first few words of the title
    
    # If title has multiple parts, use the first meaningful part
    title_parts = title_lower.split('-')
    if len(title_parts) > 1:
        # Use the first part as category (e.g., "Academics - Courses" -> "academics")
        category = title_parts[0].strip()
        if len(category) > 3 and len(category) < 30:
            return category
    
    # Extract from common patterns
    if 'iit palakkad' in title_lower:
        # Remove "IIT Palakkad" prefix to get actual category
        cleaned = title_lower.replace('iit palakkad', '').replace('|', '').strip()
        if cleaned and len(cleaned) > 3:
            words = cleaned.split()
            if words:
                return words[0]  # First word after "IIT Palakkad"
    
    # Try to find key topic words in title (excluding common words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'at', 'to', 'for', 'of', 'in', 'on'}
    title_words = [w for w in title_lower.split() if w not in stop_words and len(w) > 3]
    
    if title_words:
        return title_words[0]  # Use first meaningful word
    
    # Fallback: look at first sentence of content
    first_sentence = content_lower.split('.')[0] if content_lower else ''
    content_words = [w for w in first_sentence.split()[:10] if w not in stop_words and len(w) > 4]
    
    if content_words:
        return content_words[0]
    
    return 'information'  # Generic fallback


def extract_keywords(text: str) -> str:
    """Extract important keywords from text"""
    # Remove common words
    stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of'}
    
    words = re.findall(r'\b\w+\b', text.lower())
    keywords = [w for w in words if w not in stop_words and len(w) > 3]
    
    # Return top 20 most common keywords
    from collections import Counter
    word_freq = Counter(keywords)
    top_keywords = [word for word, _ in word_freq.most_common(20)]
    
    return ','.join(top_keywords)


def scrape_iitpkd_website(db: Session):
    """Main function to scrape and save IIT Palakkad website"""
    scraper = IITPKDWebScraper()
    scraped_data = scraper.start_scraping()
    save_to_database(scraped_data, db)
    return len(scraped_data)
# newapp/ai_service.py

from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from newapp import models
from datetime import datetime
from typing import List, Dict, Optional
from difflib import SequenceMatcher
import re
import os

# LangChain imports
from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient

# Configure OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Configure MCP Client
mcp_client = MultiServerMCPClient(
    {
        "college": {
            "transport": "streamable_http",
            "url": os.getenv("MCP_SERVER_URL", "http://10.32.5.221:8080/mcp"),
        },
    }
)


class AIAssistant:
    def __init__(self, db: Session):
        self.db = db
        self.agent = None
        self.tools = None
        
    async def initialize_agent(self):
        """Initialize the MCP agent with tools"""
        if self.agent is None:
            self.tools = await mcp_client.get_tools()
            # Create agent with system prompt
            self.agent = create_agent(
                "gpt-4o",  # or "gpt-3.5-turbo" for cost savings
                self.tools,
                system_prompt="""You are an AI assistant specifically for IIT Palakkad students.

CORE RESPONSIBILITIES:
1. Answer student queries accurately using available tools and knowledge base
2. Provide clear, well-structured responses with proper formatting
3. Extract and provide relevant contact information when needed
4. Be friendly, helpful, and student-oriented

RESPONSE GUIDELINES:
- Use bullet points or numbered lists for clarity
- Keep responses under 250 words unless detailed explanation needed
- Use emojis sparingly (1-2 max) for friendliness
- Always cite sources when using knowledge base information
- If uncertain, be honest and suggest relevant contacts

CONTACT SUGGESTIONS:
- Academic queries → academics@iitpkd.ac.in
- Hostel queries → hostel@iitpkd.ac.in
- Exam queries → exams@iitpkd.ac.in
- General queries → office@iitpkd.ac.in

You have access to tools that can query the college database. Use them when appropriate."""
            )
        
    async def get_response(self, user_id: int, message: str) -> Dict:
        """Main function to get AI response using MCP + LangChain"""
        
        # Initialize agent if needed
        await self.initialize_agent()
        
        # Save user message
        self._save_chat(user_id, message, True)
        
        # Step 1: Search knowledge base for relevant context
        kb_results = self._search_knowledge_base(message)
        
        # Step 2: Query agent with full context
        try:
            if kb_results and kb_results[0]['similarity'] > 0.4:
                # We have relevant knowledge - provide it to agent
                response_data = await self._query_agent_with_kb_context(
                    user_id, message, kb_results
                )
                confidence = "high" if kb_results[0]['similarity'] > 0.65 else "medium"
                has_kb_data = True
            else:
                # No relevant knowledge - let agent use its own knowledge + tools
                response_data = await self._query_agent_general(user_id, message)
                confidence = "medium"
                has_kb_data = False
            
            response_text = response_data['answer']
            contacts = response_data.get('contacts', [])
            
            # Additional contact extraction from KB
            if kb_results:
                kb_contacts = self._extract_contacts_from_kb(kb_results)
                contacts.extend(kb_contacts)
            
            # Remove duplicates
            contacts = self._deduplicate_contacts(contacts)
            
            # Check if agent couldn't answer
            if self._is_uncertain_response(response_text):
                confidence = "low"
                # Save as unanswered question for admin review
                self._save_unanswered_question(user_id, message)
                
                # Suggest contacts
                if not contacts:
                    contacts = self._suggest_contacts_for_query(message)
                
                if contacts:
                    response_text += f"\n\n💡 I've noted this question for review. Meanwhile, try contacting: {contacts[0]['email']}"
                
                self._save_chat(user_id, response_text, False, 0.3)
                
                return {
                    "response": response_text,
                    "confidence": confidence,
                    "contacts": contacts[:3],
                    "sources": ["AI Generated"] if not has_kb_data else [r['source_url'] for r in kb_results[:2]],
                    "unanswered": True,
                    "chat_id": self._get_last_chat_id(user_id)
                }
            
            # Success! Save and return
            confidence_score = 0.85 if confidence == "high" else 0.65 if confidence == "medium" else 0.4
            self._save_chat(user_id, response_text, False, confidence_score)
            
            return {
                "response": response_text,
                "confidence": confidence,
                "sources": ["IIT Palakkad Knowledge Base + AI"] if has_kb_data else ["AI Generated with IIT Palakkad Context"],
                "contacts": contacts[:3],
                "chat_id": self._get_last_chat_id(user_id)
            }
            
        except Exception as e:
            print(f"Agent error: {e}")
            # Fallback response
            self._save_unanswered_question(user_id, message)
            contacts = self._get_general_contacts()
            
            fallback = "I'm having trouble processing your question right now. For immediate help, please contact office@iitpkd.ac.in or check the IIT Palakkad website at https://iitpkd.ac.in"
            self._save_chat(user_id, fallback, False, 0.3)
            
            return {
                "response": fallback,
                "confidence": "error",
                "contacts": contacts,
                "unanswered": True,
                "chat_id": self._get_last_chat_id(user_id)
            }
    
    async def _query_agent_with_kb_context(
        self, user_id: int, message: str, kb_results: List[Dict]
    ) -> Dict:
        """Query agent WITH knowledge base context"""
        
        # Build context from knowledge base
        context = self._build_detailed_context(kb_results)
        
        # Create comprehensive prompt with user context
        user_prompt = f"""USER CONTEXT:
- User ID: {user_id}
- Remember this user ID for any tool calls that require user identification

📚 KNOWLEDGE BASE INFORMATION (Use this as PRIMARY source):
{context}

🎓 STUDENT'S QUESTION: {message}

Instructions:
1. Use the knowledge base information provided above as your main source
2. If you need additional user-specific data, use the available tools with user_id={user_id}
3. Extract and mention any relevant contacts (emails/phones) from the KB
4. Provide a clear, well-structured answer
5. Be specific and accurate
6. Use bullet points or numbered lists when appropriate

Provide your answer:"""

        try:
            # Invoke agent
            agent_response = await self.agent.ainvoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": user_prompt
                        }
                    ]
                }
            )
            
            # Extract final response
            answer_text = agent_response["messages"][-1].content
            
            # Extract contacts mentioned in response
            contacts = self._extract_contacts_from_text(answer_text)
            
            return {
                'answer': answer_text,
                'contacts': contacts
            }
        except Exception as e:
            print(f"Agent query error: {e}")
            raise
    
    async def _query_agent_general(self, user_id: int, message: str) -> Dict:
        """Query agent WITHOUT KB context - uses general knowledge + tools"""
        
        user_prompt = f"""USER CONTEXT:
- User ID: {user_id}
- Remember this user ID for any tool calls that require user identification

🎓 STUDENT'S QUESTION: {message}

Instructions:
1. Answer about IIT Palakkad to the best of your knowledge
2. Use available tools if they can help answer the question (remember to use user_id={user_id})
3. Be honest if you're not certain about specific details
4. Suggest contacting relevant departments when appropriate
5. Structure your answer clearly with bullet points if needed
6. Keep response under 200 words
7. If you don't have enough information, say so and suggest whom to contact:
   * Academic queries → academics@iitpkd.ac.in
   * Hostel queries → hostel@iitpkd.ac.in
   * General queries → office@iitpkd.ac.in

Provide your answer:"""

        try:
            # Invoke agent
            agent_response = await self.agent.ainvoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": user_prompt
                        }
                    ]
                }
            )
            
            # Extract final response
            answer_text = agent_response["messages"][-1].content
            
            # Extract any contacts mentioned
            contacts = self._extract_contacts_from_text(answer_text)
            
            # If no contacts found, suggest based on query
            if not contacts:
                contacts = self._suggest_contacts_for_query(message)
            
            return {
                'answer': answer_text,
                'contacts': contacts
            }
        except Exception as e:
            print(f"Agent query error: {e}")
            raise
    
    def _search_knowledge_base(self, query: str, limit: int = 10) -> List[Dict]:
        """Search knowledge base using semantic similarity"""
        query_lower = query.lower()
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        
        # Remove common stop words
        stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'what', 'how', 'when', 'where', 'who', 'why'}
        query_words = query_words - stop_words
        
        # Get all KB entries
        kb_entries = self.db.query(models.KnowledgeBase).all()
        
        results = []
        for entry in kb_entries:
            # Calculate similarity
            similarity = self._calculate_text_similarity(query_lower, entry.content.lower(), entry.title.lower())
            
            # Boost similarity if keywords match
            if entry.keywords:
                kb_keywords = set(entry.keywords.split(','))
                keyword_overlap = len(query_words & kb_keywords) / max(len(query_words), 1)
                similarity = similarity * 0.6 + keyword_overlap * 0.4
            
            if similarity > 0.25:  # Minimum threshold
                results.append({
                    'id': entry.id,
                    'title': entry.title,
                    'content': entry.content,
                    'category': entry.category,
                    'source_url': entry.source_url,
                    'similarity': similarity
                })
        
        # Sort by similarity
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:limit]
    
    def _calculate_text_similarity(self, query: str, content: str, title: str) -> float:
        """Calculate similarity between query and content"""
        # Word overlap method
        query_words = set(re.findall(r'\b\w+\b', query))
        content_words = set(re.findall(r'\b\w+\b', content[:1000]))  # First 1000 chars
        title_words = set(re.findall(r'\b\w+\b', title))
        
        if not query_words:
            return 0.0
        
        # Calculate Jaccard similarity
        content_intersection = query_words & content_words
        title_intersection = query_words & title_words
        
        content_sim = len(content_intersection) / len(query_words) if query_words else 0
        title_sim = len(title_intersection) / len(query_words) if query_words else 0
        
        # Also use sequence matcher for phrase matching
        sequence_sim = SequenceMatcher(None, query[:200], content[:200]).ratio()
        
        # Weighted combination (title matches are more important)
        return title_sim * 0.4 + content_sim * 0.35 + sequence_sim * 0.25
    
    def _build_detailed_context(self, kb_results: List[Dict]) -> str:
        """Build detailed context from knowledge base results"""
        if not kb_results:
            return "No specific information found in knowledge base."
        
        context = ""
        for i, result in enumerate(kb_results[:5], 1):
            context += f"\n{'='*60}\n"
            context += f"SOURCE {i}: {result['title']}\n"
            context += f"Category: {result['category']}\n"
            context += f"Relevance: {result['similarity']:.2%}\n"
            context += f"URL: {result['source_url']}\n"
            context += f"\nCONTENT:\n{result['content'][:800]}\n"
            
            # Add indicator if content is truncated
            if len(result['content']) > 800:
                context += "... (content truncated)\n"
        
        context += f"\n{'='*60}\n"
        return context
    
    def _extract_contacts_from_text(self, text: str) -> List[Dict]:
        """Extract contact information from text"""
        contacts = []
        
        # Extract emails
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@iitpkd\.ac\.in', text)
        for email in set(emails):
            # Try to get context/department
            dept = self._guess_department_from_email(email)
            contacts.append({
                'email': email,
                'department': dept,
                'type': 'email'
            })
        
        # Extract phone numbers (Indian format)
        phones = re.findall(r'(?:\+91[-\s]?)?[6-9]\d{9}', text)
        for phone in set(phones):
            contacts.append({
                'phone': phone,
                'type': 'phone'
            })
        
        return contacts
    
    def _guess_department_from_email(self, email: str) -> str:
        """Guess department from email address"""
        email_lower = email.lower()
        
        if 'academic' in email_lower:
            return 'Academic Office'
        elif 'exam' in email_lower:
            return 'Examination Section'
        elif 'hostel' in email_lower:
            return 'Hostel Office'
        elif 'placement' in email_lower:
            return 'Training & Placement'
        elif 'admission' in email_lower:
            return 'Admissions Office'
        elif 'medical' in email_lower:
            return 'Medical Center'
        elif 'sports' in email_lower:
            return 'Sports Office'
        elif 'library' in email_lower:
            return 'Central Library'
        elif 'office' in email_lower:
            return 'General Administration'
        else:
            return 'IIT Palakkad'
    
    def _is_uncertain_response(self, response: str) -> bool:
        """Check if agent response indicates uncertainty"""
        uncertain_phrases = [
            "i don't have",
            "i'm not sure",
            "i don't know",
            "i cannot find",
            "no information available",
            "unable to answer",
            "i apologize",
            "i don't have enough information",
            "i'm not certain",
            "i cannot confirm",
            "please contact",
            "i recommend contacting"
        ]
        
        response_lower = response.lower()
        
        # Check if response is too short (likely uncertain)
        if len(response_lower) < 50:
            return True
        
        # Check for uncertain phrases
        return any(phrase in response_lower for phrase in uncertain_phrases)
    
    def _extract_contacts_from_kb(self, kb_results: List[Dict]) -> List[Dict]:
        """Extract contact information from knowledge base results"""
        contacts = []
        
        for result in kb_results[:3]:  # Top 3 results only
            # Find emails
            emails = re.findall(r'[a-zA-Z0-9._%+-]+@iitpkd\.ac\.in', result['content'])
            for email in set(emails):
                dept = self._guess_department_from_email(email)
                contacts.append({
                    'email': email,
                    'department': dept,
                    'type': 'email'
                })
            
            # Find phone numbers
            phones = re.findall(r'(?:\+91[-\s]?)?[6-9]\d{9}', result['content'])
            for phone in set(phones):
                contacts.append({
                    'phone': phone,
                    'department': result.get('title', 'General'),
                    'type': 'phone'
                })
        
        return contacts
    
    def _suggest_contacts_for_query(self, query: str) -> List[Dict]:
        """Suggest relevant contacts based on query keywords"""
        query_lower = query.lower()
        
        contact_mapping = {
            'academic': [
                {'email': 'academics@iitpkd.ac.in', 'dept': 'Academic Office'},
                {'email': 'exams@iitpkd.ac.in', 'dept': 'Examination Section'}
            ],
            'exam': [
                {'email': 'exams@iitpkd.ac.in', 'dept': 'Examination Section'},
                {'email': 'academics@iitpkd.ac.in', 'dept': 'Academic Office'}
            ],
            'hostel': [
                {'email': 'hostel@iitpkd.ac.in', 'dept': 'Hostel Office'}
            ],
            'placement': [
                {'email': 'placements@iitpkd.ac.in', 'dept': 'Training & Placement Office'}
            ],
            'admission': [
                {'email': 'admissions@iitpkd.ac.in', 'dept': 'Admissions Office'}
            ],
            'medical': [
                {'email': 'medical@iitpkd.ac.in', 'dept': 'Medical Center'}
            ],
            'sports': [
                {'email': 'sports@iitpkd.ac.in', 'dept': 'Sports Office'}
            ],
            'library': [
                {'email': 'library@iitpkd.ac.in', 'dept': 'Central Library'}
            ],
            'mess': [
                {'email': 'hostel@iitpkd.ac.in', 'dept': 'Hostel Office (Mess)'}
            ],
        }
        
        # Find matching keywords
        for keyword, contact_list in contact_mapping.items():
            if keyword in query_lower:
                return [{'email': c['email'], 'department': c['dept'], 'type': 'email'} for c in contact_list]
        
        return self._get_general_contacts()
    
    def _get_general_contacts(self) -> List[Dict]:
        """Get general contact information"""
        return [
            {
                'email': 'office@iitpkd.ac.in',
                'department': 'General Administration',
                'type': 'email'
            }
        ]
    
    def _deduplicate_contacts(self, contacts: List[Dict]) -> List[Dict]:
        """Remove duplicate contacts"""
        seen = set()
        unique_contacts = []
        
        for contact in contacts:
            identifier = contact.get('email') or contact.get('phone')
            if identifier and identifier not in seen:
                seen.add(identifier)
                unique_contacts.append(contact)
        
        return unique_contacts
    
    def _save_chat(self, user_id: int, message: str, is_user: bool, confidence: float = 0.0):
        """Save chat message to history"""
        chat = models.ChatHistory(
            user_id=user_id,
            message=message,
            is_user=is_user,
            confidence_score=confidence,
            created_at=datetime.utcnow()
        )
        self.db.add(chat)
        self.db.commit()
    
    def _get_last_chat_id(self, user_id: int) -> int:
        """Get the ID of the last chat message"""
        last_chat = self.db.query(models.ChatHistory).filter(
            models.ChatHistory.user_id == user_id,
            models.ChatHistory.is_user == False
        ).order_by(models.ChatHistory.created_at.desc()).first()
        
        return last_chat.id if last_chat else 0
    
    def _save_unanswered_question(self, user_id: int, question: str):
        """Save question that couldn't be answered"""
        # Check if similar question exists
        existing = self.db.query(models.UnansweredQuestion).filter(
            models.UnansweredQuestion.question_text.ilike(f"%{question[:50]}%")
        ).first()
        
        if existing:
            # Increment ask count
            existing.ask_count += 1
            existing.last_asked = datetime.utcnow()
        else:
            # Create new unanswered question
            category = self._guess_category(question)
            unanswered = models.UnansweredQuestion(
                user_id=user_id,
                question_text=question,
                category=category,
                ask_count=1,
                status=models.QuestionStatus.UNANSWERED,
                created_at=datetime.utcnow(),
                last_asked=datetime.utcnow()
            )
            self.db.add(unanswered)
        
        self.db.commit()
    
    def _guess_category(self, text: str) -> str:
        """Guess category from question text"""
        text_lower = text.lower()
        
        # Try to find the most relevant category from our knowledge base
        try:
            # Get all unique categories from KB
            categories = self.db.query(models.KnowledgeBase.category).distinct().all()
            category_list = [c[0] for c in categories if c[0]]
            
            # Find best matching category based on keywords
            max_overlap = 0
            best_category = 'general'
            
            text_words = set(re.findall(r'\b\w+\b', text_lower))
            
            for category in category_list:
                # Check if category name appears in question
                if category.lower() in text_lower:
                    return category
                
                # Check word overlap
                category_words = set(re.findall(r'\b\w+\b', category.lower()))
                overlap = len(text_words & category_words)
                
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_category = category
            
            return best_category if max_overlap > 0 else 'general'
            
        except Exception as e:
            print(f"Error guessing category: {e}")
            return 'general'
import os
import json
from typing import Optional
from groq import Groq
from models import ParsedUserInfo


class AIParser:
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
    
    def parse_user_info(self, user_input: str) -> ParsedUserInfo:
        """
        Parse user input using AI to extract structured information
        """
        system_prompt = """
        You are an expert data parser. Parse the given text to extract user information.
        Return ONLY a JSON object with the following exact structure:
        {
            "first_name": "extracted first name",
            "last_name": "extracted last name", 
            "phone_number": "extracted phone number",
            "street_address": "extracted street address including number",
            "apartment_number": "extracted apartment/unit number or null",
            "city": "extracted city",
            "state": "extracted state/province",
            "country": "extracted country",
            "zip_code": "extracted zip/postal code"
        }
        
        Rules:
        - Extract information as accurately as possible from the text
        - If apartment number is not mentioned, use null
        - Format phone numbers consistently (e.g., +1-555-123-4567)
        - Use proper capitalization for names and places
        - For any required field that cannot be determined from the text:
          * For names: use "Unknown"
          * For phone_number: use "Not provided"
          * For addresses: use "Not provided"
          * For city/state/country: use "Unknown"
          * For zip_code: use "00000"
        - NEVER use null for required string fields - always provide a string value
        - Return ONLY the JSON, no other text
        """
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user", 
                        "content": user_input
                    }
                ],
                model="llama-3.1-8b-instant",
                temperature=0.1,
                max_tokens=500
            )
            
            response_content = chat_completion.choices[0].message.content.strip()
            
            # Parse the JSON response
            parsed_data = json.loads(response_content)
            
            # Ensure all required fields have string values (never None)
            defaults = {
                "first_name": "Unknown",
                "last_name": "Unknown", 
                "phone_number": "Not provided",
                "street_address": "Not provided",
                "city": "Unknown",
                "state": "Unknown",
                "country": "Unknown",
                "zip_code": "00000"
            }
            
            # Clean the parsed data
            for field, default_value in defaults.items():
                if field not in parsed_data or parsed_data[field] is None or parsed_data[field] == "":
                    parsed_data[field] = default_value
                elif isinstance(parsed_data[field], str):
                    parsed_data[field] = parsed_data[field].strip()
                    if not parsed_data[field]:  # Empty string after strip
                        parsed_data[field] = default_value
            
            # apartment_number can be None, but if it's an empty string, set to None
            if "apartment_number" in parsed_data:
                if parsed_data["apartment_number"] == "" or parsed_data["apartment_number"] == "null":
                    parsed_data["apartment_number"] = None
            
            # Create and return ParsedUserInfo object
            return ParsedUserInfo(**parsed_data)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise ValueError(f"AI parsing failed: {e}")


# Global instance
ai_parser = AIParser(api_key=os.getenv("GROQ_API_KEY", "your-groq-api-key-here"))
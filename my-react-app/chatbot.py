import os
import json
import dotenv
from openai import OpenAI
from typing import Dict, Any, List, Union
from dotenv import load_dotenv

load_dotenv()


def get_client() -> Union[OpenAI, str]:
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        return "Error: The 'NVIDIA_API_KEY' environment variable is not set. Make sure it's in your .env file."

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )
    return client

def get_chat_response(client: OpenAI, messages: List[Dict[str, str]]) -> str:
    try:
        response = client.chat.completions.create(
            model="qwen/qwen3-next-80b-a3b-instruct",
            messages=messages,
            temperature=0.7,
            top_p=1.0,
            max_tokens=1024,
        )
        
        if response.choices and response.choices[0].message:
            return response.choices[0].message.content
        else:
            return "Error: No response received from the API."
            
    except Exception as e:
        return f"An error occurred: {e}"

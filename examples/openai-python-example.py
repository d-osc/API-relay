#!/usr/bin/env python3
"""
Example: Using OpenAI Python Library with API Relay

This example demonstrates how to use the official OpenAI Python library
with API Relay to access ChatGPT through your browser extension.

Prerequisites:
1. Install the OpenAI library: pip install openai
2. Start API Relay server: npm start
3. Load the browser extension and log into ChatGPT
4. Generate an API key using the API Relay endpoints
"""

from openai import OpenAI
import os
import sys

def main():
    # Configuration
    API_KEY = os.getenv("API_RELAY_API_KEY", "your_api_key_here")
    BASE_URL = "http://localhost:8647/openai/v1"
    
    # Validate API key
    if API_KEY == "your_api_key_here":
        print("Error: Please set your API key")
        print("Either set API_RELAY_API_KEY environment variable or modify the script")
        sys.exit(1)
    
    # Create OpenAI client pointing to API Relay
    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL
    )
    
    print("API Relay + OpenAI Library Example")
    print("=" * 50)
    
    try:
        # Test 1: Simple completion
        print("\n1. Simple completion:")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "What is AI?"}
            ],
            temperature=0.7,
            max_tokens=150
        )
        
        print(f"Model: {response.model}")
        print(f"Response: {response.choices[0].message.content}")
        
        # Test 2: Streaming completion
        print("\n2. Streaming completion:")
        print("AI typing: ", end="", flush=True)
        
        stream = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Write a short haiku about programming"}
            ],
            stream=True,
            temperature=0.7,
            max_tokens=100
        )
        
        full_response = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                print(content, end="", flush=True)
                full_response += content
        
        print(f"\n\nFull response: {full_response}")
        
        # Test 3: Conversation with context
        print("\n3. Conversation with context:")
        
        conversation = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful programming assistant."},
                {"role": "user", "content": "What is Python?"},
                {"role": "assistant", "content": "Python is a high-level programming language..."},
                {"role": "user", "content": "Can you give me a simple example?"}
            ],
            temperature=0.5
        )
        
        print(conversation.choices[0].message.content)
        
        # Test 4: List available models
        print("\n4. Available models:")
        models = client.models.list()
        
        for model in models.data[:5]:  # Show first 5 models
            print(f"- {model.id}")
        
        print("\nExample completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure API Relay server is running on port 8647")
        print("2. Check that your browser extension is loaded and connected")
        print("3. Verify your API key is valid")
        print("4. Ensure you're logged into ChatGPT in your browser")

if __name__ == "__main__":
    main()
#!/usr/bin/env node
/**
 * Example: Using OpenAI JavaScript Library with API Relay
 * 
 * This example demonstrates how to use the official OpenAI JavaScript library
 * with API Relay to access ChatGPT through your browser extension.
 * 
 * Prerequisites:
 * 1. Install the OpenAI library: npm install openai
 * 2. Start API Relay server: npm start
 * 3. Load the browser extension and log into ChatGPT
 * 4. Generate an API key using the API Relay endpoints
 */

import OpenAI from 'openai';

// Configuration
const API_KEY = process.env.API_RELAY_API_KEY || 'your_api_key_here';
const BASE_URL = 'http://localhost:8647/openai/v1';

// Validate API key
if (API_KEY === 'your_api_key_here') {
  console.error('Error: Please set your API key');
  console.error('Either set API_RELAY_API_KEY environment variable or modify the script');
  process.exit(1);
}

// Create OpenAI client pointing to API Relay
const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

async function main() {
  console.log('API Relay + OpenAI Library Example');
  console.log('='.repeat(50));

  try {
    // Test 1: Simple completion
    console.log('\n1. Simple completion:');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'What is AI?' }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    console.log(`Model: ${response.model}`);
    console.log(`Response: ${response.choices[0].message.content}`);

    // Test 2: Streaming completion
    console.log('\n2. Streaming completion:');
    console.log('AI typing: ');

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Write a short haiku about programming' }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 100,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
      }
    }

    console.log(`\n\nFull response: ${fullResponse}`);

    // Test 3: Conversation with context
    console.log('\n3. Conversation with context:');

    const conversation = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful programming assistant.' },
        { role: 'user', content: 'What is JavaScript?' },
        { role: 'assistant', content: 'JavaScript is a high-level programming language...' },
        { role: 'user', content: 'Can you give me a simple example?' }
      ],
      temperature: 0.5,
    });

    console.log(conversation.choices[0].message.content);

    // Test 4: List available models
    console.log('\n4. Available models:');
    const models = await openai.models.list();

    models.data.slice(0, 5).forEach((model) => { // Show first 5 models
      console.log(`- ${model.id}`);
    });

    // Test 5: Advanced options
    console.log('\n5. Advanced options (JSON response format):');
    
    const jsonResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'List 3 programming languages with their year of creation in JSON format' }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    console.log('JSON Response:');
    console.log(jsonResponse.choices[0].message.content);

    console.log('\nExample completed successfully!');

  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure API Relay server is running on port 8647');
    console.error('2. Check that your browser extension is loaded and connected');
    console.error('3. Verify your API key is valid');
    console.error('4. Ensure you\'re logged into ChatGPT in your browser');
  }
}

// Run the example
main().catch(console.error);
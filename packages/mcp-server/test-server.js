#!/usr/bin/env node

/**
 * Test script for the Parking MCP Server
 * This script verifies that the server can start and respond to basic MCP protocol messages
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Testing Parking MCP Server...\n');

// Start the MCP server
const serverPath = join(__dirname, 'server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    BACKEND_URL: 'http://localhost:3000',
    LLM_SERVICE_URL: 'http://localhost:8001',
  },
});

let outputBuffer = '';
let errorBuffer = '';

// Handle server output
server.stdout.on('data', (data) => {
  outputBuffer += data.toString();
});

server.stderr.on('data', (data) => {
  errorBuffer += data.toString();
  // Server logs go to stderr
  console.log('Server log:', data.toString().trim());
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Send test messages
async function runTests() {
  console.log('📝 Sending test messages...\n');

  // Test 1: Initialize connection
  console.log('Test 1: Initializing connection...');
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  };
  
  server.stdin.write(JSON.stringify(initMessage) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: List available tools
  console.log('Test 2: Listing available tools...');
  const listToolsMessage = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  };
  
  server.stdin.write(JSON.stringify(listToolsMessage) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: List available resources
  console.log('Test 3: Listing available resources...');
  const listResourcesMessage = {
    jsonrpc: '2.0',
    id: 3,
    method: 'resources/list',
    params: {},
  };
  
  server.stdin.write(JSON.stringify(listResourcesMessage) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Parse and display results
  console.log('\n📊 Test Results:\n');
  
  try {
    const responses = outputBuffer.split('\n').filter(line => line.trim());
    
    responses.forEach(response => {
      try {
        const parsed = JSON.parse(response);
        
        if (parsed.id === 1) {
          console.log('✅ Server initialized successfully');
          console.log(`   Server: ${parsed.result.serverInfo?.name || 'Unknown'} v${parsed.result.serverInfo?.version || 'Unknown'}`);
        }
        
        if (parsed.id === 2 && parsed.result?.tools) {
          console.log(`✅ Found ${parsed.result.tools.length} tools:`);
          parsed.result.tools.forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.description}`);
          });
        }
        
        if (parsed.id === 3 && parsed.result?.resources) {
          console.log(`✅ Found ${parsed.result.resources.length} resources:`);
          parsed.result.resources.forEach(resource => {
            console.log(`   - ${resource.uri}: ${resource.name}`);
          });
        }
      } catch (e) {
        // Ignore parsing errors for incomplete messages
      }
    });
    
    if (responses.length === 0) {
      console.log('⚠️  No responses received. Make sure the MCP SDK is properly installed.');
      console.log('   Run: cd mcp-server && npm install');
    }
    
  } catch (error) {
    console.error('❌ Error parsing responses:', error.message);
  }

  // Clean shutdown
  console.log('\n🛑 Shutting down server...');
  server.kill();
  process.exit(0);
}

// Run tests after server starts
setTimeout(() => {
  runTests().catch(error => {
    console.error('❌ Test failed:', error);
    server.kill();
    process.exit(1);
  });
}, 1000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted');
  server.kill();
  process.exit(0);
});

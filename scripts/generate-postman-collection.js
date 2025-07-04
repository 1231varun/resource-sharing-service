const fs = require('fs');
const path = require('path');

/**
 * Script to generate a Postman collection from the Swagger/OpenAPI spec
 * This can be run manually or integrated into the development workflow
 */

function generatePostmanCollection() {
  const collection = {
    info: {
      name: 'Resource Sharing Service API',
      description: 'A scalable resource sharing system with multi-level access control',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: '1.0.0'
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'string'
      },
      {
        key: 'userId',
        value: '{{$randomUUID}}',
        type: 'string'
      },
      {
        key: 'resourceId',
        value: '{{$randomUUID}}',
        type: 'string'
      }
    ],
    item: [
      {
        name: 'Health Check',
        item: [
          {
            name: 'Get Health Status',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Accept',
                  value: 'application/json'
                }
              ],
              url: {
                raw: '{{baseUrl}}/health',
                host: ['{{baseUrl}}'],
                path: ['health']
              },
              description: 'Returns the current health status of the API server'
            },
            response: []
          }
        ],
        description: 'Health check endpoints'
      },
      {
        name: 'Resources',
        item: [
          {
            name: 'Get Resource Access List',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Accept',
                  value: 'application/json'
                }
              ],
              url: {
                raw: '{{baseUrl}}/resource/:id/access-list',
                host: ['{{baseUrl}}'],
                path: ['resource', ':id', 'access-list'],
                variable: [
                  {
                    key: 'id',
                    value: '{{resourceId}}',
                    description: 'Resource ID (UUID format)'
                  }
                ]
              },
              description: 'Returns all users who have access to a specific resource through direct sharing, group membership, or global access.'
            },
            response: []
          },
          {
            name: 'Check User Access to Resource',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Accept',
                  value: 'application/json'
                }
              ],
              url: {
                raw: '{{baseUrl}}/user/:id/access-check/:resourceId',
                host: ['{{baseUrl}}'],
                path: ['user', ':id', 'access-check', ':resourceId'],
                variable: [
                  {
                    key: 'id',
                    value: '{{userId}}',
                    description: 'User ID (UUID format)'
                  },
                  {
                    key: 'resourceId',
                    value: '{{resourceId}}',
                    description: 'Resource ID (UUID format)'
                  }
                ]
              },
              description: 'Fast access check to determine if a user has access to a specific resource.'
            },
            response: []
          }
        ],
        description: 'Resource management and access control'
      },
      {
        name: 'Reporting',
        item: [
          {
            name: 'Get Resource Statistics',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Accept',
                  value: 'application/json'
                }
              ],
              url: {
                raw: '{{baseUrl}}/resources/stats?limit=50&offset=0&minUsers=0',
                host: ['{{baseUrl}}'],
                path: ['resources', 'stats'],
                query: [
                  {
                    key: 'limit',
                    value: '50',
                    description: 'Maximum number of resources to return (1-100)'
                  },
                  {
                    key: 'offset',
                    value: '0',
                    description: 'Number of resources to skip'
                  },
                  {
                    key: 'minUsers',
                    value: '0',
                    description: 'Filter resources with at least N users'
                  }
                ]
              },
              description: 'Returns statistics about resources with user access counts.'
            },
            response: []
          }
        ],
        description: 'Analytics and reporting endpoints'
      },
      {
        name: 'API Documentation',
        item: [
          {
            name: 'Swagger UI',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Accept',
                  value: 'text/html'
                }
              ],
              url: {
                raw: '{{baseUrl}}/docs',
                host: ['{{baseUrl}}'],
                path: ['docs']
              },
              description: 'Interactive Swagger UI documentation'
            },
            response: []
          },
          {
            name: 'OpenAPI JSON Spec',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Accept',
                  value: 'application/json'
                }
              ],
              url: {
                raw: '{{baseUrl}}/docs/json',
                host: ['{{baseUrl}}'],
                path: ['docs', 'json']
              },
              description: 'Raw OpenAPI 3.0 specification in JSON format'
            },
            response: []
          }
        ],
        description: 'API documentation endpoints'
      }
    ],
    event: [
      {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: [
            '// Auto-generate UUIDs for testing if variables are not set',
            'if (!pm.collectionVariables.get("userId") || pm.collectionVariables.get("userId") === "{{$randomUUID}}") {',
            '    pm.collectionVariables.set("userId", "01234567-0123-4123-8123-123456789abc");',
            '}',
            '',
            'if (!pm.collectionVariables.get("resourceId") || pm.collectionVariables.get("resourceId") === "{{$randomUUID}}") {',
            '    pm.collectionVariables.set("resourceId", "11234567-1123-4123-8123-123456789abc");',
            '}',
            '',
            '// Log the current variables for debugging',
            'console.log("Base URL:", pm.collectionVariables.get("baseUrl"));',
            'console.log("User ID:", pm.collectionVariables.get("userId"));',
            'console.log("Resource ID:", pm.collectionVariables.get("resourceId"));'
          ]
        }
      },
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// Common test scripts for all requests',
            'pm.test("Status code is not 500", function () {',
            '    pm.expect(pm.response.code).to.not.equal(500);',
            '});',
            '',
            'pm.test("Response time is reasonable", function () {',
            '    pm.expect(pm.response.responseTime).to.be.below(5000);',
            '});',
            '',
            'pm.test("Content-Type header is correct", function () {',
            '    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");',
            '});',
            '',
            '// Parse response if JSON',
            'if (pm.response.headers.get("Content-Type").includes("application/json")) {',
            '    pm.test("Response is valid JSON", function () {',
            '        pm.response.to.have.jsonBody();',
            '    });',
            '    ',
            '    const responseJson = pm.response.json();',
            '    ',
            '    if (responseJson.success !== undefined) {',
            '        pm.test("Response has success field", function () {',
            '            pm.expect(responseJson).to.have.property("success");',
            '        });',
            '    }',
            '}'
          ]
        }
      }
    ]
  };

  return collection;
}

function saveCollectionToFile() {
  const collection = generatePostmanCollection();
  const outputPath = path.join(__dirname, '..', 'postman', 'resource-sharing-service.postman_collection.json');
  
  // Ensure postman directory exists
  const postmanDir = path.dirname(outputPath);
  if (!fs.existsSync(postmanDir)) {
    fs.mkdirSync(postmanDir, { recursive: true });
  }

  // Write the collection file
  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
  
  console.log(`✅ Postman collection generated successfully at: ${outputPath}`);
  console.log('📋 To use this collection:');
  console.log('   1. Open Postman');
  console.log('   2. Click "Import" → "Choose Files"');
  console.log(`   3. Select the file: ${outputPath}`);
  console.log('   4. Start the development server: npm run dev');
  console.log('   5. Test the endpoints using the collection');
  
  return outputPath;
}

// Create environment file as well
function createEnvironmentFile() {
  const environment = {
    id: 'resource-sharing-dev',
    name: 'Resource Sharing - Development',
    values: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'default',
        enabled: true
      },
      {
        key: 'userId',
        value: '01234567-0123-4123-8123-123456789abc',
        type: 'default',
        enabled: true,
        description: 'Sample user ID from seeded data'
      },
      {
        key: 'resourceId',
        value: '11234567-1123-4123-8123-123456789abc',
        type: 'default',
        enabled: true,
        description: 'Sample resource ID from seeded data'
      }
    ],
    _postman_variable_scope: 'environment'
  };

  const envPath = path.join(__dirname, '..', 'postman', 'resource-sharing-dev.postman_environment.json');
  fs.writeFileSync(envPath, JSON.stringify(environment, null, 2));
  
  console.log(`✅ Postman environment generated at: ${envPath}`);
  return envPath;
}

// Run the script if called directly
if (require.main === module) {
  try {
    saveCollectionToFile();
    createEnvironmentFile();
    
    console.log('\n🚀 Ready to test the API!');
    console.log('   Run: npm run dev');
    console.log('   Then import both files into Postman and start testing.');
  } catch (error) {
    console.error('❌ Error generating Postman collection:', error);
    process.exit(1);
  }
}

module.exports = {
  generatePostmanCollection,
  saveCollectionToFile,
  createEnvironmentFile
}; 
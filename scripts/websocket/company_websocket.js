/**
 * Company WebSocket Client Example
 * 
 * Demonstrates how to use the Company WebSocket API to interact with company endpoints
 * via WebSocket connections. Supports all 25 company WebSocket actions.
 * 
 * Usage:
 *   1. Replace 'YOUR_JWT_TOKEN' with a valid JWT token
 *   2. Replace 'YOUR_WRITE_KEY' with a valid write key (for write operations)
 *   3. Run: node company_websocket.js
 */

const WebSocket = require('ws');

// Configuration
const WS_URL = 'ws://54.87.173.234:8000/api/v1/companies/ws';
const JWT_TOKEN = 'YOUR_JWT_TOKEN';
const WRITE_KEY = 'YOUR_WRITE_KEY';

// Connect to WebSocket
const ws = new WebSocket(`${WS_URL}?token=${JWT_TOKEN}`);

// Request counter for unique request IDs
let requestCounter = 0;

function generateRequestId() {
    return `req-${Date.now()}-${++requestCounter}`;
}

// WebSocket event handlers
ws.on('open', () => {
    console.log('✓ WebSocket connected to Company API\n');
    
    // Example 1: List companies
    setTimeout(() => {
        console.log('1. Listing companies...');
        ws.send(JSON.stringify({
            action: 'list_companies',
            request_id: generateRequestId(),
            data: {
                name: 'Acme',
                employees_min: 100,
                industries: 'Technology,Software',
                limit: 10,
                ordering: '-employees_count'
            }
        }));
    }, 500);
    
    // Example 2: Get a specific company
    setTimeout(() => {
        console.log('2. Getting company by UUID...');
        ws.send(JSON.stringify({
            action: 'get_company',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c'
            }
        }));
    }, 1500);
    
    // Example 3: Count companies
    setTimeout(() => {
        console.log('3. Counting companies...');
        ws.send(JSON.stringify({
            action: 'count_companies',
            request_id: generateRequestId(),
            data: {
                industries: 'Technology',
                employees_min: 100
            }
        }));
    }, 2500);
    
    // Example 4: Get company UUIDs
    setTimeout(() => {
        console.log('4. Getting company UUIDs...');
        ws.send(JSON.stringify({
            action: 'get_company_uuids',
            request_id: generateRequestId(),
            data: {
                industries: 'Technology',
                employees_min: 100,
                limit: 50
            }
        }));
    }, 3500);
    
    // Example 5: List company names
    setTimeout(() => {
        console.log('5. Listing company names...');
        ws.send(JSON.stringify({
            action: 'list_company_names',
            request_id: generateRequestId(),
            data: {
                search: 'acme',
                limit: 20,
                ordering: 'value'
            }
        }));
    }, 4500);
    
    // Example 6: List industries
    setTimeout(() => {
        console.log('6. Listing industries...');
        ws.send(JSON.stringify({
            action: 'list_industries',
            request_id: generateRequestId(),
            data: {
                separated: true,
                ordering: '-count',
                limit: 20
            }
        }));
    }, 5500);
    
    // Example 7: List keywords
    setTimeout(() => {
        console.log('7. Listing keywords...');
        ws.send(JSON.stringify({
            action: 'list_keywords',
            request_id: generateRequestId(),
            data: {
                separated: true,
                search: 'cloud',
                limit: 20
            }
        }));
    }, 6500);
    
    // Example 8: List technologies
    setTimeout(() => {
        console.log('8. Listing technologies...');
        ws.send(JSON.stringify({
            action: 'list_technologies',
            request_id: generateRequestId(),
            data: {
                separated: true,
                search: 'python',
                ordering: '-count'
            }
        }));
    }, 7500);
    
    // Example 9: List company cities
    setTimeout(() => {
        console.log('9. Listing company cities...');
        ws.send(JSON.stringify({
            action: 'list_company_cities',
            request_id: generateRequestId(),
            data: {
                search: 'san',
                limit: 20,
                ordering: '-count'
            }
        }));
    }, 8500);
    
    // Example 10: List company states
    setTimeout(() => {
        console.log('10. Listing company states...');
        ws.send(JSON.stringify({
            action: 'list_company_states',
            request_id: generateRequestId(),
            data: {
                limit: 20,
                ordering: '-count'
            }
        }));
    }, 9500);
    
    // Example 11: List company countries
    setTimeout(() => {
        console.log('11. Listing company countries...');
        ws.send(JSON.stringify({
            action: 'list_company_countries',
            request_id: generateRequestId(),
            data: {
                limit: 20,
                ordering: '-count'
            }
        }));
    }, 10500);
    
    // Example 12: List company addresses
    setTimeout(() => {
        console.log('12. Listing company addresses...');
        ws.send(JSON.stringify({
            action: 'list_company_addresses',
            request_id: generateRequestId(),
            data: {
                search: 'San Francisco',
                limit: 20
            }
        }));
    }, 11500);
    
    // Example 13: List company contacts
    setTimeout(() => {
        console.log('13. Listing company contacts...');
        ws.send(JSON.stringify({
            action: 'list_company_contacts',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                title: 'engineer',
                seniority: 'senior',
                limit: 25,
                offset: 0
            }
        }));
    }, 12500);
    
    // Example 14: Count company contacts
    setTimeout(() => {
        console.log('14. Counting company contacts...');
        ws.send(JSON.stringify({
            action: 'count_company_contacts',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                title: 'engineer'
            }
        }));
    }, 13500);
    
    // Example 15: Get company contact UUIDs
    setTimeout(() => {
        console.log('15. Getting company contact UUIDs...');
        ws.send(JSON.stringify({
            action: 'get_company_contact_uuids',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                title: 'engineer',
                limit: 100
            }
        }));
    }, 14500);
    
    // Example 16: List company contact first names
    setTimeout(() => {
        console.log('16. Listing company contact first names...');
        ws.send(JSON.stringify({
            action: 'list_company_contact_first_names',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                search: 'john',
                limit: 25
            }
        }));
    }, 15500);
    
    // Example 17: List company contact last names
    setTimeout(() => {
        console.log('17. Listing company contact last names...');
        ws.send(JSON.stringify({
            action: 'list_company_contact_last_names',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                limit: 25
            }
        }));
    }, 16500);
    
    // Example 18: List company contact titles
    setTimeout(() => {
        console.log('18. Listing company contact titles...');
        ws.send(JSON.stringify({
            action: 'list_company_contact_titles',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                search: 'engineer',
                limit: 50
            }
        }));
    }, 17500);
    
    // Example 19: List company contact seniorities
    setTimeout(() => {
        console.log('19. Listing company contact seniorities...');
        ws.send(JSON.stringify({
            action: 'list_company_contact_seniorities',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                limit: 25
            }
        }));
    }, 18500);
    
    // Example 20: List company contact departments
    setTimeout(() => {
        console.log('20. Listing company contact departments...');
        ws.send(JSON.stringify({
            action: 'list_company_contact_departments',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                limit: 25
            }
        }));
    }, 19500);
    
    // Example 21: List company contact email statuses
    setTimeout(() => {
        console.log('21. Listing company contact email statuses...');
        ws.send(JSON.stringify({
            action: 'list_company_contact_email_statuses',
            request_id: generateRequestId(),
            data: {
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                limit: 25
            }
        }));
    }, 20500);
    
    // Example 22: Create company (requires admin + write key)
    setTimeout(() => {
        console.log('22. Creating company (requires admin + write key)...');
        ws.send(JSON.stringify({
            action: 'create_company',
            request_id: generateRequestId(),
            data: {
                write_key: WRITE_KEY,
                name: 'New Company Inc',
                employees_count: 150,
                industries: ['Technology', 'Software'],
                keywords: ['startup', 'saas'],
                address: '456 Tech Street',
                annual_revenue: 10000000,
                technologies: ['Python', 'React'],
                metadata: {
                    city: 'San Francisco',
                    state: 'CA',
                    country: 'United States',
                    website: 'https://newcompany.com'
                }
            }
        }));
    }, 21500);
    
    // Example 23: Update company (requires admin + write key)
    setTimeout(() => {
        console.log('23. Updating company (requires admin + write key)...');
        ws.send(JSON.stringify({
            action: 'update_company',
            request_id: generateRequestId(),
            data: {
                write_key: WRITE_KEY,
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c',
                name: 'Updated Company Name',
                employees_count: 300
            }
        }));
    }, 22500);
    
    // Example 24: Delete company (requires admin + write key)
    setTimeout(() => {
        console.log('24. Deleting company (requires admin + write key)...');
        ws.send(JSON.stringify({
            action: 'delete_company',
            request_id: generateRequestId(),
            data: {
                write_key: WRITE_KEY,
                company_uuid: '398cce44-233d-5f7c-aea1-e4a6a79df10c'
            }
        }));
    }, 23500);
    
    // Close connection after all examples
    setTimeout(() => {
        console.log('\n✓ All examples completed. Closing connection...');
        ws.close();
    }, 24500);
});

ws.on('message', (data) => {
    try {
        const response = JSON.parse(data.toString());
        
        if (response.status === 'success') {
            console.log(`\n✓ Success [${response.action}] (request_id: ${response.request_id})`);
            
            // Format output based on action type
            if (response.action === 'list_companies' || response.action === 'list_company_contacts') {
                console.log(`  Results: ${response.data.results?.length || 0} items`);
                if (response.data.next) {
                    console.log(`  Has next page: Yes`);
                }
            } else if (response.action === 'count_companies' || response.action === 'count_company_contacts') {
                console.log(`  Count: ${response.data.count}`);
            } else if (response.action === 'get_company_uuids' || response.action === 'get_company_contact_uuids') {
                console.log(`  Count: ${response.data.count}, UUIDs: ${response.data.uuids?.length || 0}`);
            } else if (response.action.includes('list_') && response.data.results) {
                console.log(`  Results: ${response.data.results.length} items`);
                if (response.data.results.length > 0 && response.data.results.length <= 5) {
                    console.log(`  Sample: ${JSON.stringify(response.data.results.slice(0, 3))}`);
                }
            } else if (response.action === 'get_company') {
                console.log(`  Company: ${response.data.name || 'N/A'} (${response.data.uuid})`);
            } else if (response.action === 'create_company' || response.action === 'update_company') {
                console.log(`  Company: ${response.data.name || 'N/A'} (${response.data.uuid})`);
            } else if (response.action === 'delete_company') {
                console.log(`  Company deleted successfully`);
            }
        } else {
            console.error(`\n✗ Error [${response.action}] (request_id: ${response.request_id})`);
            console.error(`  Code: ${response.error?.code || 'unknown'}`);
            console.error(`  Message: ${response.error?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        console.error('Raw data:', data.toString());
    }
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
    console.log(`\nWebSocket closed: code=${code}, reason=${reason.toString()}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down...');
    if (ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    process.exit(0);
});


# Contacts Filter Usage Guide

## Quick Start

### Enabling Debug Mode
Open your browser console and run:
```javascript
filterLogger.enable()
```

You'll now see detailed logs for:
- Every filter change
- Every API request with full parameters
- Every API response with timing
- Any errors that occur

### Using the Debug Panel
1. Look for the **🐛 Filter Debug** button in the bottom-right corner of the contacts page
2. Click it to expand the panel
3. You'll see:
   - How many filters are active
   - Breakdown by category
   - All active filters with their values
   - The exact API query parameters being sent
   - The full query string

## Filter Types & Examples

### 1. Text Filters (Partial Match)
These filters search for partial matches (case-insensitive).

**Examples:**
```
First Name: "john"
  → Matches: John, Johnny, Johnson, Johnathan

Email: "@gmail"
  → Matches: user@gmail.com, test@gmail.com

Company: "tech"
  → Matches: TechCorp, FinTech Inc, BioTech Labs
```

**Available Text Filters:**
- Person: first_name, last_name, email, title, departments
- Phone: work_direct_phone, home_phone, mobile_phone, corporate_phone, other_phone
- Location: city, state, country
- Company: company, company_name_for_emails, company_address, company_city, company_state, company_country, company_phone
- Web: person_linkedin_url, company_linkedin_url, facebook_url, twitter_url, website
- Other: industry, technologies, keywords, latest_funding, last_raised_at

### 2. Exact Match Filters
These filters require exact matches (case-insensitive).

**Examples:**
```
Email Status: "valid"
  → Matches only contacts with email_status = "valid"

Seniority: "c-level"
  → Matches only contacts with seniority = "c-level"

Employees Count: "100"
  → Matches only companies with exactly 100 employees
```

**Available Exact Match Filters:**
- email_status
- primary_email_catch_all_status
- stage
- seniority
- employees_count (NEW!)
- annual_revenue (NEW!)
- total_funding (NEW!)

### 3. Numeric Range Filters
Filter by minimum and maximum values.

**Examples:**
```
Employees: Min: 50, Max: 200
  → Matches companies with 50-200 employees

Annual Revenue: Min: 1000000, Max: 10000000
  → Matches companies with $1M-$10M revenue

Total Funding: Min: 5000000
  → Matches companies with at least $5M funding
```

**Available Range Filters:**
- employees_min / employees_max
- annual_revenue_min / annual_revenue_max
- total_funding_min / total_funding_max
- latest_funding_amount_min / latest_funding_amount_max

### 4. Date Range Filters
Filter by date ranges (ISO 8601 format).

**Format:** `YYYY-MM-DDTHH:MM:SSZ`

**Examples:**
```
Created After: "2024-01-01T00:00:00Z"
Created Before: "2024-12-31T23:59:59Z"
  → Matches contacts created in 2024

Updated After: "2024-11-01T00:00:00Z"
  → Matches contacts updated since November 2024
```

**Available Date Filters:**
- created_at_after / created_at_before
- updated_at_after / updated_at_before

### 5. Location Filters
Full-text search on location fields.

**Examples:**
```
Company Location: "San Francisco"
  → Searches company address, city, state, country

Contact Location: "California"
  → Searches contact location metadata
```

**Available Location Filters:**
- company_location
- contact_location

### 6. Exclusion Filters
Exclude contacts matching any of the specified values.

**Examples:**
```
Exclude Titles: ["Intern", "Junior", "Trainee"]
  → Excludes contacts with these titles

Exclude Industries: ["Retail", "Hospitality"]
  → Excludes contacts from these industries
```

**Available Exclusion Filters:**
- exclude_company_ids
- exclude_titles
- exclude_company_locations
- exclude_contact_locations
- exclude_seniorities
- exclude_departments
- exclude_technologies
- exclude_keywords
- exclude_industries

## Combining Filters

You can combine multiple filters for precise results:

**Example 1: Senior Tech Executives**
```
Title: "CTO"
Seniority: "c-level"
Industry: "Technology"
Employees Min: 100
```

**Example 2: Verified Contacts in California**
```
Email Status: "valid"
State: "CA"
Exclude Titles: ["Intern", "Junior"]
```

**Example 3: Recently Added Large Companies**
```
Employees Min: 500
Annual Revenue Min: 50000000
Created After: "2024-10-01T00:00:00Z"
```

## Understanding the Debug Panel

### Statistics Section
```
Total Filters: 92      # All available filters
Active: 5              # Filters currently applied
Usage: 5%              # Percentage of filters in use
```

### By Category Section
Shows how many filters are active in each category:
```
Text Filters: 3
Exact Match: 1
Numeric Range: 2
```

### Active Filters Section
Lists each active filter with its value:
```
city: "San Francisco"
employees_min: "50"
email_status: "valid"
```

### API Query Parameters Section
Shows the exact parameters sent to the API:
```
city: "San Francisco"
employees_min: "50"
email_status: "valid"
page_size: "25"
```

### Query String Section
The actual query string sent to the API:
```
city=San+Francisco&employees_min=50&email_status=valid&page_size=25
```

## Console Logging Examples

### When You Change a Filter:
```
[FILTER CHANGE] city: (empty) → San Francisco
```

### When API Request is Made:
```
[API REQUEST] GET /api/v1/contacts/ (4 params)
Query String: city=San+Francisco&employees_min=50&email_status=valid&page_size=25
Parameters: {
  city: 'San Francisco',
  employees_min: '50',
  email_status: 'valid',
  page_size: 25
}
```

### When API Response is Received:
```
[API RESPONSE] Status: 200 (342ms)
Results: 25 items
Total Count: 1,234
Meta: {
  strategy: 'cursor',
  count_mode: 'estimated',
  filters_applied: true,
  ordering: '-created_at',
  returned_records: 25
}
```

### When You Clear Filters:
```
[FILTER CLEAR] Cleared 5 filter(s): city, employees_min, email_status, title, industry
```

## Advanced Logger Commands

### View Filter History:
```javascript
filterLogger.getHistory()
// Returns array of all filter changes
```

### Clear History:
```javascript
filterLogger.clearHistory()
```

### Disable Logging:
```javascript
filterLogger.disable()
```

### Toggle Logging:
```javascript
filterLogger.toggle()
// Returns: true (enabled) or false (disabled)
```

### Check Status:
```javascript
filterLogger.isEnabled()
// Returns: true or false
```

### Custom Logging:
```javascript
// Log a custom message
filterLogger.log('My custom message', { data: 'value' })

// Log a warning
filterLogger.warn('Something might be wrong', { issue: 'details' })

// Log an error
filterLogger.error('Something failed', error)
```

## Troubleshooting

### No Results Showing?
1. Open the debug panel to see active filters
2. Check if filters are too restrictive
3. Try clearing all filters and applying them one by one
4. Enable logging to see the API request/response

### Filters Not Working?
1. Enable logging: `filterLogger.enable()`
2. Change a filter and watch the console
3. Check if the filter change is logged
4. Check if the API request includes the filter
5. Check the API response for errors

### Debug Panel Not Showing?
1. Look for the 🐛 button in the bottom-right corner
2. If it's collapsed, click to expand
3. If missing, check browser console for errors

### Slow Performance?
1. Reduce the number of active filters
2. Use more specific filters (exact match vs partial)
3. Disable logging if not needed: `filterLogger.disable()`
4. Check the API response time in the logs

## Best Practices

### 1. Start Broad, Then Narrow
```
Step 1: Industry: "Technology"
Step 2: Add State: "CA"
Step 3: Add Employees Min: 100
Step 4: Add Email Status: "valid"
```

### 2. Use Exact Match for Precision
Instead of:
```
Title: "CEO" (partial match)
```
Use:
```
Seniority: "c-level" (exact match)
+ Title: "CEO" (partial match)
```

### 3. Combine Ranges with Exclusions
```
Employees Min: 50
Employees Max: 500
Exclude Industries: ["Retail", "Hospitality"]
```

### 4. Use Date Filters for Recent Data
```
Created After: "2024-11-01T00:00:00Z"
Email Status: "valid"
```

### 5. Monitor Performance
- Enable logging to see API response times
- If queries are slow (>1s), simplify filters
- Use exact match filters when possible

## Tips & Tricks

### Tip 1: Keyboard Shortcuts
- Press `Escape` to close the mobile filter drawer
- Use `Tab` to navigate between filter inputs

### Tip 2: Filter Persistence
- Filters persist during your session
- Pagination resets when you change filters
- Clear all filters to start fresh

### Tip 3: Debug Panel Shortcuts
- Click the badge to quickly see active filter count
- Collapse when not needed to save screen space
- Query string can be copied for API testing

### Tip 4: Logging Best Practices
- Enable logging during development
- Disable in production for performance
- Use history to track filter changes over time

### Tip 5: Combining Filters Effectively
- Start with the most selective filter
- Add broader filters to expand results
- Use exclusions to remove unwanted matches

## Common Use Cases

### Use Case 1: Find Decision Makers
```
Seniority: "c-level"
Email Status: "valid"
Employees Min: 100
Exclude Titles: ["Retired", "Former"]
```

### Use Case 2: Target Specific Region
```
State: "CA"
City: "San Francisco"
Industry: "Technology"
Annual Revenue Min: 10000000
```

### Use Case 3: Recent High-Value Contacts
```
Created After: "2024-10-01T00:00:00Z"
Total Funding Min: 50000000
Email Status: "valid"
```

### Use Case 4: Clean Contact List
```
Email Status: "valid"
Exclude Seniorities: ["intern", "entry-level"]
Exclude Departments: ["HR", "Legal"]
Updated After: "2024-01-01T00:00:00Z"
```

## Need Help?

1. **Check the Debug Panel**: Shows exactly what's being sent to the API
2. **Enable Logging**: See detailed information about every operation
3. **Review FILTER_AUDIT.md**: Complete list of all available filters
4. **Check IMPLEMENTATION_SUMMARY.md**: Technical implementation details
5. **Browser Console**: Type `filterLogger` to see available commands

Happy filtering! 🎯


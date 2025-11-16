/**
 * Apollo Filter Utilities
 * 
 * Utility functions for parsing and handling Apollo filter inputs.
 */

/**
 * Parse multi-value input string into array of values
 * 
 * Supports comma-separated and newline-separated values.
 * Handles mixed formats (comma and newline in same input).
 * 
 * @param input - Input string that may contain comma or newline-separated values
 * @returns Array of trimmed, non-empty values
 * 
 * @example
 * ```typescript
 * parseMultiValueInput("example.com, test.com\ndemo.com")
 * // Returns: ["example.com", "test.com", "demo.com"]
 * 
 * parseMultiValueInput("value1\nvalue2, value3\r\nvalue4")
 * // Returns: ["value1", "value2", "value3", "value4"]
 * ```
 */
export function parseMultiValueInput(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }
  
  return input
    .split(/[,\n\r]+/)  // Split by comma, newline (\n), or carriage return (\r\n)
    .map(value => value.trim())
    .filter(value => value.length > 0);
}

/**
 * Parse and flatten multiple input strings into a single array
 * 
 * Useful for array-based inputs where each input field can contain
 * multiple comma/newline-separated values.
 * 
 * @param inputs - Array of input strings
 * @returns Flattened array of all parsed values
 * 
 * @example
 * ```typescript
 * parseMultipleInputs(["example.com, test.com", "demo.com\nspam.com"])
 * // Returns: ["example.com", "test.com", "demo.com", "spam.com"]
 * ```
 */
export function parseMultipleInputs(inputs: string[]): string[] {
  if (!Array.isArray(inputs)) {
    return [];
  }
  
  return inputs
    .flatMap(input => parseMultiValueInput(input))
    .filter(value => value.length > 0);
}


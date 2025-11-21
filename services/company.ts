/**
 * Company Service (Legacy Compatibility Layer)
 * 
 * This file re-exports from the modular company service structure.
 * All new code should import directly from '@services/company' which resolves to './company/index.ts'
 * 
 * @deprecated This file exists for backward compatibility. New code should use the modular structure.
 */

// Re-export everything from the modular structure
export * from './company/index';

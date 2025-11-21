/**
 * Contact Service (Legacy Compatibility Layer)
 * 
 * This file re-exports from the modular contact service structure.
 * All new code should import directly from '@services/contact' which resolves to './contact/index.ts'
 * 
 * @deprecated This file exists for backward compatibility. New code should use the modular structure.
 */

// Re-export everything from the modular structure
export * from './contact/index';

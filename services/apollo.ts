/**
 * Apollo Service (Legacy Compatibility Layer)
 * 
 * This file re-exports from the modular apollo service structure.
 * All new code should import directly from '@services/apollo' which resolves to './apollo/index.ts'
 * 
 * @deprecated This file exists for backward compatibility. New code should use the modular structure.
 */

// Re-export everything from the modular structure
export * from './apollo/index';

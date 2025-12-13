/**
 * Filter utilities for pet queries
 * Provides a declarative way to apply filters to Supabase queries
 */

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { PetFilters } from './pets.types';

type QueryBuilder = PostgrestFilterBuilder<any, any, any, any>;

/**
 * Filter configuration type
 * Defines how each filter should be applied to the query
 */
type FilterConfig = {
  /** Filter key in PetFilters */
  key: keyof PetFilters;
  /** Database column name */
  column: string;
  /** Query method to use ('eq' for exact match, 'ilike' for case-insensitive partial match) */
  method: 'eq' | 'ilike';
  /** Whether to skip if value is 'Todos' */
  skipIfTodos?: boolean;
};

/**
 * Default filter configurations
 * Maps filter keys to their database columns and query methods
 */
const FILTER_CONFIGS: FilterConfig[] = [
  { key: 'type', column: 'animal_type', method: 'eq', skipIfTodos: true },
  { key: 'breed', column: 'breed', method: 'eq', skipIfTodos: true },
  { key: 'size', column: 'size', method: 'eq', skipIfTodos: true },
  { key: 'color1', column: 'color', method: 'ilike', skipIfTodos: true },
  { key: 'color2', column: 'color', method: 'ilike', skipIfTodos: true },
  { key: 'color3', column: 'color', method: 'ilike', skipIfTodos: true },
  { key: 'department', column: 'location', method: 'ilike', skipIfTodos: true },
];

/**
 * Applies filters to a Supabase query builder in a declarative way
 * 
 * @param query - The Supabase query builder
 * @param filters - The filters to apply (can be partial)
 * @param configs - Optional custom filter configurations (defaults to FILTER_CONFIGS)
 * @returns The query builder with filters applied
 * 
 * @example
 * ```ts
 * let query = supabase.from('pets').select('*');
 * query = applyPetFilters(query, filters);
 * ```
 */
export function applyPetFilters(
  query: QueryBuilder,
  filters: Partial<PetFilters>,
  configs: FilterConfig[] = FILTER_CONFIGS
): QueryBuilder {
  return configs.reduce((acc, config) => {
    const filterValue = filters[config.key];
    
    // Skip if filter value is not provided
    if (filterValue === undefined || filterValue === null) {
      return acc;
    }
    
    // Skip if value is 'Todos' and skipIfTodos is true
    if (config.skipIfTodos && filterValue === 'Todos') {
      return acc;
    }
    
    // Apply the filter based on the method
    if (config.method === 'eq') {
      return acc.eq(config.column, filterValue);
    } else if (config.method === 'ilike') {
      // For ilike, wrap the value with wildcards for partial matching
      return acc.ilike(config.column, `%${filterValue}%`);
    }
    
    return acc;
  }, query);
}

/**
 * Creates a filter configuration for custom filters
 * Useful for extending filter functionality
 * 
 * @param key - Filter key in PetFilters
 * @param column - Database column name
 * @param method - Query method ('eq' or 'ilike')
 * @param skipIfTodos - Whether to skip if value is 'Todos'
 * @returns Filter configuration object
 */
export function createFilterConfig(
  key: keyof PetFilters,
  column: string,
  method: 'eq' | 'ilike' = 'eq',
  skipIfTodos: boolean = true
): FilterConfig {
  return { key, column, method, skipIfTodos };
}

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
  { key: 'department', column: 'location', method: 'ilike', skipIfTodos: true },
  { key: 'province', column: 'location', method: 'ilike', skipIfTodos: true },
  { key: 'district', column: 'location', method: 'ilike', skipIfTodos: true },
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
  // Handle status filter
  if (filters.status && filters.status !== 'Todos') {
    query = query.eq('status', filters.status);
  }

  // Handle colors filter (OR logic - pet must match at least one)
  if (filters.colors && Array.isArray(filters.colors) && filters.colors.length > 0) {
    // Use .or() to match any of the selected colors
    // Supabase .or() syntax: "column.ilike.%value1%,column.ilike.%value2%"
    const colorConditions = filters.colors.map(color => `color.ilike.%${color}%`).join(',');
    query = query.or(colorConditions);
  }

  // Handle date filter
  if (filters.dateFilter) {
    const now = new Date();
    let dateThreshold: Date;
    
    switch (filters.dateFilter) {
      case 'today':
        dateThreshold = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'last3days':
        dateThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case 'lastWeek':
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'lastMonth':
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateThreshold = new Date(0);
    }
    
    if (dateThreshold.getTime() > 0) {
      query = query.gte('created_at', dateThreshold.toISOString());
    }
  }

  // Handle name filter (only if status is 'Perdido')
  if (filters.name && filters.name.trim() && filters.status === 'Perdido') {
    query = query.ilike('name', `%${filters.name}%`);
  }

  // Apply standard filters using configs
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

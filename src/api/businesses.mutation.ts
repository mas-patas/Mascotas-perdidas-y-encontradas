import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as businessesApi from './businesses.api';
import type { CreateBusinessData, UpdateBusinessData, CreateProductData } from './businesses.types';

/**
 * Mutation hook to create a business
 */
export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBusinessData) => {
      return await businessesApi.createBusiness(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
      queryClient.invalidateQueries({ queryKey: queryKeys.businessByOwner(variables.ownerId) });
    }
  });
};

/**
 * Mutation hook to update a business
 */
export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBusinessData }) => {
      await businessesApi.updateBusiness(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
      queryClient.invalidateQueries({ queryKey: queryKeys.business(variables.id) });
    }
  });
};

/**
 * Mutation hook to add a product to a business
 */
export const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      return await businessesApi.addProduct(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business(variables.businessId) });
    }
  });
};

/**
 * Mutation hook to delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, businessId }: { productId: string; businessId: string }) => {
      await businessesApi.deleteProduct(productId);
      return { productId, businessId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business(variables.businessId) });
    }
  });
};

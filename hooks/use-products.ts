import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Category {
    id: string;
    tenant_id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    image_url: string | null;
    created_at: string;
}

export interface ProductVariant {
    id: string;
    tenant_id: string;
    product_id: string;
    name: string;
    price: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    tenant_id: string;
    category_id: string | null;
    name: string;
    price: number;
    tax_rate: number;
    is_active: boolean;
    image_url: string | null;
    stock_quantity: number | null;
    created_at: string;
    updated_at: string;
    category?: Category;
    variants?: ProductVariant[];
}

// Fetch all products for tenant
export function useProducts() {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['products', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*, category:categories(*), variants:product_variants(*)')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data as Product[];
        },
        enabled: !!tenant,
        networkMode: 'offlineFirst',
    });
}

// Fetch all categories
export function useCategories() {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['categories', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;
            return data as Category[];
        },
        enabled: !!tenant,
        networkMode: 'offlineFirst',
    });
}

// Create product
export function useCreateProduct() {
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);

    return useMutation({
        mutationFn: async (product: {
            name: string;
            price: number;
            tax_rate?: number;
            category_id?: string | null;
            image_url?: string | null;
            stock_quantity?: number | null;
        }) => {
            if (!tenant) throw new Error('No tenant');

            const { data, error } = await supabase
                .from('products')
                .insert({ ...product, tenant_id: tenant.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// Update product
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
            const { data, error } = await supabase
                .from('products')
                // Remove undefined values to avoid overwriting with defaults if needed, 
                // but usually Supabase ignores undefined if not passed in object? 
                // Actually spread works fine.
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// Delete product (soft delete)
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// Create variant
export function useCreateVariant() {
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);

    return useMutation({
        mutationFn: async (variant: {
            product_id: string;
            name: string;
            price: number;
            sort_order?: number;
        }) => {
            if (!tenant) throw new Error('No tenant');

            const { data, error } = await supabase
                .from('product_variants')
                .insert({ ...variant, tenant_id: tenant.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// Update variant
export function useUpdateVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; name?: string; price?: number; sort_order?: number }) => {
            const { data, error } = await supabase
                .from('product_variants')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// Delete variant
export function useDeleteVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('product_variants')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// Create category
export function useCreateCategory() {
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);

    return useMutation({
        mutationFn: async (category: { name: string; image_url?: string }) => {
            if (!tenant) throw new Error('No tenant');

            const { data, error } = await supabase
                .from('categories')
                .insert({
                    name: category.name,
                    image_url: category.image_url,
                    tenant_id: tenant.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}

// Update category
export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; name?: string; image_url?: string | null }) => {
            const { data, error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// Delete (soft-delete) category
export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

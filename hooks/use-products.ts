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

export interface Product {
    id: string;
    tenant_id: string;
    category_id: string | null;
    name: string;
    price: number;
    tax_rate: number;
    is_active: boolean;
    image_url: string | null;
    created_at: string;
    updated_at: string;
    category?: Category;
}

export function useProducts() {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['products', tenant?.id],
        queryFn: async () => {
            if (!tenant) return [];
            const { data, error } = await supabase
                .from('products')
                .select('*, category:categories(*)')
                .eq('tenant_id', tenant.id)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data as Product[];
        },
        enabled: !!tenant,
    });
}

export function useCategories() {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['categories', tenant?.id],
        queryFn: async () => {
            if (!tenant) return [];
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('tenant_id', tenant.id)
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;
            return data as Category[];
        },
        enabled: !!tenant,
    });
}

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

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
            const { data, error } = await supabase
                .from('products')
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
                    tenant_id: tenant.id,
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

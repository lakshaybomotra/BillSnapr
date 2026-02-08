import { IconSymbol } from '@/components/ui/icon-symbol';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useCategories, useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from '@/hooks/use-products';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProductModal() {
    const params = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!params.id;

    const { data: products } = useProducts();
    const { data: categories } = useCategories();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();
    const { pickImage, uploadImage, isUploading: isImageUploading } = useImageUpload();

    const productToEdit = isEditing
        ? products?.find(p => p.id === params.id)
        : null;

    const [name, setName] = useState(productToEdit?.name || '');
    const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
    const [imageUrl, setImageUrl] = useState(productToEdit?.image_url || '');
    const [categoryId, setCategoryId] = useState(productToEdit?.category_id || '');

    const isLoading = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending || isImageUploading;

    const handleImagePick = async () => {
        const uri = await pickImage();
        if (uri) {
            const publicUrl = await uploadImage(uri);
            if (publicUrl) {
                setImageUrl(publicUrl);
            }
        }
    };

    const handleSave = () => {
        if (!name || !price) return;

        const productData = {
            name,
            price: parseFloat(price),
            image_url: imageUrl || null,
            category_id: categoryId || null,
        };

        if (isEditing && params.id) {
            updateProduct.mutate(
                { id: params.id, ...productData },
                { onSuccess: () => router.back() }
            );
        } else {
            createProduct.mutate(
                productData,
                { onSuccess: () => router.back() }
            );
        }
    };

    const handleDelete = () => {
        if (!isEditing || !params.id) return;

        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteProduct.mutate(params.id!, {
                            onSuccess: () => router.back()
                        });
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-surface">
            <Stack.Screen options={{
                title: isEditing ? 'Edit Product' : 'New Product',
                presentation: 'modal',
                headerRight: isEditing ? () => (
                    <TouchableOpacity onPress={handleDelete} disabled={isLoading}>
                        <IconSymbol name="trash" size={24} color="#EF4444" />
                    </TouchableOpacity>
                ) : undefined
            }} />

            <ScrollView className="flex-1 p-6" contentContainerStyle={{ gap: 24, paddingBottom: 40 }}>
                <View>
                    <Text className="text-text-secondary text-sm mb-2">Product Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Burger"
                        className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <View>
                    <Text className="text-text-secondary text-sm mb-2">Price</Text>
                    <TextInput
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <View>
                    <Text className="text-text-secondary text-sm mb-2">Product Image</Text>
                    <TouchableOpacity
                        onPress={handleImagePick}
                        disabled={isLoading}
                        className="bg-surface-subtle border border-gray-200 border-dashed rounded-xl h-48 items-center justify-center overflow-hidden"
                    >
                        {isImageUploading ? (
                            <ActivityIndicator color="#00936E" />
                        ) : imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                            <View className="items-center">
                                <IconSymbol name="photo" size={32} color="#94A3B8" />
                                <Text className="text-text-muted mt-2">Tap to upload image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View>
                    <Text className="text-text-secondary text-sm mb-2">Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        {categories?.map(category => (
                            <TouchableOpacity
                                key={category.id}
                                onPress={() => setCategoryId(category.id === categoryId ? '' : category.id)}
                                className={`px-4 py-2 rounded-full border ${category.id === categoryId
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'bg-surface-subtle border-gray-200'
                                    }`}
                            >
                                <Text className={`${category.id === categoryId ? 'text-white' : 'text-text-primary'} font-medium`}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading || !name || !price}
                    className={`rounded-xl py-4 mt-4 ${isLoading || !name || !price ? 'bg-gray-300' : 'bg-primary-500'
                        }`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            {isEditing ? 'Save Changes' : 'Create Product'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

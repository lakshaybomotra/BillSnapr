import { IconSymbol } from '@/components/ui/icon-symbol';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useCategories, useCreateProduct, useCreateVariant, useDeleteProduct, useDeleteVariant, useProducts, useUpdateProduct } from '@/hooks/use-products';
import { useGate } from '@/hooks/use-subscription';
import { hapticLight, hapticMedium } from '@/lib/haptics';
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
    const createVariant = useCreateVariant();
    const deleteVariant = useDeleteVariant();
    const { pickImage, uploadImage, isUploading: isImageUploading } = useImageUpload();

    const productToEdit = isEditing
        ? products?.find(p => p.id === params.id)
        : null;

    const [name, setName] = useState(productToEdit?.name || '');
    const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
    const [imageUrl, setImageUrl] = useState(productToEdit?.image_url || '');
    const [categoryId, setCategoryId] = useState(productToEdit?.category_id || '');
    const [trackStock, setTrackStock] = useState(productToEdit?.stock_quantity != null);
    const [stockQuantity, setStockQuantity] = useState(productToEdit?.stock_quantity?.toString() || '');
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantPrice, setNewVariantPrice] = useState('');

    const isLoading = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending || isImageUploading || createVariant.isPending || deleteVariant.isPending;

    // Subscription gates
    const productCount = products?.length ?? 0;
    const productGate = useGate('products', productCount);
    const stockGate = useGate('stock_tracking');
    const isGatedCreate = !isEditing && !productGate.allowed;

    const handleImagePick = async () => {
        const imageResult = await pickImage();
        if (imageResult) {
            const publicUrl = await uploadImage(imageResult);
            if (publicUrl) {
                setImageUrl(publicUrl);
            }
        }
    };

    const handleSave = () => {
        if (!name || !price) return;

        // Block new product creation if limit reached
        if (!isEditing && !productGate.allowed) {
            productGate.showPaywall();
            return;
        }

        hapticLight();

        const productData = {
            name,
            price: parseFloat(price),
            image_url: imageUrl || null,
            category_id: categoryId || null,
            stock_quantity: trackStock ? parseInt(stockQuantity || '0', 10) : null,
        };

        if (isEditing && params.id) {
            updateProduct.mutate(
                { id: params.id, ...productData },
                { onSuccess: () => router.back() }
            );
        } else {
            createProduct.mutate(
                productData,
                {
                    onSuccess: (newProduct) => {
                        // Redirect to edit mode so user can add variants immediately
                        router.replace({
                            pathname: '/modal-product',
                            params: { id: newProduct.id },
                        });
                    }
                }
            );
        }
    };

    const handleDelete = () => {
        if (!isEditing || !params.id) return;
        hapticMedium();

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

                {/* Stock Tracking */}
                <View>
                    <TouchableOpacity
                        onPress={() => {
                            if (!stockGate.allowed) {
                                stockGate.showPaywall();
                                return;
                            }
                            setTrackStock(!trackStock);
                        }}
                        className="flex-row items-center justify-between bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 mb-2"
                    >
                        <View className="flex-row items-center gap-3">
                            <IconSymbol name="shippingbox" size={18} color={trackStock ? '#00936E' : '#94A3B8'} />
                            <View>
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-text-primary font-medium text-base">Track Inventory</Text>
                                    {!stockGate.allowed && (
                                        <View className="bg-amber-100 px-1.5 py-0.5 rounded">
                                            <Text className="text-amber-700 text-2xs font-bold">PRO</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-text-muted text-xs">Enable stock tracking for this item</Text>
                            </View>
                        </View>
                        <View className={`w-12 h-7 rounded-full flex-row items-center px-0.5 ${trackStock && stockGate.allowed ? 'bg-primary-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                            <View className="w-6 h-6 rounded-full bg-white shadow" />
                        </View>
                    </TouchableOpacity>
                    {trackStock && (
                        <TextInput
                            value={stockQuantity}
                            onChangeText={setStockQuantity}
                            placeholder="Current stock quantity"
                            keyboardType="number-pad"
                            className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                            placeholderTextColor="#94A3B8"
                        />
                    )}
                </View>

                {/* Variants Section (only when editing) */}
                {isEditing && params.id && (
                    <View>
                        <Text className="text-text-secondary text-sm mb-2">Variants (Half/Full, S/M/L)</Text>

                        {/* Existing variants */}
                        {productToEdit?.variants && productToEdit.variants.length > 0 && (
                            <View className="gap-2 mb-3">
                                {productToEdit.variants.map((v) => (
                                    <View key={v.id} className="flex-row items-center bg-surface-subtle border border-gray-200 rounded-xl px-4 py-3">
                                        <View className="flex-1">
                                            <Text className="text-text-primary font-medium">{v.name}</Text>
                                            <Text className="text-primary-600 font-semibold text-sm">
                                                {v.price.toFixed(2)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                Alert.alert('Delete Variant', `Remove "${v.name}"?`, [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Delete', style: 'destructive',
                                                        onPress: () => deleteVariant.mutate(v.id),
                                                    },
                                                ]);
                                            }}
                                            disabled={isLoading}
                                        >
                                            <IconSymbol name="trash" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Add new variant */}
                        <View className="flex-row items-end gap-2">
                            <View className="flex-1">
                                <TextInput
                                    value={newVariantName}
                                    onChangeText={setNewVariantName}
                                    placeholder="e.g. Half Plate"
                                    className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-3 text-text-primary text-sm"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                            <View className="w-24">
                                <TextInput
                                    value={newVariantPrice}
                                    onChangeText={setNewVariantPrice}
                                    placeholder="Price"
                                    keyboardType="decimal-pad"
                                    className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-3 text-text-primary text-sm"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    if (!newVariantName.trim() || !newVariantPrice.trim()) return;
                                    createVariant.mutate({
                                        product_id: params.id!,
                                        name: newVariantName.trim(),
                                        price: parseFloat(newVariantPrice),
                                        sort_order: (productToEdit?.variants?.length || 0),
                                    }, {
                                        onSuccess: () => {
                                            setNewVariantName('');
                                            setNewVariantPrice('');
                                        },
                                    });
                                }}
                                disabled={isLoading || !newVariantName.trim() || !newVariantPrice.trim()}
                                className={`w-11 h-11 rounded-xl items-center justify-center ${isLoading || !newVariantName.trim() || !newVariantPrice.trim() ? 'bg-gray-200' : 'bg-primary-500'}`}
                            >
                                <IconSymbol name="plus" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

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

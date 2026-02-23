import { IconSymbol } from '@/components/ui/icon-symbol';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/use-products';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CategoryModal() {
    const params = useLocalSearchParams<{ id?: string; name?: string; image_url?: string }>();
    const isEditing = !!params.id;

    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();
    const { pickImage, uploadImage, isUploading: isImageUploading } = useImageUpload();

    const [name, setName] = useState(params.name || '');
    const [imageUrl, setImageUrl] = useState(params.image_url || '');

    const isLoading = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending || isImageUploading;

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
        if (!name.trim()) return;
        hapticLight();

        if (isEditing) {
            updateCategory.mutate(
                { id: params.id!, name: name.trim(), image_url: imageUrl || null },
                { onSuccess: () => router.back() }
            );
        } else {
            createCategory.mutate(
                { name: name.trim(), image_url: imageUrl || undefined },
                { onSuccess: () => router.back() }
            );
        }
    };

    const handleDelete = () => {
        if (!params.id) return;
        hapticMedium();

        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete"${name}"? Products in this category will become uncategorized.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: () => deleteCategory.mutate(params.id!, {
                        onSuccess: () => router.back(),
                        onError: (error) => Alert.alert('Error', error.message),
                    }),
                },
            ]
        );
    };

    return (
        <View className="flex-1 bg-surface">
            <Stack.Screen options={{
                title: isEditing ? 'Edit Category' : 'New Category',
                presentation: 'modal',
            }} />

            <ScrollView className="flex-1 p-6" contentContainerStyle={{ gap: 24 }}>
                <View>
                    <Text className="text-text-secondary text-sm mb-2">Category Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Starters"
                        className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <View>
                    <Text className="text-text-secondary text-sm mb-2">Category Icon/Image</Text>
                    <TouchableOpacity
                        onPress={handleImagePick}
                        disabled={isLoading}
                        className="bg-surface-subtle border border-gray-200 border-dashed rounded-xl h-32 items-center justify-center overflow-hidden"
                    >
                        {isImageUploading ? (
                            <ActivityIndicator color="#00936E" />
                        ) : imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                        ) : (
                            <View className="items-center">
                                <IconSymbol name="photo" size={28} color="#94A3B8" />
                                <Text className="text-text-muted mt-2 text-sm">Upload Icon</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading || !name.trim()}
                    className={`rounded-xl py-4 mt-4 ${isLoading || !name.trim() ? 'bg-gray-300' : 'bg-primary-500'
                        }`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            {isEditing ? 'Update Category' : 'Create Category'}
                        </Text>
                    )}
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={isLoading}
                        className="rounded-xl py-4 border border-red-200 bg-red-50"
                    >
                        <Text className="text-red-600 text-center font-semibold text-base">
                            Delete Category
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

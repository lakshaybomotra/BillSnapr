import { IconSymbol } from '@/components/ui/icon-symbol';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useCreateCategory } from '@/hooks/use-products';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CategoryModal() {
    // Currently only supporting Create, as Edit requires more setup
    const createCategory = useCreateCategory();
    const { pickImage, uploadImage, isUploading: isImageUploading } = useImageUpload();

    // Simplistic state for now
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const isLoading = createCategory.isPending || isImageUploading;

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
        if (!name) return;

        createCategory.mutate(
            { name, image_url: imageUrl || undefined },
            { onSuccess: () => router.back() }
        );
    };

    return (
        <View className="flex-1 bg-surface">
            <Stack.Screen options={{
                title: 'New Category',
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
                    disabled={isLoading || !name}
                    className={`rounded-xl py-4 mt-4 ${isLoading || !name ? 'bg-gray-300' : 'bg-primary-500'
                        }`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            Create Category
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

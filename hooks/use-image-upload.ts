import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { Buffer } from 'buffer';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

export type ImageResult = {
    uri: string;
    base64?: string | null;
}

export function useImageUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const tenant = useAuthStore((s) => s.tenant);

    const pickImage = async (): Promise<ImageResult | null> => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5, // Reduced quality for reliable uploads
            base64: true, // Request base64
        });

        if (!result.canceled && result.assets[0]) {
            return {
                uri: result.assets[0].uri,
                base64: result.assets[0].base64,
            };
        }
        return null;
    };

    const uploadImage = async (image: ImageResult): Promise<string | null> => {
        try {
            setIsUploading(true);
            if (!tenant) throw new Error('No tenant found');
            if (!image.base64) throw new Error('No image data found (base64 is missing)');

            // 1. Prepare file info
            const filename = image.uri.split('/').pop() || 'image.jpg';
            const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg';
            const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${tenant.id}/${uniqueFilename}`;

            // 2. Convert base64 to Buffer (ArrayBuffer)
            const arrayBuffer = Buffer.from(image.base64, 'base64');

            // 3. Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: false,
                });

            if (uploadError) {
                console.error('Upload Error detailed:', uploadError);
                throw uploadError;
            }

            // 4. Get Public URL
            const { data } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return data.publicUrl;

        } catch (error: any) {
            console.error('Upload Logic Failed:', error);
            Alert.alert('Upload Failed', error.message || 'There was an error uploading your image.');
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        pickImage,
        uploadImage,
        isUploading,
    };
}

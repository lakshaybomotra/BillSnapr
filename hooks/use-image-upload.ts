import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useImageUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const tenant = useAuthStore((s) => s.tenant);

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for products/categories
            quality: 0.8,
        });

        if (!result.canceled) {
            return result.assets[0].uri;
        }
        return null;
    };

    const uploadImage = async (uri: string): Promise<string | null> => {
        try {
            setIsUploading(true);
            if (!tenant) throw new Error('No tenant found');

            // 1. Prepare file info
            const filename = uri.split('/').pop() || 'image.jpg';
            const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg';
            const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${tenant.id}/${uniqueFilename}`; // Organized by tenant

            // 2. Convert uri to blob/arraybuffer
            const response = await fetch(uri);
            const blob = await response.blob();

            // 3. Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, blob, {
                    contentType: `image/${fileExt}`,
                    upsert: false,
                });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw uploadError;
            }

            // 4. Get Public URL
            const { data } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return data.publicUrl;

        } catch (error) {
            console.error(error);
            Alert.alert('Upload Failed', 'There was an error uploading your image.');
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

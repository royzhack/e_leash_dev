import PhotoPreviewSection from '@/assets/PhotoPreviewSection';
import { AntDesign } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    Alert,
} from 'react-native';

type Props = {
    onPhotoTaken?: (photo: any) => void;
    onClose: () => void;
};

export default function Camera({ onPhotoTaken, onClose }: Props) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [photos, setPhotos] = useState<any[]>([]);
    const cameraRef = useRef<CameraView | null>(null);

    if (!permission) {
        // still loading perms
        return <View />;
    }
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center' }}>
                    We need your permission to show the camera
                </Text>
                <Button onPress={requestPermission} title="Grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    }

    const handleTakePhoto = async () => {
        if (photos.length >= 5) {
            Alert.alert('Limit reached', 'You can only add up to 5 photos.');
            return;
        }
        if (cameraRef.current) {
            const options = { quality: 1, base64: true, exif: false };
            const takenPhoto = await cameraRef.current.takePictureAsync(options);
            setPhotos((prev) => [...prev, takenPhoto]);
            if (onPhotoTaken) onPhotoTaken(takenPhoto);
            console.log('Took photo:', takenPhoto);
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <View style={styles.container}>
            {/* Preview strip */}
            {photos.length > 0 && (
                <View style={styles.previewContainer}>
                    {photos.map((photo, idx) => (
                        <View key={idx} style={styles.previewWrapper}>
                            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemovePhoto(idx)}
                            >
                                <AntDesign name="closecircle" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Camera */}
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                        <AntDesign name="retweet" size={44} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            photos.length >= 5 && styles.buttonDisabled,
                        ]}
                        onPress={handleTakePhoto}
                    >
                        <AntDesign name="camera" size={44} color="black" />
                    </TouchableOpacity>
                </View>
            </CameraView>

            {/* Bottom actions */}
            <View style={styles.bottomRow}>
                <Button
                    title={`Done (${photos.length}/5)`}
                    onPress={onClose}
                    disabled={photos.length === 0}
                />
                <Button title="Close" onPress={onClose} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    camera: { flex: 1 },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
        marginHorizontal: 10,
        backgroundColor: 'gray',
        borderRadius: 10,
        padding: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    previewContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    previewWrapper: {
        position: 'relative',
        margin: 4,
    },
    previewImage: {
        width: 60,
        height: 60,
        borderRadius: 6,
    },
    removeButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: 2,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
    },
});

import {databases, uploadfile} from '@/lib/appwrite'
import {ID} from "react-native-appwrite";
import * as FileSystem from 'expo-file-system';
import {Buffet} from '../../types'

// @ts-ignore
export async function postBuffet(level: number, locationdetails:string,  clearedby: Date, leftover: number,
                                 additionaldetails: string, userID: string, locationcoords: number[], locationname: string,
                                 photofileID: string[]): Promise<Buffet> {

    const newBuffet = {level: level, locationdetails: locationdetails, clearedby: clearedby.toISOString(),
                            leftover: leftover, additionaldetails: additionaldetails, locationname: locationname,
                            userID: userID, locationcoordslat: locationcoords[0], locationcoordslong: locationcoords[1],
                        photofileID: photofileID};

    try {
        const response = await databases.createDocument(
            process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.EXPO_PUBLIC_APPWRITE_BUFFETS_COLLECTION_ID,
            ID.unique(),
            newBuffet
        );

        // Only include fields that exist in your Buffet interface
        const buffet: Buffet = {
            $id: response.$id,
            $createdAt: response.$createdAt,
            clearedby: new Date(response.clearedby),
            leftover: response.leftover,
            additionaldetails: response.additionaldetails,
            level: response.level,
            locationdetails: response.locationdetails,
            locationname: response.locationname,
            userID: response.userID,
            locationcoordslat: response.locationcoordslat,
            locationcoordslong: response.locationcoordslong,
            photofileID: response.photofileID

            // nuslocation: response.nuslocation // Only if in your schema/interface
        };

        return buffet;
    } catch (error) {
        console.error("Failed to create buffet:", error);
        throw error;
    }
}

function getFileName(uri) {
    return uri.substring(uri.lastIndexOf('/') + 1);
}

function getMimeType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        bmp: 'image/bmp',
        webp: 'image/webp',
    };
    return mimeTypes[extension] || 'application/octet-stream';
}

async function getFileSize(uri) {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo?.size;
}

export async function supplementPhoto(photo) {
    // Ensure name
    if (!photo.name) {
        photo.name = getFileName(photo.uri);
    }
    // Ensure type
    if (!photo.type) {
        photo.type = getMimeType(photo.name);
    }
    // Ensure size (optional, but recommended)
    if (!photo.size) {
        photo.size = await getFileSize(photo.uri);
    }
    return photo;
}


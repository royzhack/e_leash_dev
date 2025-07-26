import {getBuffetRating, makeBuffet} from '@/lib/appwrite'
import {ID} from "react-native-appwrite";
import * as FileSystem from 'expo-file-system';
import {Buffet} from '../../types'

// @ts-ignore
export async function postBuffet(level: number,
                                 locationdetails:string,
                                 clearedby: Date,
                                 leftover: number,
                                 additionaldetails: string,
                                 userID: string,
                                 locationcoords: number[],
                                 locationname: string,
                                 photofileID: string[] ,
                                 userName: string): Promise<Buffet> {

    const newBuffet = {
        level: level,
        locationdetails: locationdetails,
        clearedby: clearedby.toISOString(),
        leftover: leftover,
        additionaldetails: additionaldetails,
        locationname: locationname,
        userID: userID,
        locationcoordslat: locationcoords[0],
        locationcoordslong: locationcoords[1],
        photofileID: photofileID,
        userName : userName };

    return makeBuffet(newBuffet);
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

export async function getBuffetaverageRating(buffetID) {
    try {
        const buffetRatings = await getBuffetRating(buffetID);
        const averageRating = buffetRatings.length
            ? buffetRatings.reduce((acc, item) => acc + item.rating, 0) / buffetRatings.length
            : 0;
        console.log(averageRating);
        return averageRating;
    } catch (error) {
        console.error(error);
    }
}

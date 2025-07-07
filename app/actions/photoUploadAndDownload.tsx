import {storage} from "@/lib/appwrite";
import {ID} from "react-native-appwrite";

export async function photoUpload(photo, photoID: string) {
    console.log("photo being passed into upload function", photo, photoID);
    if (!photo) {
        console.log("Photo is null");
        return null;
    }

    const file = {
        uri: photo,
        name: `${photoID}.jpg`, // or any unique name
        type: 'image/jpeg',     // or detect from the file if needed
    };

    try {
        const pic = await storage.createFile('685387bd00305b201702', photoID, file);
        console.log("photo upload function", await photoDownload(photoID));
    } catch (error) {
        console.error(error);
    }
}

export async function photoDownload(photoID: string): Promise<any> {
    if (!photoID) {
        console.log("photoID is null");
        return null;
    }
    try {
        const response = await storage.getFileDownload('685387bd00305b201702', photoID);
        return response;
    } catch (error) {
        console.error(error);
        return null;
    }
}




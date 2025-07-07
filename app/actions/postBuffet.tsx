import {databases} from '@/lib/appwrite'
import {ID} from "react-native-appwrite";

// @ts-ignore
export async function postBuffet(level: number, locationdetails:string,  clearedby: Date, leftover: number,
                                 additionaldetails: string, userID: string, locationcoords: number[], locationname: string,
                                 photoID: string): Promise<Buffet> {

    const newBuffet = {level: level, locationdetails: locationdetails, clearedby: clearedby.toISOString(),
                            leftover: leftover, additionaldetails: additionaldetails, locationname: locationname,
                            userID: userID, locationcoordslat: locationcoords[0], locationcoordslong: locationcoords[1],
                        photoID: photoID};

    try {
        const response = await databases.createDocument(
            '6842a4150011ed4c7211',
            '6842aa210006eafe1e09',
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
            photoID: response.photoID

            // nuslocation: response.nuslocation // Only if in your schema/interface
        };

        return buffet;
    } catch (error) {
        console.error("Failed to create buffet:", error);
        throw error;
    }
}
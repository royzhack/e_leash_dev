import {databases} from '@/lib/appwrite'
import {ID} from "react-native-appwrite";

// @ts-ignore
export async function postBuffet(level: number, locationdetails:string,  clearedby: Date, leftover: number,
                                 additionaldetails: string): Promise<Buffet> {
    const newBuffet = {level: level, locationdetails: locationdetails, clearedby: clearedby.toISOString(),
                            leftover: leftover, additionaldetails: additionaldetails};

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
            // buffetpics: response.buffetpics, // Only if in your schema/interface
            // nuslocation: response.nuslocation // Only if in your schema/interface
        };

        return buffet;
    } catch (error) {
        console.error("Failed to create buffet:", error);
        throw error;
    }
}
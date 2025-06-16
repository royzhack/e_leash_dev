import {databases} from '@/lib/appwrite'
import {ID} from "react-native-appwrite";

export async function postBuffet(buffetpics:URL, nuslocation: NUSLocation,
                                level: number, leftover: number, clearedby: string,
                                 additionaldetails: string): Promise<Buffet> {
    const newBuffet = {}

    const response = await databases.createDocument( //(databaseid, collection id, instanceid, object)
    '6842a4150011ed4c7211',
        '6842aa210006eafe1e09',
        ID.unique(),
        newBuffet )

    const buffet = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        clearedby: response.clearedby,
        leftover: response.leftover,
        additionaldetails: response.additionaldetails,
        buffetpics: response.buffetpics,
        nuslocation: response.nuslocation,
        level:response.level
    }
    return buffet
}
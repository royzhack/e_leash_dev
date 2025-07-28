
import {
    Avatars,
    Account,
    Client,
    OAuthProvider, Databases, Query, Storage, ID,
} from "react-native-appwrite" //add databases
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";
import { makeRedirectUri } from 'expo-auth-session';
import {Buffet, Rating} from "@/types";

export const config = {
    platform: 'com.roy.wasteless',
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    buffetcollectionID: process.env.EXPO_PUBLIC_APPWRITE_BUFFETS_COLLECTION_ID,
    deletedBuffetcollectionID: process.env.EXPO_PUBLIC_APPWRITE_DELETEDBUFFETS_COLLECTION_ID,
    ratingscollectionID: process.env.EXPO_PUBLIC_APPWRITE_RATINGS_COLLECTION_ID,
    bucketID: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID
}

console.log(config)


export const client = new Client()

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectID!)
    .setPlatform(config.platform!)

export const avatar = new Avatars(client)
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)


//user and auth functions
export async function login() {
    try {
        const redirectUri =  `appwrite-callback-${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}://project-callback`;


        console.log("Redirect URI:", redirectUri);
        const response = await account.createOAuth2Token(
            OAuthProvider.Google,
            redirectUri
        );
        if (!response) throw new Error("Create OAuth2 token failed");

        const browserResult = await openAuthSessionAsync(
            response.toString(),
            redirectUri
        );
        if (browserResult.type !== "success")
            throw new Error("Create OAuth2 token failed");

        const url = new URL(browserResult.url);
        console.log("URL", url);
        const secret = url.searchParams.get("secret")?.toString();
        console.log("Secretlog", secret);
        const userId = url.searchParams.get("userId")?.toString();
        console.log("UserID", userId);
        if (!secret || !userId) throw new Error("Create OAuth2 token failed");

        const session = await account.createSession(userId, secret);
        if (!session) throw new Error("Failed to create session");

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function logout() {
    try {
        const result = await account.deleteSession("current");
        return result;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getCurrentUser() {
    try {
        const result = await account.get();
        if (result.$id) {
            const userAvatar = avatar.getInitials(result.name);

            return {
                ...result,
                avatar: userAvatar.toString(),
            };
        }

        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

//buffet functions
export async function makeBuffet(newbuffet: Buffet) {
    try {
        const response = await databases.createDocument(
            config.databaseId!,
            config.buffetcollectionID!,
            ID.unique(),
            newbuffet
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
            photofileID: response.photofileID ,
            userName: response.userName,
            isHalal: response.isHalal,
            isVeg: response.isVeg,
            isBeef: response.isBeef,

            // nuslocation: response.nuslocation // Only if in your schema/interface
        };

        return buffet;
    } catch (error) {
        console.error("Failed to create buffet:", error);
        throw error;
    }
}

export async function getLatestBuffets() {
    try{
        const result = await databases.listDocuments(
            config.databaseId!,
            config.buffetcollectionID!,
            [Query.orderAsc('clearedby'),
                Query.limit(30)]
        )
        return result.documents;

    }catch(error){
        console.error(error)
        return [];
    }
}

export async function getUsersBuffets(userID) {
    try {
        const result = await databases.listDocuments(
            config.databaseId!,
            config.buffetcollectionID!,
            [Query.equal('userID', userID)]
        );
        return result.documents;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getUsersDeletedBuffets(userID) {
    try {
        const result = await databases.listDocuments(
            config.databaseId!,
            config.deletedBuffetcollectionID!,
            [Query.equal('userID', userID)]
        );
        return result.documents;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function uploadfile(file, fileID) {
    try {
        const result = await storage.createFile(
            config.bucketID, // bucketId
            fileID, // fileID
            file // file
        );

        console.log(result);
    } catch(error) {
        console.error(error);
    }
}

export async function deleteBuffet (buffetID: string) {
    try {
        const result = await databases.deleteDocument(
            config.databaseId!,
            config.buffetcollectionID!,
            buffetID
        )
        console.log("Buffet deleted", result);
        return;
    } catch (error) {
        console.error(error);
    }
}

export async function updateBuffet (leftover: number, buffetID: string) {
    try {
        const response = await databases.updateDocument(
            config.databaseId,
            config.buffetcollectionID,
            buffetID,
            {leftover: leftover}
        );
        console.log(response);
    } catch(error) {
        console.error(error);
    }
}

export async function updateFullBuffet (buffet, buffetID) {
    try {
        const response = await databases.updateDocument(
            config.databaseId,
            config.buffetcollectionID,
            buffetID,
            buffet);
    } catch(error) {
        console.error(error);
    }
}

//ratings functions

export async function makeRating(newrating: Rating) {
    try {
        const response = await databases.createDocument(
            config.databaseId!,
            config.ratingscollectionID!,
            ID.unique(),
            newrating
        );

        const rating = response.rating;

        return rating;

    } catch(error) {
        console.error(error);
    }
}

export async function getBuffetRating(buffetID: string) {
    try {
        const result = await databases.listDocuments(
            config.databaseId!,
            config.ratingscollectionID!,
            [
                Query.equal('buffetID', buffetID)
            ]
        );

        return result.documents;
    } catch(error) {
        console.error(error);
    }
}

export async function checkUserRating(userID, buffetID) {
    try {
        const result = await databases.listDocuments(
            config.databaseId!,
            config.ratingscollectionID!,
            [
                Query.and([
                    Query.equal('userID', userID),
                    Query.equal('buffetID', buffetID)
                ])
            ]
            );

        return result.documents
    } catch(error) {
        console.error(error);
    }
}

// Get the current user's name
export async function getUserName(userId) {
    try {
        const user = await account.get();  // This fetches the logged-in user
        return user.name || user.email || 'Anonymous';
    } catch (error) {
        console.error("Error fetching user name:", error);
        return 'Anonymous';
    }
}

export async function postRating(newRating) {
    try {
        const response = await databases.createDocument(
            config.databaseId!,
            config.ratingscollectionID!,
            ID.unique(),
            newRating  // This now includes userName
        );

        return response;
    } catch (error) {
        console.error(error);
    }
}










import {
    Avatars,
    Account,
    Client,
    OAuthProvider,
    Databases,
    Query
} from "react-native-appwrite" //add databases
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";
import * as querystring from "node:querystring";
export const config = {
    platform : 'com.roy.wasteless',
    endpoint : 'https://cloud.appwrite.io/v1',
    projectID: "6837256a001912254094",
    databaseId: '6842a4150011ed4c7211',
    buffetcollectionID: '6842aa210006eafe1e09'
}

export const client = new Client()

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectID!)
    .setPlatform(config.platform!)

export const avatar = new Avatars(client)
export const account = new Account(client)
export const databases = new Databases(client)


export async function login() {
    try {
        const redirectUri = Linking.createURL("/(root)/(tabs)/profile")
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
        const secret = url.searchParams.get("secret")?.toString();
        const userId = url.searchParams.get("userId")?.toString();
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

export async function getLatestBuffets() {
  try{
      const result = await databases.listDocuments(
          config.databaseId!,
          config.buffetcollectionID!,
          [Query.orderAsc('clearedby'),
          Query.limit(10)]
      )
      return result.documents;

  }catch(error){
      console.error(error)
      return [];
  }

}
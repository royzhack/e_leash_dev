import {makeRating} from "@/lib/appwrite";

export async function postRating(rating: number, comments: string, buffetID: string, userID: string) {
    const newRating = {
        rating: rating,
        comments: comments,
        buffetID: buffetID,
        userID: userID,
    }

    return makeRating(newRating);
}

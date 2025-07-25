
export default interface Buffet {
    $id?: string
    $createdAt?: string
    clearedby: Date
    leftover: number
    additionaldetails: string
    level: number
    locationdetails: string
    locationname: string
    userID: string
    locationcoordslat: number
    locationcoordslong: number
    photofileID: string[]
    distance?: number
    userName: string
}

export type Rating = {
    $id?: string
    $createdAt?: string
    rating: number
    comments?: string
    buffetID: string
    userID: string
}

export type UserLocation = {
    latitude: number;
    longitude: number;
};

// declare module '*.geojson' {
//     const value: any;
//     export default value;
// }


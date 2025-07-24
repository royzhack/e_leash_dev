
export default interface Buffet {
    $id: string
    $createdAt: string
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
    uri : string[]; // Add this line to store the image URL (uri)
}

export type UserLocation = {
    latitude: number;
    longitude: number;
};

// declare module '*.geojson' {
//     const value: any;
//     export default value;
// }


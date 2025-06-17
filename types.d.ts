interface Buffet {
    $id: string
    $createdAt: string
    clearedby: Date
    leftover: number
    additionaldetails: string
    buffetpics: string
    nuslocation: NUSLocation
    level: number
    locationdetails: string
}

interface NUSLocation {
    $id: string
    $createdAt: string
    latitude: number
    longitude: number
    name:string
    buffets: Buffet[]
}
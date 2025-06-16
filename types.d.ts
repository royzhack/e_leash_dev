interface Buffet {
    $id: string
    $createdAt: string
    clearedby: string
    leftover: number
    additionaldetails: string
    buffetpics: URL
    nuslocation: NUSLocation
    level: number
}

interface NUSLocation {
    $id: string
    $createdAt: string
    latitude: number
    longitude: number
    name:string
    buffets: string
}
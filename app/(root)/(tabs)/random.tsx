import { storage } from '@/lib/appwrite'; // your Appwrite config file

const BUCKET_ID = '685387bd00305b201702';
const FILE_ID = '6878fc38003a1df6e853'; // this comes from your DB

const imageUrl = storage.getFilePreview(BUCKET_ID, FILE_ID).href;

<img src={imageUrl} alt="Buffet Image" />;

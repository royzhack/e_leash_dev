const { Client, Databases, Query } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const BUFFET_COL = process.env.BUFFET_COLLECTION;
const DELETED_COL = process.env.DELETED_COLLECTION;

/**
 * Appwrite Function Handler
 * Scans 'buffets' collection for items whose 'clearedby' time is more than 30 minutes in the past,
 * archives them into 'deletedBuffets', and deletes the originals.
 */
module.exports = async function (req, res) {
    try {
        // 1. Calculate cutoff timestamp (30 minutes ago)
        const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        // 2. Fetch expired buffets
        const expired = await databases.listDocuments(
            BUFFET_COL,
            [],
            [Query.lessThan('clearedby', cutoff)]
        );

        // 3. For each expired buffet, archive then delete
        for (const doc of expired.documents) {
            // 3a. Archive copy
            await databases.createDocument(
                DELETED_COL,
                'unique()',      // auto-generate a new ID
                { ...doc },      // copy all fields
                ['*'], ['*']     // permissions (adjust as needed)
            );

            // 3b. Delete original
            await databases.deleteDocument(BUFFET_COL, doc.$id);
        }

        // 4. Return success
        return res.json({ success: true, deletedCount: expired.documents.length });
    } catch (error) {
        console.error("[BuffetCleaner] Error:", error);
        return res.json({ success: false, error: error.message });
    }
};

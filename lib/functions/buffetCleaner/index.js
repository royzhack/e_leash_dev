const { Client, Databases, Query } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_FUNCTION_API_KEY); // Use the dynamic API key

const databases = new Databases(client);
const BUFFET_COL = process.env.BUFFET_COLLECTION;
const DELETED_COL = process.env.DELETED_COLLECTION;

/**
 * Handler for the BuffetCleaner function.
 * Scans for documents in 'buffets' where `clearedby` is more than 30 minutes ago,
 * copies each to `deletedBuffets`, and then deletes the original.
 */
module.exports = async function (context) {
  try {
    // 1. Calculate cutoff timestamp (30 minutes ago)
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // 2. Fetch expired buffets
    const expired = await databases.listDocuments(
      BUFFET_COL,
      [], // no filters on IDs
      [Query.lessThan('clearedby', cutoff)]
    );

    // 3. Archive & delete each
    for (const doc of expired.documents) {
      // 3a. Copy into deletedBuffets
      await databases.createDocument(
        DELETED_COL,
        'unique()',    // generate new ID
        { ...doc },    // preserve all fields
        ['*'], ['*']   // adjust permissions as needed
      );
      // 3b. Remove from buffets
      await databases.deleteDocument(BUFFET_COL, doc.$id);
    }

    // 4. Return JSON response
    return context.res.json({
      success: true,
      deletedCount: expired.documents.length,
    });
  } catch (error) {
    context.log.error('BuffetCleaner error:', error);
    return context.res.json(
      { success: false, message: error.message },
      500
    );
  }
};

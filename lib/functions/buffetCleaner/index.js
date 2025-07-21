const { Client, Databases, Query } = require('node-appwrite');

// Init client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)          // e.g. https://cloud.appwrite.io/v1
  .setProject(process.env.APPWRITE_PROJECT)            // your project ID
  .setKey(process.env.APPWRITE_FUNCTION_API_KEY);      // function’s API key

const databases  = new Databases(client);
const DB_ID      = process.env.DATABASE_ID;            // newly added
const BUFFET_COL = process.env.BUFFET_COLLECTION;      // your buffets collection ID
const DEL_COL    = process.env.DELETED_COLLECTION;     // your deletedBuffets collection ID

module.exports = async function (context) {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Pass (databaseId, collectionId, queries)
    const expired = await databases.listDocuments(
      DB_ID,
      BUFFET_COL,
      [ Query.lessThan('clearedby', cutoff) ]
    );

    for (const doc of expired.documents) {
      await databases.createDocument(
        DB_ID,
        DEL_COL,
        'unique()',
        { ...doc },
        ['*'], ['*']
      );
      await databases.deleteDocument(DB_ID, BUFFET_COL, doc.$id);
    }

    return context.res.json({
      success: true,
      deletedCount: expired.documents.length
    });
  } catch (err) {
    context.error('BuffetCleaner error:', err);
    return context.res.json({ success: false, message: err.message }, 500);
  }
};

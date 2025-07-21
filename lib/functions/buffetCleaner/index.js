// index.js
const { Client, Databases, Query } = require('node-appwrite');

// Init Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)       // e.g. https://cloud.appwrite.io/v1
  .setProject(process.env.APPWRITE_PROJECT)         // your project ID
  .setKey(process.env.APPWRITE_FUNCTION_API_KEY);   // the API key you set in env-vars

const databases = new Databases(client);
const BUFFET_COL  = process.env.BUFFET_COLLECTION;
const DELETED_COL = process.env.DELETED_COLLECTION;

module.exports = async function (context) {
  try {
    // 30 minutes ago
    const cutoff = new Date(Date.now() - 30*60*1000).toISOString();

    // 1) Find expired buffets
    const expired = await databases.listDocuments(
      BUFFET_COL,
      [], // no document IDs filter
      [ Query.lessThan('clearedby', cutoff) ]
    );

    // 2) Archive + delete
    for (const doc of expired.documents) {
      await databases.createDocument(
        DELETED_COL,
        'unique()',
        { ...doc },
        ['*'], ['*']
      );
      await databases.deleteDocument(BUFFET_COL, doc.$id);
    }

    // 3) Return JSON
    return context.res.json({ success: true, deletedCount: expired.documents.length });
  } catch (err) {
    context.log.error('BuffetCleaner error:', err);
    return context.res.json({ success: false, message: err.message }, 500);
  }
};

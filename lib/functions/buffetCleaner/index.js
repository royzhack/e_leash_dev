const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

const databases = new Databases(client);
const BUFFET_COL  = process.env.BUFFET_COLLECTION;
const DELETED_COL = process.env.DELETED_COLLECTION;

module.exports = async function (context) {
  try {
    // 30 minutes ago
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // 1) Fetch expired buffets
    const expired = await databases.listDocuments(
      BUFFET_COL,
      [],
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

    // 3) Return success JSON
    return context.res.json({ success: true, deletedCount: expired.documents.length });
  } catch (err) {
    // Correct error logging
    context.error('BuffetCleaner error:', err);
    return context.res.json(
      { success: false, message: err.message },
      500
    );
  }
};

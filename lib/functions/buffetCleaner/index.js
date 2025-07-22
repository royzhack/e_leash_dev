const { Client, Databases, Query, Permission, Role } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()

  .setEndpoint('https://cloud.appwrite.io/v1')             // your endpoint
  .setProject('6837256a001912254094')                      // your project ID
  .setKey('standard_4d2b8502ce52c331913fbc1da66da74d684970ff924d063f1cecae91fd6d3ff383b0045e5e1127196ec37d4c03dd966390e934b3770cd060e4005f8f6cc1320fd9d53a5b403075173b9890f411ef82f62f1eb1b07e3c455fd5f80fd0e4b4bd6ed42d2e0bb7e6423a7e92def3c522a797ccbb03c4c5907b8721fc1cc33d1c266c') // your function API key

const databases    = new Databases(client);
const DATABASE_ID  = '6842a4150011ed4c7211';      // your buffets DB
const BUFFET_COL   = '6842aa210006eafe1e09';      // your buffets collection
const DELETED_COL  = '687e300e00199e458d7c';      // your deletedBuffets collection

module.exports = async function (context) {

  try {
    // 30 minutes ago cutoff
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // 1) Fetch expired buffets
    const expired = await databases.listDocuments(
      DATABASE_ID,
      BUFFET_COL,
      [ Query.lessThan('clearedby', cutoff) ]
    );

    // 2) Archive & delete for each expired buffet
    for (const doc of expired.documents) {
      // Archive into deletedBuffets with selected fields
      await databases.createDocument(
        DATABASE_ID,
        DELETED_COL,
        'unique()',     // auto-generated ID
        {
          additionaldetails: doc.additionaldetails || '',
          level: doc.level,
          locationdetsails: doc.locationdetails || '',
          clearedby: doc.clearedby,
          locationname: doc.locationname,
          userID: doc.userID,
          photofileID: doc.photofileID || []
        },
        [
          Permission.read(Role.any())  // Anyone can view archived buffet
        ],
        [
          Permission.write(Role.any()) // Anyone can write to archived buffet
        ]
      );
      // Remove from live buffets
      await databases.deleteDocument(
        DATABASE_ID,
        BUFFET_COL,
        doc.$id
      );
    }

    // Return success
    return context.res.json({
      success: true,
      deletedCount: expired.documents.length
    });
  } catch (err) {
    // Log and return error
    context.error('BuffetCleaner error:', err);
    return context.res.json({ success: false, message: err.message }, 500);
  }
};
=======
    try {
        // 30 minutes ago cutoff
        const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        // 1) Fetch expired buffets
        const expired = await databases.listDocuments(
            DATABASE_ID,
            BUFFET_COL,
            [ Query.lessThan('clearedby', cutoff) ]
        );

        // 2) Archive & delete for each expired buffet
        for (const doc of expired.documents) {
            // Archive into deletedBuffets with selected fields
            await databases.createDocument(
                DATABASE_ID,
                DELETED_COL,
                'unique()',     // auto-generated ID
                {
                    additionaldetails: doc.additionaldetails || '',
                    level: doc.level,
                    locationdetsails: doc.locationdetails || '',
                    clearedby: doc.clearedby,
                    locationname: doc.locationname,
                    userID: doc.userID,
                    photofileID: doc.photofileID || []
                },
                [
                    Permission.read(Role.any())  // Anyone can view archived buffet
                ],
                [
                    Permission.write(Role.any()) // Anyone can write to archived buffet
                ]
            );
            // Remove from live buffets
            await databases.deleteDocument(
                DATABASE_ID,
                BUFFET_COL,
                doc.$id
            );
        }

        // Return success
        return context.res.json({
            success: true,
            deletedCount: expired.documents.length
        });
    } catch (err) {
        // Log and return error
        context.error('BuffetCleaner error:', err);
        return context.res.json({ success: false, message: err.message }, 500);
    }
};
>>>>>>> 7a45903 (updated ui of post and home)

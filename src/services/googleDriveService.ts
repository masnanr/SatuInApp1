import { google } from 'googleapis';
import stream from 'stream';

/**
 * SERVICE_ACCOUNT_KEY should be provided in environment or as a file
 * For this app, we'll assume the user provides a service account JSON content in env
 */
export async function uploadToDrive(fileName: string, buffer: Buffer, mimeType: string, targetFolderId?: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const folderId = targetFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: 'id, webViewLink',
    });

    // Make the file publicly viewable if requested
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    throw error;
  }
}

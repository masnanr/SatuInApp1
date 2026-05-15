import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateReportPDF } from './src/services/pdfService';
import { uploadToDrive } from './src/services/googleDriveService';

dotenv.config();

let db: any;

const app = express();
const PORT = 3000;

// Export app for serverless environments (like Vercel)
export default app;

async function initFirebase() {
  // Load config with fallback for Vercel
  let firebaseConfig: any = {};
  try {
    const config = await import('./firebase-applet-config.json', { with: { type: 'json' } });
    firebaseConfig = config.default;
  } catch (e) {
    console.log('Using environment variables for Firebase configuration');
    firebaseConfig = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '(default)'
    };
  }

  // Initialize Firebase Admin
  if (!getApps().length) {
    const adminConfig: any = {
      projectId: firebaseConfig.projectId
    };
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      adminConfig.credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    }
    
    console.log('Initializing Admin Project:', adminConfig.projectId);
    initializeApp(adminConfig);
  }

  // Access the specific database
  const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') 
    ? firebaseConfig.firestoreDatabaseId 
    : undefined;

  db = getFirestore(dbId);

  // Log configuration on startup
  console.log('Firebase Initialization:', {
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    envProject: process.env.GOOGLE_CLOUD_PROJECT || 'not set'
  });
}

// Global initialization
initFirebase().catch(err => console.error('Firebase init failed:', err));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes
app.get('/api/health', async (req, res) => {
    try {
      // Test Firestore connection
      const testDoc = await db.collection('_health_check').doc('ping').get();
      res.json({ 
        status: 'ok', 
        firestore: 'connected',
        databaseId: firebaseConfig.firestoreDatabaseId 
      });
    } catch (error: any) {
      console.error('Health Check Firestore Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: error.message,
        code: error.code,
        details: error.details || 'no details',
        stack: error.stack
      });
    }
  });

  // Report Submission Endpoint
  app.post('/api/reports/submit', async (req, res) => {
    const { reportData, attachment } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ success: false, error: 'Missing report data' });
    }

    try {
      // 1. Generate PDF
      const pdfBytes = await generateReportPDF(reportData);
      
      // 2. Fetch target folder
      let targetFolderId = undefined;
      if (reportData.user_id) {
        const userDoc = await db.collection('users').doc(reportData.user_id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          targetFolderId = userData?.gdrive_folder_id;
        }
      }

      // If user folder is missing, try global config from Firestore
      if (!targetFolderId) {
        const configDoc = await db.collection('config').doc('google_drive').get();
        if (configDoc.exists) {
          targetFolderId = configDoc.data()?.folder_id;
        }
      }

      // 3. Upload PDF to GDrive
      const pdfFileName = `Report_${reportData.userName}_${reportData.tanggal}.pdf`;
      let gdriveLink = '';
      try {
        const uploadResult = await uploadToDrive(pdfFileName, Buffer.from(pdfBytes), 'application/pdf', targetFolderId);
        gdriveLink = uploadResult.webViewLink || '';
      } catch (uploadError) {
        console.error('GDrive PDF upload failed:', uploadError);
      }

      // 4. Upload Attachment if exists
      let attachmentLink = '';
      if (attachment && attachment.data) {
        try {
          const attachmentFileName = `Bukti_${reportData.userName}_${reportData.tanggal}_${attachment.name}`;
          const attachmentResult = await uploadToDrive(
             attachmentFileName, 
             Buffer.from(attachment.data, 'base64'), 
             attachment.type || 'application/octet-stream',
             targetFolderId
          );
          attachmentLink = attachmentResult.webViewLink || '';
        } catch (attachError) {
          console.error('GDrive attachment upload failed:', attachError);
        }
      }

      // 5. Save to Firestore
      const reportRef = db.collection('reports').doc();
      await reportRef.set({
        ...reportData,
        pdf_link: gdriveLink,
        attachment_link: attachmentLink,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });


      res.status(200).json({ 
        success: true, 
        message: 'Report processed and saved',
        reportId: reportRef.id,
        pdfLink: gdriveLink
      });
    } catch (error: any) {
      console.error('Report submission error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // KeepUp Automation Endpoint
  app.post('/api/keepup/sync', async (req, res) => {
    // Placeholder for actual Playwright call
    res.json({ success: true, message: 'Sync started' });
  });

// Setup static files and Vite
const setupServer = async () => {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only start listening if not in a serverless environment like Vercel
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`SatuInApp Server running status:
      - Mode: ${process.env.NODE_ENV || 'development'}
      - URL: http://localhost:${PORT}`);
    });
  }
};

setupServer().catch(err => console.error('Server setup failed:', err));

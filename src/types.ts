export interface User {
  id: string;
  name: string;
  email: string;
  google_id: string;
  avatar: string;
  role: 'admin' | 'user';
  gdrive_folder_id?: string;
}

export interface Team {
  id: string;
  nama_tim: string;
}

export interface Activity {
  id: string;
  team_id: string;
  nama_kegiatan: string;
}

export interface SubActivity {
  id: string;
  activity_id: string;
  nama_subkegiatan: string;
}

export interface TeamUser {
  user_id: string;
  team_id: string;
}

export interface Report {
  id: string;
  user_id: string;
  team_id: string;
  activity_id: string;
  sub_activity_id: string;
  tanggal: string;
  jam: string;
  penjelasan: string;
  bukti_file: string; // URL to storage
  pdf_link: string;   // Google Drive URL
  created_at: any;    // Firestore Timestamp
}

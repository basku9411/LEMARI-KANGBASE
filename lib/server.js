import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

let initialized = false;
export function services(){
  if(!initialized){
    const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if(!raw) throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT_JSON belum diatur di Vercel.'),{status:500});
    let serviceAccount;
    try { serviceAccount=JSON.parse(raw); } catch { throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT_JSON bukan JSON yang valid.'),{status:500}); }
    if(!admin.apps.length) admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
    initialized=true;
  }
  if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET) throw Object.assign(new Error('Konfigurasi Cloudinary server belum lengkap.'),{status:500});
  cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true});
  return {admin,db:admin.firestore(),cloudinary};
}
export async function requireUser(req,{allowPending=false}={}){
  const {admin,db,cloudinary}=services();
  const header=req.headers.authorization||'';
  if(!header.startsWith('Bearer ')) throw Object.assign(new Error('Silakan login kembali.'),{status:401});
  let decoded;
  try { decoded=await admin.auth().verifyIdToken(header.slice(7),true); }
  catch { throw Object.assign(new Error('Sesi login tidak valid. Silakan login kembali.'),{status:401}); }
  const uid=decoded.uid; const owner=!!process.env.ADMIN_UID&&uid===process.env.ADMIN_UID;
  const snap=await db.doc(`users/${uid}`).get();
  const status=snap.exists?snap.data().status:null;
  if(!owner && status!=='approved' && !(allowPending && status==='pending')) throw Object.assign(new Error('Akun belum disetujui atau tidak memiliki akses.'),{status:403});
  return {uid,owner,db,cloudinary,status,admin};
}
export function sendError(res,error){res.status(error.status||500).json({error:error.message||'Terjadi kesalahan server.'});}

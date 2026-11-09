import {requireUser,sendError} from '../lib/server.js';
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Metode tidak diizinkan.'});
 try{
  const {uid,db,cloudinary}=await requireUser(req);
  const {itemId}=req.body||{};
  if(!itemId) return res.status(400).json({error:'ID file tidak ada.'});
  const snap=await db.doc(`users/${uid}/items/${itemId}`).get();
  if(!snap.exists) return res.status(404).json({error:'File tidak ditemukan.'});
  const item=snap.data();
  if(!item.publicId) return res.status(404).json({error:'File ini belum memakai penyimpanan Cloudinary.'});
  const url=cloudinary.utils.private_download_url(item.publicId,item.format||'jpg',{resource_type:item.resourceType||'image',type:'authenticated',expires_at:Math.floor(Date.now()/1000)+300});
  res.status(200).json({url,expiresIn:300});
 }catch(e){sendError(res,e)}
}

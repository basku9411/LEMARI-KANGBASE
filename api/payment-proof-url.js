import {requireUser,sendError} from '../lib/server.js';
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Metode tidak diizinkan.'});
 try{
  const {uid,owner,db,cloudinary}=await requireUser(req);
  const {userId}=req.body||{};
  if(!userId||(!owner&&uid!==userId)) return res.status(403).json({error:'Tidak memiliki izin.'});
  const snap=await db.doc(`users/${userId}`).get();
  if(!snap.exists||!snap.data().paymentProofPublicId) return res.status(404).json({error:'Bukti pembayaran tidak ditemukan.'});
  const d=snap.data();
  const url=cloudinary.utils.private_download_url(d.paymentProofPublicId,d.paymentProofFormat||'jpg',{resource_type:d.paymentProofResourceType||'image',type:'authenticated',expires_at:Math.floor(Date.now()/1000)+300});
  res.status(200).json({url,expiresIn:300});
 }catch(e){sendError(res,e)}
}

import {requireUser,sendError} from '../lib/server.js';
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Metode tidak diizinkan.'});
 try{const {uid,db,cloudinary}=await requireUser(req);const {itemId}=req.body||{};const ref=db.doc(`users/${uid}/items/${itemId}`);const snap=await ref.get();if(!snap.exists) return res.status(404).json({error:'File tidak ditemukan.'});const d=snap.data();if(d.publicId) await cloudinary.uploader.destroy(d.publicId,{resource_type:d.resourceType||'image',type:'authenticated',invalidate:true});res.status(200).json({ok:true});
 }catch(e){sendError(res,e)}
}

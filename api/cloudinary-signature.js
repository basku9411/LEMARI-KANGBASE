import {requireUser,sendError} from '../lib/server.js';
export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Metode tidak diizinkan.'});
 try{
  const {uid,cloudinary,status}=await requireUser(req,{allowPending:true});
  const requestedFolder=(req.body||{}).folder;
  const allowed=requestedFolder===`users/${uid}` || requestedFolder===`payment-proofs/${uid}`;
  if(!allowed || (status==='pending' && requestedFolder!==`payment-proofs/${uid}`)) return res.status(403).json({error:'Folder upload tidak diizinkan.'});
  const timestamp=Math.floor(Date.now()/1000);
  const params={folder:requestedFolder,timestamp,type:'authenticated'};
  const signature=cloudinary.utils.api_sign_request(params,process.env.CLOUDINARY_API_SECRET);
  res.status(200).json({cloudName:process.env.CLOUDINARY_CLOUD_NAME,apiKey:process.env.CLOUDINARY_API_KEY,params,signature});
 }catch(e){sendError(res,e)}
}

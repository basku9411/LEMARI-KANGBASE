import {requireUser,sendError} from '../lib/server.js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Metode tidak diizinkan.'});
  let targetRef=null, oldData=null, admin=null, memberUid=null, authChanged=false;
  try{
    const services=await requireUser(req);
    const {uid,owner,db}=services;
    admin=services.admin;
    if(!owner) return res.status(403).json({error:'Hanya pemilik AMAN AJA yang boleh mengubah status anggota.'});
    const body=req.body||{};
    memberUid=body.memberUid;
    const action=body.action;
    if(typeof memberUid!=='string'||!memberUid.trim()) return res.status(400).json({error:'ID anggota tidak valid.'});
    if(memberUid===uid) return res.status(400).json({error:'Status akun pemilik tidak dapat diubah dari menu anggota.'});
    if(!['activate','disable','reject'].includes(action)) return res.status(400).json({error:'Perintah perubahan status tidak dikenal.'});
    targetRef=db.doc(`users/${memberUid}`);
    const snap=await targetRef.get();
    if(!snap.exists) return res.status(404).json({error:'Data anggota tidak ditemukan.'});
    oldData=snap.data();
    const authUser=await admin.auth().getUser(memberUid);
    const now=admin.firestore.FieldValue.serverTimestamp();

    if(action==='disable'){
      if(oldData.status==='disabled'&&authUser.disabled) return res.status(200).json({ok:true,status:'disabled',message:'Anggota sudah nonaktif.'});
      await targetRef.update({status:'disabled',statusBeforeDisabled:oldData.status||'pending',disabledAt:now,updatedAt:now,updatedBy:uid});
      try{
        await admin.auth().updateUser(memberUid,{disabled:true});
        authChanged=true;
        await admin.auth().revokeRefreshTokens(memberUid);
      }catch(authError){
        // Compensate both systems if Authentication only completed partially.
        if(authChanged){
          try{await admin.auth().updateUser(memberUid,{disabled:!!authUser.disabled});await admin.auth().revokeRefreshTokens(memberUid);}catch(rollbackAuthError){
            throw Object.assign(new Error(`Status Firestore sudah dikunci, tetapi pemulihan Firebase Authentication gagal. Hubungi administrator: ${rollbackAuthError.message}`),{status:502});
          }
        }
        await targetRef.update({status:oldData.status||'pending',statusBeforeDisabled:admin.firestore.FieldValue.delete(),disabledAt:admin.firestore.FieldValue.delete(),updatedAt:now});
        throw Object.assign(new Error(`Firebase Authentication gagal menonaktifkan akun: ${authError.message}`),{status:502});
      }
      return res.status(200).json({ok:true,status:'disabled',message:'Anggota berhasil dinonaktifkan. File tetap tersimpan.'});
    }

    if(action==='activate'){
      await admin.auth().updateUser(memberUid,{disabled:false});
      authChanged=true;
      try{
        await admin.auth().revokeRefreshTokens(memberUid);
        await targetRef.update({status:'approved',statusBeforeDisabled:admin.firestore.FieldValue.delete(),disabledAt:admin.firestore.FieldValue.delete(),reviewedAt:now,reviewedBy:uid,updatedAt:now,updatedBy:uid});
      }catch(error){
        try{await admin.auth().updateUser(memberUid,{disabled:true});await admin.auth().revokeRefreshTokens(memberUid);}catch(rollbackAuthError){
          throw Object.assign(new Error(`Pengaktifan gagal dan pemulihan Authentication juga gagal. Akun mungkin masih terkunci; hubungi administrator: ${rollbackAuthError.message}`),{status:502});
        }
        authChanged=false;
        throw error;
      }
      return res.status(200).json({ok:true,status:'approved',message:'Anggota berhasil diaktifkan.'});
    }

    await targetRef.update({status:'rejected',reviewedAt:now,reviewedBy:uid,updatedAt:now,updatedBy:uid});
    return res.status(200).json({ok:true,status:'rejected',message:'Pendaftaran anggota ditolak.'});
  }catch(error){
    sendError(res,error);
  }
}

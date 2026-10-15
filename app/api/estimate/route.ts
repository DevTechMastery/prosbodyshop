import {NextRequest,NextResponse} from 'next/server';
import {Resend} from 'resend';
import {estimateSchema,escapeHtml} from '@/lib/estimate';
import {parseEstimateRequest,EstimateInputError} from '@/lib/estimate-request';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 if(origin && origin!==req.nextUrl.origin) return NextResponse.json({message:'Request origin not allowed.'},{status:403});
 let parsed:Awaited<ReturnType<typeof parseEstimateRequest>>;
 try{parsed=await parseEstimateRequest(req)}catch(error){return NextResponse.json({message:error instanceof EstimateInputError?error.message:'Could not read the request.'},{status:error instanceof EstimateInputError?error.status:400})}
 const {body,attachments}=parsed;
 const result=estimateSchema.safeParse(body);
 if(!result.success)return NextResponse.json({message:'Please check the required fields.',errors:result.error.flatten().fieldErrors},{status:400});
 const data=result.data;
 const timestamp=new Date().toISOString();
 if(!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL){
  if(process.env.NODE_ENV==='development'||process.env.ESTIMATE_DEMO_MODE==='true'){
   console.info('[ESTIMATE DEVELOPMENT ONLY — EMAIL NOT SENT]',{...data,submittedAt:timestamp,photos:attachments.map(({filename,content})=>({filename,bytes:content.length}))});
   return NextResponse.json({delivered:false,development:true,message:'Development mode: your request was logged on the server, but no email was sent. Please call (626) 444-8308 to contact the shop.'},{status:202});
  }
  return NextResponse.json({message:'Online requests are not available yet. Please call (626) 444-8308. Your request has not been sent.'},{status:503});
 }
 const rows=[['Customer Name',data.name],['Phone',data.phone],['Email',data.email],['Vehicle',`${data.year} ${data.make} ${data.model}`],['Damage Area',data.damage],['Description',data.description],['Photos attached',String(attachments.length)],['Submitted (UTC)',timestamp]];
 try{
 const {error}=await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.FROM_EMAIL,to:process.env.ESTIMATE_EMAIL||'prosbodyshop@gmail.com',replyTo:data.email,attachments:attachments.map(({filename,content,contentType})=>({filename,content:content.toString('base64'),contentType})),subject:`New Estimate Request — ${data.year} ${data.make} ${data.model} — ${data.damage}`,text:rows.map(([k,v])=>`${k}: ${v}`).join('\n\n'),html:`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h1 style="border-top:5px solid #f23a18;padding-top:24px">New estimate request</h1><p>Pro’s Body Shop &amp; Paint</p><table style="width:100%;border-collapse:collapse">${rows.map(([k,v])=>`<tr><th style="text-align:left;padding:14px 8px;border-bottom:1px solid #ddd;vertical-align:top">${escapeHtml(k)}</th><td style="padding:14px 8px;border-bottom:1px solid #ddd;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`).join('')}</table></div>`});
 if(error){console.error('Estimate provider rejected request',error.name);return NextResponse.json({message:'Your request could not be sent. Please try again or call the shop.'},{status:502})}
 return NextResponse.json({delivered:true,message:'Your estimate request has been sent to Pro’s Body Shop & Paint. For anything urgent, call the shop directly.'});
 }catch{console.error('Estimate email transport failed');return NextResponse.json({message:'Your request could not be sent. Please try again or call (626) 444-8308.'},{status:502})}
}

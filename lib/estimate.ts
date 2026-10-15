import {z} from 'zod';
export const damageAreas=['Front Bumper','Rear Bumper','Hood','Fender','Door','Quarter Panel','Paint','Headlight / Light','Other'] as const;
const singleLine=(max:number)=>z.string().trim().min(1,'This field is required.').max(max).refine(v=>!/[\r\n\x00-\x1f]/.test(v),'Use a single line.');
export const estimateSchema=z.object({name:singleLine(100),phone:singleLine(32).refine(v=>v.replace(/\D/g,'').length>=7,'Enter a valid phone number.'),email:z.email().max(254),year:z.coerce.number().int().min(1886).max(new Date().getFullYear()+2),make:singleLine(80),model:singleLine(100),damage:z.enum(damageAreas),description:z.string().trim().min(10,'Please describe the damage in at least 10 characters.').max(3000),website:z.string().max(0).optional()});
export function escapeHtml(value:unknown){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}

import {NextRequest,NextResponse} from 'next/server';
export async function GET(req:NextRequest){
 const year=req.nextUrl.searchParams.get('year');const make=req.nextUrl.searchParams.get('make');
 if(!year||!/^\d{4}$/.test(year)||+year<1886||+year>new Date().getFullYear()+2||make&&!/^\d{1,8}$/.test(make))return NextResponse.json({message:'Invalid vehicle lookup.'},{status:400});
 // vPIC makes are not year-filtered; model results are filtered by make AND model year.
 const path=make?`GetModelsForMakeIdYear/makeId/${make}/modelyear/${year}`:'GetAllMakes';
 try{const res=await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/${path}?format=json`,{next:{revalidate:86400},signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw new Error('Unavailable');
 const data=await res.json();
 if(!Array.isArray(data.Results))throw new Error('Invalid upstream data');
 const rows=data.Results as Record<string,unknown>[];
 const options=rows.map(row=>({id:String(make?row.Model_ID:row.Make_ID),label:String(make?row.Model_Name:row.Make_Name)}));
 const unique=[...new Map(options.map(o=>[o.label.toLowerCase(),o])).values()].sort((a,b)=>a.label.localeCompare(b.label));
 return NextResponse.json({options:unique});
 }catch{return NextResponse.json({message:'Vehicle lookup is unavailable. Please enter your vehicle manually.'},{status:502})}
}

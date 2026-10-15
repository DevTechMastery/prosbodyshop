import type {Metadata} from 'next';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow-condensed/900.css';
import './globals.css';
export const metadata:Metadata={title:'Pro’s Body Shop & Paint | Auto Body & Paint | El Monte, CA',description:'Auto body repair, collision repair and paint services in El Monte, California. Contact Pro’s Body Shop & Paint or request an estimate online.',robots:{index:false,follow:false},icons:{icon:'/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

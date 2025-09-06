import "./globals.css"
export const metadata = { title:"Social MVP", description:"Feed + Explore + Profiles" }
export default function RootLayout({ children }:{ children:React.ReactNode }){
  return (<html lang="en" dir="ltr"><body className="bg-gray-50 text-gray-900">{children}</body></html>)
}

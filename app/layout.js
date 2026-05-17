
import Providers from './Providers'
import "./globals.css";
import Navbar from './components/Navbar'


export default function RootLayout({ children }) {
  return (
      <html lang="en">
          <body>
                <Providers>
                <Navbar />
                    {children}
                </Providers>
          </body>
      </html>
  )
}

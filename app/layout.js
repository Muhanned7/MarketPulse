
import Providers from './Providers'
import "./globals.css";
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'


export default function RootLayout({ children }) {
  return (
      <html lang="en">
          <body>
                <Providers>
                <Navbar />
                    <div style={{ display: 'flex', flex: 1 }}>
                    <Sidebar />
                    <div style={{ flex: 1, overflow: 'auto' }}>
                            {children}
                        </div>
                    </div>
                </Providers>
          </body>
      </html>
  )
}

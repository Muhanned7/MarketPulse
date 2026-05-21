/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  allowedDevOrigins: ['172.20.80.1'],
  experimental: {
    turbo: {
      enabled: false
    }
},
devIndicators: {
  appIsrStatus: false,
  buildActivity: false,
},
eslint:{
  ignoreDuringBuilds: true,
}
}


export default nextConfig;

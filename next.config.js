/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configure canvas as external to avoid bundling issues
      config.externals = config.externals || []
      config.externals.push('canvas')
      
      // Disable module parsing for pdfjs-dist
      config.module = config.module || {}
      config.module.noParse = config.module.noParse || []
      config.module.noParse.push(/pdfjs-dist/)
    }
    
    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
    }
    
    return config
  },
}

module.exports = nextConfig

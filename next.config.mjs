/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse (native PDF text extraction, Syrka Learning Stage B) wraps
  // pdfjs-dist, whose legacy Node build breaks when webpack bundles it into
  // the server/RSC layer ("Object.defineProperty called on non-object").
  // Keeping it external forces a plain require() at runtime instead, which
  // is how pdf-parse's own Next.js/Vercel integration guide expects it to
  // be consumed.
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  },
};

export default nextConfig;

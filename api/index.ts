import app from '../server';

export default function handler(req: any, res: any) {
  if (req.url && req.url.includes('/api/index.ts')) {
    req.url = req.originalUrl || req.url;
  }
  const url = req.url || '';
  if (url.includes('/health')) {
    return res.status(200).json({
      success: true,
      service: 'vitals-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'ONLINE (Vercel Serverless Gateway)'
    });
  }
  return app(req, res);
}


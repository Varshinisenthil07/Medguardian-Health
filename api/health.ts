export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    success: true,
    service: 'vitals-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'ONLINE (Vercel Serverless)'
  });
}

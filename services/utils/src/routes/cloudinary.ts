import express from 'express';
import cloudinary from 'cloudinary';

const router = express.Router();

const verifyInternalSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
};

router.post('/upload', verifyInternalSecret, async (req, res) => {
  try {
    const { buffer } = req.body;
    if (!buffer) {
      res.status(400).json({ message: "No buffer provided" });
      return;
    }
    const cloud = await cloudinary.v2.uploader.upload(buffer);
    res.json({ url: cloud.secure_url });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
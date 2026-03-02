const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const sharp = require('sharp');

const app = express();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

app.use(express.static('public'));

// ✅ PDF to Word
app.post('/api/pdf-to-word', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!req.file.originalname.endsWith('.pdf')) return res.status(400).json({ error: 'Invalid file type' });

  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, req.file.originalname);
  const outputPath = path.join(tempDir, req.file.originalname.replace('.pdf', '.docx'));

  fs.writeFileSync(inputPath, req.file.buffer);

  try {
    execSync(`libreoffice --headless --convert-to docx "${inputPath}" --outdir "${tempDir}"`);
    res.sendFile(outputPath, (err) => {
      if (err) console.error(err);
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });
  } catch (err) {
    try { fs.unlinkSync(inputPath); } catch {}
    res.status(500).json({ error: 'Conversion failed. Make sure LibreOffice is installed.' });
  }
});

// ✅ Word to PDF
app.post('/api/word-to-pdf', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!req.file.originalname.endsWith('.docx')) return res.status(400).json({ error: 'Invalid file type' });

  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, req.file.originalname);
  const outputPath = path.join(tempDir, req.file.originalname.replace('.docx', '.pdf'));

  fs.writeFileSync(inputPath, req.file.buffer);

  try {
    execSync(`libreoffice --headless --convert-to pdf "${inputPath}" --outdir "${tempDir}"`);
    res.sendFile(outputPath, (err) => {
      if (err) console.error(err);
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });
  } catch (err) {
    try { fs.unlinkSync(inputPath); } catch {}
    res.status(500).json({ error: 'Conversion failed. Make sure LibreOffice is installed.' });
  }
});

// ✅ File Compressor (FIXED: async + separate image handling)
app.post('/api/compress', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
    return res.status(400).json({ error: 'Invalid file type. Must be PDF, JPG, or PNG.' });
  }

  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, req.file.originalname);
  const outputPath = path.join(tempDir, `compressed_${req.file.originalname}`);

  fs.writeFileSync(inputPath, req.file.buffer);

  try {
    if (ext === 'pdf') {
      // Use Ghostscript to compress PDF
      execSync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`);
    } else if (ext === 'png') {
      // ✅ FIXED: PNG compression
      await sharp(inputPath).png({ compressionLevel: 8 }).toFile(outputPath);
    } else {
      // ✅ FIXED: JPG/JPEG compression
      await sharp(inputPath).jpeg({ quality: 80 }).toFile(outputPath);
    }

    res.sendFile(outputPath, (err) => {
      if (err) console.error(err);
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });
  } catch (err) {
    try { fs.unlinkSync(inputPath); } catch {}
    res.status(500).json({ error: 'Compression failed. Make sure Ghostscript is installed for PDF.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

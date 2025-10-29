const express = require('express');
const multer = require('multer');
const { storageBucket } = require('./firebase.js');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint de upload
app.post('/upload', upload.single('avtarProfil'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');

    const filename = `uploads/${Date.now()}`;
    const file = storageBucket.file(filename);

    const blobStream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype },
    });

    blobStream.on('error', (err) => {
      console.error('Erro no upload:', err);
      res.status(500).send('Erro ao enviar arquivo.');
    });

    blobStream.on('finish', async () => {
      // Gera URL temporária para acesso
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-17-2026',
      });

      res.status(200).json({
        message: '✅ Upload concluído!',
        fileName: filename,
        url,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno do servidor.');
  }
});

app.listen(3000, () =>
  console.log('🚀 Servidor rodando em http://localhost:3000')
);

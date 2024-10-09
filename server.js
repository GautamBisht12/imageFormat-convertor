const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pdfPoppler = require('pdf-poppler');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
    origin: '*',
    methods: 'POST',
    allowedHeaders: ['Content-Type']
}));

app.post('/convert', upload.single('file'), async (req, res) => {
    const format = req.body.format;
    const isPDF = req.body.isPDF === 'true';
    const fileBuffer = req.file?.buffer;

    try {
        if (!fileBuffer) {
            return res.status(400).send('Invalid file.');
        }

        if (isPDF) {
            const tempPdfPath = path.join('/tmp', 'temp.pdf');
            fs.writeFileSync(tempPdfPath, fileBuffer);

            const outputDir = '/tmp';

            const options = {
                format: format === 'jpeg' ? 'jpeg' : format,  // ensure correct format
                out_dir: outputDir,
                out_prefix: 'converted-file',
                page: 1
            };

            await pdfPoppler.convert(tempPdfPath, options);

            const outputImagePath = path.join(outputDir, `converted-file-1.${format}`);
            
            if (fs.existsSync(outputImagePath)) {
                const outputImage = fs.readFileSync(outputImagePath);
                res.set('Content-Disposition', `attachment; filename="converted-file.${format}"`);
                res.set('Content-Type', `image/${format}`);
                res.send(outputImage);
            } else {
                throw new Error(`Converted file not found at ${outputImagePath}`);
            }

            fs.unlinkSync(tempPdfPath);
            fs.unlinkSync(outputImagePath);
        } else {
            const convertedImage = await sharp(fileBuffer)
                .toFormat(format)
                .toBuffer();

            res.set('Content-Disposition', `attachment; filename="converted-file.${format}"`);
            res.set('Content-Type', `image/${format}`);
            res.send(convertedImage);
        }
    } catch (err) {
        console.error('Error during conversion:', err);
        res.status(500).send('Error converting file');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

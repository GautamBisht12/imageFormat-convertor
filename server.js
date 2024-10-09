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
            const tempPdfPath = path.join(__dirname, 'temp.pdf');
            fs.writeFileSync(tempPdfPath, fileBuffer);
            console.log('Temporary PDF created at:', tempPdfPath);

            const outputDir = path.join(__dirname, 'output');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
                console.log('Output directory created:', outputDir);
            }

            const options = {
                format: format === 'jpeg' ? 'jpeg' : format,  // ensure correct format
                out_dir: outputDir,
                out_prefix: 'converted-file',
                page: 1
            };

            console.log("Starting PDF conversion...");
            await pdfPoppler.convert(tempPdfPath, options);
            console.log("PDF conversion completed.");

            const outputImagePath = path.join(outputDir, `converted-file-1.${format}`);
            console.log('Checking for converted file at:', outputImagePath);

            if (fs.existsSync(outputImagePath)) {
                const outputImage = fs.readFileSync(outputImagePath);
                res.set('Content-Disposition', `attachment; filename="converted-file.${format}"`);
                res.set('Content-Type', `image/${format}`);
                res.send(outputImage);
            } else {
                throw new Error(`Converted file not found at ${outputImagePath}`);
            }

            // Clean up temporary files
            fs.unlinkSync(tempPdfPath);
            console.log('Temporary PDF deleted.');
            fs.unlinkSync(outputImagePath);
            console.log('Converted image deleted.');
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





app.listen(3000, () => console.log('Server running on port 3000'));

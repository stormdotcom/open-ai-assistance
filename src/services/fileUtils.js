const pdfParse = require('pdf-parse');
const fs = require('fs');
const mammoth = require('mammoth');

exports.extractTextFromPDF = async (pdfPath) => {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    return data.text;
  };


  exports.readTextFile = (filePath) => {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');  // Read file and encode as UTF-8
      return data;  // Return file content
    } catch (err) {
      console.error('Error reading file:', err);
    }
  };


exports.extractTextFromDocx = async (filePath) => {
    try {
      const docxBuffer = fs.readFileSync(filePath); 
      const result = await mammoth.extractRawText({ buffer: docxBuffer }); 
      return result.value;  // Return the extracted text
    } catch (err) {
      console.error('Error reading DOCX file:', err);
    }
  };
  
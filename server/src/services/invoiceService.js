const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');

const generateInvoicePDF = (transaction, buyer, idea) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        
        // Upload PDF raw buffer to Cloudinary
        cloudinary.uploader.upload_stream(
          { resource_type: 'raw', format: 'pdf', folder: 'ideax/invoices' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        ).end(pdfData);
      });

      // Design the PDF Invoice
      doc.fontSize(24).font('Helvetica-Bold').text('IdeaX - Invoice', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Transaction ID: ${transaction.id}`);
      doc.text(`Status: PAID`);
      doc.moveDown();
      
      doc.font('Helvetica-Bold').text('Buyer Information:');
      doc.font('Helvetica').text(`Name: ${buyer.displayName}`);
      doc.text(`Email: ${buyer.email}`);
      doc.moveDown();
      
      doc.font('Helvetica-Bold').text('Purchase Details:');
      doc.font('Helvetica').text(`Idea ID: ${idea.id}`);
      doc.text(`Description: ${idea.content.substring(0, 100)}...`);
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text(`Total Amount: INR ${transaction.amount}`, { align: 'right' });
      
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica-Oblique').text('Thank you for using IdeaX. This is a computer generated invoice.', { align: 'center' });
      
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, invoiceData } = await request.json()

    // Create a transporter using Gmail
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Format the invoice as HTML email
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .invoice-table th { background-color: #f3f4f6; font-weight: bold; }
            .totals { margin: 20px 0; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .amount-due { font-size: 24px; color: #dc2626; font-weight: bold; }
            .info-box { background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p style="font-size: 18px; margin: 10px 0;">Invoice #${invoiceData.invoiceNumber}</p>
          </div>
          
          <div class="content">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
              <div>
                <h3 style="margin-bottom: 10px;">Bill To:</h3>
                <p style="margin: 5px 0;"><strong>${invoiceData.clientName}</strong></p>
                <p style="margin: 5px 0;">${invoiceData.clientEmail}</p>
                <p style="margin: 5px 0;">${invoiceData.clientPhone}</p>
                <p style="margin: 5px 0;">${invoiceData.clientAddress}</p>
                <p style="margin: 5px 0;">${invoiceData.clientCity}, ${invoiceData.clientState} ${invoiceData.clientZip}</p>
              </div>
              <div style="text-align: right;">
                <h3 style="margin-bottom: 10px;">Invoice Details:</h3>
                <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${invoiceData.invoiceDate}</p>
                <p style="margin: 5px 0;"><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
                <p style="margin: 5px 0;"><strong>Project:</strong> ${invoiceData.projectName}</p>
              </div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.lineItems.map((item: any) => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">$${item.rate.toFixed(2)}</td>
                    <td style="text-align: right;">$${(item.quantity * item.rate).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span><strong>Subtotal:</strong></span>
                <span>$${invoiceData.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span><strong>Already Paid:</strong></span>
                <span style="color: #16a34a;">-$${invoiceData.paidAmount.toFixed(2)}</span>
              </div>
              <div class="total-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #333;">
                <span><strong>Amount Due:</strong></span>
                <span class="amount-due">$${invoiceData.amountDue.toFixed(2)}</span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Payment Instructions:</h3>
              <p>Please make payment by <strong>${invoiceData.dueDate}</strong>.</p>
              <p>You can pay online through our payment portal or contact us for other payment methods.</p>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p><strong>Your Company Name</strong></p>
              <p>If you have any questions about this invoice, please contact us.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email
    const info = await transporter.sendMail({
      from: `"Your Company" <${process.env.SMTP_FROM}>`,
      to: to,
      subject: subject,
      text: body,
      html: htmlBody,
    })

    console.log('Email sent:', info.messageId)

    return NextResponse.json({ success: true, message: 'Invoice sent successfully' })
  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
import QRCode from "qrcode";

export interface TicketQRPayload {
  ticketCode: string;
  bookingRef: string;
  showtimeId: string;
  seatLabel: string;
  issuedAt: string;
}

export async function generateTicketQRCodeDataUrl(
  payload: TicketQRPayload
): Promise<string> {
  const jsonString = JSON.stringify(payload);
  try {
    const dataUrl = await QRCode.toDataURL(jsonString, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    // Fallback simple base64 placeholder
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><text x="10" y="50">QR Error</text></svg>`;
  }
}

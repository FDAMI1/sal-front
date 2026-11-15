/** What every QR export needs: the image, the salon it belongs to, and its link. */
export interface QrAsset {
  dataUrl: string;
  salonName: string;
  /** Used for file names. */
  salonSlug: string;
  url: string;
}

export const SCAN_PROMPT = "Scan to book your visit";

const fileName = (slug: string, ext: string) =>
  `${slug || "salon"}-booking-qr.${ext}`;

function clickDownload(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadQrPng(qr: QrAsset) {
  clickDownload(qr.dataUrl, fileName(qr.salonSlug, "png"));
}

/** A4 portrait: salon name, the QR centred at 120mm, the prompt and the link. */
export async function downloadQrPdf(qr: QrAsset) {
  // Loaded on demand so jsPDF stays out of the main bundle.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const centre = doc.internal.pageSize.getWidth() / 2;
  const size = 120;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(qr.salonName, centre, 45, { align: "center", maxWidth: 170 });
  doc.addImage(qr.dataUrl, "PNG", centre - size / 2, 65, size, size);
  doc.setFontSize(18);
  doc.text(SCAN_PROMPT, centre, 205, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(qr.url, centre, 217, { align: "center", maxWidth: 170 });
  doc.save(fileName(qr.salonSlug, "pdf"));
}

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );

/** Prints only the QR sheet from a hidden iframe, never the dashboard around it. */
export function printQr(qr: QrAsset) {
  const frame = document.createElement("iframe");
  frame.title = "QR code print view";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(qr.salonName)}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;text-align:center;color:#111}
main{padding:20mm 15mm}h1{font-size:28pt;margin:0 0 10mm}img{width:120mm;height:120mm}
p{margin:6mm 0 0;font-size:16pt}.url{font-size:11pt;word-break:break-all}</style></head>
<body><main><h1>${escapeHtml(qr.salonName)}</h1><img src="${qr.dataUrl}" alt="">
<p>${SCAN_PROMPT}</p><p class="url">${escapeHtml(qr.url)}</p></main></body></html>`;
  // The iframe's load event waits for the image, so the code is never blank.
  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return frame.remove();
    win.addEventListener("afterprint", () => frame.remove());
    win.focus();
    win.print();
  };
  document.body.appendChild(frame);
}

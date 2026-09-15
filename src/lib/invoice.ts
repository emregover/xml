import QRCode from "qrcode";

export type InvoiceMeta = {
  id?: string;
  issueDate?: string;
  profile?: string;
  invoiceType?: string;
  currency?: string;
  supplier?: string;
  customer?: string;
  payableAmount?: string;
};

const getByLocalName = (root: Document | Element, localName: string) =>
  Array.from(root.getElementsByTagName("*")).find((el) => el.localName === localName) ?? null;

const getAllByLocalName = (root: Document | Element, localName: string) =>
  Array.from(root.getElementsByTagName("*")).filter((el) => el.localName === localName);

const textOf = (root: Document | Element, localName: string) =>
  getByLocalName(root, localName)?.textContent?.trim() || undefined;

export function parseXml(xmlText: string): Document {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  const parserError = xml.querySelector("parsererror");
  if (parserError) throw new Error("Geçerli bir XML dosyası okunamadı.");
  return xml;
}

export function extractEmbeddedXslt(xml: Document): string {
  const attachments = getAllByLocalName(xml, "EmbeddedDocumentBinaryObject");
  const xsltNode = attachments.find((node) => {
    const filename = node.getAttribute("filename")?.toLowerCase() || "";
    return filename.endsWith(".xslt") || filename.endsWith(".xsl");
  });

  if (!xsltNode?.textContent) {
    throw new Error("XML içinde gömülü XSLT görsel şablonu bulunamadı.");
  }

  const compact = xsltNode.textContent.replace(/\s+/g, "");
  try {
    const binary = atob(compact);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    throw new Error("Gömülü XSLT şablonu Base64 olarak çözülemedi.");
  }
}

export async function transformInvoice(xml: Document, xsltText: string): Promise<string> {
  if (typeof XSLTProcessor === "undefined") {
    throw new Error("Tarayıcınız XSLT dönüşümünü desteklemiyor. Chrome veya Edge deneyin.");
  }

  const xslt = parseXml(xsltText);
  const processor = new XSLTProcessor();
  processor.importStylesheet(xslt);
  const result = processor.transformToDocument(xml);

  if (!result?.documentElement) {
    throw new Error("Fatura XSLT ile görselleştirilemedi.");
  }

  const serialized = new XMLSerializer().serializeToString(result);
  return sanitizeAndEnhanceHtml(serialized);
}

async function sanitizeAndEnhanceHtml(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // QNB eSolutions benzeri şablonlar QR'ı kendi JavaScript'i ile üretir.
  // O scripti çalıştırmak yerine yalnızca QR payload'ını okuyup güvenli SVG üretiyoruz.
  const qrValue = doc.querySelector("#qrvalue")?.textContent?.trim();
  const qrHost = doc.querySelector("#qrcode");
  if (qrValue && qrHost) {
    try {
      const svg = await QRCode.toString(qrValue, {
        type: "svg",
        errorCorrectionLevel: "M",
        width: 140,
        margin: 0,
      });
      qrHost.innerHTML = svg;
      const svgEl = qrHost.querySelector("svg");
      if (svgEl) {
        svgEl.setAttribute("width", "140");
        svgEl.setAttribute("height", "140");
        svgEl.setAttribute("aria-label", "e-Fatura QR kodu");
        svgEl.setAttribute("role", "img");
        svgEl.style.display = "inline-block";
      }
    } catch {
      // QR üretimi başarısız olsa bile faturanın kalanını göstermeye devam et.
    }
  }

  // Fatura kaynaklı aktif içeriği kaldır. Görüntü ve stil içerikleri korunur.
  doc.querySelectorAll("script, iframe, object, embed, base").forEach((el) => el.remove());

  doc.querySelectorAll("meta[http-equiv]").forEach((el) => {
    if ((el.getAttribute("http-equiv") || "").toLowerCase() === "refresh") el.remove();
  });

  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      if ((name === "href" || name === "src" || name === "xlink:href") && value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Şablonun baskı geometrisini ekranda da kullanıyoruz. QNB şablonu baskıda
  // 845 px genişlik kullanıyor; böylece A4 önizleme ve PDF aynı yerleşimi görür.
  const viewerStyle = doc.createElement("style");
  viewerStyle.textContent = `
    @page { size: A4 portrait; margin: 0; }

    @media screen {
      html, body {
        width: 845px !important;
        min-width: 845px !important;
        margin: 0 !important;
        padding: 0 !important;
        color: #000 !important;
        background: #fff !important;
        background-image: none !important;
        text-align: left !important;
      }

      .documentContainerOuter {
        width: 845px !important;
        min-width: 845px !important;
        max-width: 845px !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }

      .documentContainer {
        width: 845px !important;
        min-width: 845px !important;
        max-width: 845px !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        display: block !important;
        color: #000 !important;
        background: #fff !important;
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        -moz-box-shadow: none !important;
      }

      .documentContainer::before,
      .documentContainer::after {
        display: none !important;
        box-shadow: none !important;
      }

      #malHizmetTablosu {
        width: 845px !important;
      }
    }

    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        color: #000 !important;
        background: #fff !important;
        background-image: none !important;
        text-align: left !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .documentContainerOuter {
        margin: 0 !important;
        padding: 0 !important;
      }

      .documentContainer {
        width: 845px !important;
        min-width: 845px !important;
        max-width: 845px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        -moz-box-shadow: none !important;
      }

      #malHizmetTablosu {
        width: 845px !important;
      }
    }
  `;
  doc.head.appendChild(viewerStyle);

  const head = doc.head.innerHTML;
  const body = doc.body.innerHTML;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=845">${head}</head><body>${body}</body></html>`;
}

export function getInvoiceMeta(xml: Document): InvoiceMeta {
  const supplierParty = getAllByLocalName(xml, "AccountingSupplierParty")[0];
  const customerParty = getAllByLocalName(xml, "AccountingCustomerParty")[0];
  const legalMonetaryTotal = getAllByLocalName(xml, "LegalMonetaryTotal")[0];

  const partyName = (party?: Element) => {
    if (!party) return undefined;
    const name = getByLocalName(party, "Name")?.textContent?.trim();
    const registration = getByLocalName(party, "RegistrationName")?.textContent?.trim();
    return registration || name || undefined;
  };

  return {
    id: textOf(xml, "ID"),
    issueDate: textOf(xml, "IssueDate"),
    profile: textOf(xml, "ProfileID"),
    invoiceType: textOf(xml, "InvoiceTypeCode"),
    currency: textOf(xml, "DocumentCurrencyCode"),
    supplier: partyName(supplierParty),
    customer: partyName(customerParty),
    payableAmount: legalMonetaryTotal ? textOf(legalMonetaryTotal, "PayableAmount") : undefined,
  };
}

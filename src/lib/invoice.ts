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

export function transformInvoice(xml: Document, xsltText: string): string {
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
  return sanitizeHtml(serialized);
}

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
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

  const head = doc.head.innerHTML;
  const body = doc.body.innerHTML;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`;
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

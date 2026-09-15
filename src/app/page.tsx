"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { extractEmbeddedXslt, getInvoiceMeta, InvoiceMeta, parseXml, transformInvoice } from "@/lib/invoice";
import {
  ArchivedInvoice,
  deleteArchivedInvoice,
  listArchivedInvoices,
  saveArchivedInvoice,
} from "@/lib/archive";

type Status = "idle" | "ready" | "error";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function formatMoney(value?: string, currency?: string) {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value} ${currency ?? ""}`.trim();
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)} ${currency ?? ""}`.trim();
}

function formatSavedAt(value: number) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [html, setHtml] = useState("");
  const [meta, setMeta] = useState<InvoiceMeta | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [archive, setArchive] = useState<ArchivedInvoice[]>([]);
  const [archiveError, setArchiveError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);

  const details = useMemo(
    () =>
      meta
        ? [
            ["Fatura No", meta.id],
            ["Tarih", meta.issueDate],
            ["Profil", meta.profile],
            ["Tip", meta.invoiceType],
            ["Para Birimi", meta.currency],
            ["Satıcı", meta.supplier],
            ["Alıcı", meta.customer],
            ["Ödenecek", formatMoney(meta.payableAmount, meta.currency)],
          ].filter((item) => item[1])
        : [],
    [meta]
  );

  async function refreshArchive() {
    try {
      setArchive(await listArchivedInvoices());
      setArchiveError("");
    } catch {
      setArchiveError("Tarayıcı arşivi okunamadı. Gizli mod veya tarayıcı depolama ayarları bunu engelliyor olabilir.");
    }
  }

  useEffect(() => {
    void refreshArchive();
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const stage = previewStageRef.current;
    if (!stage) return;

    const updateScale = () => {
      const available = Math.max(280, stage.clientWidth - 32);
      setPreviewScale(Math.min(1, available / A4_WIDTH_PX));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [status]);

  async function renderXml(xmlText: string, sourceFileName: string, saveToArchive: boolean) {
    setError("");
    setStatus("idle");
    setHtml("");
    setMeta(null);
    setFileName(sourceFileName);

    try {
      const xml = parseXml(xmlText);
      const xslt = extractEmbeddedXslt(xml);
      const invoiceMeta = getInvoiceMeta(xml);
      const rendered = await transformInvoice(xml, xslt);

      setMeta(invoiceMeta);
      setHtml(rendered);
      setStatus("ready");

      if (saveToArchive) {
        try {
          await saveArchivedInvoice({ xmlText, fileName: sourceFileName, meta: invoiceMeta });
          await refreshArchive();
        } catch {
          setArchiveError("Fatura görüntülendi ancak tarayıcı arşivine kaydedilemedi.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fatura görüntülenemedi.");
      setStatus("error");
    }
  }

  async function openFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("Lütfen .xml uzantılı bir e-Fatura dosyası seçin.");
      setStatus("error");
      return;
    }
    await renderXml(await file.text(), file.name, true);
  }

  function chooseNewInvoice() {
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void openFile(event.dataTransfer.files?.[0]);
  }

  async function openArchivedInvoice(item: ArchivedInvoice) {
    await renderXml(item.xmlText, item.fileName, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeArchivedInvoice(item: ArchivedInvoice) {
    const label = item.meta.id || item.fileName;
    if (!window.confirm(`${label} arşivden silinsin mi?`)) return;
    try {
      await deleteArchivedInvoice(item.id);
      await refreshArchive();
    } catch {
      setArchiveError("Fatura arşivden silinemedi.");
    }
  }

  function downloadHtml() {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${meta?.id || fileName.replace(/\.xml$/i, "") || "efatura"}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function printInvoice() {
    if (!html) return;

    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    Object.assign(printFrame.style, {
      position: "fixed",
      width: "1px",
      height: "1px",
      right: "100%",
      bottom: "0",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
    });

    document.body.appendChild(printFrame);
    const printWindow = printFrame.contentWindow;
    const printDocument = printFrame.contentDocument;

    if (!printWindow || !printDocument) {
      printFrame.remove();
      window.alert("Yazdırma penceresi hazırlanamadı. Lütfen tekrar deneyin.");
      return;
    }

    printDocument.open();
    printDocument.write(html);
    printDocument.close();

    const cleanup = () => window.setTimeout(() => printFrame.remove(), 500);
    const runPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } finally {
        cleanup();
      }
    };

    window.setTimeout(runPrint, 180);
  }

  return (
    <main>
      <section className="hero">
        <div className="badge">UBL-TR · e-Fatura</div>
        <div className="heroRow">
          <div>
            <h1>XML e-Faturayı<br />anında görüntüle.</h1>
            <p className="lead">
              XML dosyanızdaki gömülü XSLT şablonunu kullanır. Dosya tarayıcınızdan çıkmaz, sunucuya yüklenmez.
            </p>
          </div>
          <button className="newInvoiceButton" onClick={chooseNewInvoice}>+ Yeni XML Fatura Yükle</button>
        </div>
      </section>

      <section className="workspace">
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          hidden
          onChange={(event) => void openFile(event.target.files?.[0])}
        />

        <div
          className={`dropzone ${status === "ready" ? "compact" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onClick={chooseNewInvoice}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => event.key === "Enter" && chooseNewInvoice()}
        >
          <div className="uploadIcon" aria-hidden="true">↥</div>
          <div>
            <strong>{fileName || "e-Fatura XML dosyasını bırakın"}</strong>
            <span>{fileName ? "Yeni bir XML seçmek için tıklayın" : "veya dosya seçmek için tıklayın"}</span>
          </div>
        </div>

        {archiveError && <div className="archiveWarning">{archiveError}</div>}
        {status === "error" && <div className="errorBox">{error}</div>}

        {archive.length > 0 && (
          <section className="archiveSection" aria-label="Tarayıcı fatura arşivi">
            <div className="archiveHeader">
              <div>
                <span className="eyebrow">BU TARAYICIDA</span>
                <h2>Fatura Arşivi</h2>
              </div>
              <span className="archiveCount">{archive.length} fatura</span>
            </div>
            <div className="archiveList">
              {archive.map((item) => (
                <article className={`archiveItem ${meta?.id === item.meta.id ? "active" : ""}`} key={item.id}>
                  <button className="archiveOpen" onClick={() => void openArchivedInvoice(item)}>
                    <span className="archiveId">{item.meta.id || item.fileName}</span>
                    <span className="archiveParties">{item.meta.supplier || "Satıcı"} → {item.meta.customer || "Alıcı"}</span>
                    <span className="archiveMeta">
                      {item.meta.issueDate || "Tarih yok"} · {formatMoney(item.meta.payableAmount, item.meta.currency) || "Tutar yok"}
                    </span>
                  </button>
                  <div className="archiveSide">
                    <span>{formatSavedAt(item.savedAt)}</span>
                    <button className="deleteArchive" onClick={() => void removeArchivedInvoice(item)} aria-label={`${item.meta.id || item.fileName} arşivden sil`}>Sil</button>
                  </div>
                </article>
              ))}
            </div>
            <p className="archiveNote">Arşiv yalnızca bu tarayıcının IndexedDB alanında tutulur. Sunucuya gönderilmez.</p>
          </section>
        )}

        {status === "ready" && (
          <>
            <div className="toolbar">
              <div className="metaGrid">
                {details.map(([label, value]) => (
                  <div className="metaItem" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="actions">
                <button className="secondary" onClick={downloadHtml}>HTML indir</button>
                <button className="primary" onClick={printInvoice}>Yazdır / PDF</button>
              </div>
            </div>

            <div className="previewShell">
              <div className="previewTop">
                <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
                <span className="previewTitle">A4 Fatura Önizleme</span>
                <span className="previewFormat">210 × 297 mm · 10 mm kenar boşluğu</span>
              </div>
              <div className="previewStage" ref={previewStageRef}>
                <div
                  className="a4Page"
                  style={{ width: A4_WIDTH_PX * previewScale, height: A4_HEIGHT_PX * previewScale }}
                >
                  <iframe
                    className="invoiceFrame"
                    title="e-Fatura A4 önizleme"
                    sandbox="allow-same-origin allow-modals"
                    srcDoc={html}
                    style={{
                      width: A4_WIDTH_PX,
                      height: A4_HEIGHT_PX,
                      transform: `scale(${previewScale})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <footer>
        <span>Dosyalar cihazınızda işlenir.</span>
        <span>XML içerikleri ve tarayıcı arşivi sunucuya gönderilmez.</span>
      </footer>
    </main>
  );
}

"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { extractEmbeddedXslt, getInvoiceMeta, InvoiceMeta, parseXml, transformInvoice } from "@/lib/invoice";

type Status = "idle" | "ready" | "error";

const A4_WIDTH_PX = 845;
const A4_HEIGHT_PX = 1195;

function formatMoney(value?: string, currency?: string) {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value} ${currency ?? ""}`.trim();
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)} ${currency ?? ""}`.trim();
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [html, setHtml] = useState("");
  const [meta, setMeta] = useState<InvoiceMeta | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const invoiceFrameRef = useRef<HTMLIFrameElement>(null);

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

  async function openFile(file?: File) {
    if (!file) return;
    setError("");
    setStatus("idle");
    setHtml("");
    setMeta(null);
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("Lütfen .xml uzantılı bir e-Fatura dosyası seçin.");
      setStatus("error");
      return;
    }

    try {
      const xmlText = await file.text();
      const xml = parseXml(xmlText);
      const xslt = extractEmbeddedXslt(xml);
      const rendered = await transformInvoice(xml, xslt);
      setMeta(getInvoiceMeta(xml));
      setHtml(rendered);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fatura görüntülenemedi.");
      setStatus("error");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void openFile(event.dataTransfer.files?.[0]);
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
    // Print the exact sanitized document shown in the A4 preview. This avoids
    // popup/new-tab timing issues and guarantees preview/print use one source.
    const frameWindow = invoiceFrameRef.current?.contentWindow;
    if (!frameWindow) {
      window.alert("Fatura önizlemesi henüz hazır değil. Lütfen bir kez daha deneyin.");
      return;
    }

    frameWindow.focus();
    window.setTimeout(() => frameWindow.print(), 50);
  }

  return (
    <main>
      <section className="hero">
        <div className="badge">UBL-TR · e-Fatura</div>
        <h1>XML e-Faturayı<br />anında görüntüle.</h1>
        <p className="lead">
          XML dosyanızdaki gömülü XSLT şablonunu kullanır. Dosya tarayıcınızdan çıkmaz, sunucuya yüklenmez.
        </p>
      </section>

      <section className="workspace">
        <div
          className={`dropzone ${status === "ready" ? "compact" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            hidden
            onChange={(event) => void openFile(event.target.files?.[0])}
          />
          <div className="uploadIcon" aria-hidden="true">↥</div>
          <div>
            <strong>{fileName || "e-Fatura XML dosyasını bırakın"}</strong>
            <span>{fileName ? "Değiştirmek için tıklayın" : "veya dosya seçmek için tıklayın"}</span>
          </div>
        </div>

        {status === "error" && <div className="errorBox">{error}</div>}

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
                <span className="previewFormat">210 × 297 mm</span>
              </div>
              <div className="previewStage" ref={previewStageRef}>
                <div
                  className="a4Page"
                  style={{
                    width: A4_WIDTH_PX * previewScale,
                    height: A4_HEIGHT_PX * previewScale,
                  }}
                >
                  <iframe
                    ref={invoiceFrameRef}
                    className="invoiceFrame"
                    title="e-Fatura A4 önizleme"
                    sandbox="allow-same-origin"
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
        <span>Sunucuya XML veya fatura içeriği gönderilmez.</span>
      </footer>
    </main>
  );
}

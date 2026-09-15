"use client";

import { DragEvent, useMemo, useRef, useState } from "react";
import { extractEmbeddedXslt, getInvoiceMeta, InvoiceMeta, parseXml, transformInvoice } from "@/lib/invoice";

type Status = "idle" | "ready" | "error";

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
  const inputRef = useRef<HTMLInputElement>(null);

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
    // The rendered HTML is sanitized before it reaches this point. Open the
    // print document synchronously so popup blockers keep the user gesture.
    const win = window.open("about:blank", "_blank", "width=980,height=1100");
    if (!win) {
      window.alert("Yazdırma penceresi tarayıcı tarafından engellendi. Bu site için açılır pencerelere izin verin.");
      return;
    }

    // Prevent the child window from navigating the application window.
    try {
      win.opener = null;
    } catch {
      // Some browsers expose opener as read-only; the invoice contains no executable scripts.
    }

    win.document.open();
    win.document.write(html);
    win.document.close();

    const triggerPrint = () => {
      win.focus();
      window.setTimeout(() => {
        win.print();
      }, 180);
    };

    if (win.document.readyState === "complete") {
      triggerPrint();
    } else {
      win.addEventListener("load", triggerPrint, { once: true });
    }
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
                <span className="previewTitle">Fatura Önizleme</span>
              </div>
              <iframe className="invoiceFrame" title="e-Fatura önizleme" sandbox="" srcDoc={html} />
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

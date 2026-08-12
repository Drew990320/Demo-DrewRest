"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentsToTicketPreviewHtml = segmentsToTicketPreviewHtml;
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function segmentsToTicketPreviewHtml(segments, opts) {
    const anchoMm = opts?.anchoMm === 80 ? 80 : 58;
    const lines = [];
    if (opts?.subtitle?.trim()) {
        lines.push(`<div class="subtitle">${escapeHtml(opts.subtitle.trim())}</div>`);
    }
    if (opts?.logoDataUrl) {
        lines.push(`<img class="logo" src="${opts.logoDataUrl}" alt="Logo" />`);
    }
    for (const seg of segments) {
        if (seg.kind === 'logo') {
            continue;
        }
        if (seg.kind === 'rule') {
            lines.push('<hr class="rule" />');
            continue;
        }
        const { line } = seg;
        const cls = [
            'line',
            line.align !== 'left' ? `align-${line.align}` : '',
            line.bold ? 'bold' : '',
            line.doubleHeight ? 'tall' : '',
            line.doubleWidth ? 'wide' : '',
        ]
            .filter(Boolean)
            .join(' ');
        const text = line.text.trim() ? escapeHtml(line.text) : '&nbsp;';
        lines.push(`<div class="${cls}">${text}</div>`);
    }
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vista previa ticket ${anchoMm} mm</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: #ececec;
      font-family: "Courier New", Courier, monospace;
      display: flex;
      justify-content: center;
    }
    .ticket {
      width: ${anchoMm}mm;
      max-width: 100%;
      background: #fff;
      color: #111;
      padding: 10px 8px 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,.12);
      font-size: 11px;
      line-height: 1.35;
      word-break: break-word;
    }
    .subtitle {
      text-align: center;
      color: #666;
      font-family: system-ui, sans-serif;
      font-size: 9px;
      margin-bottom: 8px;
    }
    .logo {
      display: block;
      width: 100%;
      height: auto;
      margin: 0 auto 8px;
    }
    .line { white-space: pre-wrap; }
    .line.align-center { text-align: center; }
    .line.align-right { text-align: right; }
    .line.bold { font-weight: 700; }
    .line.tall { font-size: 13px; line-height: 1.25; }
    .line.wide { letter-spacing: 0.02em; }
    hr.rule {
      border: none;
      border-top: 1px dashed #999;
      margin: 6px 0;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .ticket { box-shadow: none; width: ${anchoMm}mm; }
    }
  </style>
</head>
<body>
  <div class="ticket">${lines.join('\n')}</div>
</body>
</html>`;
}
//# sourceMappingURL=ticket-preview-html.builder.js.map
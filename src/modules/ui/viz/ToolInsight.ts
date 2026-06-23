/**
 * renderInsight — shared DOM helper for the per-tool "chart + readout" pattern.
 *
 * Every tool controller used to repeat: getElementById('x-chart') → innerHTML,
 * getElementById('x-readout') → textContent, plus a clear-on-empty branch. This
 * centralises that so behaviour is identical everywhere — notably an invalid
 * result ALWAYS clears both and never leaves a stale chart. (Accessibility
 * labels are emitted by the Charts builders themselves on their role="img"
 * root, so they survive this generic mount.)
 */
export interface IInsight {
  /** Whether the inputs produced a valid result. When false, both are cleared. */
  ok: boolean;
  /** Chart HTML (from Charts.ts builders) for the `${id}-chart` mount. */
  chartHtml?: string;
  /** Plain-language interpretation for the `${id}-readout` element. */
  readoutText?: string;
}

/**
 * @param id tool id prefix; targets `${id}-chart` and `${id}-readout`. Either
 *   element may be absent (the matching part is skipped).
 */
export function renderInsight(id: string, insight: IInsight): void {
  const chart = document.getElementById(`${id}-chart`);
  if (chart) chart.innerHTML = insight.ok && insight.chartHtml ? insight.chartHtml : '';
  const readout = document.getElementById(`${id}-readout`);
  if (readout) readout.textContent = insight.ok ? (insight.readoutText ?? '') : '';
}

export default renderInsight;

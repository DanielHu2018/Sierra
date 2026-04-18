import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import ejs from 'ejs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RouteResult, RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary } from '../types.js';
import type { MockContact } from '../data/mock-contacts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Type Definitions ─────────────────────────────────────────────────────────
export interface PdfTemplateData {
  route: RouteResult;
  recommendation: RouteRecommendation;
  triggers: EnvironmentalTrigger[];
  alerts: SierraAlert;
  projectSummary: ProjectSummary;
  narrative: string;
  contacts: MockContact[];
  mapThumbnail: string;
  exportDate: string;
}

// ─── Puppeteer Singleton ──────────────────────────────────────────────────────
// Anti-pattern avoided: Do not launch per request — Chrome startup is 2-4s.
// Launch once at first PDF request; reuse for all subsequent requests.
let _browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!_browser) {
    _browser = await puppeteer.launch({
      headless: true, // headless: 'new' is deprecated since v22; boolean is correct
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return _browser;
}

// Register cleanup so orphaned Chrome processes don't accumulate on restart
process.on('exit', () => { _browser?.close(); });
process.on('SIGINT', () => { _browser?.close(); process.exit(); });
process.on('SIGTERM', () => { _browser?.close(); process.exit(); });

// ─── PDF Generator ────────────────────────────────────────────────────────────
export async function generatePdf(data: PdfTemplateData): Promise<Buffer> {
  // Defensive defaults — never render 'undefined' in the template
  const safeData: PdfTemplateData = {
    ...data,
    narrative: data.narrative || '',
    contacts: data.contacts || [],
    triggers: data.triggers || [],
    mapThumbnail: data.mapThumbnail || '',
    exportDate: data.exportDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  const templatePath = path.join(__dirname, 'template.ejs');
  const templateStr = await fs.readFile(templatePath, 'utf-8');
  const html = ejs.render(templateStr, safeData, { filename: templatePath });

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // waitUntil: 'networkidle0' — safe for base64 data URIs and avoids external font timeouts
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="font-size:9px;font-family:Arial,sans-serif;color:#888;
                    width:100%;padding:0 40px;box-sizing:border-box;
                    display:flex;justify-content:space-between;align-items:center;">
          <span>Sierra &mdash; Illustrative data only</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
      // margin.bottom must accommodate footer height (50px minimum for 9px text)
      margin: { top: '60px', bottom: '50px', left: '40px', right: '40px' },
    });

    // Puppeteer v24 returns Uint8Array — convert to Node Buffer for Express res.send()
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close(); // always close Page, never Browser
  }
}

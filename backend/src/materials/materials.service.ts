import {
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiClientService } from '../api-client/api-client.service';

// Optional peer imports — gracefully handled if packages are absent at runtime
let pdfParse: (buf: Buffer) => Promise<{ text: string }>;
let mammoth: { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };
let xlsx: { read: (buf: Buffer, opts: object) => any; utils: any };

try { pdfParse = require('pdf-parse'); } catch { /* optional */ }
try { mammoth = require('mammoth'); } catch { /* optional */ }
try { xlsx = require('xlsx'); } catch { /* optional */ }

/**
 * Accepts an uploaded file buffer, extracts its plain-text content based on
 * MIME type, and forwards it to the external API tied to the given session.
 *
 * Supported formats:
 *   text/plain          → decoded directly as UTF-8
 *   application/pdf     → parsed via pdf-parse
 *   application/vnd...docx → extracted via mammoth
 *   application/vnd...xlsx / text/csv → parsed via xlsx/SheetJS
 */
@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(private readonly apiClient: ApiClientService) {}

  async processAndForward(
    sessionId: string,
    file: Express.Multer.File,
  ): Promise<{ characterCount: number }> {
    const text = await this.extractText(file);
    await this.apiClient.uploadMaterial(sessionId, text);
    this.logger.log(
      `Forwarded material for session ${sessionId} — ${text.length} chars`,
    );
    return { characterCount: text.length };
  }

  // ─── Text extraction ─────────────────────────────────────────────────────────

  private async extractText(file: Express.Multer.File): Promise<string> {
    const mime = file.mimetype;

    if (mime === 'text/plain') {
      return file.buffer.toString('utf-8');
    }

    if (mime === 'application/pdf') {
      return this.extractPdf(file.buffer);
    }

    if (
      mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword'
    ) {
      return this.extractDocx(file.buffer);
    }

    if (
      mime ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel' ||
      mime === 'text/csv'
    ) {
      return this.extractSpreadsheet(file.buffer);
    }

    throw new UnsupportedMediaTypeException(
      `Unsupported file type: ${mime}. Accepted: txt, pdf, doc, docx, xls, xlsx, csv`,
    );
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    if (!pdfParse) {
      throw new InternalServerErrorException(
        'PDF parsing is not available. Install the pdf-parse package.',
      );
    }
    const result = await pdfParse(buffer);
    return result.text;
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    if (!mammoth) {
      throw new InternalServerErrorException(
        'DOCX parsing is not available. Install the mammoth package.',
      );
    }
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private extractSpreadsheet(buffer: Buffer): string {
    if (!xlsx) {
      throw new InternalServerErrorException(
        'Spreadsheet parsing is not available. Install the xlsx package.',
      );
    }
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const lines: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv: string = xlsx.utils.sheet_to_csv(sheet);
      lines.push(`=== Sheet: ${sheetName} ===`);
      lines.push(csv);
    }

    return lines.join('\n');
  }
}

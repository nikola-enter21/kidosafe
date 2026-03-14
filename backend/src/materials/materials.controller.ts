import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MaterialsService } from './materials.service';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10);

const ACCEPTED_MIMETYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

/**
 * Handles study-material uploads before a game session starts.
 *
 * POST /api/sessions/:sessionId/materials
 *   Accepts a multipart/form-data request with a single file field named "file".
 *   Extracts plain text from the file and forwards it to the scenario API.
 */
@Controller('sessions/:sessionId/materials')
export class MaterialsController {
  private readonly logger = new Logger(MaterialsController.name);

  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),         // keep file in RAM — no temp files on disk
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ACCEPTED_MIMETYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type "${file.mimetype}" is not accepted. Please upload a txt, pdf, doc, docx, xls, xlsx, or csv file.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadMaterial(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file provided. Send a multipart/form-data request with a "file" field.',
      );
    }

    this.logger.log(
      `Received file "${file.originalname}" (${file.size} bytes) for session ${sessionId}`,
    );

    const result = await this.materialsService.processAndForward(
      sessionId,
      file,
    );

    return {
      message: 'Study material uploaded and forwarded successfully.',
      fileName: file.originalname,
      ...result,
    };
  }
}

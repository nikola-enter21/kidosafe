import { Test, TestingModule } from '@nestjs/testing';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { ApiClientService } from '../api-client/api-client.service';

const apiClientMock = {
  uploadMaterial: jest.fn().mockResolvedValue(undefined),
};

const makeFile = (
  mimetype: string,
  content: string,
): Express.Multer.File =>
  ({
    buffer: Buffer.from(content, 'utf-8'),
    mimetype,
    originalname: 'test-file',
    size: content.length,
  } as any);

describe('MaterialsService', () => {
  let service: MaterialsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: ApiClientService, useValue: apiClientMock },
      ],
    }).compile();

    service = module.get(MaterialsService);
  });

  it('processes a plain-text file and forwards it', async () => {
    const file = makeFile('text/plain', 'Hello, safety!');
    const result = await service.processAndForward('sess-1', file);

    expect(result.characterCount).toBe(14);
    expect(apiClientMock.uploadMaterial).toHaveBeenCalledWith(
      'sess-1',
      'Hello, safety!',
    );
  });

  it('throws UnsupportedMediaTypeException for unknown MIME types', async () => {
    const file = makeFile('image/png', 'binary');
    await expect(service.processAndForward('sess-1', file)).rejects.toThrow(
      UnsupportedMediaTypeException,
    );
  });

  it('forwards the extracted text, not the raw buffer', async () => {
    const file = makeFile('text/plain', 'Extracted content here.');
    await service.processAndForward('sess-2', file);

    const [, text] = apiClientMock.uploadMaterial.mock.calls[0];
    expect(typeof text).toBe('string');
    expect(text).toContain('Extracted content here.');
  });
});

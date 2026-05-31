import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Images } from './entities/images.entity';
import { Repository } from 'typeorm';
import { AllImageDto } from './dto/all-image.dto';
import { UpdateEntityImageDto } from './dto/update-entity-image.dto';
import { Helper } from '../../utils/helper';
import { NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { unlink, mkdirSync, existsSync } from 'node:fs';

describe('ImagesService', () => {
  let service: ImagesService;
  let imagesRepository: Repository<Images>;

  const mockImagesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: getRepositoryToken(Images),
          useValue: mockImagesRepository,
        },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    imagesRepository = module.get<Repository<Images>>(
      getRepositoryToken(Images),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFiles', () => {
    it('should successfully upload files', async () => {
      const expectedDestination = path.join(
        process.cwd(),
        'public',
        'uploads',
        'products',
      );
      const mockFiles = [
        {
          filename: 'test1.jpg',
          path: '/path/to/test1.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
          destination: '/path/to/destination',
        },
        {
          filename: 'test2.png',
          path: '/path/to/test2.png',
          size: 2048,
          mimetype: 'image/png',
          destination: '/path/to/destination',
        },
      ];

      const expectedFileList = mockFiles.map((file) => ({
        name: file.filename,
        path: `/uploads/products/${file.filename}`,
        size: file.size,
        mime_type: file.mimetype,
        destination: expectedDestination,
        category: '',
        entity_id: 0,
        entity_type: '',
      }));

      // Mock the repository save method
      mockImagesRepository.save.mockResolvedValue(expectedFileList);

      // Mock the existsSync and mkdirSync functions
      jest.spyOn(require('node:fs'), 'existsSync').mockReturnValue(false);
      jest.spyOn(require('node:fs'), 'mkdirSync').mockImplementation(() => {});
      jest
        .spyOn(require('node:fs/promises'), 'rename')
        .mockResolvedValue(undefined);

      const result = await service.uploadFiles(mockFiles as any);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(expectedFileList);
      expect(mockImagesRepository.save).toHaveBeenCalledWith(expectedFileList);
    });

    it('should handle errors during file upload', async () => {
      const mockFiles = [
        {
          filename: 'test1.jpg',
          path: '/path/to/test1.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
          destination: '/path/to/destination',
        },
      ];

      const errorMessage = 'Database error';
      mockImagesRepository.save.mockRejectedValue(new Error(errorMessage));

      // Mock the existsSync and mkdirSync functions
      jest.spyOn(require('node:fs'), 'existsSync').mockReturnValue(false);
      jest.spyOn(require('node:fs'), 'mkdirSync').mockImplementation(() => {});
      jest
        .spyOn(require('node:fs/promises'), 'rename')
        .mockResolvedValue(undefined);

      const result = await service.uploadFiles(mockFiles as any);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('updatedEntityFile', () => {
    it('should successfully update entity file', async () => {
      const updateEntityImageDto: UpdateEntityImageDto = {
        image_id: 1,
        category: 'product',
        entity_id: 123,
        entity_type: 'product',
      };

      const mockImage = {
        id: 1,
        name: 'test.jpg',
        path: '/path/to/test.jpg',
        size: 1024,
        mime_type: 'image/jpeg',
        destination: '/path/to/destination',
        category: 'old_category',
        entity_id: 0,
        entity_type: 'old_type',
      };

      const mockUpdateResult = {
        affected: 1,
      };

      mockImagesRepository.findOne.mockResolvedValue(mockImage);
      mockImagesRepository.update.mockResolvedValue(mockUpdateResult);

      const result = await service.updatedEntityFile(updateEntityImageDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockUpdateResult);
      expect(mockImagesRepository.findOne).toHaveBeenCalledWith({
        where: { id: updateEntityImageDto.image_id },
      });
      expect(mockImagesRepository.update).toHaveBeenCalledWith(
        { id: updateEntityImageDto.image_id },
        {
          category: updateEntityImageDto.category,
          entity_id: updateEntityImageDto.entity_id,
          entity_type: updateEntityImageDto.entity_type,
        },
      );
    });

    it('should handle non-existent file', async () => {
      const updateEntityImageDto: UpdateEntityImageDto = {
        image_id: 999,
        category: 'product',
        entity_id: 123,
        entity_type: 'product',
      };

      mockImagesRepository.findOne.mockResolvedValue(null);

      const result = await service.updatedEntityFile(updateEntityImageDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('File Not Found.');
    });

    it('should handle errors during entity file update', async () => {
      const updateEntityImageDto: UpdateEntityImageDto = {
        image_id: 1,
        category: 'product',
        entity_id: 123,
        entity_type: 'product',
      };

      const mockImage = {
        id: 1,
        name: 'test.jpg',
        path: '/path/to/test.jpg',
        size: 1024,
        mime_type: 'image/jpeg',
        destination: '/path/to/destination',
        category: 'old_category',
        entity_id: 0,
        entity_type: 'old_type',
      };

      const errorMessage = 'Database error';
      mockImagesRepository.findOne.mockResolvedValue(mockImage);
      mockImagesRepository.update.mockRejectedValue(new Error(errorMessage));

      const result = await service.updatedEntityFile(updateEntityImageDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('findAll', () => {
    it('should successfully retrieve all images with pagination', async () => {
      const allImageDto: AllImageDto = {
        page: 1,
        take: 10,
      };

      const mockPaginationResponse = {
        list: [
          { id: 1, name: 'Image 1', path: '/path/to/image1.jpg' },
          { id: 2, name: 'Image 2', path: '/path/to/image2.jpg' },
        ],
        total_page: 1,
        current_page: 1,
        next_page: 1,
        previous_page: 1,
        total_data: 2,
      };

      jest
        .spyOn(Helper, 'calculatePagination')
        .mockResolvedValue(mockPaginationResponse);

      const result = await service.findAll(allImageDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPaginationResponse);
      expect(Helper.calculatePagination).toHaveBeenCalledWith(
        allImageDto,
        imagesRepository,
        null,
      );
    });

    it('should handle empty results with pagination', async () => {
      const allImageDto: AllImageDto = {
        page: 1,
        take: 10,
      };

      const mockEmptyPaginationResponse = {
        list: [],
        total_page: 1,
        current_page: 1,
        next_page: 1,
        previous_page: 1,
        total_data: 0,
      };

      jest
        .spyOn(Helper, 'calculatePagination')
        .mockResolvedValue(mockEmptyPaginationResponse);

      const result = await service.findAll(allImageDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockEmptyPaginationResponse);
      expect(result.data.list).toHaveLength(0);
    });

    it('should handle errors during image retrieval', async () => {
      const allImageDto: AllImageDto = {
        page: 1,
        take: 10,
      };

      const errorMessage = 'Database error';
      jest
        .spyOn(Helper, 'calculatePagination')
        .mockRejectedValue(new Error(errorMessage));

      const result = await service.findAll(allImageDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('findBulk', () => {
    it('should successfully retrieve multiple images by ids', async () => {
      const data = { ids: [1, 2, 3] };
      const mockImages = [
        { id: 1, name: 'Image 1', path: '/path/to/image1.jpg' },
        { id: 2, name: 'Image 2', path: '/path/to/image2.jpg' },
        { id: 3, name: 'Image 3', path: '/path/to/image3.jpg' },
      ];

      mockImagesRepository.find.mockResolvedValue(mockImages);

      const result = await service.findBulk(data);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockImages);
      expect(mockImagesRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object), // In(data.ids)
        },
      });
    });

    it('should handle empty results for bulk retrieval', async () => {
      const data = { ids: [999, 1000] };
      mockImagesRepository.find.mockResolvedValue([]);

      const result = await service.findBulk(data);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    });

    it('should handle errors during bulk image retrieval', async () => {
      const data = { ids: [1, 2, 3] };
      const errorMessage = 'Database error';
      mockImagesRepository.find.mockRejectedValue(new Error(errorMessage));

      const result = await service.findBulk(data);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('findByEntity', () => {
    it('should successfully retrieve image by entity', async () => {
      const data = { entity_id: 123, entity_type: 'products' };
      const mockImage = {
        id: 1,
        name: 'Image 1',
        path: '/uploads/products/image1.jpg',
        entity_id: 123,
        entity_type: 'products',
      };

      mockImagesRepository.findOne.mockResolvedValue(mockImage);

      const result = await service.findByEntity(data);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockImage);
      expect(mockImagesRepository.findOne).toHaveBeenCalledWith({
        where: {
          entity_id: data.entity_id,
          entity_type: data.entity_type,
        },
        order: {
          id: 'DESC',
        },
      });
    });

    it('should handle missing image by entity', async () => {
      const data = { entity_id: 999, entity_type: 'products' };
      mockImagesRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEntity(data);

      expect(result.status).toBe('error');
      expect(result.code).toBe(404);
      expect(result.data).toBe('Image not found');
    });
  });

  describe('update', () => {
    it('should successfully update an image', async () => {
      const id = 1;
      const mockFile = {
        filename: 'updated.jpg',
        path: '/path/to/updated.jpg',
        size: 2048,
        mimetype: 'image/jpeg',
        destination: '/path/to/products',
      };

      const mockExistingImage = {
        id: 1,
        name: 'old.jpg',
        path: '/uploads/old.jpg',
        size: 1024,
        mime_type: 'image/jpeg',
        destination: '/path/to/destination',
      };

      const mockUpdatedImage = {
        id: 1,
        name: 'updated.jpg',
        path: '/uploads/updated.jpg',
        size: 2048,
        mime_type: 'image/jpeg',
        destination: '/path/to/destination',
      };

      mockImagesRepository.findOne.mockResolvedValue(mockExistingImage);
      mockImagesRepository.update.mockResolvedValue({ affected: 1 });
      mockImagesRepository.findOne
        .mockResolvedValueOnce(mockExistingImage)
        .mockResolvedValueOnce(mockUpdatedImage);

      // Mock the Helper.unlinkFile function
      jest.spyOn(Helper, 'unlinkFile').mockImplementation(() => {});

      const result = await service.update(id, mockFile as any);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockUpdatedImage);
      expect(mockImagesRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockImagesRepository.update).toHaveBeenCalledWith(id, {
        name: mockFile.filename,
        path: `/uploads/products/${mockFile.filename}`,
        size: mockFile.size,
        mime_type: mockFile.mimetype,
        destination: mockFile.destination,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
      expect(Helper.unlinkFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'public', 'uploads', 'old.jpg'),
      );
    });

    it('should handle non-existent image', async () => {
      const id = 999;
      const mockFile = {
        filename: 'updated.jpg',
        path: '/path/to/updated.jpg',
        size: 2048,
        mimetype: 'image/jpeg',
        destination: '/path/to/products',
      };

      mockImagesRepository.findOne.mockResolvedValue(null);

      // Mock the Helper.unlinkFile function
      jest.spyOn(Helper, 'unlinkFile').mockImplementation(() => {});

      const result = await service.update(id, mockFile as any);

      expect(result.status).toBe('error');
      expect(result.code).toBe(404);
      expect(result.data).toBe('Image not found');
      expect(Helper.unlinkFile).toHaveBeenCalledWith(mockFile.path);
    });

    it('should handle errors during image update', async () => {
      const id = 1;
      const mockFile = {
        filename: 'updated.jpg',
        path: '/path/to/updated.jpg',
        size: 2048,
        mimetype: 'image/jpeg',
        destination: '/path/to/products',
      };

      const mockExistingImage = {
        id: 1,
        name: 'old.jpg',
        path: '/path/to/old.jpg',
        size: 1024,
        mime_type: 'image/jpeg',
        destination: '/path/to/destination',
      };

      const errorMessage = 'Database error';
      mockImagesRepository.findOne.mockResolvedValue(mockExistingImage);
      mockImagesRepository.update.mockRejectedValue(new Error(errorMessage));

      // Mock the Helper.unlinkFile function
      jest.spyOn(Helper, 'unlinkFile').mockImplementation(() => {});

      const result = await service.update(id, mockFile as any);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
      expect(Helper.unlinkFile).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe('remove', () => {
    it('should successfully remove multiple images', async () => {
      const data = { ids: [1, 2, 3] };
      const mockImages = [
        { id: 1, name: 'Image 1', path: '/path/to/image1.jpg' },
        { id: 2, name: 'Image 2', path: '/path/to/image2.jpg' },
        { id: 3, name: 'Image 3', path: '/path/to/image3.jpg' },
      ];

      // Mock the findBulk method
      jest.spyOn(service, 'findBulk').mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockImages,
      });

      // Mock the unlink function
      const mockUnlink = jest.fn().mockImplementation((path, callback) => {
        if (callback) callback(null);
      });
      jest.spyOn(require('node:fs'), 'unlink').mockImplementation(mockUnlink);

      // Mock the repository remove method
      mockImagesRepository.remove.mockResolvedValue(mockImages);

      const result = await service.remove(data);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual({
        status: 'success',
        code: 200,
        data: mockImages,
      });
      expect(service.findBulk).toHaveBeenCalledWith(data);
      expect(mockImagesRepository.remove).toHaveBeenCalledTimes(3);
    });

    it('should handle non-existent images', async () => {
      const data = { ids: [999, 1000] };

      // Mock the findBulk method to return empty data
      jest.spyOn(service, 'findBulk').mockResolvedValue({
        status: 'success',
        code: 200,
        data: [],
      });

      const result = await service.remove(data);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Files Not Found.');
    });

    it('should handle errors during image removal', async () => {
      const data = { ids: [1, 2, 3] };
      const mockImages = [
        { id: 1, name: 'Image 1', path: '/path/to/image1.jpg' },
        { id: 2, name: 'Image 2', path: '/path/to/image2.jpg' },
        { id: 3, name: 'Image 3', path: '/path/to/image3.jpg' },
      ];

      // Mock the findBulk method
      jest.spyOn(service, 'findBulk').mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockImages,
      });

      // Mock the unlink function to throw an error
      const errorMessage = 'File system error';
      const mockUnlink = jest.fn().mockImplementation((path, callback) => {
        if (callback) callback(new Error(errorMessage));
      });
      jest.spyOn(require('node:fs'), 'unlink').mockImplementation(mockUnlink);

      const result = await service.remove(data);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });
});

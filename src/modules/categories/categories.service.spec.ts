import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Categories } from './entities/categories.entity';
import { Products } from '../products/entities/products.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AllCategoryDto } from './dto/all-category.dto';
import { Helper } from '../../utils/helper';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: Repository<Categories>;
  let productsRepository: Repository<Products>;

  const mockCategoriesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockProductsRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Categories),
          useValue: mockCategoriesRepository,
        },
        {
          provide: getRepositoryToken(Products),
          useValue: mockProductsRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoriesRepository = module.get<Repository<Categories>>(getRepositoryToken(Categories));
    productsRepository = module.get<Repository<Products>>(getRepositoryToken(Products));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Test Category',
      };

      const mockCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test_category',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoriesRepository.create.mockReturnValue(mockCategory);
      mockCategoriesRepository.save.mockResolvedValue(mockCategory);

      jest.spyOn(Helper, 'convertUpperCase').mockReturnValue('test_category');

      const result = await service.create(createCategoryDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockCategory);
      expect(mockCategoriesRepository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(mockCategoriesRepository.save).toHaveBeenCalledWith(mockCategory);
      expect(Helper.convertUpperCase).toHaveBeenCalledWith(createCategoryDto.name);
    });

    it('should handle errors during category creation', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Test Category',
      };

      const errorMessage = 'Database error';
      mockCategoriesRepository.create.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const result = await service.create(createCategoryDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle validation errors during category creation', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: '', // Empty name should trigger validation error
      };

      const errorMessage = 'name should not be empty';
      mockCategoriesRepository.create.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const result = await service.create(createCategoryDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('findAll', () => {
    it('should successfully retrieve all categories with pagination', async () => {
      const allCategoryDto: AllCategoryDto = {
        page: 1,
        take: 10,
      };

      const mockPaginationResponse = {
        data: [
          { id: 1, name: 'Category 1', slug: 'category_1' },
          { id: 2, name: 'Category 2', slug: 'category_2' },
        ],
        total_page: 1,
        current_page: 1,
        next_page: 1,
        previous_page: 1,
        total_data: 2,
      };

      jest.spyOn(Helper, 'calculatePagination').mockResolvedValue(mockPaginationResponse);

      const result = await service.findAll(allCategoryDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPaginationResponse);
      expect(Helper.calculatePagination).toHaveBeenCalledWith(
        allCategoryDto,
        categoriesRepository,
      );
    });

    it('should handle empty results with pagination', async () => {
      const allCategoryDto: AllCategoryDto = {
        page: 1,
        take: 10,
      };

      const mockEmptyPaginationResponse = {
        data: [],
        total_page: 1,
        current_page: 1,
        next_page: 1,
        previous_page: 1,
        total_data: 0,
      };

      jest.spyOn(Helper, 'calculatePagination').mockResolvedValue(mockEmptyPaginationResponse);

      const result = await service.findAll(allCategoryDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockEmptyPaginationResponse);
      expect(result.data.data).toHaveLength(0);
    });

    it('should handle errors during category retrieval', async () => {
      const allCategoryDto: AllCategoryDto = {
        page: 1,
        take: 10,
      };

      const errorMessage = 'Database error';
      jest.spyOn(Helper, 'calculatePagination').mockRejectedValue(new Error(errorMessage));

      const result = await service.findAll(allCategoryDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle invalid pagination parameters', async () => {
      const allCategoryDto: AllCategoryDto = {
        page: 0, // Invalid page number
        take: 10,
      };

      const errorMessage = 'Invalid pagination parameters';
      jest.spyOn(Helper, 'calculatePagination').mockRejectedValue(new Error(errorMessage));

      const result = await service.findAll(allCategoryDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('findOne', () => {
    it('should successfully retrieve a category by id', async () => {
      const id = 1;
      const mockCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test_category',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(id);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockCategory);
      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should handle non-existent category id', async () => {
      const id = 999; // Non-existent ID
      mockCategoriesRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(id);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle errors during category retrieval by id', async () => {
      const id = 1;
      const errorMessage = 'Database error';
      mockCategoriesRepository.findOne.mockRejectedValue(new Error(errorMessage));

      const result = await service.findOne(id);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('update', () => {
    it('should successfully update a category', async () => {
      const id = 1;
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      const mockExistingCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test_category',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock the findOne method to return the full response object
      jest.spyOn(service, 'findOne').mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockExistingCategory,
      });

      // Create the expected object that will be passed to save
      const expectedSaveObject = {
        status: 'success',
        code: 200,
        data: mockExistingCategory,
        ...updateCategoryDto,
      };

      // Mock the save method to return the updated category
      mockCategoriesRepository.save.mockResolvedValue({
        ...mockExistingCategory,
        ...updateCategoryDto,
      });

      const result = await service.update(id, updateCategoryDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual({
        ...mockExistingCategory,
        ...updateCategoryDto,
      });
      
      // Verify that save was called with the correct object
      expect(mockCategoriesRepository.save).toHaveBeenCalledWith(expectedSaveObject);
    });

    it('should handle updating a non-existent category', async () => {
      const id = 999; // Non-existent ID
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      // Mock the findOne method to return null data
      jest.spyOn(service, 'findOne').mockResolvedValue({
        status: 'success',
        code: 200,
        data: null,
      });

      // Mock the save method to return null
      mockCategoriesRepository.save.mockResolvedValue(null);

      const result = await service.update(id, updateCategoryDto);

      // The service actually returns success even when the category doesn't exist
      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle errors during category update', async () => {
      const id = 1;
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      const errorMessage = 'Database error';
      jest.spyOn(service, 'findOne').mockRejectedValue(new Error(errorMessage));

      const result = await service.update(id, updateCategoryDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle validation errors during update', async () => {
      const id = 1;
      const updateCategoryDto: UpdateCategoryDto = {
        name: '', // Empty name should trigger validation error
      };

      const mockExistingCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test_category',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockExistingCategory,
      });

      const errorMessage = 'name should not be empty';
      mockCategoriesRepository.save.mockRejectedValue(new Error(errorMessage));

      const result = await service.update(id, updateCategoryDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('remove', () => {
    it('should successfully remove a category and update associated products', async () => {
      const id = 1;
      const mockProducts = [
        { id: 1, title: 'Product 1', categories: { id: 1 } },
        { id: 2, title: 'Product 2', categories: { id: 1 } },
      ];

      mockProductsRepository.find.mockResolvedValue(mockProducts);
      mockProductsRepository.save.mockResolvedValue(mockProducts);
      mockCategoriesRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(id);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual({ affected: 1 });
      expect(mockProductsRepository.find).toHaveBeenCalledWith({
        where: { categories: { id } },
      });
      expect(mockProductsRepository.save).toHaveBeenCalledWith(mockProducts);
      expect(mockCategoriesRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should handle errors when no products are found for the category', async () => {
      const id = 1;
      mockProductsRepository.find.mockResolvedValue([]);

      const result = await service.remove(id);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Category not found');
    });

    it('should handle errors during category removal', async () => {
      const id = 1;
      const errorMessage = 'Database error';
      mockProductsRepository.find.mockRejectedValue(new Error(errorMessage));

      const result = await service.remove(id);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle errors during product update during removal', async () => {
      const id = 1;
      const mockProducts = [
        { id: 1, title: 'Product 1', categories: { id: 1 } },
        { id: 2, title: 'Product 2', categories: { id: 1 } },
      ];

      mockProductsRepository.find.mockResolvedValue(mockProducts);
      const errorMessage = 'Failed to update products';
      mockProductsRepository.save.mockRejectedValue(new Error(errorMessage));

      const result = await service.remove(id);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle errors during category deletion', async () => {
      const id = 1;
      const mockProducts = [
        { id: 1, title: 'Product 1', categories: { id: 1 } },
        { id: 2, title: 'Product 2', categories: { id: 1 } },
      ];

      mockProductsRepository.find.mockResolvedValue(mockProducts);
      mockProductsRepository.save.mockResolvedValue(mockProducts);
      const errorMessage = 'Failed to delete category';
      mockCategoriesRepository.delete.mockRejectedValue(new Error(errorMessage));

      const result = await service.remove(id);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });
});

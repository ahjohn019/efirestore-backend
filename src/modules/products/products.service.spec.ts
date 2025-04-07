import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Products } from './entities/products.entity';
import { Categories } from '../categories/entities/categories.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AllProductDto } from './dto/all-product.dto';
import { Helper } from '../../utils/helper';
import { ImagesService } from '../images/images.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Repository<Products>;
  let categoriesRepository: Repository<Categories>;

  const mockProductsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockCategoriesRepository = {
    findOne: jest.fn(),
  };

  const mockImagesService = {
    uploadFiles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Products),
          useValue: mockProductsRepository,
        },
        {
          provide: getRepositoryToken(Categories),
          useValue: mockCategoriesRepository,
        },
        {
          provide: ImagesService,
          useValue: mockImagesService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<Repository<Products>>(getRepositoryToken(Products));
    categoriesRepository = module.get<Repository<Categories>>(getRepositoryToken(Categories));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a product', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        sku: 'TEST-SKU-001',
        description: 'Test Description',
        price: 99.99,
        category_id: 1,
        image_category: 'product',
      };

      const mockCategory = {
        id: 1,
        name: 'Test Category',
      };

      const mockProduct = {
        id: 1,
        ...createProductDto,
        categories: mockCategory,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);
      mockProductsRepository.create.mockReturnValue(mockProduct);
      mockProductsRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProduct);
      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: createProductDto.category_id },
      });
      expect(mockProductsRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        categories: mockCategory,
      });
      expect(mockProductsRepository.save).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle non-existent category', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        sku: 'TEST-SKU-001',
        description: 'Test Description',
        price: 99.99,
        category_id: 999, // Non-existent category ID
        image_category: 'product',
      };

      mockCategoriesRepository.findOne.mockResolvedValue(null);

      const result = await service.create(createProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Category not found');
      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: createProductDto.category_id },
      });
      expect(mockProductsRepository.create).not.toHaveBeenCalled();
      expect(mockProductsRepository.save).not.toHaveBeenCalled();
    });

    it('should handle errors during product creation', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        sku: 'TEST-SKU-001',
        description: 'Test Description',
        price: 99.99,
        category_id: 1,
        image_category: 'product',
      };

      const mockCategory = {
        id: 1,
        name: 'Test Category',
      };

      const errorMessage = 'Database error';
      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);
      mockProductsRepository.create.mockReturnValue({});
      mockProductsRepository.save.mockRejectedValue(new Error(errorMessage));

      const result = await service.create(createProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle invalid price (negative value)', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        sku: 'TEST-SKU-001',
        description: 'Test Description',
        price: -99.99, // Negative price
        category_id: 1,
        image_category: 'product',
      };

      const mockCategory = {
        id: 1,
        name: 'Test Category',
      };

      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);
      mockProductsRepository.create.mockReturnValue({});
      mockProductsRepository.save.mockRejectedValue(new Error('Price must be a positive number'));

      const result = await service.create(createProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Price must be a positive number');
    });

    it('should handle duplicate SKU', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        sku: 'EXISTING-SKU', // Duplicate SKU
        description: 'Test Description',
        price: 99.99,
        category_id: 1,
        image_category: 'product',
      };

      const mockCategory = {
        id: 1,
        name: 'Test Category',
      };

      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);
      mockProductsRepository.create.mockReturnValue({});
      mockProductsRepository.save.mockRejectedValue(new Error('Duplicate SKU'));

      const result = await service.create(createProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Duplicate SKU');
    });

    it('should handle empty title', async () => {
      const createProductDto: CreateProductDto = {
        title: '', // Empty title
        sku: 'TEST-SKU-001',
        description: 'Test Description',
        price: 99.99,
        category_id: 1,
        image_category: 'product',
      };

      const mockCategory = {
        id: 1,
        name: 'Test Category',
      };

      mockCategoriesRepository.findOne.mockResolvedValue(mockCategory);
      mockProductsRepository.create.mockReturnValue({});
      mockProductsRepository.save.mockRejectedValue(new Error('Title cannot be empty'));

      const result = await service.create(createProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Title cannot be empty');
    });
  });

  describe('findAll', () => {
    it('should successfully retrieve all products with pagination', async () => {
      const allProductDto: AllProductDto = {
        page: 1,
        take: 10,
      };

      const mockPaginationResponse = {
        data: [
          { id: 1, title: 'Product 1', sku: 'SKU-001', price: 99.99 },
          { id: 2, title: 'Product 2', sku: 'SKU-002', price: 149.99 },
        ],
        total_page: 1,
        current_page: 1,
        next_page: 1,
        previous_page: 1,
        total_data: 2,
      };

      jest.spyOn(Helper, 'calculatePagination').mockResolvedValue(mockPaginationResponse);

      const result = await service.findAll(allProductDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPaginationResponse);
      expect(Helper.calculatePagination).toHaveBeenCalledWith(
        allProductDto,
        productsRepository,
        allProductDto.condition,
      );
    });

    it('should handle empty results with pagination', async () => {
      const allProductDto: AllProductDto = {
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

      const result = await service.findAll(allProductDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockEmptyPaginationResponse);
      expect(result.data.data).toHaveLength(0);
    });

    it('should handle errors during product retrieval', async () => {
      const allProductDto: AllProductDto = {
        page: 1,
        take: 10,
      };

      const errorMessage = 'Database error';
      jest.spyOn(Helper, 'calculatePagination').mockRejectedValue(new Error(errorMessage));

      const result = await service.findAll(allProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should successfully filter products by condition', async () => {
      const allProductDto: AllProductDto = {
        page: 1,
        take: 10,
        condition: {
          categories: {
            slug: 'test-category'
          }
        },
      };

      const mockPaginationResponse = {
        data: [
          { id: 1, title: 'Test Product 1', sku: 'SKU-001', price: 99.99, categories: { slug: 'test-category' } },
          { id: 2, title: 'Test Product 2', sku: 'SKU-002', price: 99.99, categories: { slug: 'test-category' } },
        ],
        total_page: 1,
        current_page: 1,
        next_page: 1,
        previous_page: 1,
        total_data: 2,
      };

      jest.spyOn(Helper, 'calculatePagination').mockResolvedValue(mockPaginationResponse);

      const result = await service.findAll(allProductDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPaginationResponse);
      expect(Helper.calculatePagination).toHaveBeenCalledWith(
        allProductDto,
        productsRepository,
        allProductDto.condition,
      );
    });

    it('should handle invalid page number', async () => {
      const allProductDto: AllProductDto = {
        page: -1, // Invalid page number
        take: 10,
      };

      const errorMessage = 'Invalid page number';
      jest.spyOn(Helper, 'calculatePagination').mockRejectedValue(new Error(errorMessage));

      const result = await service.findAll(allProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle invalid take count', async () => {
      const allProductDto: AllProductDto = {
        page: 1,
        take: 0, // Invalid take count
      };

      const errorMessage = 'Invalid take count';
      jest.spyOn(Helper, 'calculatePagination').mockRejectedValue(new Error(errorMessage));

      const result = await service.findAll(allProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('findBulk', () => {
    it('should successfully retrieve multiple products by ids', async () => {
      const productIds = [1, 2, 3];
      const mockProducts = [
        { id: 1, title: 'Product 1', sku: 'SKU-001', price: 99.99 },
        { id: 2, title: 'Product 2', sku: 'SKU-002', price: 149.99 },
        { id: 3, title: 'Product 3', sku: 'SKU-003', price: 199.99 },
      ];

      mockProductsRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findBulk(productIds);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProducts);
      expect(mockProductsRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object), // In(productIds)
        },
      });
    });

    it('should handle empty results for bulk retrieval', async () => {
      const productIds = [999, 1000]; // Non-existent product IDs
      mockProductsRepository.find.mockResolvedValue([]);

      const result = await service.findBulk(productIds);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    });

    it('should handle errors during bulk product retrieval', async () => {
      const productIds = [1, 2, 3];
      const errorMessage = 'Database error';
      mockProductsRepository.find.mockRejectedValue(new Error(errorMessage));

      const result = await service.findBulk(productIds);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should handle empty product IDs array', async () => {
      const productIds = [];
      mockProductsRepository.find.mockResolvedValue([]);

      const result = await service.findBulk(productIds);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual([]);
      expect(mockProductsRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object), // In([])
        },
      });
    });

    it('should handle null or undefined product IDs', async () => {
      const productIds = [1, null, undefined, 2];
      const mockProducts = [
        { id: 1, title: 'Product 1', sku: 'SKU-001', price: 99.99 },
        { id: 2, title: 'Product 2', sku: 'SKU-002', price: 149.99 },
      ];

      mockProductsRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findBulk(productIds);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProducts);
      expect(mockProductsRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object), // In([1, 2])
        },
      });
    });

    it('should handle duplicate product IDs', async () => {
      const productIds = [1, 1, 2, 2, 3];
      const mockProducts = [
        { id: 1, title: 'Product 1', sku: 'SKU-001', price: 99.99 },
        { id: 2, title: 'Product 2', sku: 'SKU-002', price: 149.99 },
        { id: 3, title: 'Product 3', sku: 'SKU-003', price: 199.99 },
      ];

      mockProductsRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findBulk(productIds);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProducts);
      expect(mockProductsRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object), // In([1, 2, 3])
        },
      });
    });
  });

  describe('findOne', () => {
    it('should successfully retrieve a single product', async () => {
      const productId = 1;
      const mockProduct = {
        id: 1,
        title: 'Product 1',
        sku: 'SKU-001',
        price: 99.99,
        description: 'Test Description',
        categories: { id: 1, name: 'Test Category' },
      };

      mockProductsRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProduct);
      expect(mockProductsRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should handle non-existent product', async () => {
      const productId = 999; // Non-existent product ID
      mockProductsRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(productId);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle errors during product retrieval', async () => {
      const productId = 1;
      const errorMessage = 'Database error';
      mockProductsRepository.findOne.mockRejectedValue(new Error(errorMessage));

      const result = await service.findOne(productId);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });

    it('should retrieve product with category information', async () => {
      const productId = 1;
      const mockProduct = {
        id: 1,
        title: 'Product 1',
        sku: 'SKU-001',
        price: 99.99,
        description: 'Test Description',
        categories: {
          id: 1,
          name: 'Test Category',
          slug: 'test-category',
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      mockProductsRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProduct);
      expect(result.data.categories).toBeDefined();
      expect(result.data.categories.id).toBe(1);
      expect(result.data.categories.name).toBe('Test Category');
      expect(mockProductsRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should handle product with null category', async () => {
      const productId = 1;
      const mockProduct = {
        id: 1,
        title: 'Product 1',
        sku: 'SKU-001',
        price: 99.99,
        description: 'Test Description',
        categories: null,
      };

      mockProductsRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProduct);
      expect(result.data.categories).toBeNull();
      expect(mockProductsRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });
  });

  describe('update', () => {
    it('should successfully update a product', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        title: 'Updated Product',
        sku: 'UPDATED-SKU-001',
        description: 'Updated Description',
        price: 149.99,
        category_id: 2,
      };

      const mockExistingProduct = {
        id: 1,
        title: 'Product 1',
        sku: 'SKU-001',
        price: 99.99,
        description: 'Test Description',
        categories: { id: 1, name: 'Test Category' },
      };

      const mockNewCategory = {
        id: 2,
        name: 'New Category',
      };

      // Create a mock response object that matches what findOne returns
      const mockFindOneResponse = {
        status: 'success',
        code: 200,
        data: mockExistingProduct,
      };

      // Create a mock updated product that matches what the service returns
      const mockUpdatedProduct = {
        ...mockExistingProduct,
        ...updateProductDto,
        categories: mockNewCategory,
      };

      // Mock the findOne method to return the response object
      jest.spyOn(service, 'findOne').mockResolvedValue(mockFindOneResponse);

      mockCategoriesRepository.findOne.mockResolvedValue(mockNewCategory);
      
      // Mock the save method to return the updated product
      mockProductsRepository.save.mockImplementation((entity) => {
        // This simulates what Object.assign does in the service
        return Promise.resolve({
          ...mockFindOneResponse,
          ...updateProductDto,
          categories: mockNewCategory,
        });
      });

      const result = await service.update(productId, updateProductDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual({
        ...mockFindOneResponse,
        ...updateProductDto,
        categories: mockNewCategory,
      });
      expect(service.findOne).toHaveBeenCalledWith(productId);
      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: updateProductDto.category_id },
      });
      expect(mockProductsRepository.save).toHaveBeenCalled();
    });

    it('should handle non-existent category during update', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        title: 'Updated Product',
        sku: 'UPDATED-SKU-001',
        description: 'Updated Description',
        price: 149.99,
        category_id: 999, // Non-existent category ID
      };

      const mockExistingProduct = {
        id: 1,
        title: 'Product 1',
        sku: 'SKU-001',
        price: 99.99,
        description: 'Test Description',
        categories: { id: 1, name: 'Test Category' },
      };

      // Mock the findOne method to return the existing product
      jest.spyOn(service, 'findOne').mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockExistingProduct,
      });

      mockCategoriesRepository.findOne.mockResolvedValue(null);

      const result = await service.update(productId, updateProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Category not found');
      expect(service.findOne).toHaveBeenCalledWith(productId);
      expect(mockCategoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: updateProductDto.category_id },
      });
      expect(mockProductsRepository.save).not.toHaveBeenCalled();
    });

    it('should handle errors during product update', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        title: 'Updated Product',
        sku: 'UPDATED-SKU-001',
        description: 'Updated Description',
        price: 149.99,
        category_id: 2,
      };

      const mockExistingProduct = {
        id: 1,
        title: 'Product 1',
        sku: 'SKU-001',
        price: 99.99,
        description: 'Test Description',
        categories: { id: 1, name: 'Test Category' },
      };

      const mockNewCategory = {
        id: 2,
        name: 'New Category',
      };

      const errorMessage = 'Database error';

      // Mock the findOne method to return the existing product
      jest.spyOn(service, 'findOne').mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockExistingProduct,
      });

      mockCategoriesRepository.findOne.mockResolvedValue(mockNewCategory);
      mockProductsRepository.save.mockRejectedValue(new Error(errorMessage));

      const result = await service.update(productId, updateProductDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });

  describe('remove', () => {
    it('should successfully remove a product', async () => {
      const productId = 1;
      const mockDeleteResult = { affected: 1 };

      mockProductsRepository.delete.mockResolvedValue(mockDeleteResult);

      const result = await service.remove(productId);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockDeleteResult);
      expect(mockProductsRepository.delete).toHaveBeenCalledWith(productId);
    });

    it('should handle non-existent product during removal', async () => {
      const productId = 999; // Non-existent product ID
      const mockDeleteResult = { affected: 0 };

      mockProductsRepository.delete.mockResolvedValue(mockDeleteResult);

      const result = await service.remove(productId);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockDeleteResult);
      expect(mockProductsRepository.delete).toHaveBeenCalledWith(productId);
    });

    it('should handle errors during product removal', async () => {
      const productId = 1;
      const errorMessage = 'Database error';
      mockProductsRepository.delete.mockRejectedValue(new Error(errorMessage));

      const result = await service.remove(productId);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe(errorMessage);
    });
  });
});

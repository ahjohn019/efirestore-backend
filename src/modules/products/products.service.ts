import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AllProductDto } from './dto/all-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository, In } from 'typeorm';
import { Products } from './entities/products.entity';
import { Categories } from '../categories/entities/categories.entity';
import { Images } from '../images/entities/images.entity';
import { Helper } from '../../utils/helper';
import { ImagesService } from '../images/images.service';
import { BaseService } from '../base/base.service';
@Injectable()
export class ProductsService extends BaseService {
  constructor(
    @InjectRepository(Categories)
    private categoriesRepository: Repository<Categories>,

    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {
    super();
  }

  @Inject(ImagesService)
  private readonly imagesService: ImagesService;

  async create(createProductDto: CreateProductDto) {
    try {
      const categories = await this.categoriesRepository.findOne({
        where: {
          id: createProductDto.category_id,
        },
      });

      if (!categories) {
        throw new Error('Category not found');
      }

      const products = this.productsRepository.create({
        ...createProductDto,
        categories,
      });

      const savedProducts = await this.productsRepository.save(products);

      return this.createSuccessResponse(savedProducts);
    } catch (error) {
      throw error;
    }
  }

  async findAll(allProductDto: AllProductDto) {
    try {
      const productResponse = await Helper.calculatePagination<Products>(
        allProductDto,
        this.productsRepository,
        allProductDto.condition,
      );

      // Get min and max price
      const [priceRange] = await this.productsRepository.query(`
        SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM products
      `);

      if (allProductDto.search) {
        const { search, ...searchProductDto } = allProductDto;

        const productSearchResponse = await Helper.searchHelpers<Products>(
          this.productsRepository,
          searchProductDto,
          'products',
          ['categories'],
        );

        return this.createSuccessResponse({
          ...productSearchResponse,
          min_price: parseFloat(priceRange.minPrice),
          max_price: parseFloat(priceRange.maxPrice),
        });
      }

      return this.createSuccessResponse({
        ...productResponse,
        min_price: parseFloat(priceRange.minPrice),
        max_price: parseFloat(priceRange.maxPrice),
      });
    } catch (error) {
      throw error;
    }
  }

  async findBulk(productIds: number[]) {
    try {
      const findBulkResponse = await this.productsRepository.find({
        where: {
          id: In(productIds),
        },
      });

      return this.createSuccessResponse(findBulkResponse);
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const findOneResponse = await this.productsRepository.findOne({
        where: {
          id: id,
        },
      });

      return this.createSuccessResponse(findOneResponse);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const productsEntity = await this.productsRepository.findOne({
        where: {
          id,
        },
      });

      if (!productsEntity) {
        throw new NotFoundException('Product not found');
      }

      const categories = await this.categoriesRepository.findOne({
        where: {
          id: updateProductDto.category_id,
        },
      });

      if (!categories) {
        throw new NotFoundException('Category not found');
      }

      const updatedProduct = await this.productsRepository.save(
        Object.assign(productsEntity, { ...updateProductDto, categories }),
      );

      return this.createSuccessResponse(updatedProduct);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const removeProduct = await this.productsRepository.delete(id);
      return this.createSuccessResponse(removeProduct);
    } catch (error) {
      throw error;
    }
  }
}

import { Injectable, Inject } from '@nestjs/common';
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
      return this.createErrorResponse(error.message);
    }
  }

  async findAll(allProductDto: AllProductDto) {
    try {
      const productResponse = await Helper.calculatePagination<Products>(
        allProductDto,
        this.productsRepository,
        allProductDto.condition,
      );

      if (allProductDto.search) {
        const { search, ...searchProductDto } = allProductDto;

        const productSearchResponse = await Helper.searchHelpers<Products>(
          this.productsRepository,
          searchProductDto,
          'products',
        );

        return this.createSuccessResponse(productSearchResponse);
      }

      return this.createSuccessResponse(productResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
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
      return this.createErrorResponse(error.message);
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
      return this.createErrorResponse(error.message);
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const productsEntity = await this.findOne(id);

      const categories = await this.categoriesRepository.findOne({
        where: {
          id: updateProductDto.category_id,
        },
      });

      if (!categories) {
        throw new Error('Category not found');
      }

      await this.productsRepository.save(
        Object.assign(productsEntity, { ...updateProductDto, categories }),
      );

      return this.createSuccessResponse(productsEntity);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async remove(id: number) {
    try {
      const removeProduct = await this.productsRepository.delete(id);
      return this.createSuccessResponse(removeProduct);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}

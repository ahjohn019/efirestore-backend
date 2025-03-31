import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Categories } from '../categories/entities/categories.entity';
import { Products } from '../products/entities/products.entity';
import { Repository } from 'typeorm';
import { Helper } from '../../utils/helper';
import { AllCategoryDto } from './dto/all-category.dto';
import { BaseService } from '../base/base.service';

@Injectable()
export class CategoriesService extends BaseService {
  constructor(
    @InjectRepository(Categories)
    private categoriesRepository: Repository<Categories>,

    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {
    super();
  }

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const products = this.categoriesRepository.create(createCategoryDto);
      products.slug = Helper.convertUpperCase(createCategoryDto.name);
      const productResponse = await this.categoriesRepository.save(products);

      return this.createSuccessResponse(productResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findAll(allCategoryDto: AllCategoryDto) {
    try {
      const findAllResponse = await Helper.calculatePagination<Categories>(
        allCategoryDto,
        this.categoriesRepository,
      );

      return this.createSuccessResponse(findAllResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findOne(id: number) {
    try {
      const findCategoryResponse = await this.categoriesRepository.findOne({
        where: {
          id: id,
        },
      });

      return this.createSuccessResponse(findCategoryResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      const categoryEntity = await this.findOne(id);
      const categoryResponse = await this.categoriesRepository.save(
        Object.assign(categoryEntity, updateCategoryDto),
      );
      return this.createSuccessResponse(categoryResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async remove(id: number) {
    try {
      const categoryProductEntity = await this.productsRepository.find({
        where: {
          categories: {
            id: id,
          },
        },
      });

      if (categoryProductEntity.length <= 0) {
        throw new Error('Category not found');
      }

      for (const product of categoryProductEntity) {
        product.categories = null;
      }

      await this.productsRepository.save(Object.assign(categoryProductEntity));
      const deleteResponse = await this.categoriesRepository.delete(id);

      return this.createSuccessResponse(deleteResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}

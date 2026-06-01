import { Injectable, NotFoundException } from '@nestjs/common';
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
      throw error;
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
      throw error;
    }
  }

  async findOne(slug: string) {
    try {
      const findCategoryResponse = await this.categoriesRepository.findOne({
        where: {
          slug: slug,
        },
      });

      return this.createSuccessResponse(findCategoryResponse);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      const categoryEntity = await this.categoriesRepository.findOne({
        where: {
          id,
        },
      });

      if (!categoryEntity) {
        throw new NotFoundException('Category not found');
      }

      if (updateCategoryDto.name) {
        categoryEntity.slug = Helper.convertUpperCase(updateCategoryDto.name);
      }

      const categoryResponse = await this.categoriesRepository.save(
        Object.assign(categoryEntity, updateCategoryDto),
      );
      return this.createSuccessResponse(categoryResponse);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const categoryProductEntity = await this.productsRepository.find({
        where: {
          categories: {
            id,
          },
        },
      });

      if (categoryProductEntity.length > 0) {
        for (const product of categoryProductEntity) {
          product.categories = null;
        }

        await this.productsRepository.save(
          Object.assign(categoryProductEntity),
        );
      }

      const deleteResponse = await this.categoriesRepository.delete(id);
      return this.createSuccessResponse(deleteResponse);
    } catch (error) {
      throw error;
    }
  }
}

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Categories } from '../categories/entities/categories.entity';
import { Products } from '../products/entities/products.entity';
import { Repository } from 'typeorm';
import { Helper } from '../../utils/helper';
import { AllCategoryDto } from './dto/all-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories)
    private categoriesRepository: Repository<Categories>,

    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {}

  create(createCategoryDto: CreateCategoryDto) {
    const products = this.categoriesRepository.create(createCategoryDto);
    products.slug = Helper.convertUpperCase(createCategoryDto.name);
    return this.categoriesRepository.save(products);
  }

  async findAll(allCategoryDto: AllCategoryDto) {
    return await Helper.calculatePagination<Categories>(
      allCategoryDto,
      this.categoriesRepository,
    );
  }

  findOne(id: number) {
    return this.categoriesRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const categoryEntity = await this.findOne(id);
    await this.categoriesRepository.save(
      Object.assign(categoryEntity, updateCategoryDto),
    );

    return categoryEntity;
  }

  async remove(id: number) {
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
    return await this.categoriesRepository.delete(id);
  }
}

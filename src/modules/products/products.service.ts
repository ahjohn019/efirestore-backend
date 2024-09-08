import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AllProductDto } from './dto/all-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { Products } from './entities/products.entity';
import { Categories } from '../categories/entities/categories.entity';
import { Helper } from '../../utils/helper';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,

    @InjectRepository(Categories)
    private categoriesRepository: Repository<Categories>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const categories = await this.categoriesRepository.findOneBy({
      id: createProductDto.category_id,
    });

    if (!categories) {
      throw new Error('Category not found');
    }

    const products = this.productsRepository.create({
      ...createProductDto,
      categories,
    });

    return this.productsRepository.save(products);
  }

  async findAll(allProductDto: AllProductDto) {
    return await Helper.calculatePagination<Products>(
      allProductDto,
      this.productsRepository,
    );
  }

  findOne(id: number) {
    return this.productsRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const productsEntity = await this.findOne(id);

    const categories = await this.categoriesRepository.findOneBy({
      id: updateProductDto.category_id,
    });

    if (!categories) {
      throw new Error('Category not found');
    }

    await this.productsRepository.save(
      Object.assign(productsEntity, { ...updateProductDto, categories }),
    );

    return productsEntity;
  }

  async remove(id: number) {
    return await this.productsRepository.delete(id);
  }
}

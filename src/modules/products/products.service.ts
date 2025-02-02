import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AllProductDto } from './dto/all-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { Products } from './entities/products.entity';
import { Categories } from '../categories/entities/categories.entity';
import { Images } from '../images/entities/images.entity';
import { Helper } from '../../utils/helper';
import { ImagesService } from '../images/images.service';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Categories)
    private categoriesRepository: Repository<Categories>,

    @InjectRepository(Products)
    private productsRepository: Repository<Products>,

    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
  ) {}

  @Inject(ImagesService)
  private readonly imagesService: ImagesService;

  async create(createProductDto: CreateProductDto, file: Express.Multer.File) {
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

    // const entities = {
    //   category: createProductDto.image_category,
    //   entity_id: savedProducts.id,
    //   entity_type: products.constructor.name,
    // };

    // const result = { ...file, ...entities };

    // this.imagesService.upload(result);

    return { status: true, data: savedProducts };
  }

  async findAll(allProductDto: AllProductDto) {
    const products = await Helper.calculatePagination<Products>(
      allProductDto,
      this.productsRepository,
      allProductDto.condition,
    );

    return products;
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

    return productsEntity;
  }

  async remove(id: number) {
    return await this.productsRepository.delete(id);
  }
}

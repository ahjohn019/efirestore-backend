import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCartDto } from './dto/create-carts.dto';
import { UpdateCartDto } from './dto/update-carts.dto';
import { Carts } from './entities/carts.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Carts)
    private cartsRepository: Repository<Carts>,
  ) {}

  async create(createCartDto: CreateCartDto) {
    const cart = await this.cartsRepository.create(createCartDto);

    return this.cartsRepository.save(cart);
  }

  findAll() {
    return `This action returns all cart`;
  }

  findOne(id: number) {
    return this.cartsRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  findCartSession(session: string) {
    return this.cartsRepository.findOne({
      where: {
        cart_session_id: session,
      },
    });
  }

  findCartUserId(user_id: number) {
    return this.cartsRepository.findOne({
      where: {
        user_id: user_id,
      },
    });
  }

  async update(id: number, updateCartDto: UpdateCartDto) {
    const cartsEntity = await this.findOne(id);
    await this.cartsRepository.save(Object.assign(cartsEntity, updateCartDto));

    return cartsEntity;

    // return `This action updates a #${id} cart`;
  }

  async updateByUserId(user_id: number, updateCartDto: UpdateCartDto) {
    const cartsEntity = await this.findCartUserId(user_id);
    await this.cartsRepository.save(Object.assign(cartsEntity, updateCartDto));

    return cartsEntity;

    // return `This action updates a #${id} cart`;
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}

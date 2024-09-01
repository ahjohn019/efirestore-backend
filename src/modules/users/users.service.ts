import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { Users } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Users> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  findByPassword(password: string) {
    return this.usersRepository.findOne({
      where: {
        password: password,
      },
    });
  }

  findByToken(token: string) {
    return this.usersRepository.findOne({
      where: {
        remember_token: token,
      },
    });
  }

  async update(id: number, updateUserDto: any) {
    const userEntity = await this.findOne(id);
    await this.usersRepository.save(Object.assign(userEntity, updateUserDto));

    return userEntity;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

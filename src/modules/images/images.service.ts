import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Images } from '../images/entities/images.entity';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
  ) {}

  create(createImageDto: CreateImageDto) {
    return 'This action adds a new image';
  }

  findAll() {
    return `This action returns all images`;
  }

  findOne(id: number) {
    return `This action returns a #${id} image`;
  }

  update(id: number, updateImageDto: UpdateImageDto) {
    return `This action updates a #${id} image`;
  }

  remove(id: number) {
    return `This action removes a #${id} image`;
  }

  upload(file: CreateImageDto) {
    const images = this.imagesRepository.create({
      name: file.filename,
      path: 'uploads/' + file.filename,
      size: file.size,
      category: file.category,
      file_type: file.mimetype,
      entity_id: file.entity_id,
      entity_type: file.entity_type,
    });

    return this.imagesRepository.save(images);
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AllImageDto } from './dto/all-image.dto';
import { Images } from '../images/entities/images.entity';
import { unlink, mkdirSync, existsSync } from 'node:fs';
import { Helper } from '../../utils/helper';
import * as path from 'path';
import { UpdateEntityImageDto } from './dto/update-entity-image.dto';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
  ) {}

  async uploadFiles(files: Array<Express.Multer.File>) {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

    // Check if directory exists, if not, create it
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const fileList = files.map((file) => ({
      name: file.filename,
      path: file.path,
      size: file.size,
      mime_type: file.mimetype,
      destination: file.destination,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await this.imagesRepository.save(fileList);
    return { status: true, data: fileList };
  }

  async updatedEntityFile(updateEntityImageDto: UpdateEntityImageDto) {
    const findEntityFile = await this.imagesRepository.findOne({
      where: { id: updateEntityImageDto.image_id },
    });

    if (!findEntityFile) {
      throw new NotFoundException('File Not Found.');
    }

    const updatedEntityFile = await this.imagesRepository.update(
      { id: updateEntityImageDto.image_id },
      {
        category: updateEntityImageDto.category,
        entity_id: updateEntityImageDto.entity_id,
        entity_type: updateEntityImageDto.entity_type,
      },
    );

    return { status: true, data: updatedEntityFile };
  }

  async findAll(allImageDto: AllImageDto) {
    return await Helper.calculatePagination<Images>(
      allImageDto,
      this.imagesRepository,
      null,
    );
  }

  findBulk(data: { ids: number[] }) {
    return this.imagesRepository.find({
      where: {
        id: In(data.ids),
      },
    });
  }

  async update(id: number, file: Express.Multer.File) {
    const findFile = await this.imagesRepository.findOne({
      where: { id },
    });

    if (!findFile) {
      Helper.unlinkFile(file.path);
      throw new NotFoundException('Files Not Found.');
    }

    Helper.unlinkFile(findFile.path);

    await this.imagesRepository.update(id, {
      name: file.filename,
      path: file.path,
      size: file.size,
      mime_type: file.mimetype,
      destination: file.destination,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const updatedFile = await this.imagesRepository.findOne({ where: { id } });

    return { status: true, data: updatedFile };
  }

  async remove(data: { ids: number[] }) {
    const findFiles = await this.findBulk(data);

    if (findFiles.length <= 0) {
      throw new NotFoundException('Files Not Found.');
    }

    findFiles.forEach((file) => {
      unlink(file.path, (err) => {
        if (err) throw err;
        this.imagesRepository.remove(file);
      });
    });

    return { status: true, data: findFiles };
  }
}

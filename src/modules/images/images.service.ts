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
import { BaseService } from '../base/base.service';

@Injectable()
export class ImagesService extends BaseService {
  constructor(
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
  ) {
    super();
  }

  async uploadFiles(files: Array<Express.Multer.File>) {
    try {
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
        destination: file.destination
      }));

      await this.imagesRepository.save(fileList);

      return this.createSuccessResponse(fileList);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async updatedEntityFile(updateEntityImageDto: UpdateEntityImageDto) {
    try {
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

      return this.createSuccessResponse(updatedEntityFile);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findAll(allImageDto: AllImageDto) {
    try {
      const findAllResponse = await Helper.calculatePagination<Images>(
        allImageDto,
        this.imagesRepository,
        null,
      );

      return this.createSuccessResponse(findAllResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findBulk(data: { ids: number[] }) {
    try {
      const findBulkImageResponse = await this.imagesRepository.find({
        where: {
          id: In(data.ids),
        },
      });

      return this.createSuccessResponse(findBulkImageResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async update(id: number, file: Express.Multer.File) {
    try {
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

      return this.createSuccessResponse(updatedFile);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async remove(data: { ids: number[] }) {
    try {
      const findFiles = await this.findBulk(data);

      if (findFiles.data.length <= 0) {
        throw new NotFoundException('Files Not Found.');
      }

      findFiles.data.forEach((file: Images) => {
        unlink(file.path, (err) => {
          if (err) throw err;
          this.imagesRepository.remove(file);
        });
      });

      return this.createSuccessResponse(findFiles);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}

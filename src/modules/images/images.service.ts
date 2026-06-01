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
import { rename } from 'node:fs/promises';
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

  async uploadFiles(
    files: Array<Express.Multer.File>,
    entityType = 'products',
  ) {
    try {
      const normalizedEntityType = this.normalizeEntityType(entityType);
      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        normalizedEntityType,
      );

      // Check if directory exists, if not, create it
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      if (!files || files.length === 0) {
        throw new BadRequestException('No files uploaded.');
      }

      const fileList = [];

      for (const file of files) {
        const sourcePath = file.path;
        const targetPath = path.join(uploadDir, file.filename);

        if (sourcePath && sourcePath !== targetPath) {
          await rename(sourcePath, targetPath);
        }

        fileList.push({
          name: file.filename,
          path: this.getPublicPath(normalizedEntityType, file.filename),
          size: file.size,
          mime_type: file.mimetype,
          destination: uploadDir,
          category: '',
          entity_id: 0,
          entity_type: '',
        });
      }

      await this.imagesRepository.save(fileList);

      return this.createSuccessResponse(fileList);
    } catch (error) {
      if (files?.length) {
        files.forEach((file) => {
          if (file?.path && existsSync(file.path)) {
            Helper.unlinkFile(file.path);
          }
        });
      }
      console.log('error', error);
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  async findByEntity(data: { entity_id: number; entity_type: string }) {
    try {
      const image = await this.imagesRepository.find({
        where: {
          entity_id: data.entity_id,
          entity_type: data.entity_type,
        },
      });

      if (image.length === 0) {
        throw new NotFoundException('Image not found');
      }

      return this.createSuccessResponse(image);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, file: Express.Multer.File) {
    try {
      const findFile = await this.imagesRepository.findOne({
        where: { id },
      });

      console.log('findFile', findFile);

      if (!findFile) {
        // Delete the uploaded file since we can't associate it with an existing image
        Helper.unlinkFile(file.path);
        throw new NotFoundException('Image not found');
      }

      // Delete the old file
      Helper.unlinkFile(this.resolveStoredFilePath(findFile.path));

      await this.imagesRepository.update(id, {
        name: file.filename,
        path: this.getPublicPath(
          this.normalizeEntityType(
            this.getEntityTypeFromDestination(file.destination),
          ),
          file.filename,
        ),
        size: file.size,
        mime_type: file.mimetype,
        destination: file.destination,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const updatedFile = await this.imagesRepository.findOne({
        where: { id },
      });

      return this.createSuccessResponse(updatedFile);
    } catch (error) {
      // If there's an error, try to clean up the uploaded file
      if (file && file.path) {
        Helper.unlinkFile(file.path);
      }
      throw error;
    }
  }

  async remove(data: { ids: number[] }) {
    try {
      const findFiles = await this.findBulk(data);

      if (findFiles.data.length <= 0) {
        throw new NotFoundException('Files Not Found.');
      }

      findFiles.data.forEach((file: Images) => {
        unlink(this.resolveStoredFilePath(file.path), (err) => {
          if (err) throw err;
          this.imagesRepository.remove(file);
        });
      });

      return this.createSuccessResponse(findFiles);
    } catch (error) {
      throw error;
    }
  }

  private resolveStoredFilePath(storedPath: string) {
    if (!storedPath) {
      return storedPath;
    }

    if (storedPath.startsWith('/uploads/')) {
      return path.join(process.cwd(), 'public', storedPath.replace(/^\/+/, ''));
    }

    if (path.isAbsolute(storedPath)) {
      return storedPath;
    }

    return path.join(process.cwd(), 'public', storedPath.replace(/^\/+/, ''));
  }

  private getPublicPath(entityType: string, filename: string) {
    return `/uploads/${entityType}/${filename}`;
  }

  private getEntityTypeFromDestination(destination?: string) {
    if (!destination) {
      return 'products';
    }

    return path.basename(destination) || 'products';
  }

  private normalizeEntityType(entityType: string) {
    return (
      entityType
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'products'
    );
  }
}

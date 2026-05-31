import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { AllImageDto } from './dto/all-image.dto';
import { UpdateEntityImageDto } from './dto/update-entity-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadInterceptor } from '../../shared/validation/file_validation';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
@Controller('images')
@ApiTags('Images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(imageUploadInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple images into an entity folder' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          example: 'products',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadFiles(
    @Body() body: { entity_type?: string },
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const entityType = body?.entity_type ?? 'products';
    return this.imagesService.uploadFiles(files, entityType);
  }

  @Post('update-entity-file')
  updatedEntityFile(@Body() updateEntityImageDto: UpdateEntityImageDto) {
    return this.imagesService.updatedEntityFile(updateEntityImageDto);
  }

  @Get()
  findAll(@Query() allImageDto: AllImageDto) {
    return this.imagesService.findAll(allImageDto);
  }

  @Post('/bulk')
  findBulk(@Body() data: { ids: number[] }) {
    return this.imagesService.findBulk(data);
  }

  @Get('by-entity')
  @ApiOperation({ summary: 'Find the latest image by entity id and type' })
  @ApiQuery({ name: 'entity_id', type: Number, required: true })
  @ApiQuery({ name: 'entity_type', type: String, required: true })
  findByEntity(
    @Query('entity_id', ParseIntPipe) entityId: number,
    @Query('entity_type') entityType: string,
  ) {
    return this.imagesService.findByEntity({
      entity_id: entityId,
      entity_type: entityType,
    });
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.imagesService.update(id, file);
  }

  @Delete()
  remove(@Body() data: { ids: number[] }) {
    return this.imagesService.remove(data);
  }
}

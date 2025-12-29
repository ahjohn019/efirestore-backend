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

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Post('upload')
  @UseInterceptors(imageUploadInterceptor())
  uploadFiles(
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    console.log('files', files);
    return this.imagesService.uploadFiles(files);
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

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
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { AllImageDto } from './dto/all-image.dto';
import { CreateEntityImageDto } from './dto/create-entity-image.dto';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      fileFilter: (req, file, cb) => {
        const mimeTypeList = [
          'image/jpg',
          'image/jpeg',
          'image/png',
          'image/gif',
        ];

        if (!mimeTypeList.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Only image files (JPG, PNG, GIF) are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadFiles(
    @UploadedFiles()
    files: Array<Express.Multer.File>,
    @Body() createEntityImageDto: CreateEntityImageDto,
  ) {
    return this.imagesService.uploadFiles(files, createEntityImageDto);
  }

  @Get()
  findAll(@Body() allImageDto: AllImageDto) {
    return this.imagesService.findAll(allImageDto);
  }

  @Get('/bulk')
  findBulk(@Body() data: { ids: number[] }) {
    return this.imagesService.findBulk(data);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.imagesService.update(+id, file);
  }

  @Delete()
  remove(@Body() data: { ids: number[] }) {
    return this.imagesService.remove(data);
  }
}

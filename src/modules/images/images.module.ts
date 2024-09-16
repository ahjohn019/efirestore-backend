import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { ImageSource } from '../../config/imagesource';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Images } from './entities/images.entity';

@Module({
  imports: [ImageSource, TypeOrmModule.forFeature([Images])],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}

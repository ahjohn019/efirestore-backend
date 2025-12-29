import { BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

export function imageFileFilter(req, file, cb) {
  const mimeTypeList = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];

  if (!mimeTypeList.includes(file.mimetype)) {
    return cb(
      new BadRequestException('Only image files (JPG, PNG, GIF) are allowed!'),
      false,
    );
  }
  cb(null, true);
}

export function imageUploadInterceptor() {
  return FilesInterceptor('files', 5, {
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });
}

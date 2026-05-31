import { BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'path';

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
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = join(process.cwd(), 'public', 'uploads', '_tmp');

        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const ext = extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
      },
    }),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });
}

function sanitizeEntityType(entityType: string) {
  return entityType
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'products';
}

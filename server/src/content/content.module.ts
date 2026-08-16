import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';

@Module({
  imports: [], // در آینده پکیج‌های دیگر اینجا اضافه می‌شوند
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
import { Controller, Post, Body, Get } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto, RecommendDto } from './dto/create-content.dto';

@Controller('items')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  async create(@Body() dto: CreateContentDto) {
    return this.contentService.addItem(dto);
  }

  @Post('recommend')
  async recommend(@Body() dto: RecommendDto) {
    // اگر کاربر هیچ تگی انتخاب نکند، خطا می‌دهد (ValidationPipe در main.ts هندل می‌کند)
    // اما اگر بیاید و لیست خالی بفرستد، الگوریتم امتیاز 0 می‌دهد.
    // اینجا چک می‌کنیم که حتما حداقل یک تگ انتخاب شده باشد
    if (!dto.selectedTags || dto.selectedTags.length === 0) {
      return []; 
    }
    
    return this.contentService.recommend(dto);
  }

  @Get()
  async findAll() {
    return this.contentService.getAllItems();
  }
}
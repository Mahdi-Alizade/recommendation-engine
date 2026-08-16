import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateContentDto, RecommendDto } from './dto/create-content.dto';

@Injectable()
export class ContentService extends PrismaClient {
  
  // ایجاد آیتم جدید در دیتابیس
  async addItem(dto: CreateContentDto) {
    return this.content.create({
      data: {
        title: dto.title,
        tags: dto.tags,
      },
    });
  }

  // الگوریتم اصلی: محاسبه شباهت مبتنی بر تگ‌ها (Vector Space Model)
  async recommend(dto: RecommendDto): Promise<any[]> {
    // 1. خواندن تمام آیتم‌ها از دیتابیس
    const allItems = await this.content.findMany();
    
    // 2. استخراج مجموعه تک تیک (Universe of Tags) از کل دیتابیس
    const universeTags = [...new Set(allItems.flatMap((item) => item.tags))];

    // 3. ساخت ماتریس ویژگی (Feature Matrix) برای تمام آیتم‌ها
    // هر سطر یک آیتم است، هر ستون یک تگ. مقدار 1 اگر تگ وجود داشته باشد، صلی در غیر این صورت.
    const itemVectors = allItems.map((item) => {
      const vector = {};
      universeTags.forEach((tag) => {
        vector[tag] = item.tags.includes(tag) ? 1 : 0;
      });
      return vector;
    });

    // 4. ساخت بردار هدف (Target Vector) بر اساس تگ‌های انتخابی کاربر
    const targetVector = {};
    universeTags.forEach((tag) => {
      targetVector[tag] = dto.selectedTags.includes(tag) ? 1 : 0;
    });

    // 5. محاسبه شباهت کسینوسی (Cosine Similarity) بین هدف و تمام آیتم‌ها
    const scoredItems = allItems.map((item, index) => {
      const itemVec = itemVectors[index];
      
      // حاصل ضرب نقطتی (Dot Product)
      let dotProduct = 0;
      let magnitudeA = 0; // هدف
      let magnitudeB = 0; // آیتم
      
      universeTags.forEach((tag) => {
        const valA = targetVector[tag];
        const valB = itemVec[tag];
        
        dotProduct += valA * valB;
        magnitudeA += valA * valA;
        magnitudeB += valB * valB;
      });

      magnitudeA = Math.sqrt(magnitudeA);
      magnitudeB = Math.sqrt(magnitudeB);

      // جلوگیری از تقسیم بر صفر (اگر تگی انتخاب نشده باشه)
      const score = (magnitudeA === 0 || magnitudeB === 0) ? 0 : dotProduct / (magnitudeA * magnitudeB);

      return { ...item.data, score };
    });

    // 6. مرتب‌سازی نزولی و برگرداندن N آیتم برتر
    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, dto.limit);
  }

  async getAllItems() {
    return this.content.findMany();
  }
}
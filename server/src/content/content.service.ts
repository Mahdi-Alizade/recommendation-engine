import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { Content } from '@prisma/client';

@Injectable()
export class ContentService {
  private readonly stopWords = new Set<string>([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
    'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
    'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
    'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
    'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
    'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
    'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
    'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
    'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
    'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
    'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
    'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
    'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
    'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
    'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
    'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
    'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
    'yourself', 'yourselves'
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContentDto): Promise<Content> {
    return this.prisma.content.create({
      data: {
        title: dto.title,
        description: dto.description,
        body: dto.body,
        category: dto.category,
        tags: dto.tags || '',
      },
    });
  }

  async findAll(): Promise<Content[]> {
    return this.prisma.content.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Content> {
    const item = await this.prisma.content.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Content with ID ${id} not found.`);
    }
    return item;
  }

  async getRecommendations(id: string, limit: number = 5): Promise<{ content: Content; similarityScore: number }[]> {
    const targetContent = await this.findOne(id);
    const allContents = await this.prisma.content.findMany();

    if (allContents.length <= 1) {
      return [];
    }

    // استخراج متن ترکیبی اسناد شامل تایتل، توضیحات، بدنه و تگ‌ها (با اعمال ضریب وزن‌دهی)
    const corpus = allContents.map((doc) => ({
      id: doc.id,
      text: `${doc.title} ${doc.title} ${doc.category} ${doc.tags} ${doc.description} ${doc.body}`,
    }));

    const tokenizedDocs = corpus.map((doc) => ({
      id: doc.id,
      tokens: this.tokenize(doc.text),
    }));

    // ایجاد واژگان کل مجموعه (Vocabulary)
    const vocabulary = Array.from(
      new Set(tokenizedDocs.flatMap((doc) => doc.tokens))
    );

    const docCount = tokenizedDocs.length;

    // محاسبه Inverse Document Frequency (IDF)
    const idfMap = new Map<string, number>();
    for (const term of vocabulary) {
      const docsWithTerm = tokenizedDocs.filter((doc) => doc.tokens.includes(term)).length;
      idfMap.set(term, Math.log((docCount + 1) / (docsWithTerm + 1)) + 1);
    }

    // ساخت بردارهای TF-IDF برای هر سند
    const vectors = new Map<string, number[]>();
    for (const doc of tokenizedDocs) {
      const termFrequencies = new Map<string, number>();
      for (const token of doc.tokens) {
        termFrequencies.set(token, (termFrequencies.get(token) || 0) + 1);
      }

      const totalTokens = doc.tokens.length || 1;
      const vector = vocabulary.map((term) => {
        const tf = (termFrequencies.get(term) || 0) / totalTokens;
        const idf = idfMap.get(term) || 0;
        return tf * idf;
      });

      vectors.set(doc.id, vector);
    }

    const targetVector = vectors.get(targetContent.id);
    if (!targetVector) {
      return [];
    }

    // محاسبه کسینوس شباهت و مرتب‌سازی بر اساس شباهت
    const scoredList: { content: Content; similarityScore: number }[] = [];

    for (const doc of allContents) {
      if (doc.id === targetContent.id) {
        continue;
      }

      const candidateVector = vectors.get(doc.id);
      if (candidateVector) {
        const score = this.calculateCosineSimilarity(targetVector, candidateVector);
        if (score > 0) {
          scoredList.push({ content: doc, similarityScore: Number(score.toFixed(4)) });
        }
      }
    }

    return scoredList
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !this.stopWords.has(word));
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
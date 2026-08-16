import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class RecommendDto {
  @IsArray()
  @IsString({ each: true })
  selectedTags: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 5;
}
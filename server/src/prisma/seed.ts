import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.content.deleteMany();

  const sampleArticles = [
    {
      title: 'Introduction to Machine Learning and AI Agents',
      category: 'Artificial Intelligence',
      tags: 'ai, machine-learning, python, automation, algorithms',
      description: 'An overview of machine learning paradigms, vector embeddings, and autonomous software agents.',
      body: 'Machine learning powers modern predictive systems through vector spaces, neural networks, and mathematical pattern recognition across large datasets.'
    },
    {
      title: 'Deep Dive into Natural Language Processing and TF-IDF',
      category: 'Artificial Intelligence',
      tags: 'nlp, tf-idf, text-mining, machine-learning, vectorization',
      description: 'Understanding term frequency, inverse document frequency, and text vector representation.',
      body: 'TF-IDF transforms unstructured text documents into numerical vectors by penalizing common corpus stop-words and elevating distinctive keywords.'
    },
    {
      title: 'Building Scalable Microservices with NestJS and TypeScript',
      category: 'Backend Development',
      tags: 'nestjs, typescript, backend, microservices, architecture',
      description: 'Patterns for designing resilient backend services, modular dependency injection, and REST APIs.',
      body: 'NestJS leverages TypeScript and decorators to build structured enterprise backend architectures with strong typing and modular dependency separation.'
    },
    {
      title: 'Optimizing Redis Caching for High-Throughput APIs',
      category: 'Backend Development',
      tags: 'redis, caching, backend, performance, databases',
      description: 'Techniques for implementing in-memory caching layers to minimize database latency in distributed systems.',
      body: 'In-memory stores like Redis drastically reduce database I/O bottlenecks by keeping frequently accessed payloads and sessions cached in RAM.'
    },
    {
      title: 'Modern Frontend State Management in Next.js App Router',
      category: 'Frontend Development',
      tags: 'nextjs, react, frontend, typescript, tailwindcss',
      description: 'Managing client-side state, server components, and streaming UI in Next.js modern web applications.',
      body: 'Next.js App Router changes frontend architecture by dividing UI rendering into Server Components and interactive client components using React hooks.'
    }
  ];

  for (const article of sampleArticles) {
    await prisma.content.create({
      data: article,
    });
  }

  console.log(`Successfully seeded ${sampleArticles.length} articles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
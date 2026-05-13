import prisma from '../utils/prisma';

const DEFAULT_QUOTE = '天行健，君子以自强不息';

export interface QuoteResponse {
  id: string | null;
  content: string;
  author: string | null;
  isDefault: boolean;
}

// 获取每日一言（优先随机返回用户自定义的，否则返回默认）
export async function getDailyQuote(): Promise<QuoteResponse> {
  const count = await prisma.quote.count();

  if (count === 0) {
    return { id: null, content: DEFAULT_QUOTE, author: null, isDefault: true };
  }

  // 随机偏移取一条
  const randomIndex = Math.floor(Math.random() * count);
  const [quote] = await prisma.quote.findMany({
    skip: randomIndex,
    take: 1,
  });

  return {
    id: quote.id,
    content: quote.content,
    author: quote.author,
    isDefault: false,
  };
}

export async function createQuote(
  content: string,
  author?: string,
): Promise<QuoteResponse> {
  const quote = await prisma.quote.create({
    data: { content, author: author ?? null },
  });

  return { id: quote.id, content: quote.content, author: quote.author, isDefault: false };
}

export async function deleteQuote(id: string): Promise<boolean> {
  try {
    await prisma.quote.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listQuotes(): Promise<QuoteResponse[]> {
  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: 'desc' } });
  return quotes.map((q) => ({
    id: q.id,
    content: q.content,
    author: q.author,
    isDefault: false,
  }));
}

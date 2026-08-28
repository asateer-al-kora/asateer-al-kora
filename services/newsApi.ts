import type { NewsItem, NewsPage } from '@/types/football';
import { supabase } from '@/services/supabase';

const NEWS_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/football-news`;
const NEWS_PLACEHOLDER = require('@/assets/images/asateer-logo.png');

export type NewsCategory = 'latest' | 'saudi' | 'ucl' | 'premier' | 'laliga' | 'seriea' | 'bundesliga' | 'ligue1' | 'worldcup' | 'clubworldcup' | 'afc' | 'transfers';

function normalize(article: NewsItem): NewsItem {
  return { ...article, summary: article.summary || article.description || '', image: article.image || undefined, source: article.source || article.sourceName || '' };
}

async function request(params: Record<string, string | number>): Promise<NewsPage> {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();
  const response = await fetch(`${NEWS_FUNCTION_URL}?${query}`, { headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `news_request_failed_${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  return { articles: Array.isArray(payload.articles) ? payload.articles.map(normalize) : [], page: Number(payload.page || 1), pageSize: Number(payload.pageSize || 20), total: Number(payload.total || 0), hasMore: Boolean(payload.hasMore) };
}

export const newsApi = {
  async getLatest(category: NewsCategory = 'latest', language: 'ar' | 'en' = 'ar', page = 1): Promise<NewsPage> { return request({ category, lang: language, page }); },
  async search(query: string, language: 'ar' | 'en' = 'ar', page = 1): Promise<NewsPage> { return request({ q: query, category: 'latest', lang: language, page }); },
  async getById(id: string): Promise<NewsItem | null> {
    const response = await fetch(`${NEWS_FUNCTION_URL}?id=${encodeURIComponent(id)}`, { headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}` } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('news_request_failed');
    return normalize(await response.json());
  },
  placeholder: NEWS_PLACEHOLDER,
  supabase,
};

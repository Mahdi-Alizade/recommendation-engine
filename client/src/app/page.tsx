'use client';

import { useEffect, useState } from 'react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string;
  createdAt: string;
}

interface RecommendationResult {
  content: ContentItem;
  similarityScore: number;
}

export default function HomePage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recLoading, setRecLoading] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/content`);
      if (!res.ok) throw new Error('Failed to fetch content');
      const data: ContentItem[] = await res.json();
      setContents(data);
      if (data.length > 0) {
        handleSelect(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: ContentItem) => {
    setSelectedContent(item);
    try {
      setRecLoading(true);
      const res = await fetch(`${apiUrl}/content/${item.id}/recommendations?limit=4`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const recData: RecommendationResult[] = await res.json();
      setRecommendations(recData);
    } catch (err) {
      console.error(err);
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Content Library & Insights</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select any article to run real-time TF-IDF vector similarity analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* فهرست مقالات سمت چپ */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Available Articles</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {contents.map((item) => {
                const isSelected = selectedContent?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`glass-card glass-card-hover p-5 rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'border-indigo-500/80 bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {item.category}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-100 mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* پیش‌نمایش و توصیه‌ها سمت راست */}
        <div className="lg:col-span-7 space-y-6">
          {selectedContent ? (
            <>
              {/* جزئیات مقاله انتخاب‌شده */}
              <div className="glass-card p-6 rounded-2xl border border-gray-800">
                <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono uppercase tracking-wider mb-2">
                  <span>Selected Node</span>
                  <span>•</span>
                  <span>{selectedContent.id}</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-3">{selectedContent.title}</h2>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">{selectedContent.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContent.tags.split(',').map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-0.5 rounded-md bg-gray-800/80 text-gray-300 border border-gray-700/50"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* پیشنهادات الگوریتم */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wide text-gray-300">
                    Recommended Articles <span className="text-xs text-gray-500">(Cosine Similarity)</span>
                  </h3>
                  {recLoading && <span className="text-xs text-indigo-400 animate-pulse">Calculating vectors...</span>}
                </div>

                {recommendations.length === 0 && !recLoading ? (
                  <div className="glass-card p-6 rounded-xl text-center text-xs text-gray-500">
                    No relevant content matches the similarity threshold.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.content.id}
                        onClick={() => handleSelect(rec.content)}
                        className="glass-card glass-card-hover p-4 rounded-xl cursor-pointer border border-gray-800/90 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                              {rec.content.category}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                              {(rec.similarityScore * 100).toFixed(1)}% Match
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-200 mb-1 line-clamp-2">
                            {rec.content.title}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                            {rec.content.description}
                          </p>
                        </div>
                        <div className="text-[11px] text-indigo-400 font-medium flex items-center space-x-1">
                          <span>Inspect vector context &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card p-12 rounded-2xl text-center text-sm text-gray-400">
              No article selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
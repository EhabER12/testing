"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import { Article } from "@/store/slices/articleSlice";

interface ArticlesShowcaseProps {
  articles: Article[];
}

export function ArticlesShowcase({ articles }: ArticlesShowcaseProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  const featuredArticle = articles[0];
  const listArticles = articles.slice(1, 4);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid";
    }
  };

  return (
    <section className="py-20 sm:py-24 relative overflow-hidden">
      <div className="container px-4 sm:px-6 md:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <span className="block text-sm font-bold tracking-[0.2em] uppercase mb-3">
            Travel Journal
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            <span className="text-brand-red">Latest</span> {" "}
            <span className="italic text-secondary-blue">Stories</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover hidden gems, luxury destinations, and expert travel advice.
          </p>
        </div>

        {articles.length === 1 ? (
          /* Single Article Layout - Centered */
          <div className="max-w-4xl mx-auto">
            <Link
              href={`/articles/${featuredArticle.slug}`}
              className="group relative block h-[400px] sm:h-[500px] w-full overflow-hidden rounded-[32px] shadow-xl"
            >
              <Image
                src={
                  featuredArticle.coverImage ||
                  "/placeholder.svg?height=800&width=600"
                }
                alt={featuredArticle.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

              <div className="absolute bottom-0 left-0 p-8 sm:p-12 w-full text-center">
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {featuredArticle.tags &&
                    featuredArticle.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium tracking-wide uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-header-bg transition-colors">
                  {featuredArticle.title}
                </h3>

                <p className="text-white/80 text-lg line-clamp-2 mb-6 max-w-2xl mx-auto">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center justify-center gap-6 text-white/70 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(
                        featuredArticle.publishedAt || featuredArticle.createdAt
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{featuredArticle.views} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-white group-hover:translate-x-2 transition-transform">
                    Read Story <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Featured Article (Left - Takes up 7 columns) */}
            <div className="lg:col-span-7">
              <Link
                href={`/articles/${featuredArticle.slug}`}
                className="group relative block h-[400px] sm:h-[450px] w-full overflow-hidden rounded-[32px] shadow-xl"
              >
                <Image
                  src={
                    featuredArticle.coverImage ||
                    "/placeholder.svg?height=800&width=600"
                  }
                  alt={featuredArticle.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredArticle.tags &&
                      featuredArticle.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium tracking-wide uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-header-bg transition-colors">
                    {featuredArticle.title}
                  </h3>

                  <p className="text-white/80 text-base sm:text-lg line-clamp-2 mb-4 max-w-xl">
                    {featuredArticle.excerpt}
                  </p>

                  <div className="flex items-center gap-4 sm:gap-6 text-white/70 text-xs sm:text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(
                          featuredArticle.publishedAt ||
                            featuredArticle.createdAt
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{featuredArticle.views} views</span>
                    </div>
                    <div className="flex items-center gap-2 text-white ml-auto group-hover:translate-x-2 transition-transform">
                      Read Story <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Recent List (Right - Takes up 5 columns) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {listArticles.map((article) => (
                <Link
                  key={article.id || (article as any)._id}
                  href={`/articles/${article.slug}`}
                  className="group flex gap-4 sm:gap-5 items-center p-3 sm:p-4 rounded-2xl hover:bg-header-bg transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={
                        article.coverImage ||
                        "/placeholder.svg?height=200&width=200"
                      }
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
                      <span className="font-semibold text-secondary-blue uppercase tracking-wider">
                        {article.tags?.[0] || "Travel"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>
                        {formatDate(article.publishedAt || article.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-secondary-blue transition-colors">
                      {article.title}
                    </h4>

                    <div className="flex items-center text-xs sm:text-sm text-gray-500 group-hover:text-secondary-blue transition-colors">
                      Read More{" "}
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}

              {/* Mobile View All Button */}
              <div className="mt-2 md:hidden text-center">
                <Link href="/articles">
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-gray-300"
                  >
                    View All Articles
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Desktop View All Button */}
        <div className="mt-12 text-center hidden md:block">
          <Link href="/articles">
            <Button
              variant="outline"
              className="rounded-full px-8 py-6 text-lg border-gray-300 hover:bg-header-bg transition-all "
            >
              Explore All Stories <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ArticlesShowcase;

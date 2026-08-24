import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novaqa.io';
  const now = new Date();

  return [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/features`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/security`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    }
  ];
}

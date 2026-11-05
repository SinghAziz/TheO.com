// Public product facts only. Never serialize account or browser-local data here.
export const site = {
  name: "TheO",
  origin: "https://theo.harazizsingh.com",
  title: "TheO — Startup Investor Matching & Funding Schemes in India",
  description:
    "TheO helps founders in India discover relevant investors and government funding schemes, build a startup profile, and evaluate funding readiness.",
  category: "BusinessApplication",
  features: [
    "Startup profile",
    "Investor matching",
    "Indian government funding scheme discovery",
    "Startup KPI evaluation",
  ],
};

export const faqs = [
  {
    question: "What is TheO?",
    answer:
      "TheO is a startup ecosystem intelligence platform for founders in India. It brings startup profiles, investor matching, government funding schemes, and startup evaluation into one workspace.",
  },
  {
    question: "How does TheO match startups with investors?",
    answer:
      "TheO compares your startup profile with investor preferences such as sector, stage, geography, and cheque size to suggest relevant investors.",
  },
  {
    question: "What does TheO evaluate about a startup?",
    answer:
      "TheO evaluates founder-entered startup metrics across growth, unit economics, retention, and financial health to help identify strengths and areas to improve.",
  },
  {
    question: "Does a match score guarantee funding or scheme eligibility?",
    answer:
      "No. Match scores and scheme relevance are indicative. Founders should independently verify investor preferences and the current requirements of each government scheme.",
  },
];

// Escaping '<' prevents embedded data from closing an HTML script element.
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function pageHead({
  title = site.title,
  description = site.description,
  path = "/",
  index = true,
  home = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
  home?: boolean;
} = {}) {
  const url = new URL(path, site.origin).href;
  const image = `${site.origin}/social-card.png`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${site.origin}/#website`,
      url: `${site.origin}/`,
      name: site.name,
      inLanguage: "en",
      about: { "@id": `${site.origin}/#application` },
    },
    {
      "@type": "WebApplication",
      "@id": `${site.origin}/#application`,
      name: site.name,
      url: `${site.origin}/`,
      description: site.description,
      applicationCategory: site.category,
      operatingSystem: "Web browser",
      featureList: site.features,
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": `${site.origin}/#website` },
      about: { "@id": `${site.origin}/#application` },
    },
  ];
  if (home)
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      isPartOf: { "@id": `${url}#webpage` },
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: index
          ? "index, follow, max-image-preview:large"
          : "noindex, follow",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: site.name },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: `${site.name} — ${site.features[0]}`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      {
        name: "twitter:image:alt",
        content: `${site.name} — ${site.features[0]}`,
      },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: index
      ? [
          {
            type: "application/ld+json",
            children: serializeJsonLd({
              "@context": "https://schema.org",
              "@graph": graph,
            }),
          },
        ]
      : [],
  };
}

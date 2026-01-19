import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Article from "../models/articleModel.js";
import User from "../models/userModel.js";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// English Articles
const englishArticles = [
  {
    title: "How to Build a Salla Store That Actually Converts in Saudi Arabia",
    slug: "salla-store-conversion-saudi-arabia",
    excerpt:
      "Most Salla stores in Saudi Arabia struggle with conversion rates below 2%. Here is what successful store owners do differently and why your theme might be killing your sales.",
    content: `
<h2>The Reality Check Most Store Owners Need</h2>

<p>Let me be honest with you. I have seen hundreds of Salla stores in Saudi Arabia, and most of them share the same problem. They look decent, have good products, but the checkout completion rate is embarrassingly low. The owners blame the market, the economy, or customer behavior. Rarely do they look at their store setup.</p>

<p>Here is the thing. The Saudi e-commerce market grew by 30% last year. People are buying online more than ever. If your store is not converting, the market is not the problem.</p>

<h2>Why Default Themes Are Costing You Money</h2>

<p>Salla provides decent themes out of the box. They work. But working is not enough when your competitors are investing in custom experiences. The default themes are designed for everyone, which means they are optimized for no one specifically.</p>

<p>I worked with a perfume store in Riyadh last month. They were using a standard theme with all the default settings. Monthly visitors were around 15,000. Conversion rate was 0.8%. After we rebuilt their store with custom product pages, trust indicators specific to Saudi customers, and Arabic-first design thinking, that number jumped to 3.2% within 60 days.</p>

<h2>What Saudi Customers Actually Care About</h2>

<p>Here is what I have learned from testing different store configurations:</p>

<ul>
<li><strong>Mada integration visibility</strong> - Saudi customers trust Mada more than international payment methods. Make it prominent.</li>
<li><strong>WhatsApp support button</strong> - Saudis prefer instant communication. A visible WhatsApp button can increase inquiries by 200%.</li>
<li><strong>Arabic typography</strong> - Using system fonts for Arabic text looks cheap. Invest in proper Arabic web fonts.</li>
<li><strong>Loading speed</strong> - With mobile data speeds varying across the Kingdom, a lightweight store wins.</li>
</ul>

<h2>The Technical Side Nobody Talks About</h2>

<p>Most developers focus on how a store looks. Few focus on how it performs. Here is what we check before launching any Salla store:</p>

<p>PageSpeed score should be above 60 for mobile. Most stores score between 15-30. That is unacceptable in 2025. Every second of load time reduces conversion by 7% according to industry data.</p>

<p>Image optimization is critical. We regularly see product images uploaded directly from phone cameras at 4MB each. These should be compressed to under 100KB without visible quality loss.</p>

<h2>Practical Steps You Can Take Today</h2>

<p>First, check your PageSpeed score at pagespeed.web.dev. If it is below 50, you have work to do. Second, install Hotjar or a similar tool to see where visitors actually click and scroll. You might be surprised. Third, compare your store on mobile with your top three competitors. Be honest about which one you would buy from.</p>

<p>Building a high-converting Salla store is not magic. It requires attention to what Saudi customers actually want, not what looks trendy on international design websites.</p>
`,
    tags: [
      "salla",
      "e-commerce",
      "saudi arabia",
      "conversion rate",
      "online store",
    ],
    status: "published",
    publishedAt: new Date("2025-12-01"),
    seo: {
      title: "Build a High-Converting Salla Store in Saudi Arabia | Genoun",
      description:
        "Learn how to build a Salla store that converts in Saudi Arabia. Practical tips on design, speed optimization, and local customer preferences.",
      keywords: [
        "salla store",
        "salla development",
        "e-commerce saudi arabia",
        "salla conversion",
        "online store KSA",
      ],
    },
    views: 342,
    language: "en",
    coverImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
  },
  {
    title: "Why Your Shopify Store Needs Saudi Payment Integration in 2025",
    slug: "shopify-saudi-payment-integration",
    excerpt:
      "If you are running a Shopify store targeting Saudi customers without Mada integration, you are losing at least 40% of potential sales. Here is why and how to fix it.",
    content: `
<h2>The Payment Problem You Might Not Know About</h2>

<p>Shopify is a fantastic platform. It handles inventory, shipping calculations, customer management, and a hundred other things that would take months to build from scratch. But here is where it falls short in Saudi Arabia: payment options.</p>

<p>Out of the box, Shopify offers Stripe, PayPal, and a few other international payment gateways. These work fine for customers in Europe or the US. But for Saudi customers, especially those over 30, these options feel foreign and untrustworthy.</p>

<h2>Understanding How Saudis Actually Pay</h2>

<p>Let me share some numbers from stores we have worked with. Before adding Mada as a payment option, the average cart abandonment rate at checkout was 78%. After adding Mada, it dropped to 52%. That is a massive difference from a single change.</p>

<p>Why? Because Mada is the debit network that every Saudi bank card uses. When customers see the Mada logo, they know their payment is processed through familiar channels. Apple Pay also performs well because it is linked to their local cards anyway.</p>

<h2>The Integration Process Is Not as Hard as You Think</h2>

<p>I have talked to many store owners who delayed adding Saudi payment methods because they thought it would be complicated. Here is the reality: with the right payment gateway partner, you can have Mada, Apple Pay, and STC Pay running within 48 hours.</p>

<p>The main gateways that work well with Shopify in Saudi Arabia are Tap, HyperPay, and MyFatoorah. Each has its pros and cons. Tap has the smoothest Shopify integration. HyperPay offers better rates for high-volume stores. MyFatoorah works well if you also sell in other Gulf countries.</p>

<h2>Technical Requirements You Need to Consider</h2>

<p>To integrate Saudi payment methods with Shopify, you will need:</p>

<ul>
<li>A commercial registration (CR) in Saudi Arabia or a valid freelance certificate</li>
<li>A Saudi bank account in your business name</li>
<li>Basic documentation like ID copies and proof of business</li>
</ul>

<p>The gateway providers handle the actual technical integration. You do not need to write code. But you do need someone who understands how to configure Shopify checkout settings properly, especially for multi-currency stores.</p>

<h2>Common Mistakes to Avoid</h2>

<p>The biggest mistake I see is stores that add Saudi payment options but hide them below international options. Mada should be your first visible payment choice, not the third. Another mistake is not testing the checkout flow on Saudi mobile networks. What works on WiFi might timeout on 4G in some areas.</p>

<p>Finally, make sure your payment success and failure pages are properly translated. Nothing kills trust faster than an Arabic store showing English error messages when a payment fails.</p>
`,
    tags: [
      "shopify",
      "mada",
      "payment integration",
      "saudi arabia",
      "e-commerce",
    ],
    status: "published",
    publishedAt: new Date("2025-11-28"),
    seo: {
      title: "Shopify Saudi Payment Integration - Mada, Apple Pay | Genoun",
      description:
        "Learn how to integrate Mada, Apple Pay, and STC Pay with your Shopify store in Saudi Arabia. Reduce cart abandonment and increase conversions.",
      keywords: [
        "shopify saudi arabia",
        "mada integration",
        "shopify payment KSA",
        "apple pay shopify",
        "saudi e-commerce",
      ],
    },
    views: 287,
    language: "en",
    coverImage:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200",
  },
  {
    title: "Speed Optimization for E-commerce: From 14 to 60 PageSpeed Score",
    slug: "speed-optimization-ecommerce-pagespeed",
    excerpt:
      "We took a Salla store from a PageSpeed score of 14 to 67 in two weeks. Here is the exact process we followed and the results in terms of actual revenue.",
    content: `
<h2>A Case Study in Speed</h2>

<p>A client approached us in October with a common problem. Their Salla store was loading slowly, and they knew it was affecting sales. What they did not know was exactly how much. Their PageSpeed Insights score was 14 on mobile. That is not a typo. Fourteen out of one hundred.</p>

<p>The store sold women's fashion in Saudi Arabia. Good products, competitive prices, regular Instagram marketing. But visitors would click through from Instagram, wait for the page to load, and leave before seeing any products. Bounce rate was at 73%.</p>

<h2>Diagnosing the Real Problems</h2>

<p>The first thing we did was run a detailed performance audit. Here is what we found:</p>

<ul>
<li>Product images averaged 2.3MB each. Some were over 5MB.</li>
<li>The theme loaded 47 different JavaScript files, many of them unused.</li>
<li>No caching was configured. Every page load was served fresh.</li>
<li>Third-party tracking scripts were blocking the main content from rendering.</li>
<li>Web fonts were loading from external servers with no fallback.</li>
</ul>

<p>None of these issues were obvious from just looking at the store. It looked fine. But under the hood, it was a mess.</p>

<h2>The Optimization Process</h2>

<p>We approached the optimization in three phases. First, images. We compressed every product and banner image while maintaining visual quality. Average image size dropped from 2.3MB to 180KB. That alone took the score from 14 to 31.</p>

<p>Second, code cleanup. We identified which features the store actually used and removed unused JavaScript. We consolidated CSS files and implemented critical CSS inline loading. Score jumped to 48.</p>

<p>Third, infrastructure. We configured browser caching, enabled GZIP compression, and moved third-party scripts to load asynchronously. Final score: 67.</p>

<h2>The Results That Actually Matter</h2>

<p>A PageSpeed score is just a number. What matters is business impact. Here is what changed in the 30 days after optimization:</p>

<ul>
<li>Bounce rate dropped from 73% to 49%</li>
<li>Average session duration increased by 42%</li>
<li>Conversion rate went from 1.1% to 2.4%</li>
<li>Monthly revenue increased by approximately 85,000 SAR</li>
</ul>

<p>The client's comment was simple: "Why did nobody tell us about this before?"</p>

<h2>What You Can Check Right Now</h2>

<p>Go to pagespeed.web.dev and test your store. If your mobile score is below 50, you are losing money every day. Check your largest images, count your JavaScript files, and see if your servers are sending proper cache headers. These are the basics, but most stores get them wrong.</p>
`,
    tags: [
      "speed optimization",
      "pagespeed",
      "performance",
      "salla",
      "e-commerce",
    ],
    status: "published",
    publishedAt: new Date("2025-11-20"),
    seo: {
      title: "E-commerce Speed Optimization - PageSpeed Case Study | Genoun",
      description:
        "Real case study: how we improved a Salla store PageSpeed from 14 to 67 and increased revenue by 85,000 SAR monthly through speed optimization.",
      keywords: [
        "speed optimization",
        "pagespeed",
        "salla performance",
        "e-commerce speed",
        "website optimization KSA",
      ],
    },
    views: 456,
    language: "en",
    coverImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200",
  },
  {
    title: "SEO for Saudi E-commerce: What Works in 2025",
    slug: "seo-saudi-ecommerce-guide-2025",
    excerpt:
      "Google rankings in Saudi Arabia work differently than in Western markets. Here is what we have learned from ranking dozens of e-commerce stores in the Kingdom.",
    content: `
<h2>SEO in Saudi Arabia Is Different</h2>

<p>If you are applying international SEO strategies to your Saudi e-commerce store without adaptation, you are wasting time and money. The Saudi market has specific characteristics that change how search optimization works.</p>

<p>For starters, Arabic search behavior is different from English search behavior. Users often mix Arabic and English in queries. They might search for a product name in English but add Arabic descriptors. Understanding this hybrid search behavior is essential.</p>

<h2>Bilingual Optimization Is Not Optional</h2>

<p>Here is a mistake I see constantly: stores that are fully Arabic but only optimize for Arabic keywords, or vice versa. The reality is that Saudi users search in both languages, sometimes within the same session.</p>

<p>A customer looking for a laptop might search "لابتوب قوي للبرمجة" first, then follow up with "best programming laptop 2025" to compare prices. If your store only targets one language, you are invisible to hybrid searchers.</p>

<p>The solution is proper hreflang implementation combined with content that addresses both language markets. Not translation, but localized content for each audience.</p>

<h2>Local SEO Matters More Than You Think</h2>

<p>Over 46% of searches in Saudi Arabia have local intent. This means even if you are an e-commerce store without a physical location, local signals matter. Having your store associated with specific cities like Riyadh, Jeddah, or Dammam can improve visibility.</p>

<p>Practical implementation includes:</p>

<ul>
<li>City-specific landing pages if you serve different areas</li>
<li>Local business schema markup even for online-only stores</li>
<li>Content that references Saudi locations and culture naturally</li>
<li>Reviews and testimonials from customers mentioning their city</li>
</ul>

<h2>Mobile and Voice Search Optimization</h2>

<p>Over 90% of internet users in Saudi Arabia access the web via mobile. This is not surprising. What is surprising is how few stores optimize their content for mobile search behavior.</p>

<p>Mobile users tend to use shorter, more conversational queries. Voice search is growing rapidly, especially among younger users. This means targeting long-tail conversational keywords like "where to buy original perfumes in Riyadh" rather than just "perfume Riyadh."</p>

<h2>Technical SEO Checklist for Saudi Stores</h2>

<p>Before focusing on content, make sure your technical foundation is solid:</p>

<ul>
<li>Core Web Vitals passing on mobile, tested on Saudi networks</li>
<li>Proper Arabic text direction (RTL) configured correctly</li>
<li>Hreflang tags if you have both Arabic and English versions</li>
<li>Structured data for products including prices in SAR</li>
<li>Saudi phone number format for contact information</li>
<li>HTTPS with valid certificate</li>
</ul>

<p>These basics are often overlooked but form the foundation for any SEO success in the Saudi market.</p>
`,
    tags: ["seo", "saudi arabia", "e-commerce", "keywords", "google"],
    status: "published",
    publishedAt: new Date("2025-11-15"),
    seo: {
      title: "SEO for Saudi E-commerce 2025 - Complete Guide | Genoun",
      description:
        "Learn SEO strategies specific to Saudi Arabia e-commerce. Cover bilingual optimization, local SEO, mobile-first indexing, and technical requirements.",
      keywords: [
        "seo saudi arabia",
        "e-commerce seo KSA",
        "arabic seo",
        "google ranking saudi",
        "search optimization",
      ],
    },
    views: 523,
    language: "en",
    coverImage:
      "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200",
  },
  {
    title: "Brand Identity for E-commerce: Why Your Logo Is Just the Beginning",
    slug: "brand-identity-ecommerce-guide",
    excerpt:
      "Your logo cost you 500 SAR from Fiverr. Your competitor spent 15,000 SAR on a full brand identity. Here is why they are winning and how brand perception affects your bottom line.",
    content: `
<h2>The Logo Trap</h2>

<p>I get calls every week from store owners who want "a logo that will make their brand stand out." When I ask about their brand strategy, target audience definition, or value proposition, I usually get silence. They want the visual output without the strategic foundation.</p>

<p>Here is the uncomfortable truth: a logo is about 10% of what makes a brand memorable. The other 90% is consistency, positioning, and the customer experience around that visual identity.</p>

<h2>What Brand Identity Actually Includes</h2>

<p>A complete brand identity for an e-commerce store covers:</p>

<ul>
<li><strong>Visual system:</strong> Logo, colors, typography, photography style, iconography</li>
<li><strong>Voice and tone:</strong> How you write product descriptions, customer emails, social posts</li>
<li><strong>Customer experience:</strong> Unboxing, packaging, follow-up communication</li>
<li><strong>Digital presence:</strong> Website design language, social media templates, ad creatives</li>
</ul>

<p>When all these elements work together consistently, customers start to recognize your brand without even seeing the logo. They recognize the feeling your brand creates.</p>

<h2>Real Numbers from Real Brands</h2>

<p>Let me share a comparison from two fashion stores we worked with last year. Both sold similar products at similar price points. One invested in a cheap logo and used random Instagram templates. The other invested in a complete brand identity.</p>

<p>Store A (minimal branding) had an average order value of 340 SAR. Store B (complete branding) had an average order value of 520 SAR. Same market, same products, different perception of value.</p>

<p>Store A struggled with customer retention. Store B had 35% of orders from returning customers. Branding creates trust, and trust creates loyalty.</p>

<h2>The Saudi Market Perspective</h2>

<p>Saudi consumers are becoming increasingly sophisticated about brands. The days when any store could compete on price alone are ending. Customers now compare experiences, not just products.</p>

<p>Luxury and premium positioning works particularly well in Saudi Arabia. But luxury requires consistency. You cannot have a premium logo with cheap packaging and expect customers to perceive value.</p>

<h2>Starting Points for Store Owners</h2>

<p>If you cannot invest in a complete brand identity right now, at least do these things:</p>

<ul>
<li>Define your brand colors and use them consistently everywhere</li>
<li>Choose one Arabic and one English font and stick to them</li>
<li>Create templates for social media so your content looks cohesive</li>
<li>Write down your brand voice guidelines in three sentences</li>
<li>Make your packaging memorable, even if simple</li>
</ul>

<p>Branding is not about spending money. It is about making intentional decisions and applying them consistently over time. The stores that understand this are the ones that build real businesses, not just temporary shops.</p>
`,
    tags: ["branding", "brand identity", "e-commerce", "design", "marketing"],
    status: "published",
    publishedAt: new Date("2025-11-10"),
    seo: {
      title: "E-commerce Brand Identity Guide - Beyond the Logo | Genoun",
      description:
        "Learn why brand identity is more than just a logo. Complete guide to building a memorable e-commerce brand in Saudi Arabia.",
      keywords: [
        "brand identity",
        "e-commerce branding",
        "logo design",
        "visual identity",
        "saudi branding",
      ],
    },
    views: 312,
    language: "en",
    coverImage:
      "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=1200",
  },
];

// Arabic Articles
const arabicArticles = [
  {
    title: "كيف تبني متجر سلة يحقق مبيعات حقيقية في السعودية",
    slug: "build-salla-store-saudi-ar",
    excerpt:
      "أغلب متاجر سلة في السعودية تعاني من معدلات تحويل أقل من 2%. هذا ما يفعله أصحاب المتاجر الناجحين بشكل مختلف.",
    content: `
<h2>الواقع الذي يحتاج كل صاحب متجر لفهمه</h2>

<p>سأكون صريحا معك. شاهدت مئات متاجر سلة في السعودية، ومعظمها يعاني من نفس المشكلة. تبدو جيدة، ومنتجاتها ممتازة، لكن نسبة إتمام الشراء منخفضة جدا. يلوم أصحابها السوق أو الاقتصاد أو سلوك العملاء. نادرا ما ينظرون لإعدادات متجرهم.</p>

<p>الحقيقة أن سوق التجارة الإلكترونية السعودي نما بنسبة 30% العام الماضي. الناس يشترون أونلاين أكثر من أي وقت مضى. إذا متجرك لا يحقق مبيعات، المشكلة ليست في السوق.</p>

<h2>لماذا القوالب الجاهزة تكلفك المال</h2>

<p>سلة توفر قوالب جيدة. تعمل. لكن العمل لا يكفي عندما منافسيك يستثمرون في تجارب مخصصة. القوالب الافتراضية مصممة للجميع، وهذا يعني أنها غير محسنة لأحد بعينه.</p>

<p>عملت مع متجر عطور في الرياض الشهر الماضي. كانوا يستخدمون قالب عادي بكل الإعدادات الافتراضية. الزوار الشهريون حوالي 15,000. معدل التحويل كان 0.8%. بعد إعادة بناء متجرهم بصفحات منتجات مخصصة وعناصر ثقة مصممة للعميل السعودي، ارتفع الرقم إلى 3.2% خلال 60 يوم.</p>

<h2>ما الذي يهم العملاء السعوديين فعلا</h2>

<p>إليك ما تعلمته من اختبار إعدادات مختلفة للمتاجر:</p>

<ul>
<li><strong>إبراز مدى:</strong> العملاء السعوديون يثقون بمدى أكثر من وسائل الدفع العالمية. اجعلها بارزة.</li>
<li><strong>زر واتساب:</strong> السعوديون يفضلون التواصل الفوري. زر واتساب ظاهر يمكن أن يزيد الاستفسارات 200%.</li>
<li><strong>الخطوط العربية:</strong> استخدام خطوط النظام للعربية يبدو رخيصا. استثمر في خطوط ويب عربية احترافية.</li>
<li><strong>سرعة التحميل:</strong> مع تفاوت سرعات البيانات في المملكة، المتجر الخفيف يفوز.</li>
</ul>

<h2>الجانب التقني الذي لا يتحدث عنه أحد</h2>

<p>أغلب المطورين يركزون على شكل المتجر. قليلون يركزون على أدائه. إليك ما نفحصه قبل إطلاق أي متجر سلة:</p>

<p>درجة PageSpeed يجب أن تكون فوق 60 للجوال. معظم المتاجر بين 15-30. هذا غير مقبول في 2025. كل ثانية تحميل إضافية تقلل التحويل بنسبة 7%.</p>

<p>تحسين الصور أمر حاسم. نرى بانتظام صور منتجات مرفوعة مباشرة من الجوال بحجم 4 ميجابايت. هذه يجب ضغطها لأقل من 100 كيلوبايت بدون فقدان جودة مرئية.</p>

<h2>خطوات عملية يمكنك تطبيقها اليوم</h2>

<p>أولا، افحص درجة PageSpeed في pagespeed.web.dev. إذا كانت أقل من 50، لديك عمل للقيام به. ثانيا، ثبت Hotjar أو أداة مشابهة لترى أين ينقر الزوار فعلا. قد تتفاجأ. ثالثا، قارن متجرك على الجوال مع أفضل ثلاثة منافسين. كن صادقا: من أي متجر ستشتري؟</p>
`,
    tags: [
      "سلة",
      "تجارة إلكترونية",
      "السعودية",
      "معدل التحويل",
      "متجر إلكتروني",
    ],
    status: "published",
    publishedAt: new Date("2025-12-02"),
    seo: {
      title: "بناء متجر سلة ناجح في السعودية | جنون",
      description:
        "تعلم كيف تبني متجر سلة يحقق مبيعات في السعودية. نصائح عملية عن التصميم وتحسين السرعة وتفضيلات العملاء المحليين.",
      keywords: [
        "متجر سلة",
        "تطوير سلة",
        "تجارة إلكترونية السعودية",
        "زيادة المبيعات",
        "متجر إلكتروني",
      ],
    },
    views: 478,
    language: "ar",
    coverImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
  },
  {
    title: "تحسين سرعة المتجر الإلكتروني: من 14 إلى 60 في PageSpeed",
    slug: "speed-optimization-salla-ar",
    excerpt:
      "رفعنا درجة متجر سلة من 14 إلى 67 في PageSpeed خلال أسبوعين. هذه العملية بالتفصيل والنتائج الفعلية على الإيرادات.",
    content: `
<h2>دراسة حالة في السرعة</h2>

<p>تواصل معنا عميل في أكتوبر بمشكلة شائعة. متجره على سلة بطيء، وكان يعرف أن هذا يؤثر على المبيعات. ما لم يعرفه هو كم بالضبط. درجته في PageSpeed Insights كانت 14 على الجوال. ليست خطأ مطبعي. أربعة عشر من مئة.</p>

<p>المتجر يبيع أزياء نسائية في السعودية. منتجات جيدة، أسعار منافسة، تسويق منتظم على انستجرام. لكن الزوار ينقرون من انستجرام، ينتظرون تحميل الصفحة، ويغادرون قبل رؤية أي منتج. معدل الارتداد كان 73%.</p>

<h2>تشخيص المشاكل الحقيقية</h2>

<p>أول شيء فعلناه هو فحص أداء شامل. إليك ما وجدناه:</p>

<ul>
<li>صور المنتجات متوسط حجمها 2.3 ميجابايت. بعضها فوق 5 ميجابايت.</li>
<li>القالب يحمل 47 ملف JavaScript مختلف، كثير منها غير مستخدم.</li>
<li>لا يوجد تخزين مؤقت. كل تحميل صفحة يخدم من جديد.</li>
<li>سكربتات التتبع الخارجية تمنع المحتوى الرئيسي من الظهور.</li>
<li>الخطوط تحمل من سيرفرات خارجية بدون بديل.</li>
</ul>

<p>لا شيء من هذه المشاكل واضح من مجرد النظر للمتجر. يبدو جيدا. لكن من الداخل، فوضى.</p>

<h2>عملية التحسين</h2>

<p>اتبعنا ثلاث مراحل. أولا، الصور. ضغطنا كل صور المنتجات والبانرات مع الحفاظ على الجودة البصرية. متوسط حجم الصورة انخفض من 2.3 ميجابايت إلى 180 كيلوبايت. هذا وحده رفع الدرجة من 14 إلى 31.</p>

<p>ثانيا، تنظيف الكود. حددنا المميزات التي يستخدمها المتجر فعلا وأزلنا JavaScript غير المستخدم. دمجنا ملفات CSS وطبقنا تحميل CSS الحرج. الدرجة قفزت إلى 48.</p>

<p>ثالثا، البنية التحتية. ضبطنا التخزين المؤقت، فعلنا ضغط GZIP، وجعلنا السكربتات الخارجية تحمل بشكل غير متزامن. الدرجة النهائية: 67.</p>

<h2>النتائج التي تهم فعلا</h2>

<p>درجة PageSpeed مجرد رقم. ما يهم هو التأثير على العمل. إليك ما تغير في 30 يوم بعد التحسين:</p>

<ul>
<li>معدل الارتداد انخفض من 73% إلى 49%</li>
<li>متوسط مدة الجلسة زاد 42%</li>
<li>معدل التحويل ارتفع من 1.1% إلى 2.4%</li>
<li>الإيرادات الشهرية زادت حوالي 85,000 ريال</li>
</ul>

<p>تعليق العميل كان بسيط: "ليش ما حد قالنا عن هذا قبل؟"</p>

<h2>ما يمكنك فحصه الآن</h2>

<p>اذهب إلى pagespeed.web.dev وافحص متجرك. إذا درجتك على الجوال أقل من 50، أنت تخسر مال كل يوم. افحص أكبر صورك، عد ملفات JavaScript، وشوف إذا سيرفراتك ترسل headers التخزين المؤقت الصحيحة. هذه الأساسيات، لكن معظم المتاجر تخطئ فيها.</p>
`,
    tags: ["تحسين السرعة", "PageSpeed", "الأداء", "سلة", "تجارة إلكترونية"],
    status: "published",
    publishedAt: new Date("2025-11-22"),
    seo: {
      title: "تحسين سرعة المتجر الإلكتروني - دراسة حالة | جنون",
      description:
        "دراسة حالة حقيقية: كيف حسنا سرعة متجر سلة من 14 إلى 67 في PageSpeed وزدنا الإيرادات 85,000 ريال شهريا.",
      keywords: [
        "تحسين السرعة",
        "PageSpeed",
        "أداء سلة",
        "سرعة المتجر",
        "تحسين الموقع",
      ],
    },
    views: 389,
    language: "ar",
    coverImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200",
  },
  {
    title: "تحسين محركات البحث للتجارة الإلكترونية في السعودية 2025",
    slug: "seo-ecommerce-saudi-ar",
    excerpt:
      "ترتيب جوجل في السعودية يعمل بشكل مختلف عن الأسواق الغربية. إليك ما تعلمناه من تصدر عشرات المتاجر في المملكة.",
    content: `
<h2>السيو في السعودية مختلف</h2>

<p>إذا كنت تطبق استراتيجيات سيو عالمية على متجرك السعودي بدون تكييف، أنت تضيع وقتك ومالك. السوق السعودي له خصائص محددة تغير كيف يعمل تحسين البحث.</p>

<p>للبداية، سلوك البحث العربي مختلف عن الإنجليزي. المستخدمون غالبا يخلطون عربي وإنجليزي في نفس البحث. قد يبحثون عن اسم المنتج بالإنجليزي لكن يضيفون وصف عربي. فهم هذا السلوك الهجين أساسي.</p>

<h2>التحسين ثنائي اللغة ليس اختياري</h2>

<p>إليك خطأ أراه باستمرار: متاجر عربية بالكامل تحسن فقط للكلمات العربية، أو العكس. الواقع أن المستخدمين السعوديين يبحثون بكلا اللغتين، أحيانا في نفس الجلسة.</p>

<p>عميل يبحث عن لابتوب قد يبحث "لابتوب قوي للبرمجة" أولا، ثم يتابع بـ "best programming laptop 2025" لمقارنة الأسعار. إذا متجرك يستهدف لغة واحدة، أنت غير مرئي للباحثين الهجين.</p>

<p>الحل هو تطبيق hreflang صحيح مع محتوى يخاطب كلا السوقين. ليس ترجمة، بل محتوى محلي لكل جمهور.</p>

<h2>السيو المحلي أهم مما تظن</h2>

<p>أكثر من 46% من البحث في السعودية له نية محلية. هذا يعني حتى لو كنت متجر إلكتروني بدون موقع فعلي، الإشارات المحلية مهمة. ربط متجرك بمدن محددة مثل الرياض أو جدة أو الدمام يمكن أن يحسن الظهور.</p>

<p>التطبيق العملي يشمل:</p>

<ul>
<li>صفحات هبوط خاصة بكل مدينة إذا كنت تخدم مناطق مختلفة</li>
<li>علامات schema للنشاط المحلي حتى للمتاجر الإلكترونية فقط</li>
<li>محتوى يذكر مواقع وثقافة سعودية بشكل طبيعي</li>
<li>تقييمات وشهادات من عملاء يذكرون مدينتهم</li>
</ul>

<h2>تحسين الجوال والبحث الصوتي</h2>

<p>أكثر من 90% من مستخدمي الإنترنت في السعودية يدخلون من الجوال. هذا غير مفاجئ. المفاجئ هو كم قليل من المتاجر تحسن محتواها لسلوك البحث على الجوال.</p>

<p>مستخدمو الجوال يميلون لاستعلامات أقصر وأكثر محادثة. البحث الصوتي ينمو بسرعة، خاصة بين الشباب. هذا يعني استهداف كلمات طويلة محادثية مثل "وين أحصل عطور أصلية في الرياض" بدلا من مجرد "عطور الرياض".</p>

<h2>قائمة فحص السيو التقني للمتاجر السعودية</h2>

<p>قبل التركيز على المحتوى، تأكد أن أساسك التقني صلب:</p>

<ul>
<li>Core Web Vitals ناجحة على الجوال، مختبرة على شبكات سعودية</li>
<li>اتجاه النص العربي (RTL) مضبوط بشكل صحيح</li>
<li>علامات hreflang إذا كان لديك نسخ عربية وإنجليزية</li>
<li>بيانات منظمة للمنتجات تشمل الأسعار بالريال</li>
<li>صيغة رقم الهاتف السعودي لمعلومات الاتصال</li>
<li>HTTPS بشهادة صالحة</li>
</ul>

<p>هذه الأساسيات غالبا تُتجاهل لكنها تشكل الأساس لأي نجاح سيو في السوق السعودي.</p>
`,
    tags: ["سيو", "السعودية", "تجارة إلكترونية", "كلمات مفتاحية", "جوجل"],
    status: "published",
    publishedAt: new Date("2025-11-18"),
    seo: {
      title: "سيو التجارة الإلكترونية السعودية 2025 - دليل شامل | جنون",
      description:
        "تعلم استراتيجيات سيو خاصة بالتجارة الإلكترونية في السعودية. التحسين ثنائي اللغة والسيو المحلي وفهرسة الجوال أولا.",
      keywords: [
        "سيو السعودية",
        "سيو التجارة الإلكترونية",
        "سيو عربي",
        "ترتيب جوجل",
        "تحسين البحث",
      ],
    },
    views: 567,
    language: "ar",
    coverImage:
      "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200",
  },
  {
    title: "الهوية البصرية للتجارة الإلكترونية: الشعار مجرد البداية",
    slug: "brand-identity-ecommerce-ar",
    excerpt:
      "شعارك كلفك 500 ريال من Fiverr. منافسك صرف 15,000 ريال على هوية بصرية كاملة. إليك لماذا هو يفوز وكيف تصور العلامة تؤثر على أرباحك.",
    content: `
<h2>فخ الشعار</h2>

<p>يتصل بي أصحاب متاجر كل أسبوع يريدون "شعار يخلي علامتهم تبرز." لما أسألهم عن استراتيجية العلامة التجارية، تعريف الجمهور المستهدف، أو عرض القيمة، عادة أحصل على صمت. يريدون المخرج البصري بدون الأساس الاستراتيجي.</p>

<p>إليك الحقيقة غير المريحة: الشعار حوالي 10% مما يجعل العلامة التجارية لا تنسى. الـ 90% الباقية هي الاتساق والتموضع وتجربة العميل حول تلك الهوية البصرية.</p>

<h2>ما تشمله الهوية البصرية فعلا</h2>

<p>الهوية البصرية الكاملة لمتجر إلكتروني تغطي:</p>

<ul>
<li><strong>النظام البصري:</strong> الشعار، الألوان، الخطوط، أسلوب التصوير، الأيقونات</li>
<li><strong>الصوت والنبرة:</strong> كيف تكتب وصف المنتجات، إيميلات العملاء، منشورات السوشيال</li>
<li><strong>تجربة العميل:</strong> فتح الطرد، التغليف، التواصل اللاحق</li>
<li><strong>الحضور الرقمي:</strong> لغة تصميم الموقع، قوالب السوشيال، تصاميم الإعلانات</li>
</ul>

<p>عندما تعمل كل هذه العناصر معا باتساق، العملاء يبدأون يتعرفون على علامتك بدون حتى رؤية الشعار. يتعرفون على الشعور الذي تخلقه علامتك.</p>

<h2>أرقام حقيقية من علامات حقيقية</h2>

<p>دعني أشارك مقارنة من متجرين أزياء عملنا معهم السنة الماضية. كلاهما يبيع منتجات مشابهة بأسعار مشابهة. واحد استثمر في شعار رخيص واستخدم قوالب انستجرام عشوائية. الآخر استثمر في هوية بصرية كاملة.</p>

<p>متجر أ (براندينج أساسي) كان متوسط قيمة الطلب 340 ريال. متجر ب (براندينج كامل) كان متوسط قيمة الطلب 520 ريال. نفس السوق، نفس المنتجات، تصور مختلف للقيمة.</p>

<p>متجر أ يعاني مع استبقاء العملاء. متجر ب 35% من طلباته من عملاء عائدين. البراندينج يخلق ثقة، والثقة تخلق ولاء.</p>

<h2>منظور السوق السعودي</h2>

<p>المستهلكون السعوديون أصبحوا أكثر تطورا في فهم العلامات التجارية. أيام كان أي متجر يمكن أن ينافس بالسعر فقط انتهت. العملاء الآن يقارنون التجارب، ليس فقط المنتجات.</p>

<p>التموضع الفاخر والمتميز يعمل بشكل خاص في السعودية. لكن الفخامة تتطلب اتساق. لا يمكن أن يكون لديك شعار فخم مع تغليف رخيص وتتوقع أن يشعر العملاء بالقيمة.</p>

<h2>نقاط بداية لأصحاب المتاجر</h2>

<p>إذا لا تستطيع الاستثمار في هوية بصرية كاملة الآن، على الأقل افعل هذه الأشياء:</p>

<ul>
<li>حدد ألوان علامتك واستخدمها باتساق في كل مكان</li>
<li>اختر خط عربي وخط إنجليزي والتزم بهم</li>
<li>أنشئ قوالب للسوشيال حتى يبدو محتواك متناسق</li>
<li>اكتب إرشادات صوت علامتك في ثلاث جمل</li>
<li>اجعل تغليفك لا ينسى، حتى لو بسيط</li>
</ul>

<p>البراندينج ليس عن صرف المال. هو عن اتخاذ قرارات مقصودة وتطبيقها باتساق عبر الوقت. المتاجر التي تفهم هذا هي التي تبني أعمال حقيقية، ليس مجرد متاجر مؤقتة.</p>
`,
    tags: ["براندينج", "هوية بصرية", "تجارة إلكترونية", "تصميم", "تسويق"],
    status: "published",
    publishedAt: new Date("2025-11-12"),
    seo: {
      title: "دليل الهوية البصرية للتجارة الإلكترونية - أكثر من شعار | جنون",
      description:
        "تعلم لماذا الهوية البصرية أكثر من مجرد شعار. دليل كامل لبناء علامة تجارية لا تنسى لمتجرك الإلكتروني في السعودية.",
      keywords: [
        "هوية بصرية",
        "براندينج التجارة الإلكترونية",
        "تصميم شعار",
        "الهوية المرئية",
        "براندينج السعودية",
      ],
    },
    views: 423,
    language: "ar",
    coverImage:
      "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=1200",
  },
  {
    title: "لماذا متجرك على شوبيفاي يحتاج تكامل الدفع السعودي في 2025",
    slug: "shopify-saudi-payment-ar",
    excerpt:
      "إذا تدير متجر شوبيفاي يستهدف عملاء سعوديين بدون تكامل مدى، أنت تخسر على الأقل 40% من المبيعات المحتملة.",
    content: `
<h2>مشكلة الدفع التي قد لا تعرف عنها</h2>

<p>شوبيفاي منصة رائعة. يتعامل مع المخزون، حسابات الشحن، إدارة العملاء، ومئة شيء آخر سيحتاج أشهر لبنائه من الصفر. لكن هنا حيث يقصر في السعودية: خيارات الدفع.</p>

<p>افتراضيا، شوبيفاي يوفر Stripe و PayPal وبعض بوابات الدفع العالمية الأخرى. تعمل جيد للعملاء في أوروبا أو أمريكا. لكن للعملاء السعوديين، خاصة فوق 30، هذه الخيارات تبدو غريبة وغير موثوقة.</p>

<h2>فهم كيف يدفع السعوديون فعلا</h2>

<p>دعني أشارك بعض الأرقام من متاجر عملنا معها. قبل إضافة مدى كخيار دفع، متوسط معدل ترك السلة عند الدفع كان 78%. بعد إضافة مدى، انخفض إلى 52%. هذا فرق ضخم من تغيير واحد.</p>

<p>لماذا؟ لأن مدى هي شبكة الخصم التي تستخدمها كل بطاقة بنك سعودي. عندما يرى العملاء شعار مدى، يعرفون أن دفعتهم تمر عبر قنوات مألوفة. Apple Pay أيضا يؤدي جيد لأنه مربوط ببطاقاتهم المحلية على أي حال.</p>

<h2>عملية التكامل ليست صعبة كما تظن</h2>

<p>تحدثت مع كثير من أصحاب المتاجر الذين أخروا إضافة وسائل دفع سعودية لأنهم ظنوا ستكون معقدة. إليك الواقع: مع شريك بوابة الدفع الصحيح، يمكن أن يكون عندك مدى و Apple Pay و STC Pay يعملون خلال 48 ساعة.</p>

<p>البوابات الرئيسية التي تعمل جيد مع شوبيفاي في السعودية هي Tap و HyperPay و MyFatoorah. كل واحدة لها مميزاتها وعيوبها. Tap لديه أسلس تكامل مع شوبيفاي. HyperPay يوفر أسعار أفضل للمتاجر ذات الحجم العالي. MyFatoorah يعمل جيد إذا تبيع أيضا في دول الخليج الأخرى.</p>

<h2>المتطلبات التقنية التي تحتاج تعتبرها</h2>

<p>لتكامل وسائل الدفع السعودية مع شوبيفاي، ستحتاج:</p>

<ul>
<li>سجل تجاري في السعودية أو وثيقة عمل حر صالحة</li>
<li>حساب بنك سعودي باسم نشاطك التجاري</li>
<li>وثائق أساسية مثل نسخ الهوية وإثبات النشاط</li>
</ul>

<p>مزودو البوابات يتعاملون مع التكامل التقني الفعلي. لا تحتاج تكتب كود. لكن تحتاج شخص يفهم كيف يضبط إعدادات الدفع في شوبيفاي بشكل صحيح، خاصة للمتاجر متعددة العملات.</p>

<h2>أخطاء شائعة لتجنبها</h2>

<p>أكبر خطأ أراه هو متاجر تضيف خيارات الدفع السعودية لكن تخفيها تحت الخيارات العالمية. مدى يجب أن يكون أول خيار دفع مرئي، ليس الثالث. خطأ آخر هو عدم اختبار مسار الدفع على شبكات الجوال السعودية. ما يعمل على WiFi قد ينقطع على 4G في بعض المناطق.</p>

<p>أخيرا، تأكد أن صفحات نجاح وفشل الدفع مترجمة بشكل صحيح. لا شيء يقتل الثقة أسرع من متجر عربي يعرض رسائل خطأ إنجليزية عندما يفشل الدفع.</p>
`,
    tags: ["شوبيفاي", "مدى", "تكامل الدفع", "السعودية", "تجارة إلكترونية"],
    status: "published",
    publishedAt: new Date("2025-11-25"),
    seo: {
      title: "تكامل الدفع السعودي لشوبيفاي - مدى وApple Pay | جنون",
      description:
        "تعلم كيف تكامل مدى و Apple Pay و STC Pay مع متجرك على شوبيفاي في السعودية. قلل ترك السلة وزد التحويلات.",
      keywords: [
        "شوبيفاي السعودية",
        "تكامل مدى",
        "دفع شوبيفاي",
        "apple pay شوبيفاي",
        "تجارة إلكترونية سعودية",
      ],
    },
    views: 356,
    language: "ar",
    coverImage:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200",
  },
];

async function seedArticles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find an admin user to be the author
    let author = await User.findOne({ role: "admin" });
    if (!author) {
      // Try to find any user
      author = await User.findOne();
    }
    if (!author) {
      console.error("No user found in database. Please create a user first.");
      process.exit(1);
    }
    console.log(`Using author: ${author.email}`);

    // Prepare all articles with author
    const allArticles = [...englishArticles, ...arabicArticles].map(
      (article) => ({
        ...article,
        author: author._id,
      })
    );

    // Clear existing articles (optional - comment out if you want to keep existing)
    await Article.deleteMany({});
    console.log("Cleared existing articles");

    // Insert new articles
    const result = await Article.insertMany(allArticles);
    console.log(`Successfully seeded ${result.length} articles:`);
    console.log(`  - ${englishArticles.length} English articles`);
    console.log(`  - ${arabicArticles.length} Arabic articles`);

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding articles:", error);
    process.exit(1);
  }
}

seedArticles();

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Service from "../models/serviceModel.js";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two directories up from seeds)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const services = [
  {
    title: { ar: "تطوير منصة سلة", en: "Salla Development" },
    slug: "salla-development",
    shortDescription: {
      ar: "تصميم قوالب مخصصة احترافية تعكس هوية علامتك التجارية وتزيد معدلات التحويل.",
      en: "Custom professional themes that reflect your brand identity and increase conversion rates.",
    },
    description: {
      ar: "نقدم خدمات تطوير متكاملة لمنصة سلة تشمل تصميم قوالب مخصصة احترافية، تحسين واجهة المستخدم، وتكامل مع أنظمة الدفع والشحن السعودية. فريقنا من المطورين المحترفين يضمن لك متجراً إلكترونياً يعكس هوية علامتك التجارية ويحقق أعلى معدلات التحويل.",
      en: "We provide comprehensive Salla platform development including custom professional themes, UI/UX improvements, and integration with Saudi payment and shipping systems. Our professional developers ensure your store reflects your brand identity and achieves maximum conversion rates.",
    },
    icon: "shopping-cart",
    category: "salla",
    features: [
      {
        icon: "palette",
        title: { ar: "تصميم مخصص", en: "Custom Design" },
        description: {
          ar: "قوالب فريدة تعكس هوية علامتك التجارية",
          en: "Unique templates reflecting your brand identity",
        },
      },
      {
        icon: "zap",
        title: { ar: "أداء عالي", en: "High Performance" },
        description: {
          ar: "سرعة تحميل فائقة ومتوافق مع الجوال",
          en: "Fast loading speed and mobile responsive",
        },
      },
      {
        icon: "shield",
        title: { ar: "تكامل آمن", en: "Secure Integration" },
        description: {
          ar: "تكامل مع بوابات الدفع السعودية",
          en: "Integration with Saudi payment gateways",
        },
      },
    ],
    stats: [
      {
        value: "50+",
        label: { ar: "قالب مخصص", en: "Custom Themes" },
        icon: "layout",
      },
      {
        value: "200+",
        label: { ar: "عميل سعيد", en: "Happy Clients" },
        icon: "users",
      },
      {
        value: "99%",
        label: { ar: "رضا العملاء", en: "Satisfaction" },
        icon: "heart",
      },
    ],
    pricingType: "quote",
    order: 1,
    isActive: true,
    isFeatured: true,
  },
  {
    title: { ar: "تحسين السرعة", en: "Speed Optimization" },
    slug: "speed-optimization",
    shortDescription: {
      ar: "تحسين أداء متجرك على سلة وزد من سرعة 14 إلى 60+ في PageSpeed.",
      en: "Optimize your Salla & Zid store performance from 14 to 60+ PageSpeed score.",
    },
    description: {
      ar: "نقوم بتحسين أداء متجرك الإلكتروني بشكل شامل من خلال تقليل وقت التحميل، تحسين الصور، ضغط الملفات، وتحسين الكود البرمجي. نحقق نتائج ملموسة برفع درجة PageSpeed من 14 إلى 60+ مما يحسن تجربة المستخدم ويزيد معدلات التحويل.",
      en: "We comprehensively optimize your online store by reducing load times, optimizing images, compressing files, and improving code. We achieve tangible results by increasing PageSpeed from 14 to 60+, improving user experience and conversion rates.",
    },
    icon: "zap",
    category: "seo",
    features: [
      {
        icon: "gauge",
        title: { ar: "تحليل الأداء", en: "Performance Analysis" },
        description: {
          ar: "تحليل شامل لأداء متجرك الحالي",
          en: "Comprehensive analysis of current store performance",
        },
      },
      {
        icon: "image",
        title: { ar: "تحسين الصور", en: "Image Optimization" },
        description: {
          ar: "ضغط وتحسين جودة الصور تلقائياً",
          en: "Automatic image compression and optimization",
        },
      },
      {
        icon: "code",
        title: { ar: "تحسين الكود", en: "Code Optimization" },
        description: {
          ar: "تحسين وتنظيف الكود البرمجي",
          en: "Clean and optimize source code",
        },
      },
    ],
    stats: [
      {
        value: "14→60",
        label: { ar: "PageSpeed", en: "PageSpeed" },
        icon: "trending-up",
      },
      { value: "70%", label: { ar: "سرعة أفضل", en: "Faster" }, icon: "zap" },
      {
        value: "3x",
        label: { ar: "تحويلات أكثر", en: "More Conversions" },
        icon: "arrow-up",
      },
    ],
    pricingType: "quote",
    order: 2,
    isActive: true,
    isFeatured: true,
  },
  {
    title: { ar: "مواقع مخصصة", en: "Custom Websites" },
    slug: "custom-websites",
    shortDescription: {
      ar: "تطوير مواقع متكاملة من الصفر - سياحة، حجوزات، متاجر، وأنظمة إدارة.",
      en: "Building complete websites from scratch - travel, booking, stores, and management systems.",
    },
    description: {
      ar: "نطور مواقع إلكترونية مخصصة من الصفر تناسب احتياجات عملك الفريدة. سواء كنت تحتاج موقع سياحي، نظام حجوزات، متجر إلكتروني، أو نظام إدارة داخلي - فريقنا المتخصص سيحول رؤيتك إلى واقع رقمي متميز.",
      en: "We develop custom websites from scratch to suit your unique business needs. Whether you need a travel site, booking system, online store, or internal management system - our specialized team will transform your vision into an outstanding digital reality.",
    },
    icon: "globe",
    category: "websites",
    features: [
      {
        icon: "code",
        title: { ar: "تطوير مخصص", en: "Custom Development" },
        description: {
          ar: "حلول برمجية مصممة خصيصاً لك",
          en: "Tailored programming solutions for you",
        },
      },
      {
        icon: "smartphone",
        title: { ar: "متوافق مع الجوال", en: "Mobile Responsive" },
        description: {
          ar: "تصميم متجاوب يعمل على جميع الأجهزة",
          en: "Responsive design works on all devices",
        },
      },
      {
        icon: "database",
        title: { ar: "قاعدة بيانات", en: "Database" },
        description: {
          ar: "إدارة بيانات متقدمة وآمنة",
          en: "Advanced and secure data management",
        },
      },
    ],
    stats: [
      {
        value: "100+",
        label: { ar: "مشروع ناجح", en: "Successful Projects" },
        icon: "check-circle",
      },
      {
        value: "15+",
        label: { ar: "سنة خبرة", en: "Years Experience" },
        icon: "award",
      },
    ],
    pricingType: "quote",
    order: 3,
    isActive: true,
    isFeatured: true,
  },
  {
    title: { ar: "متاجر شوبيفاي", en: "Shopify Stores" },
    slug: "shopify-stores",
    shortDescription: {
      ar: "بناء متاجر شوبيفاي احترافية مع تخصيص كامل وتكامل مع أنظمة الدفع السعودية.",
      en: "Professional Shopify stores with full customization and Saudi payment integration.",
    },
    description: {
      ar: "نبني متاجر شوبيفاي احترافية تناسب السوق السعودي والعالمي. نقدم تخصيص كامل للقالب، تكامل مع بوابات الدفع السعودية، وتحسين محركات البحث لضمان وصولك لأكبر عدد من العملاء.",
      en: "We build professional Shopify stores suitable for Saudi and global markets. We offer full theme customization, Saudi payment gateway integration, and SEO optimization to ensure you reach the maximum number of customers.",
    },
    icon: "code",
    category: "shopify",
    features: [
      {
        icon: "globe",
        title: { ar: "عالمي محلي", en: "Global Local" },
        description: {
          ar: "متجر عالمي بلمسة سعودية",
          en: "Global store with Saudi touch",
        },
      },
      {
        icon: "credit-card",
        title: { ar: "دفع سعودي", en: "Saudi Payment" },
        description: {
          ar: "تكامل مع مدى وأبل باي",
          en: "Integration with Mada and Apple Pay",
        },
      },
    ],
    stats: [
      { value: "99.9%", label: { ar: "Uptime", en: "Uptime" }, icon: "server" },
      {
        value: "24/7",
        label: { ar: "دعم فني", en: "Support" },
        icon: "headphones",
      },
    ],
    pricingType: "quote",
    order: 4,
    isActive: true,
    isFeatured: false,
  },
  {
    title: { ar: "تصدر نتائج البحث", en: "SEO & Marketing" },
    slug: "seo-marketing",
    shortDescription: {
      ar: "استراتيجيات SEO متقدمة لظهور متجرك في الصفحة الأولى من Google.",
      en: "Advanced SEO strategies to rank your store on the first page of Google.",
    },
    description: {
      ar: "نقدم استراتيجيات تحسين محركات البحث متقدمة تضمن ظهور متجرك في الصفحة الأولى من Google. نستخدم أحدث التقنيات والأدوات لتحليل الكلمات المفتاحية وبناء روابط قوية.",
      en: "We provide advanced SEO strategies that ensure your store appears on the first page of Google. We use the latest techniques and tools for keyword analysis and strong link building.",
    },
    icon: "search",
    category: "seo",
    features: [
      {
        icon: "target",
        title: { ar: "كلمات مفتاحية", en: "Keywords" },
        description: {
          ar: "تحليل واستهداف الكلمات الأكثر بحثاً",
          en: "Analysis and targeting of most searched keywords",
        },
      },
      {
        icon: "link",
        title: { ar: "بناء روابط", en: "Link Building" },
        description: {
          ar: "روابط خلفية قوية من مواقع موثوقة",
          en: "Strong backlinks from trusted sites",
        },
      },
    ],
    stats: [
      { value: "Page 1", label: { ar: "Google", en: "Google" }, icon: "award" },
      {
        value: "300%",
        label: { ar: "زيادة الزوار", en: "Traffic Increase" },
        icon: "trending-up",
      },
    ],
    pricingType: "quote",
    order: 5,
    isActive: true,
    isFeatured: false,
  },
  {
    title: { ar: "الهوية البصرية", en: "Brand Identity" },
    slug: "branding",
    shortDescription: {
      ar: "تصميم هويات بصرية متكاملة تميز علامتك التجارية في السوق السعودي.",
      en: "Complete visual identity design that sets your brand apart in the Saudi market.",
    },
    description: {
      ar: "نصمم هويات بصرية متكاملة تشمل الشعار، الألوان، الخطوط، وجميع عناصر التصميم التي تميز علامتك التجارية. نهتم بأدق التفاصيل لنقدم لك هوية فريدة تعكس قيم شركتك.",
      en: "We design complete visual identities including logo, colors, fonts, and all design elements that distinguish your brand. We pay attention to the finest details to provide you with a unique identity that reflects your company values.",
    },
    icon: "palette",
    category: "branding",
    features: [
      {
        icon: "pen-tool",
        title: { ar: "تصميم الشعار", en: "Logo Design" },
        description: {
          ar: "شعار فريد يعكس هوية علامتك",
          en: "Unique logo reflecting your brand identity",
        },
      },
      {
        icon: "layout",
        title: { ar: "دليل الهوية", en: "Brand Guide" },
        description: {
          ar: "دليل شامل لاستخدام الهوية البصرية",
          en: "Complete guide for visual identity usage",
        },
      },
    ],
    stats: [
      {
        value: "360°",
        label: { ar: "تصميم شامل", en: "Full Design" },
        icon: "target",
      },
      {
        value: "100+",
        label: { ar: "علامة تجارية", en: "Brands" },
        icon: "star",
      },
    ],
    pricingType: "quote",
    order: 6,
    isActive: true,
    isFeatured: false,
  },
];

async function seedServices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing services
    await Service.deleteMany({});
    console.log("Cleared existing services");

    // Insert new services
    const result = await Service.insertMany(services);
    console.log(`Successfully seeded ${result.length} services`);

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding services:", error);
    process.exit(1);
  }
}

seedServices();

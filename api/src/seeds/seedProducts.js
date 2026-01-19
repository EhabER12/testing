import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two directories up from seeds)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Category Schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    description: {
      ar: { type: String },
      en: { type: String },
    },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Product Schema
const productSchema = new mongoose.Schema(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    slug: { type: String, required: true, unique: true },
    shortDescription: {
      ar: { type: String },
      en: { type: String },
    },
    description: {
      ar: { type: String },
      en: { type: String },
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    coverImage: { type: String },
    gallery: [{ type: String }],
    basePrice: { type: Number, required: true },
    compareAtPrice: { type: Number },
    currency: { type: String, default: "SAR" },
    variants: [
      {
        name: {
          ar: { type: String },
          en: { type: String },
        },
        price: { type: Number },
        isDefault: { type: Boolean, default: false },
      },
    ],
    addons: [
      {
        name: {
          ar: { type: String },
          en: { type: String },
        },
        price: { type: Number },
      },
    ],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

// Categories Data
const categories = [
  {
    name: { ar: "قوالب سلة", en: "Salla Templates" },
    description: {
      ar: "قوالب احترافية جاهزة لمتاجر سلة",
      en: "Professional ready-made templates for Salla stores",
    },
    isActive: true,
    order: 1,
  },
  {
    name: { ar: "بنرات وتصاميم", en: "Banners & Designs" },
    description: {
      ar: "بنرات إعلانية وتصاميم سوشيال ميديا",
      en: "Ad banners and social media designs",
    },
    isActive: true,
    order: 2,
  },
  {
    name: { ar: "هوية بصرية", en: "Brand Identity" },
    description: {
      ar: "شعارات وهويات بصرية كاملة",
      en: "Logos and complete visual identities",
    },
    isActive: true,
    order: 3,
  },
  {
    name: { ar: "UI/UX تصاميم", en: "UI/UX Designs" },
    description: {
      ar: "تصاميم واجهات المستخدم وتجربة المستخدم",
      en: "User interface and user experience designs",
    },
    isActive: true,
    order: 4,
  },
];

// Products Data (will be populated with category IDs)
const getProducts = (categoryIds) => [
  // Salla Templates
  {
    name: { ar: "قالب فاشن برو", en: "Fashion Pro Template" },
    slug: "fashion-pro-template",
    shortDescription: {
      ar: "قالب احترافي لمتاجر الملابس والأزياء",
      en: "Professional template for fashion and clothing stores",
    },
    description: {
      ar: "قالب سلة احترافي مصمم خصيصاً لمتاجر الملابس والأزياء. يتميز بتصميم عصري وأنيق مع عرض منتجات جذاب وتجربة تسوق سلسة. يشمل القالب صفحة رئيسية، صفحات المنتجات، سلة التسوق، وصفحة الدفع.",
      en: "Professional Salla template designed specifically for fashion and clothing stores. Features modern and elegant design with attractive product display and smooth shopping experience. Includes homepage, product pages, shopping cart, and checkout page.",
    },
    categoryId: categoryIds[0],
    coverImage:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400",
    basePrice: 499,
    compareAtPrice: 799,
    currency: "SAR",
    variants: [
      { name: { ar: "أساسي", en: "Basic" }, price: 499, isDefault: true },
      { name: { ar: "متقدم", en: "Advanced" }, price: 799, isDefault: false },
      { name: { ar: "برو", en: "Pro" }, price: 1299, isDefault: false },
    ],
    addons: [
      {
        name: { ar: "التركيب والإعداد", en: "Installation & Setup" },
        price: 150,
      },
      { name: { ar: "تعديلات مخصصة", en: "Custom Modifications" }, price: 300 },
    ],
    isActive: true,
    isFeatured: true,
    order: 1,
  },
  {
    name: { ar: "قالب تك ستور", en: "Tech Store Template" },
    slug: "tech-store-template",
    shortDescription: {
      ar: "قالب متجر إلكترونيات ومنتجات تقنية",
      en: "Electronics and tech products store template",
    },
    description: {
      ar: "قالب سلة متخصص للمنتجات التقنية والإلكترونيات. تصميم عصري مع عرض مواصفات المنتجات بشكل واضح ومقارنة المنتجات.",
      en: "Salla template specialized for tech products and electronics. Modern design with clear product specifications display and product comparison.",
    },
    categoryId: categoryIds[0],
    coverImage:
      "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400",
    basePrice: 599,
    compareAtPrice: 899,
    currency: "SAR",
    variants: [
      { name: { ar: "أساسي", en: "Basic" }, price: 599, isDefault: true },
      { name: { ar: "برو", en: "Pro" }, price: 999, isDefault: false },
    ],
    isActive: true,
    isFeatured: true,
    order: 2,
  },
  // Banners & Designs
  {
    name: { ar: "باقة بنرات رمضان", en: "Ramadan Banners Pack" },
    slug: "ramadan-banners-pack",
    shortDescription: {
      ar: "20 بنر احترافي لشهر رمضان المبارك",
      en: "20 professional banners for Ramadan",
    },
    description: {
      ar: "باقة متكاملة من 20 بنر احترافي مصمم خصيصاً لشهر رمضان. تشمل بنرات للموقع، انستاجرام، تويتر، وسناب شات. جميع الملفات بصيغة PSD قابلة للتعديل.",
      en: "Complete package of 20 professional banners designed for Ramadan. Includes banners for website, Instagram, Twitter, and Snapchat. All files in editable PSD format.",
    },
    categoryId: categoryIds[1],
    coverImage:
      "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400",
    basePrice: 199,
    compareAtPrice: 399,
    currency: "SAR",
    isActive: true,
    isFeatured: true,
    order: 3,
  },
  {
    name: { ar: "حزمة سوشيال ميديا", en: "Social Media Bundle" },
    slug: "social-media-bundle",
    shortDescription: {
      ar: "50 تصميم لجميع منصات التواصل",
      en: "50 designs for all social platforms",
    },
    description: {
      ar: "حزمة شاملة تحتوي على 50 تصميم احترافي لجميع منصات التواصل الاجتماعي. تشمل ستوريات، بوستات، كوفرات، وإعلانات.",
      en: "Comprehensive bundle containing 50 professional designs for all social media platforms. Includes stories, posts, covers, and ads.",
    },
    categoryId: categoryIds[1],
    coverImage:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400",
    basePrice: 299,
    currency: "SAR",
    variants: [
      {
        name: { ar: "50 تصميم", en: "50 Designs" },
        price: 299,
        isDefault: true,
      },
      {
        name: { ar: "100 تصميم", en: "100 Designs" },
        price: 499,
        isDefault: false,
      },
    ],
    isActive: true,
    isFeatured: true,
    order: 4,
  },
  // Brand Identity
  {
    name: { ar: "هوية بصرية متكاملة", en: "Complete Brand Identity" },
    slug: "complete-brand-identity",
    shortDescription: {
      ar: "شعار وهوية بصرية كاملة لعلامتك التجارية",
      en: "Logo and complete visual identity for your brand",
    },
    description: {
      ar: "باقة الهوية البصرية المتكاملة تشمل: تصميم الشعار، اختيار الألوان والخطوط، بطاقات العمل، ترويسة، أظرف، وملف PDF لدليل الهوية البصرية.",
      en: "Complete visual identity package includes: logo design, color and font selection, business cards, letterhead, envelopes, and brand identity guide PDF.",
    },
    categoryId: categoryIds[2],
    coverImage:
      "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=400",
    basePrice: 1499,
    compareAtPrice: 2499,
    currency: "SAR",
    variants: [
      { name: { ar: "أساسي", en: "Basic" }, price: 1499, isDefault: true },
      { name: { ar: "متقدم", en: "Premium" }, price: 2999, isDefault: false },
    ],
    addons: [
      { name: { ar: "موشن جرافيك للشعار", en: "Logo Animation" }, price: 500 },
      {
        name: { ar: "تصاميم سوشيال ميديا", en: "Social Media Designs" },
        price: 400,
      },
    ],
    isActive: true,
    isFeatured: true,
    order: 5,
  },
  // UI/UX Designs
  {
    name: { ar: "تصميم تطبيق توصيل", en: "Delivery App Design" },
    slug: "delivery-app-design",
    shortDescription: {
      ar: "تصميم UI/UX متكامل لتطبيق توصيل",
      en: "Complete UI/UX design for delivery app",
    },
    description: {
      ar: "تصميم واجهات مستخدم احترافية لتطبيق توصيل يشمل: صفحة الهوم، القائمة، سلة الطلبات، الدفع، تتبع الطلب، والإشعارات. جميع الشاشات بصيغة Figma.",
      en: "Professional UI design for delivery app includes: home page, menu, cart, payment, order tracking, and notifications. All screens in Figma format.",
    },
    categoryId: categoryIds[3],
    coverImage:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
    basePrice: 2999,
    currency: "SAR",
    variants: [
      { name: { ar: "iOS فقط", en: "iOS Only" }, price: 2999, isDefault: true },
      {
        name: { ar: "iOS + Android", en: "iOS + Android" },
        price: 4999,
        isDefault: false,
      },
    ],
    isActive: true,
    isFeatured: true,
    order: 6,
  },
  {
    name: { ar: "داشبورد إدارية", en: "Admin Dashboard" },
    slug: "admin-dashboard-design",
    shortDescription: {
      ar: "تصميم لوحة تحكم إدارية متكاملة",
      en: "Complete admin dashboard design",
    },
    description: {
      ar: "تصميم لوحة تحكم إدارية شاملة تشمل: الصفحة الرئيسية، إدارة المستخدمين، التقارير، الإعدادات، والإحصائيات. تصميم عصري وسهل الاستخدام.",
      en: "Comprehensive admin dashboard design includes: homepage, user management, reports, settings, and statistics. Modern and user-friendly design.",
    },
    categoryId: categoryIds[3],
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
    basePrice: 1999,
    compareAtPrice: 2999,
    currency: "SAR",
    isActive: true,
    isFeatured: false,
    order: 7,
  },
  {
    name: { ar: "قالب كوفي شوب", en: "Coffee Shop Template" },
    slug: "coffee-shop-template",
    shortDescription: {
      ar: "قالب سلة للمقاهي والكوفي شوب",
      en: "Salla template for cafes and coffee shops",
    },
    description: {
      ar: "قالب سلة مصمم خصيصاً للمقاهي والكوفي شوب. يتميز بعرض المنتجات بطريقة جذابة مع إمكانية الطلب والتوصيل.",
      en: "Salla template designed specifically for cafes and coffee shops. Features attractive product display with ordering and delivery options.",
    },
    categoryId: categoryIds[0],
    coverImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    basePrice: 449,
    currency: "SAR",
    isActive: true,
    isFeatured: false,
    order: 8,
  },
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Category.deleteMany({});
    console.log("🗑️  Cleared existing categories");

    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    // Insert categories
    const insertedCategories = await Category.insertMany(categories);
    const categoryIds = insertedCategories.map((cat) => cat._id);
    console.log(`✅ Seeded ${insertedCategories.length} categories`);

    // Insert products with category references
    const products = getProducts(categoryIds);
    const insertedProducts = await Product.insertMany(products);
    console.log(`✅ Seeded ${insertedProducts.length} products`);

    // Summary
    console.log("\n📊 Seed Summary:");
    console.log(`   Categories: ${insertedCategories.length}`);
    console.log(`   Products: ${insertedProducts.length}`);
    console.log(
      `   Featured: ${insertedProducts.filter((p) => p.isFeatured).length}`
    );

    // Close connection
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();

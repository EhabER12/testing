import mongoose from "mongoose";

/**
 * Static Page Model
 * For managing content pages like Privacy Policy, Terms, About Us, etc.
 * Content is bilingual (AR/EN) and can be displayed in footer/header navigation.
 */
const staticPageSchema = new mongoose.Schema(
  {
    // Unique slug identifier
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "privacy-policy",
        "terms-and-conditions",
        "about-us",
        "faqs",
        "pricing-policy",
        "refund-policy",
      ],
    },
    // Bilingual title
    title: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    // Bilingual content (HTML/Markdown)
    content: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    // Publishing status
    isPublished: {
      type: Boolean,
      default: false,
    },
    // Navigation visibility
    showInFooter: {
      type: Boolean,
      default: true,
    },
    showInHeader: {
      type: Boolean,
      default: false,
    },
    // Display order in navigation
    order: {
      type: Number,
      default: 0,
    },
    // SEO metadata
    seoMeta: {
      title: {
        ar: { type: String, default: "" },
        en: { type: String, default: "" },
      },
      description: {
        ar: { type: String, default: "" },
        en: { type: String, default: "" },
      },
    },
    // Last updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Default pages with initial content
const defaultPages = [
  {
    slug: "privacy-policy",
    title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    content: { ar: "", en: "" },
    order: 1,
    showInFooter: true,
    showInHeader: false,
  },
  {
    slug: "terms-and-conditions",
    title: { ar: "الشروط والأحكام", en: "Terms and Conditions" },
    content: { ar: "", en: "" },
    order: 2,
    showInFooter: true,
    showInHeader: false,
  },
  {
    slug: "about-us",
    title: { ar: "من نحن", en: "About Us" },
    content: { ar: "", en: "" },
    order: 0,
    showInFooter: true,
    showInHeader: true,
  },
  {
    slug: "faqs",
    title: { ar: "الأسئلة الشائعة", en: "FAQs" },
    content: { ar: "", en: "" },
    order: 3,
    showInFooter: true,
    showInHeader: false,
  },
  {
    slug: "pricing-policy",
    title: { ar: "سياسة التسعير", en: "Pricing Policy" },
    content: { ar: "", en: "" },
    order: 4,
    showInFooter: true,
    showInHeader: false,
  },
  {
    slug: "refund-policy",
    title: { ar: "سياسة الاسترداد", en: "Refund Policy" },
    content: { ar: "", en: "" },
    order: 5,
    showInFooter: true,
    showInHeader: false,
  },
];

// Seed default pages if they don't exist
staticPageSchema.statics.seedDefaultPages = async function () {
  for (const page of defaultPages) {
    await this.findOneAndUpdate(
      { slug: page.slug },
      { $setOnInsert: page },
      { upsert: true, new: true }
    );
  }
  return this.find().sort({ order: 1 });
};

const StaticPage = mongoose.model("StaticPage", staticPageSchema);

export default StaticPage;

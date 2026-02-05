import mongoose from "mongoose";

const socialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, "Platform is required"],
  },
  url: {
    type: String,
    required: [true, "URL is required"],
  },
});

// Marketing Banner Individual Item Schema
const marketingBannerItemSchema = new mongoose.Schema({
  text: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  linkUrl: {
    type: String,
    default: "",
  },
  linkText: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  icon: {
    type: String, // Icon name from lucide-react (e.g., "Sparkles", "Tag", "Gift")
    default: "",
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  backgroundColor: {
    type: String,
    default: "#1a472a", // Dark green matching brand
  },
  textColor: {
    type: String,
    default: "#ffffff",
  },
});

// Marketing Banners Settings Schema
const marketingBannersSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false,
  },
  autoSlideInterval: {
    type: Number,
    default: 5000, // 5 seconds
    min: 2000,
    max: 15000,
  },
  banners: [marketingBannerItemSchema],
});

// Navbar Link Schema
const navbarLinkSchema = new mongoose.Schema({
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  url: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  isExternal: {
    type: Boolean,
    default: false,
  },
});

// Homepage Section Schema
const sectionConfigSchema = new mongoose.Schema({
  title: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  subtitle: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  content: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  buttonText: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  buttonLink: {
    type: String,
    default: "",
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  backgroundImage: {
    type: String,
    default: "",
  },
  order: {
    type: Number,
    default: 0,
  },
});

// Promo Modal Schema
const promoModalSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: false,
  },
  title: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  content: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  imageUrl: {
    type: String,
    default: "",
  },
  buttonText: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  buttonLink: {
    type: String,
    default: "",
  },
  displayDelay: {
    type: Number,
    default: 3000, // 3 seconds
  },
  showOnce: {
    type: Boolean,
    default: true,
  },
});

// Homepage Banner Schema
const homepageBannerSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  title: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  subtitle: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  buttonText: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  buttonLink: {
    type: String,
    default: "",
  },
});

// Homepage Courses Settings Schema
const homepageCoursesSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  displayCount: {
    type: Number,
    default: 6,
    min: 1,
    max: 20,
  },
  title: {
    ar: { type: String, default: "الدورات المتاحة" },
    en: { type: String, default: "Available Courses" },
  },
  subtitle: {
    ar: { type: String, default: "تصفح أحدث دوراتنا" },
    en: { type: String, default: "Browse our latest courses" },
  },
  buttonText: {
    ar: { type: String, default: "عرض جميع الدورات" },
    en: { type: String, default: "View All Courses" },
  },
});

// Authority Bar Settings Schema (NEW - Platform Recognition Badges)
const authorityBarSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  title: {
    ar: { type: String, default: "موثوق من قبل المؤسسات الرائدة" },
    en: { type: String, default: "Trusted by Leading Institutions" },
  },
  order: {
    type: Number,
    default: 1,
  },
  items: [{
    icon: { type: String, default: "shield" }, // shield, users, award, check, star
    text: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
  }],
}, { _id: false });

// Reviews Section Settings Schema (NEW - Testimonials Control)
const reviewsSectionSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  title: {
    ar: { type: String, default: "آراء طلابنا" },
    en: { type: String, default: "Student Reviews" },
  },
  subtitle: {
    ar: { type: String, default: "ماذا يقول طلابنا عنا" },
    en: { type: String, default: "What our students say about us" },
  },
  order: {
    type: Number,
    default: 6,
  },
  showRating: {
    type: Boolean,
    default: true,
  },
  showDate: {
    type: Boolean,
    default: true,
  },
  displayCount: {
    type: Number,
    default: 6,
    min: 1,
    max: 20,
  },
}, { _id: false });

// Why Genoun Section Settings Schema (NEW - Features/Value Proposition)
const whyGenounSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  title: {
    ar: { type: String, default: "لماذا جنون؟" },
    en: { type: String, default: "Why Genoun?" },
  },
  subtitle: {
    ar: { type: String, default: "منصة متكاملة لحفظ القرآن الكريم" },
    en: { type: String, default: "Complete platform for Quran memorization" },
  },
  order: {
    type: Number,
    default: 2,
  },
  features: [{
    icon: { type: String, default: "book" }, // book, users, award, video, check
    title: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    description: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
  }],
}, { _id: false });

const emailSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false,
  },
  host: {
    type: String,
    default: "",
  },
  port: {
    type: Number,
    default: 587,
  },
  secure: {
    type: Boolean,
    default: false,
  },
  user: {
    type: String,
    default: "",
  },
  pass: {
    type: String,
    default: "",
  },
  fromName: {
    type: String,
    default: "Genoun",
  },
  fromEmail: {
    type: String,
    default: "",
  },
});

const headerDisplaySchema = new mongoose.Schema({
  showLogo: {
    type: Boolean,
    default: true,
  },
  showTitle: {
    type: Boolean,
    default: true,
  },
  logoWidth: {
    type: Number,
    default: 40,
    min: 20,
    max: 200,
  },
});

const notificationSchema = new mongoose.Schema({
  email: {
    enabled: {
      type: Boolean,
      default: true,
    },
    recipients: [
      {
        type: String,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
      },
    ],
    templates: {
      newForm: {
        subject: {
          type: String,
          default: "New Form Submission",
        },
        body: {
          type: String,
          default:
            "Hello, a new form has been submitted. Details: {{formDetails}}",
        },
      },
      newPurchase: {
        subject: {
          type: String,
          default: "New Purchase",
        },
        body: {
          type: String,
          default:
            "Hello, a new purchase has been made. Details: {{purchaseDetails}}",
        },
      },
      newMessage: {
        subject: {
          type: String,
          default: "New Message",
        },
        body: {
          type: String,
          default:
            "Hello, you have received a new message. Details: {{messageDetails}}",
        },
      },
    },
  },
});

const manualPaymentMethodSchema = new mongoose.Schema({
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  description: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  imageUrl: {
    type: String,
    default: "",
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  requiresAttachment: {
    type: Boolean,
    default: true,
  },
  instructions: {
    ar: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  order: {
    type: Number,
    default: 0,
  },
});

const paymentGatewaySchema = new mongoose.Schema({
  manualMethods: [manualPaymentMethodSchema],
});

const themeSchema = new mongoose.Schema({
  primary: {
    type: String,
    default: "#1a472a", // Genoun Green
  },
  secondary: {
    type: String,
    default: "#f97316", // Orange
  },
  accent: {
    type: String,
    default: "#22c55e", // Lighter Green
  },
  background: {
    type: String,
    default: "#ffffff",
  },
  text: {
    type: String,
    default: "#0f172a",
  },
  adminPrimary: {
    type: String,
    default: "#1a472a",
  },
});

const financeSettingsSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    enum: ["SAR", "EGP", "USD"],
    default: "SAR",
  },
  exchangeRates: {
    USD: { type: Number, default: 1 },
    SAR: { type: Number, default: 3.75 },
    EGP: { type: Number, default: 50.0 },
    EGPtoSAR: { type: Number, default: 13.33 },
  },
  lastRatesUpdate: {
    type: Date,
    default: Date.now,
  },
});

const apiKeysSchema = new mongoose.Schema({
  geminiApiKey: {
    type: String,
    default: "",
  },
  googleCloudCredentials: {
    type: String,
    default: "",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const teacherProfitSettingsSchema = new mongoose.Schema({
  // Global default percentages
  courseSalesPercentage: {
    type: Number,
    default: 40,
    min: 0,
    max: 100,
  },
  subscriptionPercentage: {
    type: Number,
    default: 35,
    min: 0,
    max: 100,
  },
  // Enable/disable profit tracking
  enabled: {
    type: Boolean,
    default: true,
  },
  // Last update tracking
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const subscriptionStudentProfitSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  defaultPercentage: {
    type: Number,
    default: 35,
    min: 0,
    max: 100,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const subscriptionTeacherSchema = new mongoose.Schema(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    profitPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    salaryAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    salaryDueDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: [true, "Site name is required"],
    },
    siteName_ar: {
      type: String,
      default: "",
    },
    siteDescription: {
      type: String,
      required: [true, "Site description is required"],
    },
    siteDescription_ar: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
    },
    logo_ar: {
      type: String,
      default: "",
    },
    favicon: {
      type: String,
    },
    socialLinks: [socialLinkSchema],
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
    },
    whatsappNumber: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    address_ar: {
      type: String,
      default: "",
    },
    theme: {
      type: themeSchema,
      default: () => ({}),
    },
    notifications: {
      type: notificationSchema,
      default: () => ({}),
    },
    paymentGateways: {
      type: paymentGatewaySchema,
      default: () => ({}),
    },
    whatsappConnected: {
      type: Boolean,
      default: false,
    },
    whatsappQrCode: {
      type: String,
    },
    headerDisplay: {
      type: headerDisplaySchema,
      default: () => ({}),
    },
    marketingBanners: {
      type: marketingBannersSettingsSchema,
      default: () => ({}),
    },
    navbarLinks: [navbarLinkSchema],
    homepageSections: {
      hero: sectionConfigSchema,
      features: sectionConfigSchema,
      services: sectionConfigSchema,
      stats: sectionConfigSchema,
      about: sectionConfigSchema,
      cta: sectionConfigSchema,
      testimonials: sectionConfigSchema,
    },
    promoModal: {
      type: promoModalSchema,
      default: () => ({}),
    },
    homepageBanner: {
      type: homepageBannerSchema,
      default: () => ({}),
    },
    homepageCourses: {
      type: homepageCoursesSchema,
      default: () => ({}),
    },
    authorityBar: {
      type: authorityBarSchema,
      default: () => ({
        isEnabled: true,
        title: {
          ar: "موثوق من قبل المؤسسات الرائدة",
          en: "Trusted by Leading Institutions"
        },
        items: []
      }),
    },
    reviewsSettings: {
      type: reviewsSectionSchema,
      default: () => ({
        isEnabled: true,
        title: { ar: "آراء طلابنا", en: "Student Reviews" },
        subtitle: { ar: "ماذا يقول طلابنا عنا", en: "What our students say about us" },
        showRating: true,
        showDate: true,
        displayCount: 6
      }),
    },
    whyGenounSettings: {
      type: whyGenounSchema,
      default: () => ({
        isEnabled: true,
        title: { ar: "لماذا جنون؟", en: "Why Genoun?" },
        subtitle: { ar: "منصة متكاملة لحفظ القرآن الكريم", en: "Complete platform for Quran memorization" },
        features: []
      }),
    },
    emailSettings: {
      type: emailSettingsSchema,
      default: () => ({}),
    },
    financeSettings: {
      type: financeSettingsSchema,
      default: () => ({
        baseCurrency: "SAR",
        exchangeRates: {
          USD: 1,
          SAR: 3.75,
          EGP: 50.0,
          EGPtoSAR: 13.33,
        },
        lastRatesUpdate: new Date(),
      }),
    },
    apiKeys: {
      type: apiKeysSchema,
      default: () => ({}),
    },
    teacherProfitSettings: {
      type: teacherProfitSettingsSchema,
      default: () => ({
        courseSalesPercentage: 40,
        subscriptionPercentage: 35,
        enabled: true,
        lastUpdated: new Date(),
      }),
    },
    subscriptionStudentProfitSettings: {
      type: subscriptionStudentProfitSettingsSchema,
      default: () => ({
        enabled: true,
        defaultPercentage: 35,
        lastUpdated: new Date(),
      }),
    },
    subscriptionTeachers: {
      type: [subscriptionTeacherSchema],
      default: () => [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.findOneOrCreate = async function () {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }

  return this.create({
    siteName: "Genoun LLC",
    siteDescription: "We Build Your Future",
    contactEmail: "info@genoun.com",
    contactPhone: "+1234567890",
    address: "123 Street, Riyadh, Saudi Arabia",
  });
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import StaticPage from "../models/staticPageModel.js";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two directories up from seeds)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const staticPages = [
  {
    slug: "about-us",
    title: { ar: "من نحن", en: "About Us" },
    content: {
      ar: `
<h2>شريكك التقني الاستراتيجي في المملكة</h2>

<p>في <strong>جنون</strong>، نؤمن بأن التميز الرقمي ليس خياراً بل ضرورة. نحن فريق من الخبراء السعوديين المتخصصين في التجارة الإلكترونية والتسويق الرقمي، نجمع بين الإبداع والاستراتيجية والتقنية لنبني حضوراً رقمياً لا يُنافس.</p>

<h3>رؤيتنا</h3>
<p>أن نكون الشريك التقني الأول لكل رائد أعمال سعودي يطمح للريادة في السوق الرقمي.</p>

<h3>مهمتنا</h3>
<p>تمكين الأعمال السعودية من تحقيق إمكاناتها الكاملة في العالم الرقمي من خلال حلول مبتكرة ودعم استراتيجي مستمر.</p>

<h3>قيمنا</h3>
<ul>
  <li><strong>الجودة أولاً:</strong> لا نقبل بأقل من الأفضل في كل مشروع نعمل عليه</li>
  <li><strong>الشفافية:</strong> نؤمن بالتواصل الواضح والصادق مع عملائنا</li>
  <li><strong>الابتكار:</strong> نواكب أحدث التقنيات والاتجاهات العالمية</li>
  <li><strong>النتائج:</strong> نتحدث بلغة الأرقام ونؤمن بالنتائج القابلة للقياس</li>
</ul>

<h3>لماذا جنون؟</h3>
<ul>
  <li>+500 مشروع رقمي ناجح</li>
  <li>+100 عميل راضٍ</li>
  <li>+300% متوسط نمو المبيعات لعملائنا</li>
  <li>خبرة محلية وفهم عميق للسوق السعودي</li>
</ul>

<p>نحن لا نبني مجرد مواقع ومتاجر - نحن نبني <strong>إمبراطوريات رقمية</strong>.</p>
      `,
      en: `
<h2>Your Strategic Tech Partner in the Kingdom</h2>

<p>At <strong>Genoun</strong>, we believe digital excellence is not an option but a necessity. We are a team of Saudi experts specializing in e-commerce and digital marketing, combining creativity, strategy, and technology to build an unrivaled digital presence.</p>

<h3>Our Vision</h3>
<p>To be the premier tech partner for every Saudi entrepreneur aspiring to lead in the digital marketplace.</p>

<h3>Our Mission</h3>
<p>Empowering Saudi businesses to achieve their full potential in the digital world through innovative solutions and continuous strategic support.</p>

<h3>Our Values</h3>
<ul>
  <li><strong>Quality First:</strong> We accept nothing less than excellence in every project</li>
  <li><strong>Transparency:</strong> We believe in clear and honest communication with our clients</li>
  <li><strong>Innovation:</strong> We stay current with the latest global technologies and trends</li>
  <li><strong>Results:</strong> We speak the language of numbers and believe in measurable outcomes</li>
</ul>

<h3>Why Genoun?</h3>
<ul>
  <li>500+ successful digital projects</li>
  <li>100+ satisfied clients</li>
  <li>300%+ average sales growth for our clients</li>
  <li>Local expertise and deep understanding of the Saudi market</li>
</ul>

<p>We don't just build websites and stores - we build <strong>digital empires</strong>.</p>
      `,
    },
    isPublished: true,
    showInFooter: true,
    showInHeader: true,
    order: 0,
    seoMeta: {
      title: {
        ar: "من نحن - جنون للتسويق الرقمي",
        en: "About Us - Genoun Digital Marketing",
      },
      description: {
        ar: "تعرف على جنون - شريكك التقني الاستراتيجي في المملكة. خبراء في التجارة الإلكترونية والتسويق الرقمي.",
        en: "Learn about Genoun - Your strategic tech partner in the Kingdom. Experts in e-commerce and digital marketing.",
      },
    },
  },
  {
    slug: "privacy-policy",
    title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    content: {
      ar: `
<h2>سياسة الخصوصية</h2>
<p><em>آخر تحديث: ديسمبر 2024</em></p>

<p>في جنون، نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك.</p>

<h3>المعلومات التي نجمعها</h3>
<ul>
  <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف عند التسجيل</li>
  <li><strong>معلومات الطلبات:</strong> تفاصيل المنتجات والخدمات المطلوبة</li>
  <li><strong>معلومات الدفع:</strong> نستخدم بوابات دفع آمنة ولا نخزن بيانات البطاقات</li>
  <li><strong>بيانات الاستخدام:</strong> كيفية تفاعلك مع موقعنا لتحسين تجربتك</li>
</ul>

<h3>كيف نستخدم معلوماتك</h3>
<ul>
  <li>تقديم وتحسين خدماتنا</li>
  <li>معالجة طلباتك ومدفوعاتك</li>
  <li>التواصل معك بشأن طلباتك أو استفساراتك</li>
  <li>إرسال تحديثات وعروض (يمكنك إلغاء الاشتراك في أي وقت)</li>
</ul>

<h3>حماية بياناتك</h3>
<p>نستخدم تقنيات التشفير المتقدمة وإجراءات أمنية صارمة لحماية معلوماتك. فريقنا مدرب على أفضل ممارسات حماية البيانات.</p>

<h3>مشاركة المعلومات</h3>
<p>لا نبيع أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا:</p>
<ul>
  <li>لمعالجة المدفوعات عبر بوابات الدفع الآمنة</li>
  <li>عند الطلب القانوني من الجهات الرسمية</li>
</ul>

<h3>حقوقك</h3>
<p>لديك الحق في الوصول إلى بياناتك، تصحيحها، أو طلب حذفها. تواصل معنا لأي استفسار.</p>

<h3>تواصل معنا</h3>
<p>للأسئلة حول هذه السياسة، تواصل معنا عبر صفحة الاتصال.</p>
      `,
      en: `
<h2>Privacy Policy</h2>
<p><em>Last updated: December 2024</em></p>

<p>At Genoun, we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information.</p>

<h3>Information We Collect</h3>
<ul>
  <li><strong>Account Information:</strong> Name, email, phone number when registering</li>
  <li><strong>Order Information:</strong> Details of products and services requested</li>
  <li><strong>Payment Information:</strong> We use secure payment gateways and do not store card data</li>
  <li><strong>Usage Data:</strong> How you interact with our site to improve your experience</li>
</ul>

<h3>How We Use Your Information</h3>
<ul>
  <li>Provide and improve our services</li>
  <li>Process your orders and payments</li>
  <li>Communicate with you about your orders or inquiries</li>
  <li>Send updates and offers (you can unsubscribe anytime)</li>
</ul>

<h3>Data Protection</h3>
<p>We use advanced encryption technologies and strict security measures to protect your information. Our team is trained in data protection best practices.</p>

<h3>Information Sharing</h3>
<p>We do not sell or share your personal information with third parties except:</p>
<ul>
  <li>To process payments through secure payment gateways</li>
  <li>When legally required by official authorities</li>
</ul>

<h3>Your Rights</h3>
<p>You have the right to access, correct, or request deletion of your data. Contact us for any inquiries.</p>

<h3>Contact Us</h3>
<p>For questions about this policy, reach out through our contact page.</p>
      `,
    },
    isPublished: true,
    showInFooter: true,
    showInHeader: false,
    order: 1,
    seoMeta: {
      title: { ar: "سياسة الخصوصية - جنون", en: "Privacy Policy - Genoun" },
      description: {
        ar: "سياسة الخصوصية لموقع جنون. تعرف على كيفية جمع وحماية بياناتك الشخصية.",
        en: "Genoun Privacy Policy. Learn how we collect and protect your personal data.",
      },
    },
  },
  {
    slug: "terms-and-conditions",
    title: { ar: "الشروط والأحكام", en: "Terms and Conditions" },
    content: {
      ar: `
<h2>الشروط والأحكام</h2>
<p><em>آخر تحديث: ديسمبر 2024</em></p>

<p>باستخدامك لموقع جنون وخدماتنا، فإنك توافق على الشروط والأحكام التالية.</p>

<h3>الخدمات المقدمة</h3>
<p>تقدم جنون خدمات التسويق الرقمي، تطوير المتاجر الإلكترونية، وتصميم المواقع. تفاصيل كل خدمة موضحة في صفحة الخدمة المعنية.</p>

<h3>الطلبات والتنفيذ</h3>
<ul>
  <li>عند تأكيد الطلب والدفع، نبدأ العمل وفق الجدول الزمني المتفق عليه</li>
  <li>المنتجات الرقمية يتم تسليمها إلكترونياً خلال المدة المحددة</li>
  <li>الخدمات الاستشارية تُقدم حسب الاتفاق المسبق</li>
</ul>

<h3>الدفع</h3>
<ul>
  <li>جميع الأسعار معروضة بالريال السعودي</li>
  <li>نقبل الدفع عبر بوابات الدفع الإلكترونية والتحويل البنكي</li>
  <li>يجب الدفع الكامل قبل البدء في الخدمات (ما لم يُتفق على خلاف ذلك)</li>
</ul>

<h3>حقوق الملكية الفكرية</h3>
<ul>
  <li>جميع التصاميم والقوالب المخصصة تنتقل ملكيتها للعميل بعد الدفع الكامل</li>
  <li>نحتفظ بالحق في عرض الأعمال في معرض أعمالنا</li>
  <li>المحتوى الأصلي يظل ملكاً لصاحبه الأصلي</li>
</ul>

<h3>المسؤولية</h3>
<p>نلتزم بتقديم خدمات عالية الجودة، لكننا غير مسؤولين عن:</p>
<ul>
  <li>تأخيرات بسبب عدم تقديم العميل للمتطلبات في الوقت المحدد</li>
  <li>نتائج تعتمد على عوامل خارج سيطرتنا (مثل خوارزميات محركات البحث)</li>
</ul>

<h3>إلغاء الخدمة</h3>
<p>راجع سياسة الاسترداد للتفاصيل حول الإلغاء والاسترداد.</p>

<h3>التعديلات</h3>
<p>نحتفظ بالحق في تعديل هذه الشروط. التعديلات سارية فور نشرها.</p>
      `,
      en: `
<h2>Terms and Conditions</h2>
<p><em>Last updated: December 2024</em></p>

<p>By using Genoun's website and services, you agree to the following terms and conditions.</p>

<h3>Services Provided</h3>
<p>Genoun offers digital marketing services, e-commerce store development, and website design. Details of each service are outlined on the respective service page.</p>

<h3>Orders and Delivery</h3>
<ul>
  <li>Upon order confirmation and payment, we begin work according to the agreed timeline</li>
  <li>Digital products are delivered electronically within the specified period</li>
  <li>Consulting services are provided as per prior agreement</li>
</ul>

<h3>Payment</h3>
<ul>
  <li>All prices are displayed in Saudi Riyals (SAR)</li>
  <li>We accept payment via electronic payment gateways and bank transfer</li>
  <li>Full payment is required before starting services (unless otherwise agreed)</li>
</ul>

<h3>Intellectual Property Rights</h3>
<ul>
  <li>All custom designs and templates transfer to the client after full payment</li>
  <li>We reserve the right to showcase work in our portfolio</li>
  <li>Original content remains the property of its original owner</li>
</ul>

<h3>Liability</h3>
<p>We commit to providing high-quality services, but we are not responsible for:</p>
<ul>
  <li>Delays due to client not providing requirements on time</li>
  <li>Results dependent on factors outside our control (such as search engine algorithms)</li>
</ul>

<h3>Service Cancellation</h3>
<p>See our Refund Policy for details on cancellation and refunds.</p>

<h3>Amendments</h3>
<p>We reserve the right to modify these terms. Changes are effective upon posting.</p>
      `,
    },
    isPublished: true,
    showInFooter: true,
    showInHeader: false,
    order: 2,
    seoMeta: {
      title: {
        ar: "الشروط والأحكام - جنون",
        en: "Terms and Conditions - Genoun",
      },
      description: {
        ar: "الشروط والأحكام لاستخدام خدمات جنون للتسويق الرقمي.",
        en: "Terms and conditions for using Genoun digital marketing services.",
      },
    },
  },
  {
    slug: "faqs",
    title: { ar: "الأسئلة الشائعة", en: "FAQs" },
    content: {
      ar: `
<h2>الأسئلة الشائعة</h2>

<h3>ما هي الخدمات التي تقدمونها؟</h3>
<p>نقدم مجموعة شاملة من الخدمات الرقمية تشمل:</p>
<ul>
  <li>تطوير متاجر سلة وشوبيفاي</li>
  <li>تحسين محركات البحث (SEO)</li>
  <li>إدارة الحملات الإعلانية</li>
  <li>تصميم الهوية البصرية</li>
  <li>تصميم مواقع مخصصة</li>
</ul>

<h3>كم يستغرق إنشاء متجر إلكتروني؟</h3>
<p>يعتمد على حجم المشروع ومتطلباته. عادةً:</p>
<ul>
  <li>القوالب الجاهزة: 3-7 أيام عمل</li>
  <li>التصميم المخصص: 2-4 أسابيع</li>
  <li>المتاجر الكبيرة: 4-8 أسابيع</li>
</ul>

<h3>هل تقدمون دعماً بعد التسليم؟</h3>
<p>نعم! نقدم فترة دعم فني مجاني بعد التسليم، ونوفر باقات دعم شهرية للعملاء الذين يرغبون في دعم مستمر.</p>

<h3>ما هي طرق الدفع المتاحة؟</h3>
<p>نقبل الدفع عبر:</p>
<ul>
  <li>بطاقات الائتمان (فيزا، ماستركارد، مدى)</li>
  <li>Apple Pay</li>
  <li>التحويل البنكي</li>
  <li>STC Pay</li>
</ul>

<h3>هل يمكنني طلب تعديلات على التصميم؟</h3>
<p>بالتأكيد! كل مشروع يتضمن عدداً محدداً من جولات التعديلات المجانية. التعديلات الإضافية متاحة بأسعار مرنة.</p>

<h3>هل تعملون مع العملاء خارج السعودية؟</h3>
<p>نعم، نعمل مع عملاء من جميع أنحاء الخليج والعالم العربي. خبرتنا تشمل السوق السعودي والخليجي بشكل خاص.</p>

<h3>كيف أبدأ التعامل معكم؟</h3>
<p>ببساطة تواصل معنا عبر نموذج الاستشارة أو تصفح منتجاتنا الرقمية. سنتواصل معك خلال 24 ساعة.</p>
      `,
      en: `
<h2>Frequently Asked Questions</h2>

<h3>What services do you offer?</h3>
<p>We provide a comprehensive range of digital services including:</p>
<ul>
  <li>Salla and Shopify store development</li>
  <li>Search Engine Optimization (SEO)</li>
  <li>Advertising campaign management</li>
  <li>Brand identity design</li>
  <li>Custom website design</li>
</ul>

<h3>How long does it take to build an online store?</h3>
<p>It depends on the project size and requirements. Typically:</p>
<ul>
  <li>Ready templates: 3-7 business days</li>
  <li>Custom design: 2-4 weeks</li>
  <li>Large stores: 4-8 weeks</li>
</ul>

<h3>Do you provide support after delivery?</h3>
<p>Yes! We offer a free technical support period after delivery, and we provide monthly support packages for clients who want ongoing support.</p>

<h3>What payment methods are available?</h3>
<p>We accept payment via:</p>
<ul>
  <li>Credit cards (Visa, Mastercard, Mada)</li>
  <li>Apple Pay</li>
  <li>Bank transfer</li>
  <li>STC Pay</li>
</ul>

<h3>Can I request design modifications?</h3>
<p>Absolutely! Each project includes a set number of free revision rounds. Additional revisions are available at flexible rates.</p>

<h3>Do you work with clients outside Saudi Arabia?</h3>
<p>Yes, we work with clients from across the Gulf and Arab world. Our expertise particularly covers the Saudi and Gulf market.</p>

<h3>How do I start working with you?</h3>
<p>Simply contact us via the consultation form or browse our digital products. We'll get back to you within 24 hours.</p>
      `,
    },
    isPublished: true,
    showInFooter: true,
    showInHeader: false,
    order: 3,
    seoMeta: {
      title: { ar: "الأسئلة الشائعة - جنون", en: "FAQs - Genoun" },
      description: {
        ar: "إجابات على الأسئلة الشائعة حول خدمات جنون للتسويق الرقمي والتجارة الإلكترونية.",
        en: "Answers to frequently asked questions about Genoun's digital marketing and e-commerce services.",
      },
    },
  },
  {
    slug: "pricing-policy",
    title: { ar: "سياسة التسعير", en: "Pricing Policy" },
    content: {
      ar: `
<h2>سياسة التسعير</h2>

<h3>التسعير الشفاف</h3>
<p>نؤمن بالشفافية الكاملة في التسعير. جميع أسعارنا معروضة بوضوح على الموقع، ولا توجد رسوم مخفية.</p>

<h3>العملة</h3>
<p>جميع الأسعار معروضة بالريال السعودي (SAR).</p>

<h3>الضرائب</h3>
<p>الأسعار المعروضة شاملة لضريبة القيمة المضافة (15%) حيث ينطبق ذلك.</p>

<h3>أنواع التسعير</h3>

<h4>المنتجات الرقمية</h4>
<p>أسعار ثابتة ومحددة مسبقاً لكل منتج. شاملة لجميع الميزات المذكورة.</p>

<h4>الخدمات الاستشارية</h4>
<p>نقدم باقات متعددة لتناسب احتياجاتك:</p>
<ul>
  <li>الباقة الأساسية: للمشاريع الصغيرة والبدايات</li>
  <li>الباقة الاحترافية: للأعمال المتوسطة</li>
  <li>الباقة المتقدمة: للمشاريع الكبيرة والمتطلبات المتقدمة</li>
</ul>

<h4>المشاريع المخصصة</h4>
<p>للمشاريع ذات المتطلبات الخاصة، نقدم عروض أسعار مخصصة بناءً على:</p>
<ul>
  <li>نطاق العمل المطلوب</li>
  <li>الجدول الزمني</li>
  <li>مستوى التعقيد</li>
</ul>

<h3>طلب عرض سعر</h3>
<p>للمشاريع المخصصة، تواصل معنا عبر نموذج الاستشارة وسنرسل لك عرض سعر تفصيلي خلال 48 ساعة.</p>

<h3>العروض والخصومات</h3>
<p>نقدم عروضاً خاصة من وقت لآخر. تابع صفحاتنا على وسائل التواصل الاجتماعي لمعرفة أحدث العروض.</p>
      `,
      en: `
<h2>Pricing Policy</h2>

<h3>Transparent Pricing</h3>
<p>We believe in complete pricing transparency. All our prices are clearly displayed on the website with no hidden fees.</p>

<h3>Currency</h3>
<p>All prices are displayed in Saudi Riyals (SAR).</p>

<h3>Taxes</h3>
<p>Displayed prices include Value Added Tax (15%) where applicable.</p>

<h3>Pricing Types</h3>

<h4>Digital Products</h4>
<p>Fixed, pre-set prices for each product. Inclusive of all listed features.</p>

<h4>Consulting Services</h4>
<p>We offer multiple packages to suit your needs:</p>
<ul>
  <li>Basic Package: For small projects and startups</li>
  <li>Professional Package: For medium businesses</li>
  <li>Advanced Package: For large projects and advanced requirements</li>
</ul>

<h4>Custom Projects</h4>
<p>For projects with special requirements, we provide custom quotes based on:</p>
<ul>
  <li>Scope of work required</li>
  <li>Timeline</li>
  <li>Complexity level</li>
</ul>

<h3>Request a Quote</h3>
<p>For custom projects, contact us via the consultation form and we'll send you a detailed quote within 48 hours.</p>

<h3>Offers and Discounts</h3>
<p>We offer special promotions from time to time. Follow our social media pages to stay updated on the latest offers.</p>
      `,
    },
    isPublished: true,
    showInFooter: true,
    showInHeader: false,
    order: 4,
    seoMeta: {
      title: { ar: "سياسة التسعير - جنون", en: "Pricing Policy - Genoun" },
      description: {
        ar: "سياسة التسعير والأسعار لخدمات جنون للتسويق الرقمي.",
        en: "Pricing policy and rates for Genoun digital marketing services.",
      },
    },
  },
  {
    slug: "refund-policy",
    title: { ar: "سياسة الاسترداد", en: "Refund Policy" },
    content: {
      ar: `
<h2>سياسة الاسترداد والإلغاء</h2>

<h3>التزامنا بالجودة</h3>
<p>نسعى دائماً لتقديم أعلى مستوى من الخدمة. رضا العميل هو أولويتنا القصوى.</p>

<h3>المنتجات الرقمية</h3>
<p>نظراً لطبيعة المنتجات الرقمية:</p>
<ul>
  <li>لا يمكن استرداد المنتجات الرقمية بعد التحميل أو التسليم</li>
  <li>يمكنك معاينة تفاصيل المنتج قبل الشراء</li>
  <li>في حالة وجود عيب تقني، نقدم بديلاً أو استرداداً كاملاً</li>
</ul>

<h3>الخدمات المخصصة</h3>

<h4>قبل البدء بالعمل</h4>
<p>يمكنك إلغاء الطلب واسترداد المبلغ بالكامل قبل بدء العمل على مشروعك.</p>

<h4>بعد البدء بالعمل</h4>
<ul>
  <li>إلغاء خلال أول 25% من المشروع: استرداد 75% من المبلغ</li>
  <li>إلغاء بين 25-50% من المشروع: استرداد 50% من المبلغ</li>
  <li>إلغاء بعد 50% من المشروع: لا يمكن الاسترداد، لكن نسلم ما أُنجز</li>
</ul>

<h3>طلب الاسترداد</h3>
<p>لطلب استرداد:</p>
<ol>
  <li>تواصل معنا عبر البريد الإلكتروني أو نموذج الاتصال</li>
  <li>اذكر رقم الطلب وسبب طلب الاسترداد</li>
  <li>سنراجع طلبك خلال 3 أيام عمل</li>
  <li>في حالة الموافقة، يتم التحويل خلال 7-14 يوم عمل</li>
</ol>

<h3>طريقة الاسترداد</h3>
<p>يتم الاسترداد بنفس طريقة الدفع الأصلية. قد تختلف مدة ظهور المبلغ حسب البنك.</p>

<h3>استثناءات</h3>
<p>لا يشمل الاسترداد:</p>
<ul>
  <li>التأخيرات الناتجة عن تأخر العميل في تقديم المتطلبات</li>
  <li>التعديلات الإضافية خارج نطاق الاتفاق</li>
  <li>تغيير الرأي بعد اكتمال العمل والموافقة عليه</li>
</ul>

<h3>تواصل معنا</h3>
<p>لأي استفسارات حول سياسة الاسترداد، نحن هنا لمساعدتك.</p>
      `,
      en: `
<h2>Refund and Cancellation Policy</h2>

<h3>Our Commitment to Quality</h3>
<p>We always strive to deliver the highest level of service. Customer satisfaction is our top priority.</p>

<h3>Digital Products</h3>
<p>Due to the nature of digital products:</p>
<ul>
  <li>Digital products cannot be refunded after download or delivery</li>
  <li>You can preview product details before purchase</li>
  <li>In case of technical defects, we offer a replacement or full refund</li>
</ul>

<h3>Custom Services</h3>

<h4>Before Work Begins</h4>
<p>You can cancel your order and receive a full refund before work starts on your project.</p>

<h4>After Work Begins</h4>
<ul>
  <li>Cancellation within first 25% of project: 75% refund</li>
  <li>Cancellation between 25-50% of project: 50% refund</li>
  <li>Cancellation after 50% of project: No refund, but we deliver completed work</li>
</ul>

<h3>Requesting a Refund</h3>
<p>To request a refund:</p>
<ol>
  <li>Contact us via email or contact form</li>
  <li>Provide your order number and reason for refund request</li>
  <li>We'll review your request within 3 business days</li>
  <li>If approved, the transfer is processed within 7-14 business days</li>
</ol>

<h3>Refund Method</h3>
<p>Refunds are issued via the original payment method. The time for the amount to appear may vary by bank.</p>

<h3>Exceptions</h3>
<p>Refunds do not cover:</p>
<ul>
  <li>Delays caused by client's delayed submission of requirements</li>
  <li>Additional modifications outside the agreed scope</li>
  <li>Change of mind after work completion and approval</li>
</ul>

<h3>Contact Us</h3>
<p>For any questions about the refund policy, we're here to help.</p>
      `,
    },
    isPublished: true,
    showInFooter: true,
    showInHeader: false,
    order: 5,
    seoMeta: {
      title: { ar: "سياسة الاسترداد - جنون", en: "Refund Policy - Genoun" },
      description: {
        ar: "سياسة الاسترداد والإلغاء لخدمات ومنتجات جنون.",
        en: "Refund and cancellation policy for Genoun services and products.",
      },
    },
  },
];

const seedStaticPages = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    console.log("URI:", process.env.MONGODB_URI ? "✅ Found" : "❌ Not found");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing pages
    console.log("🧹 Clearing existing static pages...");
    await StaticPage.deleteMany({});
    console.log("✅ Cleared existing pages");

    // Insert new pages
    console.log("📝 Inserting static pages...");
    const result = await StaticPage.insertMany(staticPages);
    console.log(`✅ Successfully seeded ${result.length} static pages:`);

    result.forEach((page) => {
      console.log(`   - ${page.slug}: ${page.title.en} / ${page.title.ar}`);
    });

    console.log("\n🎉 Static pages seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding static pages:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

seedStaticPages();

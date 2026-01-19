import mongoose from "mongoose";

// Bilingual text schema
const bilingualTextSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

// Material schema (PDFs, files, links)
const materialSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["pdf", "file", "link"],
      required: true,
    },
    title: {
      type: bilingualTextSchema,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    size: {
      type: Number, // in bytes
    },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: [true, "Section ID is required"],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
      index: true,
    },
    title: {
      type: bilingualTextSchema,
      required: [true, "Lesson title is required"],
    },
    description: {
      type: bilingualTextSchema,
    },

    // Video Source
    videoSource: {
      type: String,
      enum: ["youtube", "vimeo", "upload", "none"],
      default: "youtube",
    },
    videoUrl: {
      type: String,
    },
    videoId: {
      type: String, // YouTube/Vimeo ID
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },

    // Materials (PDFs, files, links)
    materials: [materialSchema],

    // Display
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isPreview: {
      type: Boolean,
      default: false, // Free preview
    },
    isPublished: {
      type: Boolean,
      default: true,
    },

    // Stats
    views: {
      type: Number,
      default: 0,
    },
    completionsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
lessonSchema.index({ sectionId: 1, order: 1 });
lessonSchema.index({ courseId: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;

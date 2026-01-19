import mongoose from "mongoose";

// Bilingual text schema
const bilingualTextSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
      index: true,
    },
    title: {
      type: bilingualTextSchema,
      required: [true, "Section title is required"],
    },
    description: {
      type: bilingualTextSchema,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    // Stats (auto-calculated)
    lessonsCount: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0, // in minutes
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
sectionSchema.index({ courseId: 1, order: 1 });

const Section = mongoose.model("Section", sectionSchema);

export default Section;

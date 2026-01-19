import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    description: {
      ar: { type: String },
      en: { type: String },
    },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual for product count
categorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "categoryId",
  count: true,
});

// Virtual for course count
categorySchema.virtual("courseCount", {
  ref: "Course",
  localField: "_id",
  foreignField: "categoryId",
  count: true,
});



const Category = mongoose.model("Category", categorySchema);
export default Category;

import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  label: {
    type: String,
    required: [true, "Label is required"],
  },
  type: {
    type: String,
    enum: [
      "text",
      "email",
      "tel",
      "number",
      "select",
      "checkbox",
      "radio",
      "textarea",
      "date",
      "attachment",
    ],
    required: [true, "Field type is required"],
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [
    {
      type: String,
    },
  ],
  placeholder: {
    type: String,
  },
});

const submissionSchema = new mongoose.Schema({
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  adminNotes: {
    type: String,
    default: "",
  },
});

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "draft",
    },
    fields: [fieldSchema],
    submissions: [submissionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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

formSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Form = mongoose.model("Form", formSchema);

export default Form;

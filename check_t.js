import mongoose from "mongoose";
import EmailTemplate from "./api/src/models/emailTemplateModel.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/genoun";

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        const t = await EmailTemplate.findOne({ name: "email_verification" });
        if (t) {
            console.log("FOUND_TEMPLATE: " + t.name);
        } else {
            console.log("TEMPLATE_NOT_FOUND");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();

import express from "express";
import { ManualPaymentMethodController } from "../controllers/manualPaymentMethodController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadSingle } from "../middlewares/uploadMiddleware.js";
import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = express.Router();
const manualPaymentMethodController = new ManualPaymentMethodController();

// Apply imagePathMiddleware to all routes
router.use(imagePathMiddleware);

// Get all manual payment methods (public - for checkout)
router.get(
  "/",
  manualPaymentMethodController.getAllMethods.bind(
    manualPaymentMethodController
  )
);

// Admin routes
router.post(
  "/",
  protect,
  uploadSingle("image"),
  manualPaymentMethodController.createMethod.bind(manualPaymentMethodController)
);

router.put(
  "/:id",
  protect,
  uploadSingle("image"),
  manualPaymentMethodController.updateMethod.bind(manualPaymentMethodController)
);

router.patch(
  "/:id",
  protect,
  manualPaymentMethodController.toggleMethod.bind(manualPaymentMethodController)
);

router.delete(
  "/:id",
  protect,
  manualPaymentMethodController.deleteMethod.bind(manualPaymentMethodController)
);

export default router;

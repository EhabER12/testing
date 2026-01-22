import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
  approveTeacher,
  rejectTeacher,
} from "../controllers/userController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { createUserSchema } from "../validations/userValidation.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  validate(createUserSchema),
  createUser
);
router.get("/", protect, authorize("admin", "moderator"), getAllUsers);
router.get("/:id", protect, authorize("admin", "moderator"), getUserById);

router.put("/:id", protect, authorize("admin"), updateUser);
router.put("/:id/role", protect, authorize("admin"), updateUserRole);
router.put("/:id/password", protect, authorize("admin"), updateUserPassword);

router.delete("/:id", protect, authorize("admin"), deleteUser);

// Teacher approval routes
router.post(
  "/:id/approve-teacher",
  protect,
  authorize("admin"),
  approveTeacher
);
router.post(
  "/:id/reject-teacher",
  protect,
  authorize("admin"),
  rejectTeacher
);

export default router;

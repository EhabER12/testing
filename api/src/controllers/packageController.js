import packageService from "../services/packageService.js";

// Create package
export const createPackage = async (req, res, next) => {
  try {
    const createdBy = req.user._id;
    const pkg = await packageService.createPackage(req.body, createdBy);

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

// Get all packages
export const getAllPackages = async (req, res, next) => {
  try {
    const { type, isActive } = req.query;
    const filters = {};

    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === "true";

    const packages = await packageService.getAllPackages(filters);

    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

// Get package by ID
export const getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pkg = await packageService.getPackageById(id);

    res.status(200).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

// Update package
export const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBy = req.user._id;

    const pkg = await packageService.updatePackage(id, req.body, updatedBy);

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

// Delete package
export const deletePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await packageService.deletePackage(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Get package statistics
export const getPackageStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await packageService.getPackageStats(id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get package students
export const getPackageStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    const filters = {};
    if (status) filters.status = status;

    const students = await packageService.getPackageStudents(id, filters);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

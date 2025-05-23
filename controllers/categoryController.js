const { Category } = require("../models/category");
const {
  UnprocessableEntityError,
  NotFoundError,
} = require("../errors/customError");
const { tryCatch } = require("../utils/tryCatch");

const { categoryValidation } = require("../validations/CategoryValidation");

const createCategory = tryCatch(async (req, res) => {
  const { error } = categoryValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(", ");
    throw new UnprocessableEntityError(errorMessage);
  }
  const category = await Category.create(req.body);
  res.status(201).json({
    category,
    success: true,
  });
});

const getAllCats = tryCatch(async (req, res) => {
  const { name, sort } = req.query;
  const queryObject = {};

  if (name) {
    queryObject.name = name;
  }

  // sort
  let result = Category.find(queryObject);
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const categories = await result;
  res.status(200).json({
    categories,
  });
});

const getSingleCat = tryCatch(async (req, res) => {
  const categoryId = req.params.id;
  const category = await Category.findOne({ _id: categoryId });

  if (!category) {
    throw new NotFoundError("category not found");
  }

  res.status(200).json({
    category,
    success: true,
  });
});

const updateCategory = tryCatch(async (req, res) => {
  const categoryId = req.params.id;
  const category = await Category.findOne({ _id: categoryId });
  if (!category) {
    throw new NotFoundError("no such category found");
  }
  const { error } = categoryValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(", ");
    throw new UnprocessableEntityError(errorMessage);
  }

  const updatedCategory = await Category.findOneAndUpdate(
    { _id: categoryId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(201).json({
    updatedCategory,
    success: true,
  });
});

module.exports = { createCategory, getAllCats, getSingleCat, updateCategory };

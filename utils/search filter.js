// utils/searchFilter.js

const searchFilter = (search = "", fields = []) => {
  if (!search || !fields.length) return {};

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    })),
  };
};

module.exports = { searchFilter };

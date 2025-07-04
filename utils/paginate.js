const paginate = async (
  req,
  model,
  searchFilter = {},  // new: search-only filter
  sort = { createdAt: -1 },
  populate = "",
  baseFilter = {}      // new: additional static filters (like customer)
) => {
  const combinedFilter = { ...baseFilter, ...searchFilter };

  const page = parseInt(req.query.page);
  const perPage = parseInt(req.query.per_page);

  // If no pagination requested, return all results
  if (!req.query.page && !req.query.per_page) {
    let query = model.find(combinedFilter).sort(sort);
    if (populate) query = query.populate(populate);
    const all = await query.lean();
    return {
      data: all,
      pagination: null,
    };
  }

  const currentPage = page || 1;
  const limit = perPage || 10;
  const skip = (currentPage - 1) * limit;

  const total = await model.countDocuments(combinedFilter);

  let query = model.find(combinedFilter).sort(sort).skip(skip).limit(limit);
  if (populate) query = query.populate(populate);

  const results = await query.lean();

  const lastPage = Math.ceil(total / limit);

  const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;
  const createPageUrl = (p) => `${baseUrl}?page=${p}&per_page=${limit}`;

  const links = [];

  links.push({
    url: currentPage > 1 ? createPageUrl(currentPage - 1) : null,
    label: "&laquo; قبلی",
    active: false,
  });

  for (let i = 1; i <= lastPage; i++) {
    links.push({
      url: createPageUrl(i),
      label: `${i}`,
      active: i === currentPage,
    });
  }

  links.push({
    url: currentPage < lastPage ? createPageUrl(currentPage + 1) : null,
    label: "بعدی &raquo;",
    active: false,
  });

  return {
    data: results,
    pagination: {
      current_page: currentPage,
      per_page: limit,
      total,
      from: skip + 1,
      to: skip + results.length,
      first_page_url: createPageUrl(1),
      last_page: lastPage,
      last_page_url: createPageUrl(lastPage),
      next_page_url:
        currentPage < lastPage ? createPageUrl(currentPage + 1) : null,
      prev_page_url: currentPage > 1 ? createPageUrl(currentPage - 1) : null,
      path: baseUrl,
      links,
    },
  };
};

module.exports = paginate;

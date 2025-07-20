const paginate = async (
  req,
  model,
  searchFilter = {},
  sort = { createdAt: -1 },
  populate = "",
  baseFilter = {}
) => {
  const combinedFilter = { ...baseFilter, ...searchFilter };

  const page = parseInt(req.query.page);
  const perPage = parseInt(req.query.per_page);

  // No pagination? Return all
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

  // For Vue Pagination component: numbered links
  const numberedLinks = [];

  numberedLinks.push({
    url: currentPage > 1 ? createPageUrl(currentPage - 1) : null,
    label: "&laquo; قبلی",
    active: false,
  });

  for (let i = 1; i <= lastPage; i++) {
    numberedLinks.push({
      url: createPageUrl(i),
      label: `${i}`,
      active: i === currentPage,
    });
  }

  numberedLinks.push({
    url: currentPage < lastPage ? createPageUrl(currentPage + 1) : null,
    label: "بعدی &raquo;",
    active: false,
  });

  // Laravel-style pagination structure
  return {
    data: {
      data: results,
      meta: {
        current_page: currentPage,
        per_page: limit,
        total,
        from: skip + 1,
        to: skip + results.length,
        last_page: lastPage,
        path: baseUrl,
      },
      links: {
        first: createPageUrl(1),
        last: createPageUrl(lastPage),
        next: currentPage < lastPage ? createPageUrl(currentPage + 1) : null,
        prev: currentPage > 1 ? createPageUrl(currentPage - 1) : null,
        // Optional: include full link array like Laravel's `links`
        pages: numberedLinks,
      },
    },
    pagination: null, // just for compatibility if any controller checks this
  };
};

module.exports = paginate;

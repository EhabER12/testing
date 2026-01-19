function slugify(text, options = {}) {
  const { lower = true, strict = true } = options;

  // Convert to lowercase if specified
  let slug = lower ? text.toLowerCase() : text;

  // Replace spaces with hyphens
  slug = slug.replace(/\s+/g, "-");

  if (strict) {
    // Remove all characters that are not alphanumeric, hyphen, or underscore
    slug = slug.replace(/[^a-z0-9\-_]/g, "");
  } else {
    // Less strict: keep some special characters but convert problematic ones
    slug = slug
      .replace(/[&]/g, "and")
      .replace(/[+]/g, "plus")
      .replace(/[=]/g, "equals")
      .replace(/[\/\\#,^!:*?"<>|[\](){}]/g, "-")
      .replace(/-+/g, "-"); // Replace multiple hyphens with a single one
  }

  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}

export default slugify;

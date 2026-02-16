module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "dist/main.css": "vendor/ui-foundations/main.css",
  });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });
  eleventyConfig.addCollection("tokensDocs", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("site/tokens/**/*.md")
      .sort((a, b) => {
        const aOrder = Number(a.data.order || 999);
        const bOrder = Number(b.data.order || 999);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.data.title || "").localeCompare(
          String(b.data.title || ""),
        );
      });
  });
  eleventyConfig.addCollection("componentsDocs", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("site/components/**/*.md")
      .sort((a, b) => {
        const aOrder = Number(a.data.order || 999);
        const bOrder = Number(b.data.order || 999);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.data.title || "").localeCompare(
          String(b.data.title || ""),
        );
      });
  });

  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "site",
      output: "_site",
    },
  };
};

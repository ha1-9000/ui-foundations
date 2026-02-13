module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "dist/main.css": "vendor/ui-foundations/main.css",
  });
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });

  return {
    dir: {
      input: "site",
      output: "_site",
    },
  };
};

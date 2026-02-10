module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "dist/main.css": "main.css" });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};

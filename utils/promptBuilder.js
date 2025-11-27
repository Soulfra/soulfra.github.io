
function buildPrompt(template, input) {
  let result = template;
  for (const key in input) {
    result = result.replace(`{{${key}}}`, input[key]);
  }
  return result;
}

module.exports = { buildPrompt };

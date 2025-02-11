const COST_PER_INPUT_TOKEN = 0.001 / 1000; // $0.001 per 1000 input tokens
const COST_PER_OUTPUT_TOKEN = 0.002 / 1000; // $0.002 per 1000 output tokens

function countTokens(text) {
  const tokens = text.split(/\s+/).filter(token => token.length > 0);
  return tokens.length;
}

function countTokensAndCost(text) {
  const tokenCount = countTokens(text);

  // Estimating a 50/50 split between input and output tokens
  const estimatedInputCost = tokenCount * COST_PER_INPUT_TOKEN * 0.5;
  const estimatedOutputCost = tokenCount * COST_PER_OUTPUT_TOKEN * 0.5;
  const estimatedTotalCost = estimatedInputCost + estimatedOutputCost;

  return { tokenCount, estimatedCost: estimatedTotalCost };
}

module.exports = { countTokensAndCost };

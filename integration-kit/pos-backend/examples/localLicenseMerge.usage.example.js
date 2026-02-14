const Restaurant = require("../models/restaurantModel");
const { mergeServerLicenseData } = require("../services/localLicenseMerge");

async function merge(serverData) {
  let config = await Restaurant.findOne();
  if (!config) config = new Restaurant();
  mergeServerLicenseData(config, serverData);
  await config.save();
  return config;
}

module.exports = { merge }

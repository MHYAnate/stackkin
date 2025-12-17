import DataLoader from 'dataloader';
import Advertisement from '../../models/Advertisement.js';
import Campaign from '../../models/Campaign.js';
import Advertiser from '../../models/Advertiser.js';

const createAdvertisementLoaders = () => {
  const advertisementLoader = new DataLoader(async (adIds) => {
    const ads = await Advertisement.find({ _id: { $in: adIds } });
    const adMap = {};
    ads.forEach(ad => {
      adMap[ad._id.toString()] = ad;
    });
    return adIds.map(id => adMap[id.toString()] || null);
  });

  const campaignLoader = new DataLoader(async (campaignIds) => {
    const campaigns = await Campaign.find({ _id: { $in: campaignIds } });
    const campaignMap = {};
    campaigns.forEach(campaign => {
      campaignMap[campaign._id.toString()] = campaign;
    });
    return campaignIds.map(id => campaignMap[id.toString()] || null);
  });

  const advertiserLoader = new DataLoader(async (advertiserIds) => {
    const advertisers = await Advertiser.find({ _id: { $in: advertiserIds } });
    const advertiserMap = {};
    advertisers.forEach(advertiser => {
      advertiserMap[advertiser._id.toString()] = advertiser;
    });
    return advertiserIds.map(id => advertiserMap[id.toString()] || null);
  });

  return {
    advertisementLoader,
    campaignLoader,
    advertiserLoader
  };
};

export default createAdvertisementLoaders;
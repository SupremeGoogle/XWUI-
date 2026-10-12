import { websiteShellData } from './website/shell.data.js';
import { websiteLandingData } from './website/landing.data.js';
import { websiteDirectoryData } from './website/directory.data.js';
import { websitePricingData } from './website/pricing.data.js';
import { websiteSelfhostData } from './website/self-host.data.js';

export const websiteData = {
  ...websiteShellData,
  ...websiteLandingData,
  ...websiteDirectoryData,
  ...websitePricingData,
  ...websiteSelfhostData,
};

export const WEBSITE_RULES = Object.freeze({
  failureRate: 0.05,
  zoom: { min: 0.6, max: 1.3, step: 0.1, initial: 1 },
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
});

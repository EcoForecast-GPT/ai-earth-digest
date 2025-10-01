import { Buffer } from 'buffer';

// NASA Earthdata Login credentials should be stored securely
// For development, you can use environment variables
const EARTHDATA_USERNAME = process.env.EARTHDATA_USERNAME;
const EARTHDATA_PASSWORD = process.env.EARTHDATA_PASSWORD;

export const getEarthdataAuthHeader = () => {
  if (!EARTHDATA_USERNAME || !EARTHDATA_PASSWORD) {
    throw new Error('Earthdata Login credentials not configured');
  }
  
  const auth = Buffer.from(`${EARTHDATA_USERNAME}:${EARTHDATA_PASSWORD}`).toString('base64');
  return `Basic ${auth}`;
};

// NASA GES DISC OPeNDAP endpoints
export const NASA_OPENDAP_BASE_URL = 'https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/M2T1NXSLV.5.12.4';
export const NASA_SUBSET_BASE_URL = 'https://disc.gsfc.nasa.gov/api/nc4';

// MERRA-2 collection details
export const MERRA2_COLLECTION = {
  shortName: 'M2T1NXSLV',
  version: '5.12.4',
  variables: {
    temperature: 'T2M',           // 2-meter air temperature (K)
    precipitation: 'PRECTOTCORR', // Corrected total precipitation (kg m-2 s-1)
    humidity: 'QV2M',            // 2-meter specific humidity (kg kg-1)
    windU: 'U10M',              // 10-meter eastward wind (m s-1)
    windV: 'V10M',              // 10-meter northward wind (m s-1)
    pressure: 'PS'              // Surface pressure (Pa)
  }
};
import heroShowcaseImg from '../assets/images/hero_curated_showcase_1792933871497.jpg';
import headphonesImg from '../assets/images/anc_wireless_headphones_1792933872521.jpg';
import smartwatchImg from '../assets/images/smart_fitness_watch_1792933874100.jpg';
import speakerImg from '../assets/images/portable_bluetooth_speaker_1792933874355.jpg';
import keyboardImg from '../assets/images/mechanical_desk_keyboard_1792933875607.jpg';
import linenShirtImg from '../assets/images/handloom_linen_shirt_1792933876309.jpg';
import leatherBagImg from '../assets/images/leather_crossbody_bag_1792933878210.jpg';
import silkStoleImg from '../assets/images/handwoven_silk_stole_1792933879682.jpg';
import sneakersImg from '../assets/images/urban_running_sneakers_1792933880935.jpg';
import brassLampImg from '../assets/images/brass_table_lamp_1792933882130.jpg';
import dutchOvenImg from '../assets/images/ceramic_dutch_oven_1792933881587.jpg';
import carafeImg from '../assets/images/steel_thermal_carafe_1792933882235.jpg';
import cowGheeJarImg from '../assets/images/bengal_cow_ghee_jar_1792936973957.jpg';
import freshProduceImg from '../assets/images/fresh_produce_basket_1792936975364.jpg';
import bengaliSweetsImg from '../assets/images/bengali_sweets_box_1792936977246.jpg';
import kathiRollImg from '../assets/images/kolkata_kathi_roll_1792936977684.jpg';
import pujaThaliImg from '../assets/images/brass_puja_thali_1792936977813.jpg';
import ledBattenImg from '../assets/images/modular_led_batten_1792936977765.jpg';

export const HERO_SHOWCASE_ASSET = heroShowcaseImg;

export const PRODUCT_ASSET_MAP: Record<string, string> = {
  // Legacy single-store catalog keys
  'prod-headphones': headphonesImg,
  'prod-smartwatch': smartwatchImg,
  'prod-speaker': speakerImg,
  'prod-keyboard': keyboardImg,
  'prod-linen-shirt': linenShirtImg,
  'prod-leather-bag': leatherBagImg,
  'prod-silk-stole': silkStoleImg,
  'prod-sneakers': sneakersImg,
  'prod-brass-lamp': brassLampImg,
  'prod-dutch-oven': dutchOvenImg,
  'prod-carafe': carafeImg,

  // Multi-Vendor Marketplace catalog keys across all 8 primary categories
  'mp-headphones': headphonesImg,
  'mp-smartwatch': smartwatchImg,
  'mp-speaker': speakerImg,
  'mp-keyboard': keyboardImg,
  'mp-linen-shirt': linenShirtImg,
  'mp-silk-stole': silkStoleImg,
  'mp-leather-bag': leatherBagImg,
  'mp-brass-lamp': brassLampImg,
  'mp-dutch-oven': dutchOvenImg,
  'mp-carafe': carafeImg,
  'mp-ghee-doi': cowGheeJarImg,
  'mp-produce-basket': freshProduceImg,
  'mp-bengali-sweets': bengaliSweetsImg,
  'mp-kathi-roll': kathiRollImg,
  'mp-puja-thali': pujaThaliImg,
  'mp-led-electrical': ledBattenImg,
};

export function resolveProductImage(productId: string, fallbackUrl: string): string {
  return PRODUCT_ASSET_MAP[productId] || fallbackUrl;
}

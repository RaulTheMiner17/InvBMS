export interface Offer {
  "@type": string;
  URL: string;
  availability: string;
  inventoryLevel: string;
  name: string;
  price: string;
  priceCurrency: string;
  validFrom: string;
}

export interface InventoryResponse {
  offers: Offer[];
}
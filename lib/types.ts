export interface LocationAddress {
  line_1: string;
  line_2: string | null;
  city: string;
  state: string | null;
  postcode: string;
  country: string;
  country_id: number;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationHours {
  type: string;
  days: any;
  open: string;
  close: string;
  timesheet: string;
  flexible: Array<{
    day: string;
    hours: string;
    status: string;
  }>;
}

export interface LocationImageThumbnail {
  url: string;
  path: string;
  name: string;
  size: number | null;
  type: string;
  width: number | null;
  height: number | null;
}

export interface LocationImages {
  thumbnail: LocationImageThumbnail;
}

export interface LocationOptions {
  auto_allocate_table: string;
  auto_lat_lng: string;
  collection_add_lead_time: string;
  collection_cancellation_timeout: number;
  collection_lead_time: number;
  collection_min_order_amount: string;
  collection_time_interval: number;
  collection_time_restriction: string;
  delivery_add_lead_time: string;
  delivery_cancellation_timeout: number;
  delivery_lead_time: number;
  delivery_min_order_amount: string;
  delivery_time_interval: number;
  delivery_time_restriction: string;
  future_orders: {
    enable_delivery: string;
    enable_collection: string;
  };
  gallery: {
    title: string;
    description: string;
  };
  guest_order: string;
  hours: {
    collection: LocationHours;
    delivery: LocationHours;
    opening: LocationHours;
  };
  limit_guests: string;
  limit_orders: string;
  max_reservation_advance_time: number;
  min_reservation_advance_time: number;
  offer_collection: string;
  offer_delivery: string;
  offer_reservation: string;
  payments: string;
  reservation_cancellation_timeout: number;
  reservation_include_start_time: string;
  reservation_stay_time: number;
  reservation_time_interval: number;
}

export interface RestaurantStatus {
  is_open: boolean;
  pickup_available: boolean;
  delivery_available: boolean;
  next_opening_time: string | null;
  status_message: string;
}

export interface Location {
  id: number;
  name: string;
  email: string;
  telephone: string;
  address: LocationAddress;
  coordinates: LocationCoordinates;
  description: string | null;
  status: boolean;
  permalink: string;
  options: LocationOptions;
  images: LocationImages | [];
  restaurant_status?: RestaurantStatus;
}

export interface LocationsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    locations: Location[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    };
  };
}

export interface MenuCategory {
  category_id: number;
  name: string;
  description: string;
  priority: number;
  permalink_slug: string;
}

export interface MenuCategoriesResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    location: {
      id: number;
      name: string;
    };
    categories: MenuCategory[];
  };
}

export interface MenuItemCategory {
  category_id: number;
  name: string;
  description: string;
  priority: number;
  permalink_slug: string;
}

export interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_description: string;
  menu_price: number;
  minimum_qty: number;
  menu_priority: number;
  order_restriction: string | null;
  currency: string;
  categories: MenuItemCategory[];
  image?: {
    url: string;
    path: string;
    name: string;
    size: number | null;
    type: string;
    width: number | null;
    height: number | null;
  };
}

export interface MenuItemsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    location: {
      id: number;
      name: string;
    };
    menu_items: MenuItem[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    };
  };
}

export interface AddressBookEntry {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  is_default: boolean;
  instructions?: string;
}

export interface AddressBookResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    addresses: AddressBookEntry[];
  };
}

export interface Order {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters: {
    user_id: string;
    status: string | null;
    location: string | null;
    sort: string;
    include: string;
  };
}

export interface OrderMenuItem {
  menu_name: string;
  menu_quantity: number;
  menu_price: string;
  menu_subtotal: string;
  menu_options: string;
  menu_comment: string | null;
}

export interface OrderTotal {
  title: string;
  value: string;
  priority: number;
}

export interface OrderDetails {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
  menu_items: OrderMenuItem[];
  order_totals: OrderTotal[];
}

export interface OrderDetailsResponse {
  success: boolean;
  data: OrderDetails;
  filters: {
    user_id: string;
    order_id: string;
    include: string;
  };
}

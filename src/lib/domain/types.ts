/**
 * Entidades do domínio Camino 3D.
 * Espelham as tabelas de supabase/migrations/0001_init.sql (snake_case no banco, camelCase aqui).
 */

export type ISODate = string;
export type LngLat = [lng: number, lat: number];

/** Metadados obrigatórios para todo dado vindo de fonte externa. */
export interface DataProvenance {
  source: string;
  sourceUrl?: string;
  fetchedAt: ISODate;
  expiresAt: ISODate;
  /** true quando o dado é fictício (selo "Dados de demonstração"). */
  isDemo: boolean;
}

export interface Timestamps {
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ---------- Usuário ----------

export type Locale = 'pt' | 'en' | 'es';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type WalkingStyle = 'alone' | 'group' | 'meet';
export type LodgingPreference = 'albergue' | 'hostel' | 'hotel' | 'pousada' | 'casa_rural' | 'camping' | 'religioso';
export type FoodPreference = 'local' | 'vegetarian' | 'vegan' | 'gluten_free' | 'budget';
export type CulturalInterest = 'churches' | 'museums' | 'gastronomy' | 'festivals' | 'nature' | 'history' | 'markets';
export type AccessibilityNeed = 'low_slope' | 'paved' | 'no_stairs' | 'transport_support' | 'accessible_places';

export interface User extends Timestamps {
  id: string;
  email: string;
  authProvider: 'email' | 'google' | 'apple' | 'demo';
}

export interface Profile extends Timestamps {
  userId: string;
  displayName: string;
  locale: Locale;
  countryCode: string;
  startDate: ISODate;
  originId: string;
  destinationId: string;
  daysAvailable: number;
  dailyKm: number;
  fitness: FitnessLevel;
  dailyBudgetEur: number;
  lodging: LodgingPreference[];
  food: FoodPreference[];
  interests: CulturalInterest[];
  accessibility: AccessibilityNeed[];
  walkingStyle: WalkingStyle;
  languages: string[];
  bio?: string;
}

export type LocationGranularity = 'hidden' | 'city' | 'approximate' | 'precise_temporary';

export interface PrivacySettings {
  userId: string;
  /** Presença na comunidade; desligada por padrão. */
  communityPresence: boolean;
  invisibleMode: boolean;
  locationGranularity: LocationGranularity;
  /** Expiração do compartilhamento preciso temporário. */
  preciseSharingExpiresAt?: ISODate;
  consentLocation: boolean;
  consentAnalytics: boolean;
  consentVoiceProcessing: boolean;
  consentTerms: boolean;
  updatedAt: ISODate;
}

// ---------- Rotas ----------

export type Difficulty = 'easy' | 'moderate' | 'hard';
export type Terrain = 'asphalt' | 'dirt' | 'gravel' | 'cobblestone' | 'forest_trail' | 'boardwalk';
export type CrowdLevel = 'low' | 'medium' | 'high';

export type RouteMode =
  | 'fastest'
  | 'easiest'
  | 'cheapest'
  | 'safest'
  | 'scenic'
  | 'accessible'
  | 'quietest'
  | 'social';

export type WaypointKind =
  | 'town'
  | 'water'
  | 'toilet'
  | 'pharmacy'
  | 'health'
  | 'market'
  | 'shelter'
  | 'rest'
  | 'danger'
  | 'no_signal'
  | 'detour'
  | 'transport'
  | 'viewpoint';

export interface Waypoint {
  id: string;
  routeId: string;
  kind: WaypointKind;
  name: string;
  coord: LngLat;
  /** Quilômetro acumulado a partir da origem da rota. */
  km: number;
  note?: string;
  /** Para perigos/interdições: data da última verificação. */
  verifiedAt?: ISODate;
}

export interface Route extends DataProvenance {
  id: string;
  name: string;
  shortName: string;
  description: string;
  originId: string;
  destinationId: string;
  totalKm: number;
  /** Atributos de 0 a 1 usados pela pontuação por modo. */
  attributes: {
    scenery: number;
    crowd: number;
    infrastructure: number;
    avgLodgingEur: number;
    pavedShare: number;
    maxSlopePct: number;
    trafficExposure: number;
    socialScore: number;
  };
  /** Linha simplificada (cidade a cidade + pontos intermediários). */
  geometry: LngLat[];
  stops: RouteStop[];
  waypoints: Waypoint[];
  alerts: RouteAlert[];
}

/** Cidade/vila ao longo da rota onde é possível terminar uma etapa. */
export interface RouteStop {
  id: string;
  name: string;
  coord: LngLat;
  km: number;
  elevationM: number;
  services: { lodging: boolean; food: boolean; pharmacy: boolean; transport: boolean };
  region: 'minho' | 'galicia_sul' | 'rias_baixas' | 'santiago' | 'porto';
}

export interface RouteAlert {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  km?: number;
  verifiedAt: ISODate;
}

/** Trecho de um dia (etapa) dentro de uma viagem planejada. */
export interface RouteSegment {
  id: string;
  routeId: string;
  day: number;
  fromStopId: string;
  toStopId: string;
  fromName: string;
  toName: string;
  startKm: number;
  endKm: number;
  distanceKm: number;
  estimatedHours: number;
  ascentM: number;
  descentM: number;
  difficulty: Difficulty;
  terrain: Terrain[];
  waypoints: Waypoint[];
}

export interface Trip extends Timestamps {
  id: string;
  userId: string;
  routeId: string;
  mode: RouteMode;
  startDate: ISODate;
  days: number;
  dailyKm: number;
  segments: RouteSegment[];
  status: 'planned' | 'active' | 'completed' | 'abandoned';
  completedSegmentIds: string[];
  /** Quando cada etapa foi concluída (para cartões e retrospectiva). */
  completedAt?: Record<string, ISODate>;
  /** Rota de criador usada como camada de dicas. */
  creatorRouteId?: string;
  offlineDownloadedAt?: ISODate;
}

/** Relato da comunidade sobre um trecho (Camino Live). Expira sozinho. */
export interface LiveReport {
  id: string;
  routeId: string;
  stopId: string;
  kind: 'mud' | 'no_water' | 'works' | 'closed' | 'queue' | 'crowded' | 'tip';
  note: string;
  createdAt: ISODate;
  expiresAt: ISODate;
  confirmations: number;
  authorIsMe?: boolean;
  isDemo: boolean;
}

/** Convite aberto para café, jantar, evento ou caminhar junto. Somente locais públicos. */
export interface LiveInvite {
  id: string;
  stopId: string;
  kind: 'walk' | 'coffee' | 'dinner' | 'event';
  title: string;
  placeName: string;
  startsAt: ISODate;
  going: number;
  hostName: string;
  hostIsMe?: boolean;
  isDemo: boolean;
}

// ---------- Lugares ----------

export interface PriceSnapshot extends DataProvenance {
  amount: number;
  currency: 'EUR';
  /** Preço por pessoa/noite ou preço médio de refeição. */
  unit: 'per_night' | 'per_meal' | 'per_ticket';
  knownFees?: string;
  isEstimate: boolean;
}

export interface ReviewSummary extends DataProvenance {
  rating: number;
  count: number;
}

export interface BookingProvider {
  id: string;
  name: string;
  /** Somente fornecedores autorizados (API oficial/afiliado). */
  kind: 'official_api' | 'affiliate' | 'direct_contact';
  url: string;
}

interface PlaceBase {
  id: string;
  name: string;
  coord: LngLat;
  stopId: string;
  town: string;
  /** Distância (km) do traçado da rota. */
  distanceFromRouteKm: number;
  accessible: boolean;
  review?: ReviewSummary;
  sponsored?: SponsoredPlacement;
  partnerOffer?: PartnerOffer;
  provenance: DataProvenance;
}

export type AccommodationType = 'albergue' | 'hostel' | 'hotel' | 'pousada' | 'casa_rural' | 'camping' | 'religioso';

export interface Accommodation extends PlaceBase {
  type: AccommodationType;
  price: PriceSnapshot;
  availability: 'available' | 'limited' | 'full' | 'unknown';
  amenities: {
    breakfast: boolean;
    laundry: boolean;
    kitchen: boolean;
    bikeStorage: boolean;
    privateRoom: boolean;
    dorm: boolean;
    petsAllowed: boolean;
    freeCancellation: boolean;
  };
  checkInFrom: string;
  beds?: number;
  description: string;
  bookingProviders: BookingProvider[];
}

export interface Restaurant extends PlaceBase {
  kind: 'cafe' | 'restaurant' | 'bar' | 'bakery';
  avgPrice: PriceSnapshot;
  openingHours: string;
  cuisine: string;
  pilgrimMenu: boolean;
  diets: { vegetarian: boolean; vegan: boolean; glutenFree: boolean };
  amenities: { waterRefill: boolean; toilet: boolean; sockets: boolean; wifi: boolean; restArea: boolean };
}

export type PoiCategory = 'church' | 'monument' | 'museum' | 'market' | 'viewpoint' | 'bridge';

export interface PointOfInterest extends PlaceBase {
  category: PoiCategory;
  description: string;
  openingHours?: string;
  price?: PriceSnapshot;
  etiquette?: string;
}

export interface Event {
  id: string;
  title: string;
  category: 'festival' | 'fair' | 'concert' | 'religious' | 'market' | 'gastronomy';
  town: string;
  stopId: string;
  coord: LngLat;
  startsAt: ISODate;
  endsAt: ISODate;
  priceEur: number | null;
  description: string;
  provenance: DataProvenance;
}

// ---------- Clima ----------

export interface WeatherHour {
  time: ISODate;
  tempC: number;
  precipProb: number;
  condition: WeatherCondition;
}

export type WeatherCondition = 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'showers' | 'storm' | 'fog' | 'wind';

export interface WeatherDay {
  date: ISODate;
  minC: number;
  maxC: number;
  precipProb: number;
  condition: WeatherCondition;
}

export interface WeatherAlert {
  id: string;
  level: 'yellow' | 'orange' | 'red';
  title: string;
  description: string;
  issuer: string;
  validUntil: ISODate;
}

export interface WeatherSnapshot extends DataProvenance {
  locationName: string;
  coord: LngLat;
  current: {
    tempC: number;
    feelsLikeC: number;
    condition: WeatherCondition;
    precipProb: number;
    windKmh: number;
    uvIndex: number;
  };
  sunrise: string;
  sunset: string;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  alerts: WeatherAlert[];
}

// ---------- Comunidade ----------

export interface PublicPilgrim {
  id: string;
  displayName: string;
  countryCode: string;
  languages: string[];
  routeId: string;
  pace: 'slow' | 'medium' | 'fast';
  interests: CulturalInterest[];
  availableToChat: boolean;
  avatar: AvatarConfiguration;
  /** Posição já ofuscada conforme a granularidade escolhida pelo usuário. */
  location: UserLocation | null;
  isDemo: boolean;
}

export interface UserLocation {
  userId: string;
  granularity: Exclude<LocationGranularity, 'hidden'>;
  /** Coordenada já reduzida/ofuscada. Nunca a posição exata, exceto 'precise_temporary'. */
  coord: LngLat | null;
  cityName: string;
  /** Precisão anunciada em metros. */
  accuracyM: number;
  expiresAt?: ISODate;
  updatedAt: ISODate;
}

export interface ConnectionRequest extends Timestamps {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
}

export interface Conversation extends Timestamps {
  id: string;
  kind: 'direct' | 'group';
  title: string;
  memberIds: string[];
  stopId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: ISODate;
  flagged?: boolean;
}

export interface Report extends Timestamps {
  id: string;
  reporterId: string;
  targetUserId?: string;
  targetMessageId?: string;
  reason: 'spam' | 'harassment' | 'unsafe_meeting' | 'fake_profile' | 'other';
  details?: string;
  status: 'open' | 'reviewing' | 'resolved';
}

export interface ModerationAction extends Timestamps {
  id: string;
  reportId: string;
  moderatorId: string;
  action: 'dismiss' | 'warn' | 'mute_24h' | 'suspend' | 'ban';
  note?: string;
}

// ---------- Segurança ----------

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relation: string;
}

export interface SafetyCheckIn {
  id: string;
  userId: string;
  segmentId?: string;
  dueAt: ISODate;
  status: 'scheduled' | 'ok' | 'missed';
  createdAt: ISODate;
}

// ---------- Personagem, diário, conquistas ----------

export type BodyType = 'slim' | 'average' | 'broad';
export type Presentation = 'feminine' | 'masculine' | 'neutral';

export interface AvatarConfiguration {
  bodyType: BodyType;
  presentation: Presentation;
  skinTone: string;
  hairStyle: 'short' | 'long' | 'bun' | 'curly' | 'bald';
  hairColor: string;
  outfit: 'tshirt_shorts' | 'jacket_pants' | 'dress_leggings' | 'poncho';
  outfitColor: string;
  backpack: 'small' | 'medium' | 'large';
  backpackColor: string;
  hat: 'none' | 'sun_hat' | 'cap' | 'beanie';
  shoes: 'boots' | 'trail_runners' | 'sandals';
  staff: 'none' | 'wooden' | 'poles';
  accessories: Array<'shell' | 'gourd' | 'bandana' | 'sunglasses'>;
}

export interface JournalEntry extends Timestamps {
  id: string;
  userId: string;
  tripId?: string;
  segmentId?: string;
  title: string;
  body: string;
  photos: string[];
  distanceKm?: number;
  placesVisited: string[];
  mood?: 'great' | 'good' | 'tired' | 'hard';
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: ISODate;
}

// ---------- Comercial ----------

/** Camino Pass: pagamento único por jornada (sem assinatura). 'group' = pacote Grupo/Família. */
export type PlanId = 'free' | 'pass' | 'group';

export interface Subscription extends Timestamps {
  id: string;
  userId: string;
  plan: PlanId;
  /** 'cancelled' = reembolsado. O passe não expira: a jornada comprada fica liberada para sempre. */
  status: 'trialing' | 'active' | 'cancelled' | 'expired';
  /** Só o teste gratuito tem fim; o passe pago não tem. */
  currentPeriodEnd?: ISODate;
  /** Rota (jornada) liberada pela compra. */
  routeFamily?: string;
  amountPaidEur?: number;
  couponCode?: string;
  /** Afiliado/criador que originou a venda (para comissão). */
  affiliateId?: string;
  /** Pacote Grupo/Família: lugares e convites. */
  seats?: number;
  inviteCodes?: string[];
  provider: 'stripe' | 'apple' | 'google' | 'demo';
  providerRef?: string;
}

export interface Sponsor extends Timestamps {
  id: string;
  name: string;
  category: 'accommodation' | 'restaurant' | 'shop' | 'service';
  contactEmail: string;
  status: 'lead' | 'active' | 'paused';
  /** Parceiro fundador: cadastro verificado, oferta exclusiva e painel de desempenho. */
  tier?: 'founding' | 'standard';
  verified?: boolean;
  pricing?: 'monthly' | 'season' | 'per_click' | 'per_result';
}

/** Afiliado ou criador de conteúdo com link e cupom próprios. */
export interface Affiliate {
  id: string;
  name: string;
  channel: 'youtube' | 'instagram' | 'tiktok' | 'blog' | 'agency';
  code: string;
  /** Fração da receita líquida paga como comissão (ex.: 0.25). */
  commissionRate: number;
  status: 'active' | 'pending' | 'paused';
  /** O uso do nome em "O Caminho de ..." exige autorização por escrito. */
  nameUseAuthorized: boolean;
  stats: { clicks: number; checkouts: number; sales: number };
  isDemo: boolean;
}

/** Rota recomendada por um criador: sobreposição de dicas e lugares favoritos sobre uma rota base. */
export interface CreatorRoute {
  id: string;
  affiliateId: string;
  title: string;
  baseRouteId: string;
  summary: string;
  videoUrl?: string;
  tips: { stopId: string; text: string; placeIds?: string[] }[];
  isDemo: boolean;
}

/** Oferta de parceiro fundador: sempre exibida separada das recomendações orgânicas. */
export interface PartnerOffer {
  id: string;
  sponsorId: string;
  placeId: string;
  title: string;
  couponCode: string;
  validUntil: ISODate;
}

export interface SponsoredPlacement {
  id: string;
  sponsorId: string;
  /** Sempre exibido ao usuário. */
  label: 'Patrocinado';
  placeId: string;
  startsAt: ISODate;
  endsAt: ISODate;
  /** Patrocínio pode mudar a ordem na lista, nunca alertas nem o modo "Mais segura". */
  boost: number;
}

// MLS API Response Types
export interface MLSResponse<T> {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  value: T[];
}

export interface MLSProperty {
  ListingKey: string;
  ListingId?: string;
  StandardStatus?: string;
  PropertyType?: string;
  PropertySubType?: string;
  ListPrice?: number;
  OriginalListPrice?: number;
  ClosePrice?: number;
  UnparsedAddress?: string;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  CountyOrParish?: string;
  Country?: string;
  Latitude?: number;
  Longitude?: number;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  BathroomsOneQuarter?: number;
  BathroomsThreeQuarter?: number;
  LivingArea?: number;
  LivingAreaUnits?: string;
  LotSizeArea?: number;
  LotSizeSquareFeet?: number;
  LotSizeAcres?: number;
  YearBuilt?: number;
  StoriesTotal?: number;
  ArchitecturalStyle?: string;
  ConstructionMaterials?: string;
  RoofType?: string;
  ParkingFeatures?: string | string[];
  ParkingTotal?: number;
  GarageSpaces?: number;
  GarageYN?: boolean;
  Heating?: string;
  Cooling?: string;
  Appliances?: string;
  Flooring?: string;
  InteriorFeatures?: string;
  FireplaceFeatures?: string;
  FireplaceYN?: boolean;
  ExteriorFeatures?: string;
  LotFeatures?: string;
  PoolFeatures?: string;
  PoolYN?: boolean;
  TaxAnnualAmount?: number;
  TaxYear?: number;
  AssociationFee?: number;
  AssociationFeeFrequency?: string;
  MlgCanView: boolean;
  OriginatingSystemName?: string;
  OriginatingSystemKey?: string;
  ListAgentKey?: string;
  ListAgentMlsId?: string;
  ListAgentFullName?: string;
  ListOfficeKey?: string;
  ListOfficeMlsId?: string;
  ListOfficeName?: string;
  BuyerAgentKey?: string;
  BuyerAgentMlsId?: string;
  BuyerOfficeKey?: string;
  BuyerOfficeMlsId?: string;
  ModificationTimestamp: string;
  OriginatingSystemModificationTimestamp?: string;
  OnMarketDate?: string;
  OffMarketDate?: string;
  ListingContractDate?: string;
  PurchaseContractDate?: string;
  CloseDate?: string;
  ExpirationDate?: string;
  ShowingInstructions?: string;
  ShowingContactName?: string;
  ShowingContactPhone?: string;
  PublicRemarks?: string;
  PrivateRemarks?: string;
  VirtualTourURLUnbranded?: string;
  Media?: MLSMedia[];
  Rooms?: MLSRoom[];
  UnitTypes?: MLSUnitType[];
  [key: string]: any;
}

export interface MLSMedia {
  MediaKey: string;
  ResourceRecordKey?: string;
  ResourceName?: string;
  MediaURL: string;
  MediaType?: string;
  MediaCategory?: string;
  MediaObjectID?: string;
  Order?: number;
  ShortDescription?: string;
  LongDescription?: string;
  ImageWidth?: number;
  ImageHeight?: number;
  ImageSize?: number;
  MlgCanView?: boolean;
  OriginatingSystemName?: string;
  ModificationTimestamp: string;
  [key: string]: any;
}

export interface MLSRoom {
  RoomType?: string;
  RoomLevel?: string;
  RoomLength?: number;
  RoomWidth?: number;
  RoomArea?: number;
  RoomDimensions?: string;
  RoomFeatures?: string;
  RoomDescription?: string;
  [key: string]: any;
}

export interface MLSUnitType {
  UnitTypeType?: string;
  UnitNumber?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  UnitTypeArea?: number;
  UnitTypeRent?: number;
  UnitTypeLeaseType?: string;
  [key: string]: any;
}

export interface MLSMember {
  MemberKey: string;
  MemberMlsId?: string;
  MemberFirstName?: string;
  MemberMiddleName?: string;
  MemberLastName?: string;
  MemberFullName?: string;
  MemberNameSuffix?: string;
  MemberEmail?: string;
  MemberMobilePhone?: string;
  MemberOfficePhone?: string;
  MemberHomePhone?: string;
  MemberPager?: string;
  MemberFax?: string;
  MemberCity?: string;
  MemberStateOrProvince?: string;
  MemberPostalCode?: string;
  OfficeKey?: string;
  OfficeMlsId?: string;
  OfficeName?: string;
  MemberStatus?: string;
  MemberType?: string;
  MemberDesignation?: string | string[];
  MemberAOR?: string;
  MemberAORMlsId?: string;
  JobTitle?: string;
  MemberLanguages?: string | string[];
  MlgCanView: boolean;
  MlgCanUse?: string | string[];
  OriginatingSystemName?: string;
  OriginatingSystemID?: string;
  OriginalEntryTimestamp?: string;
  ModificationTimestamp: string;
  PhotosChangeTimestamp?: string;
  Media?: MLSMedia[];
  [key: string]: any;
}

export interface MLSOffice {
  OfficeKey: string;
  OfficeMlsId?: string;
  OfficeName?: string;
  OfficeEmail?: string;
  OfficePhone?: string;
  OfficeFax?: string;
  OfficeAddress1?: string;
  OfficeAddress2?: string;
  OfficeCity?: string;
  OfficeStateOrProvince?: string;
  OfficePostalCode?: string;
  OfficeStatus?: string;
  OfficeBranchType?: string;
  OfficeAORMlsId?: string;
  OfficeCorporateLicense?: string;
  MainOfficeKey?: string;
  MainOfficeMlsId?: string;
  IDXOfficeParticipationYN?: boolean;
  MlgCanView: boolean;
  MlgCanUse?: string | string[];
  OriginatingSystemName?: string;
  OriginatingSystemID?: string;
  OriginatingSystemOfficeKey?: string;
  ModificationTimestamp: string;
  PhotosChangeTimestamp?: string;
  SyndicateTo?: string | string[];
  Media?: MLSMedia[];
  [key: string]: any;
}

export interface MLSOpenHouse {
  OpenHouseKey: string;
  ListingKey?: string;
  ListingId?: string;
  OpenHouseId?: string;
  OpenHouseDate?: string;
  OpenHouseStartTime?: string;
  OpenHouseEndTime?: string;
  OpenHouseType?: string;
  OpenHouseStatus?: string;
  OpenHouseRemarks?: string;
  Refreshments?: string;
  MlgCanView: boolean;
  MlgCanUse?: string | string[];
  OriginatingSystemName?: string;
  ModificationTimestamp: string;
  [key: string]: any;
}

export interface SyncResult {
  success: boolean;
  resourceType: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  duration: number;
  error?: string;
}

export interface PropertyFilters {
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  propertyType?: string;
  standardStatus?: string;
  minLivingArea?: number;
  maxLivingArea?: number;
  minLotSize?: number;
  maxLotSize?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  hasPool?: boolean;
  hasGarage?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MemberFilters {
  memberStatus?: string;
  memberType?: string;
  memberOfficeKey?: string;
  page?: number;
  limit?: number;
}

export interface OfficeFilters {
  officeStatus?: string;
  officeType?: string;
  officeCity?: string;
  officeStateOrProvince?: string;
  page?: number;
  limit?: number;
}

export interface OpenHouseFilters {
  listingKey?: string;
  upcoming?: boolean;
  startDate?: string;
  endDate?: string;
  openHouseType?: string;
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
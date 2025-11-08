-- Create MLS schema
CREATE SCHEMA IF NOT EXISTS mls;

-- Grant permissions
GRANT ALL ON SCHEMA mls TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA mls TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA mls GRANT ALL ON TABLES TO postgres;




generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  schemas  = ["public", "mls"]
}

// ==================== MLS SCHEMA (External MLS Data) ====================

model Property {
  id                            String    @id @default(uuid())
  listingKey                    String    @unique @map("listing_key")
  listingId                     String?   @map("listing_id")
  
  // Basic Info
  standardStatus                String?   @map("standard_status")
  propertyType                  String?   @map("property_type")
  propertySubType               String?   @map("property_sub_type")
  
  // Pricing
  listPrice                     Float?    @map("list_price")
  originalListPrice             Float?    @map("original_list_price")
  closePrice                    Float?    @map("close_price")
  
  // Location
  unparsedAddress               String?   @map("unparsed_address")
  streetNumber                  String?   @map("street_number")
  streetName                    String?   @map("street_name")
  streetSuffix                  String?   @map("street_suffix")
  unitNumber                    String?   @map("unit_number")
  city                          String?
  stateOrProvince               String?   @map("state_or_province")
  postalCode                    String?   @map("postal_code")
  country                       String?
  latitude                      Float?
  longitude                     Float?
  
  // Property Details
  bedroomsTotal                 Int?      @map("bedrooms_total")
  bathroomsTotalInteger         Int?      @map("bathrooms_total_integer")
  bathroomsFull                 Int?      @map("bathrooms_full")
  bathroomsHalf                 Int?      @map("bathrooms_half")
  bathroomsOneQuarter           Int?      @map("bathrooms_one_quarter")
  bathroomsThreeQuarter         Int?      @map("bathrooms_three_quarter")
  
  // Area/Size
  livingArea                    Float?    @map("living_area")
  livingAreaUnits               String?   @map("living_area_units")
  lotSizeArea                   Float?    @map("lot_size_area")
  lotSizeSquareFeet             Float?    @map("lot_size_square_feet")
  lotSizeAcres                  Float?    @map("lot_size_acres")
  
  // Building Info
  yearBuilt                     Int?      @map("year_built")
  storiesTotal                  Int?      @map("stories_total")
  architecturalStyle            String?   @map("architectural_style")
  constructionMaterials         String?   @map("construction_materials")
  roofType                      String?   @map("roof_type")
  
  // Parking
  parkingFeatures               String?   @map("parking_features")
  parkingTotal                  Int?      @map("parking_total")
  garageSpaces                  Int?      @map("garage_spaces")
  garageYN                      Boolean?  @map("garage_yn")
  
  // Utilities & Systems
  heating                       String?
  cooling                       String?
  appliances                    String?
  
  // Interior Features
  flooring                      String?
  interiorFeatures              String?   @map("interior_features")
  fireplaceFeatures             String?   @map("fireplace_features")
  fireplaceYN                   Boolean?  @map("fireplace_yn")
  
  // Exterior Features
  exteriorFeatures              String?   @map("exterior_features")
  lotFeatures                   String?   @map("lot_features")
  poolFeatures                  String?   @map("pool_features")
  poolYN                        Boolean?  @map("pool_yn")
  
  // Financial
  taxAnnualAmount               Float?    @map("tax_annual_amount")
  taxYear                       Int?      @map("tax_year")
  associationFee                Float?    @map("association_fee")
  associationFeeFrequency       String?   @map("association_fee_frequency")
  
  // MLS Info
  mlgCanView                    Boolean   @default(true) @map("mlg_can_view")
  originatingSystemName         String?   @map("originating_system_name")
  originatingSystemKey          String?   @map("originating_system_key")
  
  // Listing Details
  listAgentKey                  String?   @map("list_agent_key")
  listAgentMlsId                String?   @map("list_agent_mls_id")
  listAgentFullName             String?   @map("list_agent_full_name")
  listOfficeKey                 String?   @map("list_office_key")
  listOfficeMlsId               String?   @map("list_office_mls_id")
  listOfficeName                String?   @map("list_office_name")
  
  buyerAgentKey                 String?   @map("buyer_agent_key")
  buyerAgentMlsId               String?   @map("buyer_agent_mls_id")
  buyerOfficeKey                String?   @map("buyer_office_key")
  buyerOfficeMlsId              String?   @map("buyer_office_mls_id")
  
  // Dates
  modificationTimestamp         DateTime  @map("modification_timestamp")
  originatingSystemModificationTimestamp DateTime? @map("originating_system_modification_timestamp")
  onMarketDate                  DateTime? @map("on_market_date")
  offMarketDate                 DateTime? @map("off_market_date")
  listingContractDate           DateTime? @map("listing_contract_date")
  purchaseContractDate          DateTime? @map("purchase_contract_date")
  closeDate                     DateTime? @map("close_date")
  expirationDate                DateTime? @map("expiration_date")
  
  // Showing Info
  showingInstructions           String?   @map("showing_instructions") @db.Text
  showingContactName            String?   @map("showing_contact_name")
  showingContactPhone           String?   @map("showing_contact_phone")
  
  // Descriptions
  publicRemarks                 String?   @map("public_remarks") @db.Text
  privateRemarks                String?   @map("private_remarks") @db.Text
  
  // Virtual Tour
  virtualTourURLUnbranded       String?   @map("virtual_tour_url_unbranded")
  
  // Metadata
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations (within MLS schema)
  media                         Media[]
  rooms                         Room[]
  unitTypes                     UnitType[]
  openHouses                    OpenHouse[]
  
  // Cross-schema relations (to public schema)
  favorites                     UserFavorite[]
  inquiries                     Inquiry[]
  
  @@index([standardStatus])
  @@index([propertyType])
  @@index([city])
  @@index([stateOrProvince])
  @@index([postalCode])
  @@index([listPrice])
  @@index([bedroomsTotal])
  @@index([bathroomsTotalInteger])
  @@index([modificationTimestamp])
  @@index([mlgCanView])
  @@index([listAgentKey])
  @@index([listOfficeKey])
  @@index([onMarketDate])
  @@map("properties")
  @@schema("mls")
}

model Media {
  id                            String    @id @default(uuid())
  mediaKey                      String    @unique @map("media_key")
  
  // Resource Association
  resourceRecordKey             String?   @map("resource_record_key") // Links to Property/Member/Office
  resourceName                  String?   @map("resource_name") // Property, Member, Office
  
  // Media Info
  mediaURL                      String    @map("media_url")
  mediaType                     String?   @map("media_type") // Image, Video, PDF
  mediaCategory                 String?   @map("media_category") // Photo, Map, Document
  mediaObjectID                 String?   @map("media_object_id")
  order                         Int?      @default(0) // Display order
  
  // Descriptions
  shortDescription              String?   @map("short_description")
  longDescription               String?   @map("long_description") @db.Text
  
  // Image Specific
  imageWidth                    Int?      @map("image_width")
  imageHeight                   Int?      @map("image_height")
  imageSize                     Int?      @map("image_size") // in KB
  
  // MLS Info
  mlgCanView                    Boolean   @default(true) @map("mlg_can_view")
  originatingSystemName         String?   @map("originating_system_name")
  
  // Dates
  modificationTimestamp         DateTime  @map("modification_timestamp")
  
  // Metadata
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  property                      Property? @relation(fields: [resourceRecordKey], references: [listingKey], onDelete: Cascade)
  
  @@index([resourceRecordKey])
  @@index([resourceName])
  @@index([mediaType])
  @@index([mediaCategory])
  @@index([order])
  @@map("media")
  @@schema("mls")
}

model Room {
  id                            String    @id @default(uuid())
  
  // Property Association
  listingKey                    String    @map("listing_key")
  
  // Room Info
  roomType                      String?   @map("room_type") // Bedroom, Kitchen, Living Room, etc.
  roomLevel                     String?   @map("room_level") // Main, Upper, Lower, Basement
  roomLength                    Float?    @map("room_length")
  roomWidth                     Float?    @map("room_width")
  roomArea                      Float?    @map("room_area")
  roomDimensions                String?   @map("room_dimensions")
  roomFeatures                  String?   @map("room_features")
  roomDescription               String?   @map("room_description") @db.Text
  
  // Metadata
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  property                      Property  @relation(fields: [listingKey], references: [listingKey], onDelete: Cascade)
  
  @@index([listingKey])
  @@index([roomType])
  @@index([roomLevel])
  @@map("rooms")
  @@schema("mls")
}

model UnitType {
  id                            String    @id @default(uuid())
  
  // Property Association
  listingKey                    String    @map("listing_key")
  
  // Unit Info
  unitTypeType                  String?   @map("unit_type_type")
  unitNumber                    String?   @map("unit_number")
  bedroomsTotal                 Int?      @map("bedrooms_total")
  bathroomsTotalInteger         Int?      @map("bathrooms_total_integer")
  unitTypeArea                  Float?    @map("unit_type_area")
  unitTypeRent                  Float?    @map("unit_type_rent")
  unitTypeLeaseType             String?   @map("unit_type_lease_type")
  
  // Metadata
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  property                      Property  @relation(fields: [listingKey], references: [listingKey], onDelete: Cascade)
  
  @@index([listingKey])
  @@index([unitTypeType])
  @@map("unit_types")
  @@schema("mls")
}

model Member {
  id                            String    @id @default(uuid())
  memberKey                     String    @unique @map("member_key")
  memberMlsId                   String?   @unique @map("member_mls_id")
  
  // Personal Info
  memberFirstName               String?   @map("member_first_name")
  memberLastName                String?   @map("member_last_name")
  memberFullName                String?   @map("member_full_name")
  memberNickname                String?   @map("member_nickname")
  memberPreferredName           String?   @map("member_preferred_name")
  
  // Contact Info
  memberEmail                   String?   @map("member_email")
  memberDirectPhone             String?   @map("member_direct_phone")
  memberMobilePhone             String?   @map("member_mobile_phone")
  memberOfficePhone             String?   @map("member_office_phone")
  memberFax                     String?   @map("member_fax")
  memberTollFreePhone           String?   @map("member_toll_free_phone")
  
  // Office Association
  memberOfficeKey               String?   @map("member_office_key")
  memberOfficeMlsId             String?   @map("member_office_mls_id")
  memberOfficeName              String?   @map("member_office_name")
  
  // Status & Type
  memberStatus                  String?   @map("member_status")
  memberType                    String?   @map("member_type")
  memberDesignation             String?   @map("member_designation")
  
  // Languages
  memberLanguages               String?   @map("member_languages")
  
  // MLS Info
  mlgCanView                    Boolean   @default(true) @map("mlg_can_view")
  originatingSystemName         String?   @map("originating_system_name")
  originatingSystemKey          String?   @map("originating_system_key")
  
  // Dates
  modificationTimestamp         DateTime  @map("modification_timestamp")
  originatingSystemModificationTimestamp DateTime? @map("originating_system_modification_timestamp")
  memberStateLicense            String?   @map("member_state_license")
  
  // Metadata
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  @@index([memberStatus])
  @@index([memberType])
  @@index([memberOfficeKey])
  @@index([modificationTimestamp])
  @@index([mlgCanView])
  @@map("members")
  @@schema("mls")
}

model Office {
  id                            String    @id @default(uuid())
  officeKey                     String    @unique @map("office_key")
  officeMlsId                   String?   @unique @map("office_mls_id")
  
  // Office Info
  officeName                    String?   @map("office_name")
  officeBrokerMlsId             String?   @map("office_broker_mls_id")
  officeBrokerKey               String?   @map("office_broker_key")
  
  // Contact Info
  officeEmail                   String?   @map("office_email")
  officePhone                   String?   @map("office_phone")
  officePhoneExt                String?   @map("office_phone_ext")
  officeFax                     String?   @map("office_fax")
  
  // Address
  officeAddress1                String?   @map("office_address1")
  officeAddress2                String?   @map("office_address2")
  officeCity                    String?   @map("office_city")
  officeStateOrProvince         String?   @map("office_state_or_province")
  officePostalCode              String?   @map("office_postal_code")
  officeCountry                 String?   @map("office_country")
  
  // Status & Type
  officeStatus                  String?   @map("office_status")
  officeType                    String?   @map("office_type")
  
  // MLS Info
  mlgCanView                    Boolean   @default(true) @map("mlg_can_view")
  originatingSystemName         String?   @map("originating_system_name")
  originatingSystemKey          String?   @map("originating_system_key")
  
  // Dates
  modificationTimestamp         DateTime  @map("modification_timestamp")
  originatingSystemModificationTimestamp DateTime? @map("originating_system_modification_timestamp")
  
  // Metadata
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  @@index([officeStatus])
  @@index([officeType])
  @@index([officeCity])
  @@index([officeStateOrProvince])
  @@index([modificationTimestamp])
  @@index([mlgCanView])
  @@map("offices")
  @@schema("mls")
}

model OpenHouse {
  id                            String    @id @default(uuid())
  openHouseKey                  String    @unique @map("open_house_key")
  
  // Property Reference
  listingKey                    String?   @map("listing_key")
  listingId                     String?   @map("listing_id")
  
  // Date/Time
  openHouseDate                 DateTime? @map("open_house_date")
  openHouseStartTime            DateTime? @map("open_house_start_time")
  openHouseEndTime              DateTime? @map("open_house_end_time")
  
  // Details
  openHouseType                 String?   @map("open_house_type") // Public, Private, Broker
  openHouseRemarks              String?   @map("open_house_remarks") @db.Text
  refreshments                  String?
  
  // Showing Agent
  showingAgentKey               String?   @map("showing_agent_key")
  showingAgentMlsId             String?   @map("showing_agent_mls_id")
  
  // RSVP Info
  openHouseAttendedBy           String?   @map("open_house_attended_by")
  
  // MLS Info
  mlgCanView                    Boolean   @default(true) @map("mlg_can_view")
  originatingSystemName         String?   @map("originating_system_name")
  originatingSystemKey          String?   @map("originating_system_key")
  
  // Dates
  modificationTimestamp         DateTime  @map("modification_timestamp")
  originatingSystemModificationTimestamp DateTime? @map("originating_system_modification_timestamp")
  
  // Metadata
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  property                      Property? @relation(fields: [listingKey], references: [listingKey], onDelete: Cascade)
  
  @@index([listingKey])
  @@index([openHouseDate])
  @@index([openHouseStartTime])
  @@index([modificationTimestamp])
  @@index([mlgCanView])
  @@map("open_houses")
  @@schema("mls")
}

model SyncLog {
  id                            String    @id @default(uuid())
  resourceType                  String    @map("resource_type") // Property, Member, Office, OpenHouse
  syncType                      String    @map("sync_type") // initial, incremental
  status                        String    // success, error, in_progress
  recordsProcessed              Int       @default(0) @map("records_processed")
  recordsCreated                Int       @default(0) @map("records_created")
  recordsUpdated                Int       @default(0) @map("records_updated")
  recordsDeleted                Int       @default(0) @map("records_deleted")
  lastModificationTimestamp     DateTime? @map("last_modification_timestamp")
  errorMessage                  String?   @map("error_message") @db.Text
  errorDetails                  Json?     @map("error_details") @db.JsonB
  startedAt                     DateTime  @map("started_at")
  completedAt                   DateTime? @map("completed_at")
  durationSeconds               Int?      @map("duration_seconds")
  
  createdAt                     DateTime  @default(now()) @map("created_at")
  
  @@index([resourceType])
  @@index([syncType])
  @@index([status])
  @@index([startedAt])
  @@map("sync_logs")
  @@schema("mls")
}

// ==================== PUBLIC SCHEMA (Application Data) ====================

model User {
  id                            String    @id @default(uuid())
  email                         String    @unique
  password                      String // hashed with bcrypt
  firstName                     String?   @map("first_name")
  lastName                      String?   @map("last_name")
  phone                         String?
  avatar                        String?
  role                          String    @default("user") // user, agent, admin
  isActive                      Boolean   @default(true) @map("is_active")
  isEmailVerified               Boolean   @default(false) @map("is_email_verified")
  
  // Preferences
  preferences                   Json?     @db.JsonB
  
  // Metadata
  lastLoginAt                   DateTime? @map("last_login_at")
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  favorites                     UserFavorite[]
  searches                      SavedSearch[]
  inquiries                     Inquiry[]
  appointments                  Appointment[]
  
  @@index([email])
  @@index([role])
  @@index([isActive])
  @@map("users")
  @@schema("public")
}

model UserFavorite {
  id                            String    @id @default(uuid())
  userId                        String    @map("user_id")
  listingKey                    String    @map("listing_key")
  notes                         String?   @db.Text
  
  createdAt                     DateTime  @default(now()) @map("created_at")
  
  // Relations
  user                          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  property                      Property  @relation(fields: [listingKey], references: [listingKey], onDelete: Cascade)
  
  @@unique([userId, listingKey])
  @@index([userId])
  @@index([listingKey])
  @@map("user_favorites")
  @@schema("public")
}

model SavedSearch {
  id                            String    @id @default(uuid())
  userId                        String    @map("user_id")
  searchName                    String    @map("search_name")
  searchCriteria                Json      @map("search_criteria") @db.JsonB // Store filter params
  notifyOnNewListings           Boolean   @default(false) @map("notify_on_new_listings")
  frequency                     String?   @default("daily") // instant, daily, weekly
  
  lastNotifiedAt                DateTime? @map("last_notified_at")
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user                          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([notifyOnNewListings])
  @@map("saved_searches")
  @@schema("public")
}

model Inquiry {
  id                            String    @id @default(uuid())
  userId                        String?   @map("user_id")
  listingKey                    String    @map("listing_key")
  
  // Contact Info (if no userId)
  name                          String?
  email                         String?
  phone                         String?
  
  // Inquiry Details
  inquiryType                   String?   @map("inquiry_type") // showing, info, offer
  message                       String    @db.Text
  preferredContactMethod        String?   @map("preferred_contact_method") // email, phone, text
  
  // Status
  status                        String    @default("new") // new, contacted, scheduled, closed
  agentNotes                    String?   @map("agent_notes") @db.Text
  
  // Dates
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  contactedAt                   DateTime? @map("contacted_at")
  
  // Relations
  user                          User?     @relation(fields: [userId], references: [id])
  property                      Property  @relation(fields: [listingKey], references: [listingKey])
  
  @@index([userId])
  @@index([listingKey])
  @@index([status])
  @@index([createdAt])
  @@map("inquiries")
  @@schema("public")
}

model Appointment {
  id                            String    @id @default(uuid())
  userId                        String    @map("user_id")
  listingKey                    String?   @map("listing_key")
  
  // Appointment Info
  appointmentType               String    @map("appointment_type") // showing, consultation
  appointmentDate               DateTime  @map("appointment_date")
  duration                      Int       @default(30) // in minutes
  location                      String?
  
  // Status
  status                        String    @default("scheduled") // scheduled, confirmed, completed, cancelled
  notes                         String?   @db.Text
  
  // Agent Info
  agentId                       String?   @map("agent_id")
  agentNotes                    String?   @map("agent_notes") @db.Text
  
  // Dates
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user                          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([listingKey])
  @@index([appointmentDate])
  @@index([status])
  @@map("appointments")
  @@schema("public")
}





# 1. Create MLS schema in PostgreSQL
psql -h localhost -U postgres -d pmssystem -c "CREATE SCHEMA IF NOT EXISTS mls;"

# 2. Generate Prisma Client from mls.prisma
npx prisma generate --schema=./prisma/mls.prisma

# 3. Push schema to database (creates all tables)
npx prisma db push --schema=./prisma/mls.prisma

# 4. (Optional) Open Prisma Studio to view data
npx prisma studio --schema=./prisma/mls.prisma




# Install Prisma if not already installed
npm install prisma @prisma/client --save-dev

# Then run the commands above




# Check tables in MLS schema
psql -h localhost -U postgres -d pmssystem -c "\dt mls.*"

# Check tables in public schema
psql -h localhost -U postgres -d pmssystem -c "\dt public.*"


SELECT * FROM mls.properties

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'mls'  -- change if your table is in another schema
  AND table_name   = 'properties'
ORDER BY ordinal_position;


TRUNCATE TABLE mls.media RESTART IDENTITY CASCADE;
TRUNCATE TABLE mls.members RESTART IDENTITY CASCADE;
TRUNCATE TABLE mls.offices RESTART IDENTITY CASCADE;
TRUNCATE TABLE mls.open_houses RESTART IDENTITY CASCADE;
TRUNCATE TABLE mls.properties RESTART IDENTITY CASCADE;
TRUNCATE TABLE mls.rooms RESTART IDENTITY CASCADE;
TRUNCATE TABLE mls.sync_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE mls.unit_types RESTART IDENTITY CASCADE;



npx prisma format
npx prisma migrate dev --name align_mls_with_api_schema
npx prisma migrate reset
npx prisma generate
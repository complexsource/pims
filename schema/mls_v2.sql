-- Create schemas
CREATE SCHEMA IF NOT EXISTS mls;
CREATE SCHEMA IF NOT EXISTS public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== MLS SCHEMA TABLES ====================

-- Properties Table
CREATE TABLE mls.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_key VARCHAR(255) UNIQUE NOT NULL,
    listing_id VARCHAR(255),
    
    -- Basic Info
    standard_status VARCHAR(255),
    property_type VARCHAR(255),
    property_sub_type VARCHAR(255),
    
    -- Pricing
    list_price DOUBLE PRECISION,
    original_list_price DOUBLE PRECISION,
    close_price DOUBLE PRECISION,
    
    -- Location
    unparsed_address VARCHAR(255),
    street_number VARCHAR(255),
    street_name VARCHAR(255),
    street_suffix VARCHAR(255),
    unit_number VARCHAR(255),
    city VARCHAR(255),
    state_or_province VARCHAR(255),
    postal_code VARCHAR(255),
    county_or_parish VARCHAR(255),
    country VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Property Details
    bedrooms_total INTEGER,
    bathrooms_total_integer INTEGER,
    bathrooms_full INTEGER,
    bathrooms_half INTEGER,
    bathrooms_one_quarter INTEGER,
    bathrooms_three_quarter INTEGER,
    
    -- Area/Size
    living_area DOUBLE PRECISION,
    living_area_units VARCHAR(255),
    lot_size_area DOUBLE PRECISION,
    lot_size_square_feet DOUBLE PRECISION,
    lot_size_acres DOUBLE PRECISION,
    
    -- Building Info
    year_built INTEGER,
    stories_total INTEGER,
    architectural_style VARCHAR(255),
    construction_materials VARCHAR(255),
    roof_type VARCHAR(255),
    
    -- Parking
    parking_features VARCHAR(255),
    parking_total INTEGER,
    garage_spaces INTEGER,
    garage_yn BOOLEAN,
    
    -- Utilities & Systems
    heating VARCHAR(255),
    cooling VARCHAR(255),
    appliances VARCHAR(255),
    
    -- Interior Features
    flooring VARCHAR(255),
    interior_features VARCHAR(255),
    fireplace_features VARCHAR(255),
    fireplace_yn BOOLEAN,
    
    -- Exterior Features
    exterior_features VARCHAR(255),
    lot_features VARCHAR(255),
    pool_features VARCHAR(255),
    pool_yn BOOLEAN,
    
    -- Financial
    tax_annual_amount DOUBLE PRECISION,
    tax_year INTEGER,
    association_fee DOUBLE PRECISION,
    association_fee_frequency VARCHAR(255),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    originating_system_name VARCHAR(255),
    originating_system_key VARCHAR(255),
    
    -- Listing Details
    list_agent_key VARCHAR(255),
    list_agent_mls_id VARCHAR(255),
    list_agent_full_name VARCHAR(255),
    list_office_key VARCHAR(255),
    list_office_mls_id VARCHAR(255),
    list_office_name VARCHAR(255),
    buyer_agent_key VARCHAR(255),
    buyer_agent_mls_id VARCHAR(255),
    buyer_office_key VARCHAR(255),
    buyer_office_mls_id VARCHAR(255),
    
    -- Dates
    modification_timestamp TIMESTAMP NOT NULL,
    originating_system_modification_timestamp TIMESTAMP,
    on_market_date TIMESTAMP,
    off_market_date TIMESTAMP,
    listing_contract_date TIMESTAMP,
    purchase_contract_date TIMESTAMP,
    close_date TIMESTAMP,
    expiration_date TIMESTAMP,
    
    -- Showing Info
    showing_instructions TEXT,
    showing_contact_name VARCHAR(255),
    showing_contact_phone VARCHAR(255),
    
    -- Descriptions
    public_remarks TEXT,
    private_remarks TEXT,
    
    -- Virtual Tour
    virtual_tour_url_unbranded VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Media Table
CREATE TABLE mls.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Resource Association
    resource_record_key VARCHAR(255),
    resource_name VARCHAR(255),
    
    -- Media Info
    media_url VARCHAR(255) NOT NULL,
    media_type VARCHAR(255),
    media_category VARCHAR(255),
    media_object_id VARCHAR(255),
    "order" INTEGER DEFAULT 0,
    
    -- Descriptions
    short_description VARCHAR(255),
    long_description TEXT,
    
    -- Image Specific
    image_width INTEGER,
    image_height INTEGER,
    image_size INTEGER,
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    originating_system_name VARCHAR(255),
    
    -- Dates
    modification_timestamp TIMESTAMP NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    FOREIGN KEY (resource_record_key) REFERENCES mls.properties(listing_key) ON DELETE CASCADE
);

-- Rooms Table
CREATE TABLE mls.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_key VARCHAR(255) NOT NULL,
    
    -- Room Info
    room_type VARCHAR(255),
    room_level VARCHAR(255),
    room_length DOUBLE PRECISION,
    room_width DOUBLE PRECISION,
    room_area DOUBLE PRECISION,
    room_dimensions VARCHAR(255),
    room_features VARCHAR(255),
    room_description TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    FOREIGN KEY (listing_key) REFERENCES mls.properties(listing_key) ON DELETE CASCADE
);

-- Unit Types Table
CREATE TABLE mls.unit_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_key VARCHAR(255) NOT NULL,
    
    -- Unit Info
    unit_type_type VARCHAR(255),
    unit_number VARCHAR(255),
    bedrooms_total INTEGER,
    bathrooms_total_integer INTEGER,
    unit_type_area DOUBLE PRECISION,
    unit_type_rent DOUBLE PRECISION,
    unit_type_lease_type VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    FOREIGN KEY (listing_key) REFERENCES mls.properties(listing_key) ON DELETE CASCADE
);

-- Members Table
CREATE TABLE mls.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_key VARCHAR(255) UNIQUE NOT NULL,
    member_mls_id VARCHAR(255) UNIQUE,
    
    -- Personal Info
    member_first_name VARCHAR(255),
    member_middle_name VARCHAR(255),
    member_last_name VARCHAR(255),
    member_full_name VARCHAR(255),
    member_name_suffix VARCHAR(255),
    
    -- Contact Info
    member_email VARCHAR(255),
    member_mobile_phone VARCHAR(255),
    member_office_phone VARCHAR(255),
    member_home_phone VARCHAR(255),
    member_pager VARCHAR(255),
    member_fax VARCHAR(255),
    
    -- Office Association
    office_key VARCHAR(255),
    office_mls_id VARCHAR(255),
    office_name VARCHAR(255),
    
    -- Address Info
    member_city VARCHAR(255),
    member_state_or_province VARCHAR(255),
    member_postal_code VARCHAR(255),
    
    -- Status & Type
    member_status VARCHAR(255),
    member_type VARCHAR(255),
    member_designation VARCHAR(255),
    member_aor VARCHAR(255),
    member_aor_mls_id VARCHAR(255),
    job_title VARCHAR(255),
    
    -- Languages
    member_languages VARCHAR(255),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    mlg_can_use VARCHAR(255),
    originating_system_name VARCHAR(255),
    originating_system_id VARCHAR(255),
    
    -- Dates
    original_entry_timestamp TIMESTAMP,
    modification_timestamp TIMESTAMP NOT NULL,
    photos_change_timestamp TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Offices Table
CREATE TABLE mls.offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_key VARCHAR(255) UNIQUE NOT NULL,
    office_mls_id VARCHAR(255) UNIQUE,
    
    -- Office Info
    office_name VARCHAR(255),
    office_aor_mls_id VARCHAR(255),
    office_corporate_license VARCHAR(255),
    
    -- Main Office Relationship
    main_office_key VARCHAR(255),
    main_office_mls_id VARCHAR(255),
    
    -- Contact Info
    office_email VARCHAR(255),
    office_phone VARCHAR(255),
    office_fax VARCHAR(255),
    
    -- Address
    office_address1 VARCHAR(255),
    office_address2 VARCHAR(255),
    office_city VARCHAR(255),
    office_state_or_province VARCHAR(255),
    office_postal_code VARCHAR(255),
    
    -- Status & Type
    office_status VARCHAR(255),
    office_branch_type VARCHAR(255),
    
    -- IDX & Syndication
    idx_office_participation_yn BOOLEAN,
    syndicate_to VARCHAR(255),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    mlg_can_use VARCHAR(255),
    originating_system_name VARCHAR(255),
    originating_system_id VARCHAR(255),
    originating_system_office_key VARCHAR(255),
    
    -- Dates
    modification_timestamp TIMESTAMP NOT NULL,
    photos_change_timestamp TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Open Houses Table
CREATE TABLE mls.open_houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    open_house_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Property Reference
    listing_key VARCHAR(255),
    listing_id VARCHAR(255),
    open_house_id VARCHAR(255),
    
    -- Date/Time
    open_house_date DATE,
    open_house_start_time TIMESTAMP,
    open_house_end_time TIMESTAMP,
    
    -- Details
    open_house_type VARCHAR(255),
    open_house_status VARCHAR(255),
    open_house_remarks TEXT,
    refreshments VARCHAR(255),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    mlg_can_use VARCHAR(255),
    originating_system_name VARCHAR(255),
    
    -- Dates
    modification_timestamp TIMESTAMP NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    FOREIGN KEY (listing_key) REFERENCES mls.properties(listing_key) ON DELETE CASCADE
);

-- Sync Logs Table
CREATE TABLE mls.sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(255) NOT NULL,
    sync_type VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    records_processed INTEGER DEFAULT 0 NOT NULL,
    records_created INTEGER DEFAULT 0 NOT NULL,
    records_updated INTEGER DEFAULT 0 NOT NULL,
    records_deleted INTEGER DEFAULT 0 NOT NULL,
    last_modification_timestamp TIMESTAMP,
    error_message TEXT,
    error_details JSONB,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==================== PUBLIC SCHEMA TABLES ====================

-- Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(255),
    avatar VARCHAR(255),
    role VARCHAR(255) DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_email_verified BOOLEAN DEFAULT false NOT NULL,
    
    -- Preferences
    preferences JSONB,
    
    -- Metadata
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User Favorites Table
CREATE TABLE public.user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    listing_key VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_key) REFERENCES mls.properties(listing_key) ON DELETE CASCADE,
    
    -- Unique Constraint
    UNIQUE (user_id, listing_key)
);

-- Saved Searches Table
CREATE TABLE public.saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    search_name VARCHAR(255) NOT NULL,
    search_criteria JSONB NOT NULL,
    notify_on_new_listings BOOLEAN DEFAULT false NOT NULL,
    frequency VARCHAR(255) DEFAULT 'daily',
    last_notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Inquiries Table
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    listing_key VARCHAR(255) NOT NULL,
    
    -- Contact Info (if no userId)
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    
    -- Inquiry Details
    inquiry_type VARCHAR(255),
    message TEXT NOT NULL,
    preferred_contact_method VARCHAR(255),
    
    -- Status
    status VARCHAR(255) DEFAULT 'new' NOT NULL,
    agent_notes TEXT,
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    contacted_at TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES public.users(id),
    FOREIGN KEY (listing_key) REFERENCES mls.properties(listing_key)
);

-- Appointments Table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    listing_key VARCHAR(255),
    
    -- Appointment Info
    appointment_type VARCHAR(255) NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    duration INTEGER DEFAULT 30 NOT NULL,
    location VARCHAR(255),
    
    -- Status
    status VARCHAR(255) DEFAULT 'scheduled' NOT NULL,
    notes TEXT,
    
    -- Agent Info
    agent_id VARCHAR(255),
    agent_notes TEXT,
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ==================== INDEXES ====================

-- Properties Indexes
CREATE INDEX idx_properties_standard_status ON mls.properties(standard_status);
CREATE INDEX idx_properties_property_type ON mls.properties(property_type);
CREATE INDEX idx_properties_city ON mls.properties(city);
CREATE INDEX idx_properties_state_or_province ON mls.properties(state_or_province);
CREATE INDEX idx_properties_postal_code ON mls.properties(postal_code);
CREATE INDEX idx_properties_list_price ON mls.properties(list_price);
CREATE INDEX idx_properties_bedrooms_total ON mls.properties(bedrooms_total);
CREATE INDEX idx_properties_bathrooms_total_integer ON mls.properties(bathrooms_total_integer);
CREATE INDEX idx_properties_modification_timestamp ON mls.properties(modification_timestamp);
CREATE INDEX idx_properties_mlg_can_view ON mls.properties(mlg_can_view);
CREATE INDEX idx_properties_list_agent_key ON mls.properties(list_agent_key);
CREATE INDEX idx_properties_list_office_key ON mls.properties(list_office_key);
CREATE INDEX idx_properties_on_market_date ON mls.properties(on_market_date);

-- Media Indexes
CREATE INDEX idx_media_resource_record_key ON mls.media(resource_record_key);
CREATE INDEX idx_media_resource_name ON mls.media(resource_name);
CREATE INDEX idx_media_media_type ON mls.media(media_type);
CREATE INDEX idx_media_media_category ON mls.media(media_category);
CREATE INDEX idx_media_order ON mls.media("order");

-- Rooms Indexes
CREATE INDEX idx_rooms_listing_key ON mls.rooms(listing_key);
CREATE INDEX idx_rooms_room_type ON mls.rooms(room_type);
CREATE INDEX idx_rooms_room_level ON mls.rooms(room_level);

-- Unit Types Indexes
CREATE INDEX idx_unit_types_listing_key ON mls.unit_types(listing_key);
CREATE INDEX idx_unit_types_unit_type_type ON mls.unit_types(unit_type_type);

-- Members Indexes
CREATE INDEX idx_members_member_status ON mls.members(member_status);
CREATE INDEX idx_members_member_type ON mls.members(member_type);
CREATE INDEX idx_members_office_key ON mls.members(office_key);
CREATE INDEX idx_members_modification_timestamp ON mls.members(modification_timestamp);
CREATE INDEX idx_members_mlg_can_view ON mls.members(mlg_can_view);

-- Offices Indexes
CREATE INDEX idx_offices_office_status ON mls.offices(office_status);
CREATE INDEX idx_offices_office_branch_type ON mls.offices(office_branch_type);
CREATE INDEX idx_offices_office_city ON mls.offices(office_city);
CREATE INDEX idx_offices_office_state_or_province ON mls.offices(office_state_or_province);
CREATE INDEX idx_offices_modification_timestamp ON mls.offices(modification_timestamp);
CREATE INDEX idx_offices_mlg_can_view ON mls.offices(mlg_can_view);

-- Open Houses Indexes
CREATE INDEX idx_open_houses_listing_key ON mls.open_houses(listing_key);
CREATE INDEX idx_open_houses_open_house_date ON mls.open_houses(open_house_date);
CREATE INDEX idx_open_houses_open_house_start_time ON mls.open_houses(open_house_start_time);
CREATE INDEX idx_open_houses_open_house_status ON mls.open_houses(open_house_status);
CREATE INDEX idx_open_houses_modification_timestamp ON mls.open_houses(modification_timestamp);
CREATE INDEX idx_open_houses_mlg_can_view ON mls.open_houses(mlg_can_view);

-- Sync Logs Indexes
CREATE INDEX idx_sync_logs_resource_type ON mls.sync_logs(resource_type);
CREATE INDEX idx_sync_logs_sync_type ON mls.sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON mls.sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON mls.sync_logs(started_at);

-- Users Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- User Favorites Indexes
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_listing_key ON public.user_favorites(listing_key);

-- Saved Searches Indexes
CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_notify_on_new_listings ON public.saved_searches(notify_on_new_listings);

-- Inquiries Indexes
CREATE INDEX idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX idx_inquiries_listing_key ON public.inquiries(listing_key);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_created_at ON public.inquiries(created_at);

-- Appointments Indexes
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_listing_key ON public.appointments(listing_key);
CREATE INDEX idx_appointments_appointment_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ==================== TRIGGERS FOR UPDATED_AT ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON mls.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON mls.media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON mls.rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unit_types_updated_at BEFORE UPDATE ON mls.unit_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON mls.members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offices_updated_at BEFORE UPDATE ON mls.offices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_open_houses_updated_at BEFORE UPDATE ON mls.open_houses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();







SELECT * FROM mls.properties

TRUNCATE TABLE mls.properties RESTART IDENTITY CASCADE;

ALTER TABLE mls.properties ALTER COLUMN bathrooms_total_integer TYPE DOUBLE PRECISION;

ALTER TABLE mls.properties ALTER COLUMN bathrooms_total_integer TYPE DOUBLE PRECISION;
ALTER TABLE mls.properties ALTER COLUMN bathrooms_full TYPE DOUBLE PRECISION;
ALTER TABLE mls.properties ALTER COLUMN bathrooms_half TYPE DOUBLE PRECISION;
ALTER TABLE mls.properties ALTER COLUMN bathrooms_one_quarter TYPE DOUBLE PRECISION;
ALTER TABLE mls.properties ALTER COLUMN bathrooms_three_quarter TYPE DOUBLE PRECISION;
ALTER TABLE mls.properties ALTER COLUMN garage_spaces TYPE DOUBLE PRECISION;
ALTER TABLE mls.properties ALTER COLUMN parking_total TYPE DOUBLE PRECISION;
ALTER TABLE mls.properties ALTER COLUMN bedrooms_total TYPE DOUBLE PRECISION;







-- Migration: Fix media table to support multiple resource types
BEGIN;

-- Remove the restrictive foreign key that only allows properties
ALTER TABLE mls.media 
DROP CONSTRAINT IF EXISTS media_resource_record_key_fkey;

-- Add a check constraint to ensure only valid resource types
ALTER TABLE mls.media
ADD CONSTRAINT check_resource_name 
CHECK (resource_name IN ('Property', 'Member', 'Office', 'OpenHouse'));

-- Add composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_media_resource 
ON mls.media(resource_record_key, resource_name);

-- Add index on resource_name for filtering
CREATE INDEX IF NOT EXISTS idx_media_resource_name
ON mls.media(resource_name);

-- Add index on media_key if not already primary key
CREATE INDEX IF NOT EXISTS idx_media_key
ON mls.media(media_key);

COMMIT;

-- Verify the changes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'media' 
    AND tc.table_schema = 'mls';
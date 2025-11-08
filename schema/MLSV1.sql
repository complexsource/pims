-- ==================================================================================
-- MLS (Multiple Listing Service) Real Estate Database Schema
-- ==================================================================================
-- Version: 2.0
-- Description: Complete database schema for MLS property management system
-- Features: 
--   - Two-schema architecture (mls + public)
--   - Comprehensive property, media, and user management
--   - Automated timestamp triggers
--   - Proper indexing for performance
--   - Referential integrity with cascading deletes
-- ==================================================================================

-- ==================== CLEANUP SECTION ====================
-- Drop everything in reverse order of dependencies to avoid errors

-- Drop triggers first
DROP TRIGGER IF EXISTS update_properties_updated_at ON mls.properties CASCADE;
DROP TRIGGER IF EXISTS update_media_updated_at ON mls.media CASCADE;
DROP TRIGGER IF EXISTS update_rooms_updated_at ON mls.rooms CASCADE;
DROP TRIGGER IF EXISTS update_unit_types_updated_at ON mls.unit_types CASCADE;
DROP TRIGGER IF EXISTS update_members_updated_at ON mls.members CASCADE;
DROP TRIGGER IF EXISTS update_offices_updated_at ON mls.offices CASCADE;
DROP TRIGGER IF EXISTS update_open_houses_updated_at ON mls.open_houses CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;
DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON public.saved_searches CASCADE;
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries CASCADE;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop public schema tables (child tables first due to foreign keys)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.saved_searches CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop mls schema tables (child tables first)
DROP TABLE IF EXISTS mls.sync_logs CASCADE;
DROP TABLE IF EXISTS mls.open_houses CASCADE;
DROP TABLE IF EXISTS mls.offices CASCADE;
DROP TABLE IF EXISTS mls.members CASCADE;
DROP TABLE IF EXISTS mls.unit_types CASCADE;
DROP TABLE IF EXISTS mls.rooms CASCADE;
DROP TABLE IF EXISTS mls.media CASCADE;
DROP TABLE IF EXISTS mls.properties CASCADE;

-- Drop schemas (will fail if not empty, which is fine as safety check)
-- DROP SCHEMA IF EXISTS mls CASCADE;
-- DROP SCHEMA IF EXISTS public CASCADE;

-- Note: We don't drop extensions or schemas completely to preserve other database objects
-- If you need a complete cleanup, uncomment the CASCADE drops above

-- ==================== SCHEMA CREATION ====================

-- Create schemas
CREATE SCHEMA IF NOT EXISTS mls;
-- public schema already exists by default in PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search if needed

-- ==================== MLS SCHEMA TABLES ====================

-- Properties Table - Core property listings
CREATE TABLE mls.properties (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_key VARCHAR(255) UNIQUE NOT NULL,
    listing_id VARCHAR(255),
    
    -- Basic Info
    standard_status VARCHAR(100),
    property_type VARCHAR(100),
    property_sub_type VARCHAR(100),
    
    -- Pricing
    list_price NUMERIC(15,2), -- Changed from DOUBLE PRECISION for better precision
    original_list_price NUMERIC(15,2),
    close_price NUMERIC(15,2),
    
    -- Location
    unparsed_address TEXT,
    street_number VARCHAR(50),
    street_name VARCHAR(255),
    street_suffix VARCHAR(50),
    unit_number VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state_or_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    county_or_parish VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    latitude NUMERIC(10,8), -- Better precision for coordinates
    longitude NUMERIC(11,8),
    
    -- Property Details
    bedrooms_total NUMERIC(5,2), -- Allows for fractional bedrooms
    bathrooms_total_integer NUMERIC(5,2),
    bathrooms_full NUMERIC(5,2),
    bathrooms_half NUMERIC(5,2),
    bathrooms_one_quarter NUMERIC(5,2),
    bathrooms_three_quarter NUMERIC(5,2),
    
    -- Area/Size
    living_area NUMERIC(10,2),
    living_area_units VARCHAR(50) DEFAULT 'Square Feet',
    lot_size_area NUMERIC(12,2),
    lot_size_square_feet NUMERIC(12,2),
    lot_size_acres NUMERIC(10,4),
    
    -- Building Info
    year_built INTEGER CHECK (year_built >= 1600 AND year_built <= EXTRACT(YEAR FROM CURRENT_DATE) + 5),
    stories_total NUMERIC(5,2),
    architectural_style VARCHAR(100),
    construction_materials TEXT,
    roof_type VARCHAR(100),
    
    -- Parking
    parking_features TEXT,
    parking_total NUMERIC(5,2),
    garage_spaces NUMERIC(5,2),
    garage_yn BOOLEAN DEFAULT false,
    
    -- Utilities & Systems
    heating TEXT,
    cooling TEXT,
    appliances TEXT,
    
    -- Interior Features
    flooring TEXT,
    interior_features TEXT,
    fireplace_features TEXT,
    fireplace_yn BOOLEAN DEFAULT false,
    
    -- Exterior Features
    exterior_features TEXT,
    lot_features TEXT,
    pool_features TEXT,
    pool_yn BOOLEAN DEFAULT false,
    
    -- Financial
    tax_annual_amount NUMERIC(12,2),
    tax_year INTEGER CHECK (tax_year >= 1900 AND tax_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    association_fee NUMERIC(10,2),
    association_fee_frequency VARCHAR(50),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    originating_system_name VARCHAR(255),
    originating_system_key VARCHAR(255),
    
    -- Listing Details - Agents and Offices
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
    modification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    originating_system_modification_timestamp TIMESTAMP WITH TIME ZONE,
    on_market_date TIMESTAMP WITH TIME ZONE,
    off_market_date TIMESTAMP WITH TIME ZONE,
    listing_contract_date TIMESTAMP WITH TIME ZONE,
    purchase_contract_date TIMESTAMP WITH TIME ZONE,
    close_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Showing Info
    showing_instructions TEXT,
    showing_contact_name VARCHAR(255),
    showing_contact_phone VARCHAR(50),
    
    -- Descriptions
    public_remarks TEXT,
    private_remarks TEXT,
    
    -- Virtual Tour
    virtual_tour_url_unbranded VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT check_list_price CHECK (list_price >= 0),
    CONSTRAINT check_close_price CHECK (close_price >= 0),
    CONSTRAINT check_bedrooms CHECK (bedrooms_total >= 0),
    CONSTRAINT check_bathrooms CHECK (bathrooms_total_integer >= 0)
);

-- Add table comment
COMMENT ON TABLE mls.properties IS 'Core MLS property listings table containing all property information';

-- Media Table - Property images, videos, and documents
CREATE TABLE mls.media (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Resource Association (flexible to support multiple resource types)
    resource_record_key VARCHAR(255) NOT NULL,
    resource_name VARCHAR(50) NOT NULL CHECK (resource_name IN ('Property', 'Member', 'Office', 'OpenHouse')),
    
    -- Media Info
    media_url VARCHAR(1000) NOT NULL,
    media_type VARCHAR(50),
    media_category VARCHAR(100),
    media_object_id VARCHAR(255),
    "order" INTEGER DEFAULT 0,
    
    -- Descriptions
    short_description VARCHAR(500),
    long_description TEXT,
    
    -- Image Specific
    image_width INTEGER CHECK (image_width > 0),
    image_height INTEGER CHECK (image_height > 0),
    image_size INTEGER CHECK (image_size > 0),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    originating_system_name VARCHAR(255),
    
    -- Dates
    modification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE mls.media IS 'Media assets (images, videos, documents) associated with MLS resources';

-- Rooms Table - Individual room details
CREATE TABLE mls.rooms (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_key VARCHAR(255) NOT NULL,
    
    -- Room Info
    room_type VARCHAR(100),
    room_level VARCHAR(50),
    room_length NUMERIC(10,2) CHECK (room_length > 0),
    room_width NUMERIC(10,2) CHECK (room_width > 0),
    room_area NUMERIC(10,2) CHECK (room_area > 0),
    room_dimensions VARCHAR(100),
    room_features TEXT,
    room_description TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    CONSTRAINT fk_rooms_property FOREIGN KEY (listing_key) 
        REFERENCES mls.properties(listing_key) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

COMMENT ON TABLE mls.rooms IS 'Detailed room information for multi-room properties';

-- Unit Types Table - For multi-unit properties
CREATE TABLE mls.unit_types (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_key VARCHAR(255) NOT NULL,
    
    -- Unit Info
    unit_type_type VARCHAR(100),
    unit_number VARCHAR(50),
    bedrooms_total INTEGER CHECK (bedrooms_total >= 0),
    bathrooms_total_integer INTEGER CHECK (bathrooms_total_integer >= 0),
    unit_type_area NUMERIC(10,2) CHECK (unit_type_area > 0),
    unit_type_rent NUMERIC(10,2) CHECK (unit_type_rent >= 0),
    unit_type_lease_type VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    CONSTRAINT fk_unit_types_property FOREIGN KEY (listing_key) 
        REFERENCES mls.properties(listing_key) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

COMMENT ON TABLE mls.unit_types IS 'Unit type information for multi-unit properties (apartments, condos)';

-- Members Table - Real estate agents/brokers
CREATE TABLE mls.members (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_key VARCHAR(255) UNIQUE NOT NULL,
    member_mls_id VARCHAR(255) UNIQUE,
    
    -- Personal Info
    member_first_name VARCHAR(100),
    member_middle_name VARCHAR(100),
    member_last_name VARCHAR(100),
    member_full_name VARCHAR(255),
    member_name_suffix VARCHAR(20),
    
    -- Contact Info
    member_email VARCHAR(255),
    member_mobile_phone VARCHAR(50),
    member_office_phone VARCHAR(50),
    member_home_phone VARCHAR(50),
    member_pager VARCHAR(50),
    member_fax VARCHAR(50),
    
    -- Office Association
    office_key VARCHAR(255),
    office_mls_id VARCHAR(255),
    office_name VARCHAR(255),
    
    -- Address Info
    member_city VARCHAR(100),
    member_state_or_province VARCHAR(100),
    member_postal_code VARCHAR(20),
    
    -- Status & Type
    member_status VARCHAR(50),
    member_type VARCHAR(50),
    member_designation VARCHAR(255),
    member_aor VARCHAR(255),
    member_aor_mls_id VARCHAR(255),
    job_title VARCHAR(100),
    
    -- Languages
    member_languages VARCHAR(255),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    mlg_can_use VARCHAR(255),
    originating_system_name VARCHAR(255),
    originating_system_id VARCHAR(255),
    
    -- Dates
    original_entry_timestamp TIMESTAMP WITH TIME ZONE,
    modification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    photos_change_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT check_member_email CHECK (member_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE mls.members IS 'Real estate agents and brokers registered in the MLS system';

-- Offices Table - Real estate offices/brokerages
CREATE TABLE mls.offices (
    -- Primary Key
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
    office_phone VARCHAR(50),
    office_fax VARCHAR(50),
    
    -- Address
    office_address1 VARCHAR(255),
    office_address2 VARCHAR(255),
    office_city VARCHAR(100),
    office_state_or_province VARCHAR(100),
    office_postal_code VARCHAR(20),
    
    -- Status & Type
    office_status VARCHAR(50),
    office_branch_type VARCHAR(50),
    
    -- IDX & Syndication
    idx_office_participation_yn BOOLEAN,
    syndicate_to TEXT,
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    mlg_can_use VARCHAR(255),
    originating_system_name VARCHAR(255),
    originating_system_id VARCHAR(255),
    originating_system_office_key VARCHAR(255),
    
    -- Dates
    modification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    photos_change_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT check_office_email CHECK (office_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE mls.offices IS 'Real estate offices and brokerages in the MLS system';

-- Open Houses Table - Scheduled open house events
CREATE TABLE mls.open_houses (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    open_house_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Property Reference
    listing_key VARCHAR(255) NOT NULL,
    listing_id VARCHAR(255),
    open_house_id VARCHAR(255),
    
    -- Date/Time
    open_house_date DATE,
    open_house_start_time TIMESTAMP WITH TIME ZONE,
    open_house_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Details
    open_house_type VARCHAR(100),
    open_house_status VARCHAR(50),
    open_house_remarks TEXT,
    refreshments VARCHAR(255),
    
    -- MLS Info
    mlg_can_view BOOLEAN DEFAULT true NOT NULL,
    mlg_can_use VARCHAR(255),
    originating_system_name VARCHAR(255),
    
    -- Dates
    modification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    CONSTRAINT fk_open_houses_property FOREIGN KEY (listing_key) 
        REFERENCES mls.properties(listing_key) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT check_open_house_times CHECK (open_house_end_time > open_house_start_time)
);

COMMENT ON TABLE mls.open_houses IS 'Scheduled open house events for properties';

-- Sync Logs Table - Track data synchronization operations
CREATE TABLE mls.sync_logs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Sync Info
    resource_type VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
    
    -- Statistics
    records_processed INTEGER DEFAULT 0 NOT NULL CHECK (records_processed >= 0),
    records_created INTEGER DEFAULT 0 NOT NULL CHECK (records_created >= 0),
    records_updated INTEGER DEFAULT 0 NOT NULL CHECK (records_updated >= 0),
    records_deleted INTEGER DEFAULT 0 NOT NULL CHECK (records_deleted >= 0),
    
    -- Timing
    last_modification_timestamp TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER CHECK (duration_seconds >= 0),
    
    -- Error Handling
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT check_sync_completion CHECK (
        (status IN ('pending', 'running') AND completed_at IS NULL) OR
        (status IN ('completed', 'failed', 'partial') AND completed_at IS NOT NULL)
    )
);

COMMENT ON TABLE mls.sync_logs IS 'Audit log for data synchronization operations from external MLS sources';

-- ==================== PUBLIC SCHEMA TABLES ====================

-- Users Table - Application users
CREATE TABLE public.users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Should be hashed (bcrypt/argon2)
    
    -- Personal Info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar VARCHAR(500),
    
    -- Account Info
    role VARCHAR(50) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'agent', 'admin', 'superadmin')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_email_verified BOOLEAN DEFAULT false NOT NULL,
    
    -- Preferences
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE public.users IS 'Application users including buyers, sellers, and agents';

-- User Favorites Table - Saved property listings
CREATE TABLE public.user_favorites (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    user_id UUID NOT NULL,
    listing_key VARCHAR(255) NOT NULL,
    
    -- Additional Info
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_favorites_property FOREIGN KEY (listing_key) 
        REFERENCES mls.properties(listing_key) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT unique_user_favorite UNIQUE (user_id, listing_key)
);

COMMENT ON TABLE public.user_favorites IS 'Properties saved by users as favorites';

-- Saved Searches Table - User search criteria with notifications
CREATE TABLE public.saved_searches (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    user_id UUID NOT NULL,
    
    -- Search Info
    search_name VARCHAR(255) NOT NULL,
    search_criteria JSONB NOT NULL,
    
    -- Notifications
    notify_on_new_listings BOOLEAN DEFAULT false NOT NULL,
    frequency VARCHAR(50) DEFAULT 'daily' CHECK (frequency IN ('realtime', 'daily', 'weekly', 'never')),
    last_notified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key
    CONSTRAINT fk_saved_searches_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

COMMENT ON TABLE public.saved_searches IS 'Saved search criteria with optional email notifications for new listings';

-- Inquiries Table - User inquiries about properties
CREATE TABLE public.inquiries (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    user_id UUID,
    listing_key VARCHAR(255) NOT NULL,
    
    -- Contact Info (for non-registered users)
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Inquiry Details
    inquiry_type VARCHAR(50) CHECK (inquiry_type IN ('showing', 'information', 'offer', 'general')),
    message TEXT NOT NULL,
    preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN ('email', 'phone', 'text', 'any')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'contacted', 'in_progress', 'closed', 'spam')),
    agent_notes TEXT,
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    contacted_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign Keys
    CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT fk_inquiries_property FOREIGN KEY (listing_key) 
        REFERENCES mls.properties(listing_key) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT check_inquiry_contact CHECK (
        (user_id IS NOT NULL) OR 
        (name IS NOT NULL AND email IS NOT NULL)
    ),
    CONSTRAINT check_email_format_inquiry CHECK (
        email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

COMMENT ON TABLE public.inquiries IS 'User inquiries and questions about specific properties';

-- Appointments Table - Scheduled property viewings
CREATE TABLE public.appointments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    user_id UUID NOT NULL,
    listing_key VARCHAR(255),
    
    -- Appointment Info
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('showing', 'inspection', 'consultation', 'meeting')),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30 NOT NULL CHECK (duration > 0 AND duration <= 480),
    location VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    
    -- Agent Info
    agent_id VARCHAR(255),
    agent_notes TEXT,
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_property FOREIGN KEY (listing_key) 
        REFERENCES mls.properties(listing_key) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

COMMENT ON TABLE public.appointments IS 'Scheduled appointments for property viewings and consultations';

-- ==================== INDEXES ====================

-- Properties Indexes (optimized for common queries)
CREATE INDEX idx_properties_standard_status ON mls.properties(standard_status) WHERE mlg_can_view = true;
CREATE INDEX idx_properties_property_type ON mls.properties(property_type) WHERE mlg_can_view = true;
CREATE INDEX idx_properties_location ON mls.properties(city, state_or_province, postal_code) WHERE mlg_can_view = true;
CREATE INDEX idx_properties_city ON mls.properties(city) WHERE mlg_can_view = true;
CREATE INDEX idx_properties_state_or_province ON mls.properties(state_or_province) WHERE mlg_can_view = true;
CREATE INDEX idx_properties_postal_code ON mls.properties(postal_code) WHERE mlg_can_view = true;
CREATE INDEX idx_properties_price_range ON mls.properties(list_price) WHERE mlg_can_view = true AND list_price IS NOT NULL;
CREATE INDEX idx_properties_bedrooms ON mls.properties(bedrooms_total) WHERE mlg_can_view = true AND bedrooms_total IS NOT NULL;
CREATE INDEX idx_properties_bathrooms ON mls.properties(bathrooms_total_integer) WHERE mlg_can_view = true AND bathrooms_total_integer IS NOT NULL;
CREATE INDEX idx_properties_coordinates ON mls.properties(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_properties_modification_timestamp ON mls.properties(modification_timestamp DESC);
CREATE INDEX idx_properties_mlg_can_view ON mls.properties(mlg_can_view);
CREATE INDEX idx_properties_list_agent_key ON mls.properties(list_agent_key);
CREATE INDEX idx_properties_list_office_key ON mls.properties(list_office_key);
CREATE INDEX idx_properties_on_market_date ON mls.properties(on_market_date DESC) WHERE on_market_date IS NOT NULL;
CREATE INDEX idx_properties_year_built ON mls.properties(year_built) WHERE year_built IS NOT NULL;

-- Full-text search index for property descriptions
CREATE INDEX idx_properties_public_remarks_fts ON mls.properties USING gin(to_tsvector('english', public_remarks)) WHERE public_remarks IS NOT NULL;

-- Media Indexes
CREATE INDEX idx_media_resource_lookup ON mls.media(resource_record_key, resource_name, "order");
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
CREATE INDEX idx_members_modification_timestamp ON mls.members(modification_timestamp DESC);
CREATE INDEX idx_members_mlg_can_view ON mls.members(mlg_can_view);
CREATE INDEX idx_members_full_name ON mls.members(member_full_name) WHERE member_full_name IS NOT NULL;

-- Offices Indexes
CREATE INDEX idx_offices_office_status ON mls.offices(office_status);
CREATE INDEX idx_offices_office_branch_type ON mls.offices(office_branch_type);
CREATE INDEX idx_offices_location ON mls.offices(office_city, office_state_or_province);
CREATE INDEX idx_offices_office_city ON mls.offices(office_city);
CREATE INDEX idx_offices_office_state_or_province ON mls.offices(office_state_or_province);
CREATE INDEX idx_offices_modification_timestamp ON mls.offices(modification_timestamp DESC);
CREATE INDEX idx_offices_mlg_can_view ON mls.offices(mlg_can_view);

-- Open Houses Indexes
CREATE INDEX idx_open_houses_listing_key ON mls.open_houses(listing_key);
CREATE INDEX idx_open_houses_open_house_date ON mls.open_houses(open_house_date DESC);
CREATE INDEX idx_open_houses_open_house_start_time ON mls.open_houses(open_house_start_time DESC);
CREATE INDEX idx_open_houses_open_house_status ON mls.open_houses(open_house_status);
CREATE INDEX idx_open_houses_modification_timestamp ON mls.open_houses(modification_timestamp DESC);
CREATE INDEX idx_open_houses_mlg_can_view ON mls.open_houses(mlg_can_view);

-- Sync Logs Indexes
CREATE INDEX idx_sync_logs_resource_type ON mls.sync_logs(resource_type);
CREATE INDEX idx_sync_logs_sync_type ON mls.sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON mls.sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON mls.sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_resource_status ON mls.sync_logs(resource_type, status, started_at DESC);

-- Users Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_role_active ON public.users(role, is_active);

-- User Favorites Indexes
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_listing_key ON public.user_favorites(listing_key);
CREATE INDEX idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- Saved Searches Indexes
CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_notify ON public.saved_searches(notify_on_new_listings, frequency) WHERE notify_on_new_listings = true;

-- Inquiries Indexes
CREATE INDEX idx_inquiries_user_id ON public.inquiries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_inquiries_listing_key ON public.inquiries(listing_key);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX idx_inquiries_status_created ON public.inquiries(status, created_at DESC);

-- Appointments Indexes
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_listing_key ON public.appointments(listing_key) WHERE listing_key IS NOT NULL;
CREATE INDEX idx_appointments_appointment_date ON public.appointments(appointment_date DESC);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_status_date ON public.appointments(status, appointment_date) WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX idx_appointments_agent_id ON public.appointments(agent_id) WHERE agent_id IS NOT NULL;

-- ==================== FUNCTIONS ====================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column to the current timestamp';

-- Function to calculate duration for sync logs
CREATE OR REPLACE FUNCTION calculate_sync_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_sync_duration() IS 'Automatically calculates sync duration in seconds';

-- ==================== TRIGGERS ====================

-- Triggers for updated_at columns
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON mls.properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at 
    BEFORE UPDATE ON mls.media 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON mls.rooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unit_types_updated_at 
    BEFORE UPDATE ON mls.unit_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON mls.members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offices_updated_at 
    BEFORE UPDATE ON mls.offices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_open_houses_updated_at 
    BEFORE UPDATE ON mls.open_houses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at 
    BEFORE UPDATE ON public.saved_searches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at 
    BEFORE UPDATE ON public.inquiries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sync log duration calculation
CREATE TRIGGER calculate_sync_log_duration 
    BEFORE INSERT OR UPDATE ON mls.sync_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_sync_duration();

-- ==================== VIEWS ====================

-- View for active properties with primary photo
CREATE OR REPLACE VIEW mls.v_active_properties AS
SELECT 
    p.*,
    (
        SELECT m.media_url 
        FROM mls.media m 
        WHERE m.resource_record_key = p.listing_key 
            AND m.resource_name = 'Property' 
            AND m.media_category = 'Photo'
        ORDER BY m."order" 
        LIMIT 1
    ) AS primary_photo_url,
    (
        SELECT COUNT(*) 
        FROM mls.media m 
        WHERE m.resource_record_key = p.listing_key 
            AND m.resource_name = 'Property'
    ) AS media_count
FROM mls.properties p
WHERE p.mlg_can_view = true
    AND p.standard_status = 'Active';

COMMENT ON VIEW mls.v_active_properties IS 'Active properties with primary photo URL for quick listing displays';

-- View for property search with all important fields
CREATE OR REPLACE VIEW mls.v_property_search AS
SELECT 
    p.id,
    p.listing_key,
    p.listing_id,
    p.standard_status,
    p.property_type,
    p.property_sub_type,
    p.list_price,
    p.close_price,
    p.city,
    p.state_or_province,
    p.postal_code,
    p.bedrooms_total,
    p.bathrooms_total_integer,
    p.living_area,
    p.lot_size_square_feet,
    p.year_built,
    p.latitude,
    p.longitude,
    p.on_market_date,
    p.mlg_can_view,
    (
        SELECT m.media_url 
        FROM mls.media m 
        WHERE m.resource_record_key = p.listing_key 
            AND m.resource_name = 'Property' 
            AND m.media_category = 'Photo'
        ORDER BY m."order" 
        LIMIT 1
    ) AS primary_photo_url
FROM mls.properties p
WHERE p.mlg_can_view = true;

COMMENT ON VIEW mls.v_property_search IS 'Optimized view for property search functionality with essential fields';

-- ==================== GRANTS AND PERMISSIONS ====================
-- Uncomment and adjust these based on your application's user roles

-- GRANT USAGE ON SCHEMA mls TO app_user;
-- GRANT USAGE ON SCHEMA public TO app_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA mls TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA mls TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ==================== COMPLETION MESSAGE ====================
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'MLS Database Schema Installation Complete!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 2 Schemas (mls, public)';
    RAISE NOTICE '  - 14 Tables';
    RAISE NOTICE '  - 60+ Indexes';
    RAISE NOTICE '  - 11 Triggers';
    RAISE NOTICE '  - 2 Views';
    RAISE NOTICE '  - 2 Functions';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Review and adjust GRANT statements for your user roles';
    RAISE NOTICE '  2. Configure your application database connection';
    RAISE NOTICE '  3. Run any data migration scripts';
    RAISE NOTICE '  4. Test all functionality';
    RAISE NOTICE '=================================================================';
END $$;
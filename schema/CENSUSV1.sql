-- ==================================================================================
-- Census Data Database Schema
-- ==================================================================================
-- Version: 1.0
-- Description: Complete database schema for U.S. Census Bureau data management
-- Features: 
--   - Hybrid architecture (structured fields + JSONB storage)
--   - Flexible dataset metadata storage
--   - Comprehensive API link management
--   - Automated timestamp triggers
--   - Proper indexing for performance
-- ==================================================================================

-- ==================== CLEANUP SECTION ====================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_census_datasets_updated_at ON census.datasets CASCADE;
DROP TRIGGER IF EXISTS update_census_data_updated_at ON census.census_data CASCADE;
DROP TRIGGER IF EXISTS calculate_census_sync_duration ON census.sync_logs CASCADE;

-- Drop tables
DROP TABLE IF EXISTS census.census_data CASCADE;
DROP TABLE IF EXISTS census.sync_logs CASCADE;
DROP TABLE IF EXISTS census.datasets CASCADE;

-- Drop schema (commented out for safety)
-- DROP SCHEMA IF EXISTS census CASCADE;

-- ==================== SCHEMA CREATION ====================

-- Create census schema
CREATE SCHEMA IF NOT EXISTS census;

-- ==================== CENSUS SCHEMA TABLES ====================

-- Datasets Table - Census dataset catalog and metadata
CREATE TABLE census.datasets (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- ========== EXTRACTED KEY FIELDS (for fast queries) ==========
    
    -- Identifiers
    identifier VARCHAR(500) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    vintage INTEGER,
    dataset_path TEXT[],
    
    -- Status flags (extracted for filtering)
    is_microdata BOOLEAN DEFAULT false,
    is_cube BOOLEAN DEFAULT false,
    is_aggregate BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    
    -- API Links (extracted for easy access)
    api_endpoint VARCHAR(1000),
    geography_link VARCHAR(1000),
    variables_link VARCHAR(1000),
    tags_link VARCHAR(1000),
    examples_link VARCHAR(1000),
    groups_link VARCHAR(1000),
    sorts_link VARCHAR(1000),
    documentation_link VARCHAR(1000),
    
    -- Basic metadata (for search)
    description TEXT,
    keywords TEXT[],
    access_level VARCHAR(50),
    modified_date TIMESTAMP WITH TIME ZONE,
    
    -- Contact information
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    
    -- Distribution info
    distribution_format VARCHAR(100),
    distribution_media_type VARCHAR(100),
    
    -- Geographic and temporal coverage
    spatial VARCHAR(500),
    temporal VARCHAR(100),
    
    -- Administrative
    license VARCHAR(500),
    bureau_code TEXT[],
    program_code TEXT[],
    reference_urls TEXT[],
    
    -- ========== FULL JSON STORAGE (complete data) ==========
    
    -- Store COMPLETE responses from each link
    geography_data JSONB,
    variables_data JSONB,
    tags_data JSONB,
    examples_data JSONB,
    groups_data JSONB,
    sorts_data JSONB,
    
    -- Store original dataset metadata (complete record from data.json)
    raw_metadata JSONB NOT NULL,
    
    -- Publisher information
    publisher_data JSONB,
    
    -- Contact point information
    contact_point_data JSONB,
    
    -- ========== METADATA ==========
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync status flags
    geography_synced BOOLEAN DEFAULT false,
    variables_synced BOOLEAN DEFAULT false,
    tags_synced BOOLEAN DEFAULT false,
    examples_synced BOOLEAN DEFAULT false,
    groups_synced BOOLEAN DEFAULT false,
    sorts_synced BOOLEAN DEFAULT false,
    
    -- ========== CONSTRAINTS ==========
    CONSTRAINT check_vintage CHECK (vintage IS NULL OR (vintage >= 1900 AND vintage <= EXTRACT(YEAR FROM CURRENT_DATE) + 5)),
    CONSTRAINT check_contact_email CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE census.datasets IS 'Census datasets with hybrid storage: key fields extracted + complete JSON data';
COMMENT ON COLUMN census.datasets.geography_data IS 'Complete JSON response from c_geographyLink endpoint';
COMMENT ON COLUMN census.datasets.variables_data IS 'Complete JSON response from c_variablesLink endpoint';
COMMENT ON COLUMN census.datasets.tags_data IS 'Complete JSON response from c_tagsLink endpoint';
COMMENT ON COLUMN census.datasets.examples_data IS 'Complete JSON response from c_examplesLink endpoint';
COMMENT ON COLUMN census.datasets.groups_data IS 'Complete JSON response from c_groupsLink endpoint';
COMMENT ON COLUMN census.datasets.sorts_data IS 'Complete JSON response from c_sorts_url endpoint';
COMMENT ON COLUMN census.datasets.raw_metadata IS 'Original dataset record from catalog API';

-- Census Data Table - Store actual census data retrieved from API queries
CREATE TABLE census.census_data (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to dataset
    dataset_id UUID NOT NULL REFERENCES census.datasets(id) ON DELETE CASCADE,
    
    -- Query parameters used (for cache/lookup)
    query_params JSONB NOT NULL,
    query_hash VARCHAR(64) UNIQUE NOT NULL, -- MD5 hash of query for quick lookup
    
    -- Geography identifiers (extracted for indexing)
    geography_level VARCHAR(100),
    geography_code VARCHAR(100),
    
    -- Data year (if applicable)
    data_year INTEGER,
    
    -- Store the complete API response
    api_response JSONB NOT NULL,
    
    -- Parsed data for easier access (normalized structure)
    data_values JSONB,
    
    -- Response metadata
    response_size_bytes INTEGER,
    response_time_ms INTEGER,
    
    -- Cache control
    cache_expires_at TIMESTAMP WITH TIME ZONE,
    is_cached BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT check_response_size CHECK (response_size_bytes >= 0),
    CONSTRAINT check_response_time CHECK (response_time_ms >= 0)
);

COMMENT ON TABLE census.census_data IS 'Actual census data retrieved from API queries with caching';
COMMENT ON COLUMN census.census_data.api_response IS 'Complete API response from census data query';
COMMENT ON COLUMN census.census_data.data_values IS 'Parsed and normalized data values';
COMMENT ON COLUMN census.census_data.query_hash IS 'MD5 hash of query_params for quick lookups';

-- Sync Logs Table - Track synchronization operations
CREATE TABLE census.sync_logs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Sync details
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('catalog', 'metadata', 'data', 'full', 'incremental')),
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('datasets', 'geography', 'variables', 'tags', 'examples', 'groups', 'sorts', 'data', 'all')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial', 'paused', 'rate_limit_exceeded')),
    
    -- Optional: link to specific dataset if syncing one dataset
    dataset_id UUID REFERENCES census.datasets(id) ON DELETE SET NULL,
    
    -- Statistics
    records_processed INTEGER DEFAULT 0 CHECK (records_processed >= 0),
    records_created INTEGER DEFAULT 0 CHECK (records_created >= 0),
    records_updated INTEGER DEFAULT 0 CHECK (records_updated >= 0),
    records_failed INTEGER DEFAULT 0 CHECK (records_failed >= 0),
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER CHECK (duration_seconds >= 0),
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    
    -- Progress tracking
    current_page INTEGER,
    total_pages INTEGER,
    progress_percentage NUMERIC(5,2),
    
    -- Rate limit tracking
    api_calls_made INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT check_sync_completion CHECK (
        (status IN ('pending', 'running') AND completed_at IS NULL) OR
        (status IN ('completed', 'failed', 'partial', 'paused', 'rate_limit_exceeded') AND completed_at IS NOT NULL)
    ),
    CONSTRAINT check_progress CHECK (progress_percentage IS NULL OR (progress_percentage >= 0 AND progress_percentage <= 100))
);

COMMENT ON TABLE census.sync_logs IS 'Audit log for census data synchronization operations';

-- ==================== INDEXES ====================

-- Datasets - Structured fields (fast filtering)
CREATE INDEX idx_census_datasets_vintage ON census.datasets(vintage) WHERE vintage IS NOT NULL;
CREATE INDEX idx_census_datasets_is_available ON census.datasets(is_available) WHERE is_available = true;
CREATE INDEX idx_census_datasets_dataset_path ON census.datasets USING gin(dataset_path);
CREATE INDEX idx_census_datasets_keywords ON census.datasets USING gin(keywords);
CREATE INDEX idx_census_datasets_modified_date ON census.datasets(modified_date DESC) WHERE modified_date IS NOT NULL;
CREATE INDEX idx_census_datasets_identifier ON census.datasets(identifier);
CREATE INDEX idx_census_datasets_is_microdata ON census.datasets(is_microdata) WHERE is_microdata = true;
CREATE INDEX idx_census_datasets_is_aggregate ON census.datasets(is_aggregate) WHERE is_aggregate = true;

-- Datasets - Sync status
CREATE INDEX idx_census_datasets_sync_status ON census.datasets(geography_synced, variables_synced, tags_synced);
CREATE INDEX idx_census_datasets_last_synced ON census.datasets(last_synced_at DESC NULLS LAST);

-- Datasets - JSON fields (searching within JSON)
CREATE INDEX idx_census_datasets_raw_metadata ON census.datasets USING gin(raw_metadata);
CREATE INDEX idx_census_datasets_variables_data ON census.datasets USING gin(variables_data) WHERE variables_data IS NOT NULL;
CREATE INDEX idx_census_datasets_geography_data ON census.datasets USING gin(geography_data) WHERE geography_data IS NOT NULL;
CREATE INDEX idx_census_datasets_tags_data ON census.datasets USING gin(tags_data) WHERE tags_data IS NOT NULL;
CREATE INDEX idx_census_datasets_groups_data ON census.datasets USING gin(groups_data) WHERE groups_data IS NOT NULL;

-- Full-text search on description and title
CREATE INDEX idx_census_datasets_description_fts ON census.datasets USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;
CREATE INDEX idx_census_datasets_title_fts ON census.datasets USING gin(to_tsvector('english', title));

-- Census data indexes
CREATE INDEX idx_census_data_dataset_id ON census.census_data(dataset_id);
CREATE INDEX idx_census_data_geography ON census.census_data(geography_level, geography_code);
CREATE INDEX idx_census_data_year ON census.census_data(data_year) WHERE data_year IS NOT NULL;
CREATE INDEX idx_census_data_query_hash ON census.census_data(query_hash);
CREATE INDEX idx_census_data_query_params ON census.census_data USING gin(query_params);
CREATE INDEX idx_census_data_values ON census.census_data USING gin(data_values) WHERE data_values IS NOT NULL;
CREATE INDEX idx_census_data_cache_expires ON census.census_data(cache_expires_at) WHERE is_cached = true;
CREATE INDEX idx_census_data_created_at ON census.census_data(created_at DESC);

-- Sync logs indexes
CREATE INDEX idx_census_sync_logs_sync_type ON census.sync_logs(sync_type);
CREATE INDEX idx_census_sync_logs_resource_type ON census.sync_logs(resource_type);
CREATE INDEX idx_census_sync_logs_status ON census.sync_logs(status);
CREATE INDEX idx_census_sync_logs_started_at ON census.sync_logs(started_at DESC);
CREATE INDEX idx_census_sync_logs_dataset_id ON census.sync_logs(dataset_id) WHERE dataset_id IS NOT NULL;
CREATE INDEX idx_census_sync_logs_resource_status ON census.sync_logs(resource_type, status, started_at DESC);

-- ==================== TRIGGERS ====================

CREATE TRIGGER update_census_datasets_updated_at 
    BEFORE UPDATE ON census.datasets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_census_data_updated_at 
    BEFORE UPDATE ON census.census_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_census_sync_duration 
    BEFORE INSERT OR UPDATE ON census.sync_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_sync_duration();

-- ==================== HELPER VIEWS ====================

-- View for quick dataset lookup with sync status
CREATE OR REPLACE VIEW census.v_datasets_summary AS
SELECT 
    id,
    identifier,
    title,
    vintage,
    dataset_path,
    is_available,
    is_microdata,
    is_cube,
    is_aggregate,
    description,
    api_endpoint,
    CASE 
        WHEN variables_data IS NOT NULL THEN true 
        ELSE false 
    END AS has_variables,
    CASE 
        WHEN geography_data IS NOT NULL THEN true 
        ELSE false 
    END AS has_geography,
    CASE 
        WHEN tags_data IS NOT NULL THEN true 
        ELSE false 
    END AS has_tags,
    CASE 
        WHEN groups_data IS NOT NULL THEN true 
        ELSE false 
    END AS has_groups,
    geography_synced,
    variables_synced,
    tags_synced,
    examples_synced,
    groups_synced,
    modified_date,
    last_synced_at,
    created_at
FROM census.datasets
WHERE is_available = true
ORDER BY vintage DESC NULLS LAST, title;

COMMENT ON VIEW census.v_datasets_summary IS 'Quick summary view of available datasets with sync status';

-- View for sync statistics
CREATE OR REPLACE VIEW census.v_sync_statistics AS
SELECT 
    resource_type,
    sync_type,
    COUNT(*) as total_syncs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_syncs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_syncs,
    SUM(records_processed) as total_records_processed,
    SUM(records_created) as total_records_created,
    SUM(records_updated) as total_records_updated,
    AVG(duration_seconds) as avg_duration_seconds,
    MAX(started_at) as last_sync_time
FROM census.sync_logs
GROUP BY resource_type, sync_type
ORDER BY resource_type, sync_type;

COMMENT ON VIEW census.v_sync_statistics IS 'Aggregated sync statistics by resource and sync type';

-- ==================== USEFUL FUNCTIONS ====================

-- Function to extract variable names from variables_data JSONB
CREATE OR REPLACE FUNCTION census.get_variable_names(dataset_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
    var_names TEXT[];
BEGIN
    SELECT ARRAY_AGG(key)
    INTO var_names
    FROM census.datasets,
         LATERAL jsonb_object_keys(variables_data->'variables') AS key
    WHERE id = dataset_uuid
      AND variables_data IS NOT NULL;
    
    RETURN COALESCE(var_names, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION census.get_variable_names IS 'Extract all variable names from a dataset';

-- Function to search datasets by tag
CREATE OR REPLACE FUNCTION census.search_by_tag(tag_name TEXT)
RETURNS TABLE(dataset_id UUID, title TEXT, vintage INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.vintage
    FROM census.datasets d
    WHERE d.tags_data IS NOT NULL
      AND d.tags_data->'tags' @> to_jsonb(tag_name::text);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION census.search_by_tag IS 'Search datasets by tag name';

-- Function to get geography levels for a dataset
CREATE OR REPLACE FUNCTION census.get_geography_levels(dataset_uuid UUID)
RETURNS TABLE(name VARCHAR, geo_level_id VARCHAR, limit_value VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (fips->>'name')::VARCHAR as name,
        (fips->>'geoLevelId')::VARCHAR as geo_level_id,
        (fips->>'limit')::VARCHAR as limit_value
    FROM census.datasets,
         LATERAL jsonb_array_elements(geography_data->'fips') AS fips
    WHERE id = dataset_uuid
      AND geography_data IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION census.get_geography_levels IS 'Get all available geography levels for a dataset';

-- Function to generate query hash
CREATE OR REPLACE FUNCTION census.generate_query_hash(query_json JSONB)
RETURNS VARCHAR AS $$
BEGIN
    RETURN MD5(query_json::TEXT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION census.generate_query_hash IS 'Generate MD5 hash for query parameters';

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION census.clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM census.census_data
    WHERE is_cached = true
      AND cache_expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION census.clean_expired_cache IS 'Delete expired cached census data and return count of deleted rows';

-- ==================== COMPLETION MESSAGE ====================
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Census Database Schema Installation Complete!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 1 Schema (census)';
    RAISE NOTICE '  - 3 Tables (datasets, census_data, sync_logs)';
    RAISE NOTICE '  - 25+ Indexes';
    RAISE NOTICE '  - 3 Triggers';
    RAISE NOTICE '  - 2 Views';
    RAISE NOTICE '  - 6 Helper Functions';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Run the Census data importer';
    RAISE NOTICE '  2. Test dataset catalog sync';
    RAISE NOTICE '  3. Test metadata sync for individual datasets';
    RAISE NOTICE '=================================================================';
END $$;
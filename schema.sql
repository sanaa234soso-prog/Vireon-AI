-- VIREON: Neon PostgreSQL Production Database Schema
-- Run this script in your Neon PostgreSQL database to create all tables and indexes.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(32) NOT NULL DEFAULT 'creator', -- 'creator', 'brand', 'customer', 'admin'
    bio TEXT,
    country VARCHAR(64),
    language VARCHAR(64) DEFAULT 'English',
    is_verified BOOLEAN DEFAULT FALSE,
    personal_photo_url TEXT,
    id_document_url TEXT,
    id_type VARCHAR(32) DEFAULT 'national_id',
    verification_status VARCHAR(32) DEFAULT 'unverified',
    verified_at TIMESTAMP WITH TIME ZONE,
    is_banned BOOLEAN DEFAULT FALSE,
    whop_user_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATOR PROFILES & PASSPORT
CREATE TABLE IF NOT EXISTS creators (
    id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    handle VARCHAR(64) UNIQUE NOT NULL,
    tagline VARCHAR(255),
    vireon_score INTEGER DEFAULT 85,
    delivery_score NUMERIC(4,2) DEFAULT 98.5,
    completed_orders INTEGER DEFAULT 0,
    total_earnings NUMERIC(12,2) DEFAULT 0.00,
    verified_views BIGINT DEFAULT 0,
    avg_engagement_rate NUMERIC(5,2) DEFAULT 4.8,
    avg_conversion_rate NUMERIC(5,2) DEFAULT 3.2,
    niches TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{"English"}',
    platforms JSONB DEFAULT '{}', -- e.g. {"tiktok": {"handle": "@user", "followers": 150000}, "instagram": {...}}
    audience_demographics JSONB DEFAULT '{}',
    portfolio JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BRANDS & COMPANIES
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    website TEXT,
    industry VARCHAR(128),
    budget_range VARCHAR(64),
    total_spent NUMERIC(12,2) DEFAULT 0.00,
    verified_badge BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SERVICES (Marketplace)
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'UGC', 'Video', 'Design', 'Marketing', 'AI Personas', 'Services'
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    delivery_days INTEGER NOT NULL DEFAULT 3,
    revisions INTEGER NOT NULL DEFAULT 2,
    cover_image TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    orders_count INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. DIGITAL PRODUCTS & PROMPT PACKS
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Prompt Packs', 'Digital Products', 'AI Creators', 'Presets', 'Templates'
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    file_url TEXT,
    preview_url TEXT,
    cover_image TEXT,
    whop_product_id VARCHAR(128),
    downloads_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CAMPAIGNS (Brand Engine)
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(64) PRIMARY KEY,
    brand_id VARCHAR(64) NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    product_name VARCHAR(255),
    budget NUMERIC(12,2) NOT NULL,
    payout_model VARCHAR(32) NOT NULL, -- 'Fixed', 'PayPerView', 'Affiliate', 'Hybrid', 'Performance'
    creators_needed INTEGER NOT NULL DEFAULT 5,
    deliverables TEXT NOT NULL,
    target_platforms TEXT[] DEFAULT '{}',
    target_countries TEXT[] DEFAULT '{}',
    target_niche VARCHAR(64),
    min_engagement_rate NUMERIC(4,2) DEFAULT 3.0,
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) DEFAULT 'active', -- 'active', 'in_progress', 'completed', 'paused'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CAMPAIGN APPLICATIONS
CREATE TABLE IF NOT EXISTS campaign_applications (
    id VARCHAR(64) PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id VARCHAR(64) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    proposal_text TEXT NOT NULL,
    requested_payout NUMERIC(10,2),
    status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
    match_score INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ORDERS & PURCHASES
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    buyer_id VARCHAR(64) NOT NULL REFERENCES users(id),
    seller_id VARCHAR(64) NOT NULL REFERENCES users(id),
    item_type VARCHAR(32) NOT NULL, -- 'service', 'product', 'campaign_payout'
    item_id VARCHAR(64) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    seller_net NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'paid', 'in_progress', 'delivered', 'completed', 'cancelled', 'refunded'
    whop_payment_id VARCHAR(128),
    whop_checkout_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PAYMENTS & TRANSACTIONS (Whop Records)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id),
    whop_payment_id VARCHAR(128) UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'USD',
    status VARCHAR(32) NOT NULL, -- 'succeeded', 'failed', 'refunded'
    customer_email VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AFFILIATE LINKS & CONVERSIONS
CREATE TABLE IF NOT EXISTS affiliate_links (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id VARCHAR(64) REFERENCES campaigns(id),
    service_id VARCHAR(64) REFERENCES services(id),
    code VARCHAR(64) UNIQUE NOT NULL,
    commission_rate NUMERIC(5,2) DEFAULT 15.0,
    clicks_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    total_commission NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id VARCHAR(64) PRIMARY KEY,
    affiliate_link_id VARCHAR(64) NOT NULL REFERENCES affiliate_links(id),
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    amount NUMERIC(10,2) NOT NULL,
    commission NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'approved', 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. VERIFIED PAY-PER-VIEW (PPV) ENGINE
CREATE TABLE IF NOT EXISTS ppv_views (
    id VARCHAR(64) PRIMARY KEY,
    content_id VARCHAR(64) NOT NULL,
    creator_id VARCHAR(64) NOT NULL REFERENCES creators(id),
    campaign_id VARCHAR(64) REFERENCES campaigns(id),
    viewer_ip_hash VARCHAR(128) NOT NULL,
    device_fingerprint_hash VARCHAR(128) NOT NULL,
    session_id VARCHAR(128),
    referrer TEXT,
    platform VARCHAR(32),
    is_verified BOOLEAN DEFAULT TRUE,
    is_bot_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. MESSAGES & CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    participant_one VARCHAR(64) NOT NULL REFERENCES users(id),
    participant_two VARCHAR(64) NOT NULL REFERENCES users(id),
    subject VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id),
    reviewer_id VARCHAR(64) NOT NULL REFERENCES users(id),
    creator_id VARCHAR(64) NOT NULL REFERENCES creators(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. OPPORTUNITIES & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- 'UGC Campaign', 'Brand Deal', 'PayPerView', 'Affiliate', 'Job'
    brand_name VARCHAR(128) NOT NULL,
    budget_label VARCHAR(64) NOT NULL,
    niche VARCHAR(64) NOT NULL,
    platform VARCHAR(32) NOT NULL,
    match_score INTEGER DEFAULT 95,
    match_reason TEXT,
    deadline VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. TRUST, SAFETY & ADMIN LOGS
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id),
    target_type VARCHAR(32) NOT NULL, -- 'user', 'service', 'campaign', 'message'
    target_id VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL REFERENCES users(id),
    action VARCHAR(128) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_creator ON services(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_ppv_views_creator ON ppv_views(creator_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_creators_vireon_score ON creators(vireon_score DESC);
